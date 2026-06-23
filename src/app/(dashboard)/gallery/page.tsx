'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Grid3X3, List, Upload, Image as ImageIcon, SlidersHorizontal, X } from 'lucide-react';
import { BeforeAfterCard } from '@/components/gallery/BeforeAfterCard';
import { toast } from 'sonner';

// ─── Mock gallery data ─────────────────────────────────────────────────────────

interface GalleryItem {
  id: string;
  customerName: string;
  jobType: string;
  date: string;
  revenue: number;
  volumeRemoved: number;
  beforeUrl: string;
  afterUrl: string;
}

const JOB_TYPES = ['All', 'House Cleanout', 'Garage Cleanout', 'Construction Debris', 'Appliance Removal', 'Furniture Removal', 'Yard Waste', 'Office Cleanout'];

// Placeholder images using a reliable service
function makePlaceholder(text: string, color: string) {
  return `https://placehold.co/800x600/${color}/FFFFFF?text=${encodeURIComponent(text)}`;
}

const MOCK_GALLERY: GalleryItem[] = [
  { id: '1', customerName: 'Sarah Johnson', jobType: 'House Cleanout', date: '2026-06-18', revenue: 1240, volumeRemoved: 14, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '2', customerName: 'Mike Thompson', jobType: 'Garage Cleanout', date: '2026-06-15', revenue: 480, volumeRemoved: 6, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '3', customerName: 'Linda Carey', jobType: 'Construction Debris', date: '2026-06-12', revenue: 890, volumeRemoved: 11, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '4', customerName: 'Robert Davis', jobType: 'Appliance Removal', date: '2026-06-10', revenue: 220, volumeRemoved: 2, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '5', customerName: 'Emily Watson', jobType: 'Furniture Removal', date: '2026-06-08', revenue: 350, volumeRemoved: 4, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '6', customerName: 'James Ortiz', jobType: 'Office Cleanout', date: '2026-06-05', revenue: 1580, volumeRemoved: 18, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '7', customerName: 'Nancy Hall', jobType: 'Yard Waste', date: '2026-06-03', revenue: 280, volumeRemoved: 5, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '8', customerName: 'Tom Baker', jobType: 'House Cleanout', date: '2026-05-28', revenue: 980, volumeRemoved: 12, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '9', customerName: 'Grace Kim', jobType: 'Garage Cleanout', date: '2026-05-25', revenue: 420, volumeRemoved: 5, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '10', customerName: 'David Chen', jobType: 'Construction Debris', date: '2026-05-20', revenue: 760, volumeRemoved: 9, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '11', customerName: 'Maria Sanchez', jobType: 'Appliance Removal', date: '2026-05-18', revenue: 185, volumeRemoved: 2, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
  { id: '12', customerName: 'Chris Williams', jobType: 'Office Cleanout', date: '2026-05-15', revenue: 1420, volumeRemoved: 16, beforeUrl: makePlaceholder('Before', '374151'), afterUrl: makePlaceholder('After', '065F46') },
];

type SortKey = 'date' | 'revenue' | 'volume' | 'customer';

export default function GalleryPage() {
  const [search, setSearch] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let items = MOCK_GALLERY.filter((item) => {
      const matchSearch =
        !search ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.jobType.toLowerCase().includes(search.toLowerCase());
      const matchType = selectedJobType === 'All' || item.jobType === selectedJobType;
      const matchFrom = !dateFrom || item.date >= dateFrom;
      const matchTo = !dateTo || item.date <= dateTo;
      return matchSearch && matchType && matchFrom && matchTo;
    });

    items = [...items].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'revenue') cmp = a.revenue - b.revenue;
      else if (sortKey === 'volume') cmp = a.volumeRemoved - b.volumeRemoved;
      else if (sortKey === 'customer') cmp = a.customerName.localeCompare(b.customerName);
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [search, selectedJobType, sortKey, sortDir, dateFrom, dateTo]);

  const handleDownload = (id: string) => {
    toast.info('Downloading photos...');
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const hasFilters = search || selectedJobType !== 'All' || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch('');
    setSelectedJobType('All');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-100 text-2xl font-bold">Before & After Gallery</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {filtered.length} of {MOCK_GALLERY.length} jobs shown
          </p>
        </div>
        <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm">
          <Upload className="w-4 h-4" />
          Upload Photos
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
        {/* Search + controls row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-0" style={{ minWidth: '200px' }}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or job type..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 placeholder-gray-600"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || hasFilters
                ? 'bg-orange-600/20 border-orange-500/50 text-orange-400'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasFilters && (
              <span className="bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center ml-1">
                !
              </span>
            )}
          </button>
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="border-t border-gray-800 pt-4 space-y-4">
            {/* Job type pills */}
            <div>
              <label className="text-gray-500 text-xs font-medium uppercase tracking-wider block mb-2">Job Type</label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedJobType(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedJobType === type
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-500 text-xs font-medium block mb-1.5">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-gray-500 text-xs font-medium block mb-1.5">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-gray-500 text-xs font-medium">Sort by:</label>
              {[
                { key: 'date' as SortKey, label: 'Date' },
                { key: 'revenue' as SortKey, label: 'Revenue' },
                { key: 'volume' as SortKey, label: 'Volume' },
                { key: 'customer' as SortKey, label: 'Customer' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => toggleSort(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortKey === key ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {label}
                  {sortKey === key && (
                    <span className="ml-0.5">{sortDir === 'desc' ? '↓' : '↑'}</span>
                  )}
                </button>
              ))}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-medium ml-auto"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
          <h3 className="text-gray-400 text-lg font-medium mb-2">No photos found</h3>
          <p className="text-gray-600 text-sm text-center max-w-sm">
            Try adjusting your filters or search term to find what you're looking for.
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-orange-400 hover:text-orange-300 text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <BeforeAfterCard
              key={item.id}
              {...item}
              onDownload={handleDownload}
            />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
            >
              {/* Thumbnail pair */}
              <div className="flex gap-1 flex-shrink-0">
                <img
                  src={item.beforeUrl}
                  alt="Before"
                  className="w-16 h-12 object-cover rounded-lg"
                />
                <img
                  src={item.afterUrl}
                  alt="After"
                  className="w-16 h-12 object-cover rounded-lg"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-100 font-medium text-sm">{item.customerName}</span>
                  <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">{item.jobType}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="text-right">
                  <p className="text-emerald-400 font-bold text-sm">${item.revenue.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">{item.volumeRemoved} cu yd</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/gallery/public/${item.id}`);
                    toast.success('Link copied');
                  }}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
