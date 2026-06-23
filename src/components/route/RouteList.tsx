'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  MapPin,
  Phone,
  Navigation,
  Clock,
  Ruler,
  Package,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduledJob } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RouteStop {
  job: ScheduledJob;
  stopNumber: number;
  eta?: string;
  distanceFromPrev?: string;
  loadDescription?: string;
}

interface RouteListProps {
  stops: RouteStop[];
  onReorder: (stops: RouteStop[]) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Sortable stop item
// ---------------------------------------------------------------------------

const STOP_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E', '#6366F1',
];

function getStopColor(index: number) {
  return STOP_COLORS[index % STOP_COLORS.length];
}

interface SortableStopProps {
  stop: RouteStop;
  colorIndex: number;
}

function SortableStop({ stop, colorIndex }: SortableStopProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.job.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const customer = stop.job.customer;
  const color = getStopColor(colorIndex);

  const address = customer?.address
    ? `${customer.address}, ${customer.city}, ${customer.state}`
    : 'No address';

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-xl border transition-shadow duration-200',
        isDragging ? 'shadow-2xl border-orange-300 opacity-90' : 'border-gray-100 shadow-sm hover:shadow-md'
      )}
    >
      <div className="flex items-stretch gap-0">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex items-center justify-center px-3 py-4 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing rounded-l-xl hover:bg-gray-50 transition-colors focus:outline-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Stop number badge */}
        <div className="flex items-center pr-4 py-4">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: color }}
          >
            {stop.stopNumber}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 py-4 pr-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {customer?.name ?? 'Unknown Customer'}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{stop.job.title}</p>

              <div className="flex items-start gap-1.5 mt-2 text-gray-500">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span className="text-xs truncate">{address}</span>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {stop.eta && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" />
                    ETA {stop.eta}
                  </span>
                )}
                {stop.distanceFromPrev && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Ruler className="h-3 w-3" />
                    {stop.distanceFromPrev}
                  </span>
                )}
                {stop.loadDescription && (
                  <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
                    <Package className="h-3 w-3" />
                    {stop.loadDescription}
                  </span>
                )}
                {stop.job.scheduled_time && (
                  <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" />
                    {stop.job.scheduled_time}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {customer?.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  Call
                </a>
              )}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Navigation className="h-3 w-3" />
                Navigate
              </a>
              <a
                href={`/jobs/${stop.job.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Job
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Distance connector line (visual) */}
      {stop.distanceFromPrev && stop.stopNumber > 1 && (
        <div className="ml-[52px] border-l-2 border-dashed border-gray-200 h-0" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RouteList({ stops, onReorder, className }: RouteListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stops.findIndex((s) => s.job.id === active.id);
    const newIndex = stops.findIndex((s) => s.job.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(stops, oldIndex, newIndex).map((stop, i) => ({
      ...stop,
      stopNumber: i + 1,
    }));

    onReorder(reordered);
  };

  if (stops.length === 0) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center', className)}>
        <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No stops on today's route</p>
        <p className="text-gray-400 text-sm mt-1">Schedule jobs to build your route</p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stops.map((s) => s.job.id)} strategy={verticalListSortingStrategy}>
        <div className={cn('space-y-3', className)}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {stops.length} stop{stops.length !== 1 ? 's' : ''} · Drag to reorder
            </p>
          </div>
          {stops.map((stop, idx) => (
            <SortableStop key={stop.job.id} stop={stop} colorIndex={idx} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
