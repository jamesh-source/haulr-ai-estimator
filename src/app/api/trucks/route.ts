// =============================================================================
// GET /api/trucks  â€” List trucks
// POST /api/trucks â€” Create truck
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('name');

    if (error) {
      console.error('[trucks GET]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    console.error('[trucks GET] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('trucks')
      .insert({ ...(body as object), clerk_user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('[trucks POST]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (err) {
    console.error('[trucks POST] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
