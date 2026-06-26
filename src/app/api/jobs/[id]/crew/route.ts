import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const AssignCrewSchema = z.object({
  crew_member_id: z.string().uuid(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id: jobId } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('job_crew')
      .select(`
        id,
        job_id,
        crew_member_id,
        assigned_at,
        crew_members (
          id, name, role, phone, email,
          hourly_rate, pay_type, pay_percent, status
        )
      `)
      .eq('job_id', jobId)
      .eq('clerk_user_id', userId)
      .order('assigned_at');

    if (error) {
      console.error('[jobs/crew GET]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/crew GET] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id: jobId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 });
    }

    const parsed = AssignCrewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'crew_member_id (uuid) is required', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('job_crew')
      .insert({
        job_id: jobId,
        crew_member_id: parsed.data.crew_member_id,
        clerk_user_id: userId,
      })
      .select(`
        id,
        job_id,
        crew_member_id,
        assigned_at,
        crew_members (
          id, name, role, phone, email,
          hourly_rate, pay_type, pay_percent, status
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: { message: 'This crew member is already assigned to the job' } },
          { status: 409 }
        );
      }
      console.error('[jobs/crew POST]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/crew POST] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
