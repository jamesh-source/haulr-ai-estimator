import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; crewId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id: jobId, crewId } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('job_crew')
      .delete()
      .eq('job_id', jobId)
      .eq('crew_member_id', crewId)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[jobs/crew DELETE]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/crew DELETE] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
