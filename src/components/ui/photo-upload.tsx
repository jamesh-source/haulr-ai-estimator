'use client';

import * as React from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import {
  ImagePlus,
  X,
  Upload,
  Camera,
  FileVideo,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface UploadedFile {
  /** Unique id for tracking (generated client-side) */
  id: string;
  /** Original File object */
  file: File;
  /** Preview URL (object URL or base64) */
  preview: string;
  /** Upload progress 0–100 */
  progress: number;
  /** Error message if upload failed */
  error?: string;
  /** Whether this file has been fully uploaded */
  uploaded: boolean;
  /** Remote URL after successful upload */
  remoteUrl?: string;
}

export interface PhotoUploadProps {
  /** Current list of uploaded files (controlled) */
  files: UploadedFile[];
  /** Called when new files are added (after validation) */
  onAdd: (files: UploadedFile[]) => void;
  /** Called when a file is removed by ID */
  onRemove: (id: string) => void;
  /** Max number of files. Default: 30 */
  maxFiles?: number;
  /** Max size per file in bytes. Default: 20 MB */
  maxSizeBytes?: number;
  /** Accepted MIME types */
  accept?: Accept;
  /** Show camera capture button on mobile */
  allowCamera?: boolean;
  /** Disabled state */
  disabled?: boolean;
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_ACCEPT: Accept = {
  'image/jpeg':  ['.jpg', '.jpeg'],
  'image/png':   ['.png'],
  'image/webp':  ['.webp'],
  'image/heic':  ['.heic'],
  'image/heif':  ['.heif'],
  'video/mp4':   ['.mp4'],
};

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const DEFAULT_MAX_FILES = 30;

// =============================================================================
// HELPERS
// =============================================================================

function generateId(): string {
  return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Convert HEIC/HEIF to JPEG using heic2any (lazy imported). */
async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    // Dynamic import so heic2any is only loaded when needed
    const heic2any = (await import('heic2any')).default;
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
    const converted = Array.isArray(blob) ? blob[0] : blob;
    return new File(
      [converted],
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    );
  } catch {
    // If conversion fails, return original (might render incorrectly but won't crash)
    return file;
  }
}

function isHeic(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  );
}

function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}

// =============================================================================
// FILE THUMBNAIL
// =============================================================================

function FileThumbnail({
  item,
  onRemove,
}: {
  item: UploadedFile;
  onRemove: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      {/* Preview */}
      {isVideo({ type: item.file.type } as File) ? (
        <div className="flex h-full items-center justify-center bg-gray-900">
          <FileVideo className="h-8 w-8 text-gray-400" />
          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
            MP4
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.preview}
          alt={item.file.name}
          className="h-full w-full object-cover"
        />
      )}

      {/* Upload progress overlay */}
      {!item.uploaded && !item.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
          {item.progress > 0 && (
            <span className="mt-1 text-xs text-white">{item.progress}%</span>
          )}
        </div>
      )}

      {/* Error overlay */}
      {item.error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-900/60 p-2">
          <AlertCircle className="h-5 w-5 text-white" />
          <span className="text-center text-[10px] text-white leading-tight">
            {item.error}
          </span>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={cn(
          'absolute right-1 top-1 flex h-6 w-6 items-center justify-center',
          'rounded-full bg-black/60 text-white',
          'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
          'hover:bg-black/80 focus:outline-none focus:opacity-100'
        )}
        aria-label={`Remove ${item.file.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* File name tooltip */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-black/70 px-2 py-1 text-[10px] text-white truncate transition-transform duration-150 group-hover:translate-y-0">
        {item.file.name}
      </div>
    </div>
  );
}

// =============================================================================
// PHOTO UPLOAD COMPONENT
// =============================================================================

export function PhotoUpload({
  files,
  onAdd,
  onRemove,
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  accept = DEFAULT_ACCEPT,
  allowCamera = true,
  disabled = false,
  className,
}: PhotoUploadProps) {
  const [converting, setConverting] = React.useState(false);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const remainingSlots = Math.max(0, maxFiles - files.length);
  const isFull = remainingSlots === 0;

  async function processFiles(rawFiles: File[]): Promise<void> {
    if (rawFiles.length === 0) return;

    setConverting(true);

    const processed: UploadedFile[] = await Promise.all(
      rawFiles.slice(0, remainingSlots).map(async (raw) => {
        let file = raw;

        // Convert HEIC to JPEG for browser preview
        if (isHeic(raw)) {
          file = await convertHeicToJpeg(raw);
        }

        const preview = isVideo(file)
          ? '' // Videos: no preview URL (use icon)
          : URL.createObjectURL(file);

        return {
          id: generateId(),
          file,
          preview,
          progress: 0,
          uploaded: false,
        } satisfies UploadedFile;
      })
    );

    setConverting(false);
    onAdd(processed);
  }

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      accept,
      maxSize: maxSizeBytes,
      maxFiles: remainingSlots,
      disabled: disabled || isFull || converting,
      onDrop: (accepted) => processFiles(accepted),
      noClick: false,
      noKeyboard: false,
    });

  // Camera capture handler
  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Array.from(e.target.files ?? []);
    processFiles(raw);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }

  const hasErrors = fileRejections.length > 0;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* DROPZONE */}
      {!isFull && (
        <div
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed',
            'px-6 py-10 text-center transition-colors duration-150',
            'cursor-pointer select-none',
            isDragActive
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-300 bg-gray-50 hover:border-orange-300 hover:bg-orange-50/50',
            (disabled || converting) && 'pointer-events-none opacity-60',
          )}
        >
          <input {...getInputProps()} />

          {converting ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-orange-400" />
              <p className="text-sm text-gray-600">Converting images…</p>
            </>
          ) : isDragActive ? (
            <>
              <Upload className="h-10 w-10 text-orange-500" />
              <p className="text-sm font-medium text-orange-600">
                Drop files here
              </p>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <ImagePlus className="h-8 w-8 text-gray-400" />
                {allowCamera && <Camera className="h-8 w-8 text-gray-400" />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  Drag &amp; drop photos here, or{' '}
                  <span className="text-orange-500 underline">browse</span>
                </p>
                <p className="text-xs text-gray-400">
                  JPG, PNG, WEBP, HEIC, MP4 &bull; Max {formatFileSize(maxSizeBytes)}{' '}
                  per file &bull; Up to {maxFiles} files
                </p>
              </div>
            </>
          )}

          {/* Remaining slots badge */}
          {remainingSlots < maxFiles && (
            <span className="absolute right-3 top-3 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              {remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} left
            </span>
          )}
        </div>
      )}

      {/* Camera capture button (mobile) */}
      {allowCamera && !isFull && !disabled && (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleCameraCapture}
            aria-label="Capture photo with camera"
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className={cn(
              'sm:hidden flex items-center justify-center gap-2 rounded-lg border border-gray-300',
              'px-4 py-2.5 text-sm font-medium text-gray-700',
              'hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1'
            )}
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </button>
        </>
      )}

      {/* Validation errors */}
      {hasErrors && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="mb-1 text-xs font-semibold text-red-700">
            Some files were rejected:
          </p>
          <ul className="space-y-0.5">
            {fileRejections.map(({ file, errors }, i) => (
              <li key={i} className="text-xs text-red-600">
                <span className="font-medium">{file.name}</span>:{' '}
                {errors.map((e) => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PHOTO GRID */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {files.map((item) => (
            <FileThumbnail
              key={item.id}
              item={item}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </div>
      )}

      {/* File count summary */}
      {files.length > 0 && (
        <p className="text-xs text-gray-500">
          {files.length} file{files.length !== 1 ? 's' : ''} selected
          {files.some((f) => !f.uploaded) && (
            <> &bull; {files.filter((f) => !f.uploaded && !f.error).length} pending upload</>
          )}
        </p>
      )}
    </div>
  );
}
