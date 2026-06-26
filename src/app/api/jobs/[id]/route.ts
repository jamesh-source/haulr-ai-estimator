// =============================================================================
// GET/PUT/DELETE /api/jobs/[id]
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const UpdateJobSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  estimated_hours: z.number().min(0).max(24).optional().nullable(),
  truck_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional(),
  before_photos: z.array(z.string()).optional(),
  after_photos: z.array(z.string()).optional(),
  quote_id: z.string().uuid().optional().nullable(),
});

// -----------------------------------------------------------------------------
// GET /api/jobs/[id]
// -----------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: job, error } = await supabase
      .from('jobs')
      .select(
        `*,
         customers(*),
         quotes(*)`
      )
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: { message: 'Job not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Load crew assigned via job_crew junction table
    const { data: crewData } = await supabase
      .from('job_crew')
      .select(`
        crew_member_id,
        assigned_at,
        crew_members (
          id, name, role, phone, email,
          hourly_rate, pay_type, pay_percent, status
        )
      `)
      .eq('job_id', id)
      .eq('clerk_user_id', userId);
    const crew = (crewData ?? []).map((row: { crew_members: unknown }) => row.crew_members).filter(Boolean);

    // Load truck if assigned
    let truck: unknown = null;
    if (job.truck_id) {
      const { data: truckData } = await supabase
        .from('trucks')
        .select('id, name, make, model, year, license_plate, max_cubic_yards')
        .eq('id', job.truck_id)
        .single();
      truck = truckData;
    }

    // Load photos
    const { data: photos } = await supabase
      .from('photo_uploads')
      .select('id, storage_path, public_url, created_at')
      .eq('job_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      data: { ...job, crew, truck, photos: photos ?? [] },
      error: null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/[id] GET] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// PUT /api/jobs/[id]
// -----------------------------------------------------------------------------

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 });
    }

    const parsed = UpdateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'Validation failed', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('jobs')
      .select('id, status, customer_id')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Job not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Prevent editing completed/cancelled jobs unless just adding notes
    if (['completed', 'cancelled'].includes(existing.status as string)) {
      const allowedOnClosed = ['notes', 'after_photos'];
      const updatedKeys = Object.keys(parsed.data);
      const hasDisallowedKey = updatedKeys.some((k) => !allowedOnClosed.includes(k));
      if (hasDisallowedKey) {
        return NextResponse.json(
          {
            error: {
              message: `Cannot update a ${existing.status} job. Only notes and photos may be added.`,
              code: 'JOB_CLOSED',
            },
          },
          { status: 409 }
        );
      }
    }

    const { data: updated, error } = await supabase
      .from('jobs')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .select(`*, customers(id, name, email, phone), quotes(id, quote_number, total)`)
      .single();

    if (error) {
      console.error('[jobs/[id] PUT]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    // Sync customer status when job status changes
    if (parsed.data.status && existing.customer_id) {
      const statusMap: Record<string, string> = {
        scheduled: 'scheduled',
        in_progress: 'in_progress',
        completed: 'completed',
        cancelled: 'cancelled',
      };
      const newCustomerStatus = statusMap[parsed.data.status];
      if (newCustomerStatus) {
        await supabase
          .from('customers')
          .update({ status: newCustomerStatus, updated_at: new Date().toISOString() })
          .eq('id', existing.customer_id)
          .eq('clerk_user_id', userId);
      }
    }

    return NextResponse.json({ data: updated, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/[id] PUT] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// DELETE /api/jobs/[id] — Cancel job (no hard deletes)
// -----------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: { message: 'Job not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    if (existing.status === 'completed') {
      return NextResponse.json(
        {
          error: {
            message: 'Cannot cancel a completed job.',
            code: 'JOB_COMPLETED',
          },
        },
        { status: 409 }
      );
    }

    const { data: cancelled, error } = await supabase
      .from('jobs')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[jobs/[id] DELETE]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({
      data: { cancelled: true, id, job: cancelled },
      error: null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/[id] DELETE] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
