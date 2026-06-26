'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Phone, DollarSign, Clock, GripVertical } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatPhone, formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { Customer, CustomerStatus } from '@/types';

// =============================================================================
// COLUMN CONFIG
// =============================================================================

interface ColumnConfig {
  status: CustomerStatus;
  label: string;
  color: string;
  headerBg: string;
}

const COLUMNS: ColumnConfig[] = [
  { status: 'lead',        label: 'Lead',        color: 'bg-gray-400',    headerBg: 'bg-gray-50 border-gray-200'    },
  { status: 'contacted',   label: 'Contacted',   color: 'bg-blue-400',    headerBg: 'bg-blue-50 border-blue-200'    },
  { status: 'quoted',      label: 'Quoted',      color: 'bg-purple-400',  headerBg: 'bg-purple-50 border-purple-200'},
  { status: 'follow_up',   label: 'Follow Up',   color: 'bg-yellow-400',  headerBg: 'bg-yellow-50 border-yellow-200'},
  { status: 'scheduled',   label: 'Scheduled',   color: 'bg-indigo-400',  headerBg: 'bg-indigo-50 border-indigo-200'},
  { status: 'completed',   label: 'Completed',   color: 'bg-green-400',   headerBg: 'bg-green-50 border-green-200'  },
];

// =============================================================================
// MINI KANBAN CARD
// =============================================================================

interface KanbanCardProps {
  customer: Customer;
  isDragging?: boolean;
}

function KanbanCard({ customer, isDragging }: KanbanCardProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-100 shadow-sm p-3 select-none',
        isDragging && 'opacity-50 rotate-1 shadow-lg'
      )}
      onClick={() => router.push(`/customers/${customer.id}`)}
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{customer.name}</p>
        <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
      </div>
      {customer.phone && (
        <a
          href={`tel:${customer.phone}`}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition-colors mb-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="h-3 w-3 flex-shrink-0" />
          {formatPhone(customer.phone)}
        </a>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDate(customer.updated_at)}
        </span>
        {customer.total_revenue !== undefined && customer.total_revenue > 0 && (
          <span className="text-xs font-medium text-green-700 flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" />
            {formatCurrency(customer.total_revenue)}
          </span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SORTABLE CARD WRAPPER
// =============================================================================

function SortableCard({ customer }: { customer: Customer }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: customer.id,
    data: { customer },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <KanbanCard customer={customer} isDragging={isDragging} />
    </div>
  );
}

// =============================================================================
// DROPPABLE COLUMN
// =============================================================================

interface KanbanColumnProps {
  config: ColumnConfig;
  customers: Customer[];
  totalValue: number;
}

function KanbanColumn({ config, customers, totalValue }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: config.status });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col h-full">
      {/* Column header */}
      <div className={cn('border rounded-t-xl px-3 py-2.5', config.headerBg)}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', config.color)} />
            <span className="text-sm font-semibold text-gray-800">{config.label}</span>
          </div>
          <span className="text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5">
            {customers.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-gray-500">
            Pipeline: <span className="font-semibold text-gray-700">{formatCurrency(totalValue)}</span>
          </p>
        )}
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 border-x border-b border-gray-200 rounded-b-xl p-2 space-y-2 overflow-y-auto min-h-24 transition-colors',
          isOver && 'bg-orange-50 border-orange-300'
        )}
      >
        <SortableContext
          items={customers.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {customers.map((customer) => (
            <SortableCard key={customer.id} customer={customer} />
          ))}
        </SortableContext>
        {customers.length === 0 && (
          <div className={cn(
            'flex items-center justify-center h-16 rounded-lg border-2 border-dashed transition-colors',
            isOver ? 'border-orange-400 bg-orange-50' : 'border-gray-100'
          )}>
            <p className="text-xs text-gray-300">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN KANBAN BOARD
// =============================================================================

interface CustomerKanbanProps {
  customers: Customer[];
  onStatusChange: (customerId: string, newStatus: CustomerStatus) => Promise<void>;
}

export function CustomerKanban({ customers, onStatusChange }: CustomerKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Group customers by status
  const columnData = COLUMNS.map((col) => {
    const colCustomers = customers.filter((c) => c.status === col.status);
    const totalValue = colCustomers.reduce((sum, c) => sum + (c.total_revenue ?? 0), 0);
    return { ...col, customers: colCustomers, totalValue };
  });

  const activeCustomer = customers.find((c) => c.id === activeId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedCustomer = customers.find((c) => c.id === active.id);
    if (!draggedCustomer) return;

    // over.id is either a column status or another customer's id
    const overColumnStatus = COLUMNS.find((col) => col.status === over.id)?.status;
    if (overColumnStatus && overColumnStatus !== draggedCustomer.status) {
      onStatusChange(draggedCustomer.id, overColumnStatus);
      return;
    }

    // If dropped on a card, find what column that card is in
    const overCustomer = customers.find((c) => c.id === over.id);
    if (overCustomer && overCustomer.status !== draggedCustomer.status) {
      onStatusChange(draggedCustomer.id, overCustomer.status);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <p className="text-xs text-gray-500 mb-2 lg:hidden">Swipe left/right to see all stages</p>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {columnData.map((col) => (
          <KanbanColumn
            key={col.status}
            config={col}
            customers={col.customers}
            totalValue={col.totalValue}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCustomer && (
          <div className="w-72 rotate-2 shadow-xl">
            <KanbanCard customer={activeCustomer} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
