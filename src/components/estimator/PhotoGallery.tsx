'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn, Film, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhotoFile {
  id: string;
  file: File;
  previewUrl: string;
  originalName: string;
  isHeic: boolean;
  isVideo: boolean;
  uploading: boolean;
  uploaded: boolean;
}

interface PhotoGalleryProps {
  photos: PhotoFile[];
  onRemove: (id: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------

function Lightbox({ photo, onClose }: { photo: PhotoFile; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {photo.isVideo ? (
          <video
            src={photo.previewUrl}
            controls
            className="max-h-[85vh] max-w-full rounded-lg"
          />
        ) : (
          <img
            src={photo.previewUrl}
            alt={photo.originalName}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        )}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-xs text-white/80 backdrop-blur-sm">
          {photo.originalName}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Thumbnail
// ---------------------------------------------------------------------------

function PhotoThumbnail({
  photo,
  onRemove,
  onClick,
}: {
  photo: PhotoFile;
  onRemove: () => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2 }}
      className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Preview */}
      {photo.isVideo ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <Film className="h-10 w-10 text-white/60" />
          {/* Video element for thumbnail via poster or first frame */}
          <video
            src={photo.previewUrl}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            muted
            preload="metadata"
          />
        </div>
      ) : (
        <img
          src={photo.previewUrl}
          alt={photo.originalName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Hover overlay */}
      <AnimatePresence>
        {hovered && !photo.uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
          >
            <ZoomIn className="h-8 w-8 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {photo.uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}

      {/* Uploaded check */}
      {photo.uploaded && !photo.uploading && (
        <div className="absolute bottom-1.5 left-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 drop-shadow" />
        </div>
      )}

      {/* Remove button */}
      {!photo.uploading && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className={cn(
            'absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white transition-all',
            hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}
          aria-label="Remove photo"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Badges */}
      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
        {photo.isHeic && (
          <span className="rounded-full bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            HEIC
          </span>
        )}
        {photo.isVideo && (
          <span className="rounded-full bg-gray-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            MP4
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function PhotoGallery({ photos, onRemove, className }: PhotoGalleryProps) {
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoFile | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-gray-400">Click to enlarge</p>
        </div>

        <motion.div
          layout
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2"
        >
          <AnimatePresence mode="popLayout">
            {photos.map(photo => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                onRemove={() => onRemove(photo.id)}
                onClick={() => setLightboxPhoto(photo)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <Lightbox
            photo={lightboxPhoto}
            onClose={() => setLightboxPhoto(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
