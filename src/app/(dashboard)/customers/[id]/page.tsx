'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Check,
  X,
  FileText,
  Briefcase,
  Receipt,
  Image as ImageIcon,
  StickyNote,
  LayoutDashboard,
  ExternalLink,
  MessageSquare,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { CustomerStats } from '@/components/customers/CustomerStats';
import { CustomerTimeline } from '@/components/customers/CustomerTimeline';
import { AddNoteForm } from '@/components/customers/AddNoteForm';
import { createClient } from '@/lib/supabase/client';
import { CUSTOMER_STATUSES, LEAD_SOURCES } from '@/lib/constants';
import { formatPhone, formatDate, formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Customer, CustomerStatus, Quote, Job } from '@/types';
import type { TimelineEvent } from '@/components/customers/CustomerTimeline';

// =============================================================================
// TABS
// =============================================================================

type TabId = 'overview' | 'quotes' | 'jobs' | 'invoices' | 'photos' | 'notes';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'quotes',    label: 'Quotes',    icon: FileText         },
  { id: 'jobs',      label: 'Jobs',      icon: Briefcase        },
  { id: 'invoices',  label: 'Invoices',  icon: Receipt          },
  { id: 'photos',    label: 'Photos',    icon: ImageIcon        },
  { id: 'notes',     label: 'Notes',     icon: StickyNote       },
];

// =============================================================================
// INLINE EDITABLE FIELD
// =============================================================================

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (val: string) => void;
  type?: 'text' | 'email' | 'tel';
  placeholder?: string;
}

function EditableField({ label, value, onSave, type = 'text', placeholder }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div className="group">
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 text-sm border border-orange-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-700">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleCancel} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <p className="text-sm text-gray-900 flex-1">
            {value || <span className="text-gray-300 italic">{placeholder ?? 'Not set'}</span>}
          </p>
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-300 hover:text-orange-500"
          >
            <Edit2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// QUOTE STATUS BADGE colors
// =============================================================================

const quoteStatusColor: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired:  'bg-yellow-100 text-yellow-700',
};

// =============================================================================
// QUOTES TAB
// =============================================================================

function QuotesTab({ customerId, onCreateQuote }: { customerId: string; onCreateQuote: () => void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('quotes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setQuotes(data ?? []); setLoading(false); });
  }, [customerId]);

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>;

  if (quotes.length === 0) return (
    <div className="text-center py-12">
      <FileText className="h-8 w-8 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400 mb-3">No quotes yet</p>
      <Button size="sm" onClick={onCreateQuote} leftIcon={<FileText className="h-3.5 w-3.5" />}>
        Create Quote
      </Button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={onCreateQuote} leftIcon={<FileText className="h-3.5 w-3.5" />}>
          New Quote
        </Button>
      </div>
      {quotes.map((q) => (
        <Card key={q.id} hoverable onClick={() => router.push(`/quotes/${q.id}`)} className="cursor-pointer">
          <CardContent className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{q.quote_number}</p>
              <p className="text-xs text-gray-400">{formatDate(q.created_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', quoteStatusColor[q.status])}>
                {q.status}
              </span>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(q.total)}</p>
              <ExternalLink className="h-3.5 w-3.5 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// JOBS TAB
// =============================================================================

function JobsTab({ customerId }: { customerId: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setJobs(data ?? []); setLoading(false); });
  }, [customerId]);

  if (loading) return <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>;

  if (jobs.length === 0) return (
    <div className="text-center py-12">
      <Briefcase className="h-8 w-8 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">No jobs yet</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <Card key={job.id} hoverable onClick={() => router.push(`/jobs/${job.id}`)} className="cursor-pointer">
          <CardContent className="py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{job.title}</p>
              <p className="text-xs text-gray-400">
                {job.scheduled_date ? formatDate(job.scheduled_date) : 'Not scheduled'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={job.status} size="sm" />
              <ExternalLink className="h-3.5 w-3.5 text-gray-300" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// INVOICES TAB (placeholder)
// =============================================================================

function InvoicesTab() {
  return (
    <div className="text-center py-12">
      <Receipt className="h-8 w-8 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">Invoices coming soon</p>
    </div>
  );
}

// =============================================================================
// PHOTOS TAB
// =============================================================================

function PhotosTab({ customerId }: { customerId: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('before_photos, after_photos')
        .eq('customer_id', customerId);

      const allPhotos: string[] = [];
      (jobs ?? []).forEach((job: { before_photos?: string[]; after_photos?: string[] }) => {
        if (job.before_photos) allPhotos.push(...job.before_photos);
        if (job.after_photos) allPhotos.push(...job.after_photos);
      });
      setPhotos(allPhotos);
      setLoading(false);
    }
    load();
  }, [customerId]);

  if (loading) return <div className="grid grid-cols-3 gap-2">{[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />)}</div>;

  if (photos.length === 0) return (
    <div className="text-center py-12">
      <ImageIcon className="h-8 w-8 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">No photos yet</p>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((url, i) => (
        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Photo ${i + 1}`}
            className="aspect-square object-cover rounded-lg hover:opacity-90 transition-opacity"
          />
        </a>
      ))}
    </div>
  );
}

// =============================================================================
// NOTES TAB
// =============================================================================

interface NoteRecord { id: string; content: string; created_at: string; }

function NotesTab({ customerId }: { customerId: string }) {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    setNotes(data ?? []);
    setLoading(false);
  }, [customerId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  if (loading) return <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}</div>;

  return (
    <div className="space-y-4">
      <AddNoteForm customerId={customerId} onNoteAdded={fetchNotes} />
      {notes.length === 0 ? (
        <div className="text-center py-8">
          <StickyNote className="h-6 w-6 text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-gray-400 mt-1.5">{formatDate(note.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [stats, setStats] = useState({ totalJobs: 0, totalRevenue: 0, avgTicket: 0, lastServiceDate: null as string | null });

  // Fetch customer
  useEffect(() => {
    async function fetchCustomer() {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        toast.error('Customer not found');
        router.push('/customers');
        return;
      }
      setCustomer(data);
      setLoading(false);
    }
    fetchCustomer();
  }, [id]);

  // Fetch timeline events
  useEffect(() => {
    if (!customer) return;
    async function buildTimeline() {
      setTimelineLoading(true);
      const events: TimelineEvent[] = [];

      // Customer created
      events.push({
        id: 'created',
        type: 'customer_created',
        title: 'Customer created',
        description: `Lead source: ${customer!.lead_source?.replace('_', ' ')}`,
        timestamp: customer!.created_at,
      });

      // Quotes
      const { data: quotes } = await supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: true });

      let totalRevenue = 0;

      (quotes ?? []).forEach((q: Quote) => {
        events.push({
          id: `quote_created_${q.id}`,
          type: 'quote_created',
          title: `Quote ${q.quote_number} created`,
          amount: q.total,
          timestamp: q.created_at,
        });
        if (q.sent_at) events.push({
          id: `quote_sent_${q.id}`,
          type: 'quote_sent',
          title: `Quote ${q.quote_number} sent`,
          amount: q.total,
          timestamp: q.sent_at,
        });
        if (q.approved_at) events.push({
          id: `quote_approved_${q.id}`,
          type: 'quote_approved',
          title: `Quote ${q.quote_number} approved`,
          amount: q.total,
          timestamp: q.approved_at,
        });
      });

      // Jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: true });

      let lastServiceDate: string | null = null;

      (jobs ?? []).forEach((j: Job) => {
        events.push({
          id: `job_created_${j.id}`,
          type: 'job_scheduled',
          title: `Job "${j.title}" created`,
          timestamp: j.created_at,
        });
        if (j.actual_start) events.push({
          id: `job_started_${j.id}`,
          type: 'job_started',
          title: `Job "${j.title}" started`,
          timestamp: j.actual_start,
        });
        if (j.status === 'completed' && j.actual_end) {
          events.push({
            id: `job_completed_${j.id}`,
            type: 'job_completed',
            title: `Job "${j.title}" completed`,
            timestamp: j.actual_end,
          });
          if (!lastServiceDate || j.actual_end > lastServiceDate) {
            lastServiceDate = j.actual_end;
          }
        }
      });

      // Notes
      const { data: notes } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: true });

      (notes ?? []).forEach((n: { id: string; content: string; created_at: string }) => {
        events.push({
          id: `note_${n.id}`,
          type: 'note_added',
          title: 'Note added',
          description: n.content,
          timestamp: n.created_at,
        });
      });

      // Sort descending
      events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTimelineEvents(events);

      // Compute stats
      const completedJobs = (jobs ?? []).filter((j: Job) => j.status === 'completed');
      (quotes ?? []).filter((q: Quote) => q.status === 'approved').forEach((q: Quote) => {
        totalRevenue += q.total ?? 0;
      });
      const avgTicket = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;
      setStats({
        totalJobs: completedJobs.length,
        totalRevenue,
        avgTicket,
        lastServiceDate,
      });

      setTimelineLoading(false);
    }
    buildTimeline();
  }, [customer, id]);

  // Update field
  const updateField = async (field: string, value: string) => {
    if (!customer) return;
    const { error } = await supabase
      .from('customers')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update');
      return;
    }
    setCustomer((prev) => prev ? { ...prev, [field]: value } : prev);
    toast.success('Updated');
  };

  // Update status
  const handleStatusChange = async (newStatus: CustomerStatus) => {
    if (!customer || savingStatus) return;
    setSavingStatus(true);
    const { error } = await supabase
      .from('customers')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update status');
    } else {
      setCustomer((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success('Status updated');
    }
    setSavingStatus(false);
  };

  const handleCreateQuote = () => {
    router.push(`/quotes/new?customer_id=${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!customer) return null;

  const fullAddress = [
    customer.address,
    customer.city,
    customer.state,
    customer.zip,
  ].filter(Boolean).join(', ');

  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => router.push('/customers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{customer.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={customer.status} />
            <span className="text-xs text-gray-400">
              Added {formatDate(customer.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateQuote}
            leftIcon={<FileText className="h-3.5 w-3.5" />}
          >
            Create Quote
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-4">
          {/* Customer details card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Customer Details</CardTitle>
                {/* Status dropdown */}
                <div className="relative">
                  <select
                    value={customer.status}
                    onChange={(e) => handleStatusChange(e.target.value as CustomerStatus)}
                    disabled={savingStatus}
                    className="text-xs font-medium border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-700 appearance-none pr-6 cursor-pointer"
                  >
                    {CUSTOMER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <EditableField
                label="Full Name"
                value={customer.name}
                onSave={(v) => updateField('name', v)}
              />
              <EditableField
                label="Phone"
                value={customer.phone}
                type="tel"
                onSave={(v) => updateField('phone', v)}
              />
              <EditableField
                label="Email"
                value={customer.email}
                type="email"
                onSave={(v) => updateField('email', v)}
                placeholder="No email on file"
              />
              <EditableField
                label="Address"
                value={customer.address ?? ''}
                onSave={(v) => updateField('address', v)}
                placeholder="No address on file"
              />
              <div className="grid grid-cols-3 gap-2">
                <EditableField label="City" value={customer.city ?? ''} onSave={(v) => updateField('city', v)} />
                <EditableField label="State" value={customer.state ?? ''} onSave={(v) => updateField('state', v)} />
                <EditableField label="ZIP" value={customer.zip ?? ''} onSave={(v) => updateField('zip', v)} />
              </div>

              {/* Lead source */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-0.5">Lead Source</p>
                <select
                  value={customer.lead_source}
                  onChange={(e) => updateField('lead_source', e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {LEAD_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              {customer.tags && customer.tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {customer.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-orange-50 text-orange-700 border border-orange-100 rounded-full px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <a
              href={`tel:${customer.phone}`}
              className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-colors shadow-sm"
            >
              <Phone className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-gray-600">Call</span>
            </a>
            <a
              href={`sms:${customer.phone}`}
              className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-600">Text</span>
            </a>
            <a
              href={`mailto:${customer.email}`}
              className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50 transition-colors shadow-sm"
            >
              <Mail className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-gray-600">Email</span>
            </a>
          </div>

          {/* Map link */}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-colors shadow-sm"
            >
              <div className="h-8 w-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{customer.address || 'View on Map'}</p>
                <p className="text-xs text-gray-400">{customer.city}, {customer.state} {customer.zip}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-gray-300 flex-shrink-0 ml-auto" />
            </a>
          )}

          {/* Notes quick-add */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-yellow-500" />
                Quick Note
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <AddNoteForm
                customerId={id}
                onNoteAdded={() => {
                  if (activeTab === 'notes') return;
                  toast.success('Note saved');
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* CENTER + RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          <CustomerStats
            totalJobs={stats.totalJobs}
            totalRevenue={stats.totalRevenue}
            avgTicket={stats.avgTicket}
            lastServiceDate={stats.lastServiceDate}
          />

          {/* Tabs */}
          <Card>
            {/* Tab nav */}
            <div className="border-b border-gray-100 px-4">
              <div className="flex gap-0 overflow-x-auto">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                        activeTab === tab.id
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            <CardContent className="pt-4">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'overview' && (
                  <CustomerTimeline events={timelineEvents} loading={timelineLoading} />
                )}
                {activeTab === 'quotes' && (
                  <QuotesTab customerId={id} onCreateQuote={handleCreateQuote} />
                )}
                {activeTab === 'jobs' && (
                  <JobsTab customerId={id} />
                )}
                {activeTab === 'invoices' && <InvoicesTab />}
                {activeTab === 'photos' && <PhotosTab customerId={id} />}
                {activeTab === 'notes' && <NotesTab customerId={id} />}
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
