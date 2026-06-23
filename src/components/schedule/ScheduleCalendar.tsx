'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Calendar,
  momentLocalizer,
  Views,
  SlotInfo,
  Event as RBCEvent,
  View,
} from 'react-big-calendar';
import withDragAndDrop, { withDragAndDropProps } from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { cn } from '@/lib/utils';
import type { ScheduledJob } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  List,
  LayoutGrid,
} from 'lucide-react';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar as any);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalendarEvent extends RBCEvent {
  id: string;
  jobId: string;
  status: string;
  customer: string;
  address: string;
  crew: string[];
  truckName?: string;
  resource?: string;
}

interface ScheduleCalendarProps {
  jobs: ScheduledJob[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slotInfo: SlotInfo) => void;
  onEventDrop?: (jobId: string, start: Date, end: Date) => void;
  onEventResize?: (jobId: string, start: Date, end: Date) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Status colors
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  scheduled:   { bg: '#3B82F6', border: '#2563EB', text: '#fff' },
  in_progress: { bg: '#F59E0B', border: '#D97706', text: '#fff' },
  completed:   { bg: '#10B981', border: '#059669', text: '#fff' },
  draft:       { bg: '#9CA3AF', border: '#6B7280', text: '#fff' },
  quoted:      { bg: '#8B5CF6', border: '#7C3AED', text: '#fff' },
  cancelled:   { bg: '#EF4444', border: '#DC2626', text: '#fff' },
};

function getStatusColors(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.draft;
}

// ---------------------------------------------------------------------------
// Custom Event Renderer
// ---------------------------------------------------------------------------

function CustomEvent({ event }: { event: CalendarEvent }) {
  const colors = getStatusColors(event.status);
  return (
    <div
      className="flex flex-col gap-0.5 h-full overflow-hidden px-1.5 py-0.5"
      style={{ color: colors.text }}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span
          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.8)' }}
        />
        <span className="font-semibold text-xs truncate">{event.customer}</span>
      </div>
      {event.address && (
        <span className="text-[10px] truncate opacity-80">{event.address}</span>
      )}
      {event.crew?.length > 0 && (
        <span className="text-[10px] truncate opacity-75">
          {event.crew.join(', ')}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Toolbar
// ---------------------------------------------------------------------------

interface CustomToolbarProps {
  label: string;
  view: View;
  onView: (view: View) => void;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
}

function CustomToolbar({ label, view, onView, onNavigate }: CustomToolbarProps) {
  const views = [
    { key: Views.DAY as View,   label: 'Day',   icon: <List className="h-3.5 w-3.5" /> },
    { key: Views.WEEK as View,  label: 'Week',  icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { key: Views.MONTH as View, label: 'Month', icon: <CalendarDays className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex items-center justify-between px-2 pb-3 gap-3 flex-wrap">
      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Label */}
      <h2 className="text-base font-semibold text-gray-900 min-w-[160px] text-center">
        {label}
      </h2>

      {/* View toggles */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => onView(v.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors',
              view === v.key
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ScheduleCalendar({
  jobs,
  onSelectEvent,
  onSelectSlot,
  onEventDrop,
  onEventResize,
  className,
}: ScheduleCalendarProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  // Map jobs → calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return jobs
      .filter((j) => j.scheduled_date)
      .map((j) => {
        const dateStr = j.scheduled_date!;
        const timeStr = j.scheduled_time ?? '08:00';
        const start = moment(`${dateStr} ${timeStr}`, 'YYYY-MM-DD HH:mm').toDate();
        const durationHours = j.quote?.ai_estimate?.estimated_labor_hours ?? 2;
        const end = moment(start).add(durationHours, 'hours').toDate();

        return {
          id: j.id,
          jobId: j.id,
          title: `${j.customer?.name ?? 'Customer'} — ${j.title}`,
          start,
          end,
          status: j.status,
          customer: j.customer?.name ?? 'Unknown',
          address: j.customer?.address
            ? `${j.customer.address}, ${j.customer.city}`
            : '',
          crew: (j.crew ?? []).map((c) => c.name),
          truckName: j.truck?.name,
          resource: j.truck_id,
        };
      });
  }, [jobs]);

  const handleEventDrop = useCallback(
    ({ event, start, end }: any) => {
      onEventDrop?.(event.jobId, start as Date, end as Date);
    },
    [onEventDrop]
  );

  const handleEventResize = useCallback(
    ({ event, start, end }: any) => {
      onEventResize?.(event.jobId, start as Date, end as Date);
    },
    [onEventResize]
  );

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const colors = getStatusColors(event.status);
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: '6px',
        color: colors.text,
        fontSize: '12px',
        padding: 0,
      },
    };
  }, []);

  const components = useMemo(
    () => ({
      event: CustomEvent as any,
      toolbar: (props: any) => (
        <CustomToolbar
          label={props.label}
          view={view}
          onView={(v) => { setView(v); props.onView(v); }}
          onNavigate={props.onNavigate}
        />
      ),
    }),
    [view]
  );

  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-4', className)}>
      <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-header { padding: 6px 4px; font-size: 12px; font-weight: 600; color: #374151; border-bottom: 1px solid #F3F4F6; }
        .rbc-time-header { border-right: 0; }
        .rbc-time-content { border-top: 1px solid #F3F4F6; }
        .rbc-today { background: #FFF7ED; }
        .rbc-off-range-bg { background: #F9FAFB; }
        .rbc-slot-selecting { background: rgba(249,115,22,0.1); }
        .rbc-event { padding: 0; border: none !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .rbc-event:focus { outline: 2px solid #F97316; outline-offset: 1px; }
        .rbc-selected { box-shadow: 0 0 0 2px #F97316 !important; }
        .rbc-show-more { color: #F97316; font-size: 11px; font-weight: 600; }
        .rbc-current-time-indicator { background: #F97316; height: 2px; }
        .rbc-time-slot { color: #9CA3AF; font-size: 11px; }
        .rbc-label { color: #6B7280; font-size: 11px; }
        .rbc-allday-cell { max-height: 60px; overflow-y: auto; }
      `}</style>
      <DnDCalendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        onSelectEvent={(e: any) => onSelectEvent?.(e as CalendarEvent)}
        onSelectSlot={onSelectSlot}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        eventPropGetter={eventStyleGetter as any}
        components={components}
        selectable
        resizable
        style={{ height: 620 }}
        popup
        step={30}
        timeslots={2}
        min={moment().hours(6).minutes(0).toDate()}
        max={moment().hours(20).minutes(0).toDate()}
        defaultView={Views.WEEK}
        views={[Views.DAY, Views.WEEK, Views.MONTH]}
      />
    </div>
  );
}
