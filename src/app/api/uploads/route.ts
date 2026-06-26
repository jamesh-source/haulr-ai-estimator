// =============================================================================
// POST /api/uploads â€” Upload file to Supabase Storage
// =============================================================================

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { APP_CONFIG } from '@/lib/constants';

const STORAGE_BUCKET = 'photos';
const MAX_SIZE_BYTES = APP_CONFIG.max_photo_size_mb * 1024 * 1024;

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    // Enforce multipart/form-data
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: { message: 'Content-Type must be multipart/form-data', code: 'INVALID_CONTENT_TYPE' } },
        { status: 415 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: { message: 'Failed to parse form data', code: 'PARSE_ERROR' } },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json(
        { error: { message: 'No file provided. Use field name "file".', code: 'NO_FILE' } },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: {
            message: `File too large. Maximum size is ${APP_CONFIG.max_photo_size_mb}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
            code: 'FILE_TOO_LARGE',
          },
        },
        { status: 413 }
      );
    }

    // Validate MIME type
    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      return NextResponse.json(
        {
          error: {
            message: `Invalid file type: ${mimeType}. Allowed types: JPEG, PNG, WebP, HEIC.`,
            code: 'INVALID_FILE_TYPE',
          },
        },
        { status: 422 }
      );
    }

    // Note for HEIC files â€” conversion is expected client-side
    if (mimeType === 'image/heic' || mimeType === 'image/heif') {
      // We accept HEIC but note that display may vary; conversion to JPEG happens client-side
      console.info('[uploads] Received HEIC file â€” storing as-is. Client should convert for display.');
    }

    // Extract optional metadata
    const quoteId = formData.get('quote_id') as string | null;
    const jobId = formData.get('job_id') as string | null;
    const customerId = formData.get('customer_id') as string | null;
    const captureType = (formData.get('capture_type') as string | null) ?? 'upload'; // 'before', 'after', 'upload'

    // Build storage path: userId/year-month/uuid.ext
    const ext = ALLOWED_MIME_TYPES[mimeType] ?? 'jpg';
    const fileId = uuidv4();
    const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const storagePath = `${userId}/${yearMonth}/${fileId}.${ext}`;

    // Upload to Supabase Storage using admin client (bypasses RLS on storage)
    const adminSupabase = await createAdminClient();
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await adminSupabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: '31536000', // 1 year cache
      });

    if (uploadError) {
      console.error('[uploads] Storage upload failed:', uploadError.message);
      return NextResponse.json(
        {
          error: {
            message: 'File upload to storage failed. Please try again.',
            code: 'STORAGE_ERROR',
            detail: uploadError.message,
          },
        },
        { status: 502 }
      );
    }

    // Get public URL
    const { data: urlData } = adminSupabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Save record to database
    const supabase = await createAdminClient();
    const { data: photoRecord, error: dbError } = await supabase
      .from('photo_uploads')
      .insert({
        id: fileId,
        clerk_user_id: userId,
        quote_id: quoteId ?? null,
        job_id: jobId ?? null,
        customer_id: customerId ?? null,
        storage_path: storagePath,
        public_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: mimeType,
        capture_type: captureType,
        bucket: STORAGE_BUCKET,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[uploads] DB record failed:', dbError.message);
      // Don't fail â€” storage upload succeeded, just return what we have
    }

    return NextResponse.json(
      {
        data: {
          id: fileId,
          storage_path: storagePath,
          public_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: mimeType,
          quote_id: quoteId ?? null,
          job_id: jobId ?? null,
          customer_id: customerId ?? null,
          created_at: photoRecord?.created_at ?? new Date().toISOString(),
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[uploads] Unhandled:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
