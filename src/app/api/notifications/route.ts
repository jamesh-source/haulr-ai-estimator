import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// GET /api/notifications
// Returns: { notifications: Notification[]; unreadCount: number }
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[notifications GET] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unreadCount = (notifications ?? []).filter((n) => !n.is_read).length;

    return NextResponse.json({
      notifications: notifications ?? [],
      unreadCount,
    });
  } catch (err) {
    console.error('[notifications GET] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/notifications
// Body: { id?: string } — if id omitted, marks all as read
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createAdminClient();
    const body = await req.json().catch(() => ({}));
    const { id, ids } = body as { id?: string; ids?: string[] };

    let query = supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() });

    if (id) {
      query = query.eq('id', id);
    } else if (ids && ids.length > 0) {
      query = query.in('id', ids);
    } else {
      // Mark all as read
      query = query.eq('is_read', false);
    }

    const { error } = await query;

    if (error) {
      console.error('[notifications PUT] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[notifications PUT] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
