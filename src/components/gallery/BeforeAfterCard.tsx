'use client';

import { useState } from 'react';
import { Share2, Download, Expand, X, DollarSign, Package, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeAfterCardProps {
  id: string;
  customerName: string;
  jobType: string;
  date: string;
  revenue: number;
  volumeRemoved: number;
  beforeUrl: string;
  afterUrl: string;
  publicLink?: string;
  onDownload?: (id: string) => void;
}

export function BeforeAfterCard({
  id,
  customerName,
  jobType,
  date,
  revenue,
  volumeRemoved,
  beforeUrl,
  afterUrl,
  publicLink,
  onDownload,
}: BeforeAfterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeImage, setActiveImage] = useState<'before' | 'after' | null>(null);

  const handleShare = async () => {
    const link = publicLink || `${window.location.origin}/gallery/public/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Public link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDownload = () => {
    onDownload?.(id);
  };

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all duration-200 group">
        {/* Image pair */}
        <div className="grid grid-cols-2 h-44 relative">
          {/* Before */}
          <div className="relative overflow-hidden border-r border-gray-800">
            <img
              src={beforeUrl}
              alt="Before"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjNGI1NTYzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkJlZm9yZTwvdGV4dD48L3N2Zz4=';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-2 bg-gray-900/80 text-gray-300 text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
              BEFORE
            </span>
            <button
              onClick={() => { setActiveImage('before'); setExpanded(true); }}
              className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/70"
            >
              <Expand className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* After */}
          <div className="relative overflow-hidden">
            <img
              src={afterUrl}
              alt="After"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFmMjkzNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjNGI1NTYzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkFmdGVyPC90ZXh0Pjwvc3ZnPg==';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-2 left-2 bg-orange-500/90 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
              AFTER
            </span>
            <button
              onClick={() => { setActiveImage('after'); setExpanded(true); }}
              className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-black/70"
            >
              <Expand className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Job type badge */}
          <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {jobType}
          </div>
        </div>

        {/* Card details */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-gray-100 font-semibold text-sm">{customerName}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-gray-500" />
                <span className="text-gray-500 text-xs">{formattedDate}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-sm">{revenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 justify-end mt-0.5">
                <Package className="w-3 h-3 text-gray-500" />
                <span className="text-gray-400 text-xs">{volumeRemoved} cu yd</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-800">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              onClick={() => { setActiveImage(null); setExpanded(true); }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              <Expand className="w-3.5 h-3.5" />
              Expand
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setExpanded(false)}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-800" onClick={(e) => e.stopPropagation()}>
            <div>
              <h2 className="text-white font-semibold">{customerName}</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-gray-400 text-sm">{formattedDate}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 text-sm">{jobType}</span>
                <span className="text-gray-600">•</span>
                <span className="text-emerald-400 text-sm font-medium">${revenue.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-0 min-h-0" onClick={(e) => e.stopPropagation()}>
            {/* Tabs for mobile feel */}
            <div className="relative flex flex-col">
              <div className="bg-gray-900 px-4 py-2 text-center">
                <span className="text-gray-400 text-sm font-semibold tracking-wider uppercase">Before</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <img
                  src={beforeUrl}
                  alt="Before"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="relative flex flex-col border-l border-gray-800">
              <div className="bg-orange-900/30 px-4 py-2 text-center">
                <span className="text-orange-400 text-sm font-semibold tracking-wider uppercase">After</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <img
                  src={afterUrl}
                  alt="After"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-800 flex items-center justify-center gap-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider">Revenue</p>
              <p className="text-emerald-400 font-bold">${revenue.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider">Volume Removed</p>
              <p className="text-white font-bold">{volumeRemoved} cu yd</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider">Job Type</p>
              <p className="text-white font-bold">{jobType}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
