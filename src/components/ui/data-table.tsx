'use client';

import * as React from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Skeleton } from './skeleton';
import { EmptyState } from './empty-state';

// =============================================================================
// TYPES
// =============================================================================

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<TRow> {
  /** Unique key for the column (also used for sorting) */
  key: string;
  /** Column header label */
  header: string;
  /** Cell renderer — receives the row and returns ReactNode */
  cell: (row: TRow) => React.ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Column header className */
  headerClassName?: string;
  /** Cell className */
  cellClassName?: string;
  /** Min width in px or CSS value */
  width?: string | number;
}

export interface RowAction<TRow> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: TRow) => void;
  /** Show a red danger label */
  danger?: boolean;
  /** Conditionally hide this action */
  hidden?: (row: TRow) => boolean;
  /** Conditionally disable this action */
  disabled?: (row: TRow) => boolean;
}

export interface DataTableProps<TRow extends { id: string | number }> {
  columns: ColumnDef<TRow>[];
  data: TRow[];
  rowActions?: RowAction<TRow>[];
  /** Total count for pagination (if server-side) */
  totalCount?: number;
  /** Current page (1-indexed) */
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  /** Search input value */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton rows to display when loading */
  skeletonRows?: number;
  /** Controlled sort state */
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (key: string, direction: SortDirection) => void;
  /** Empty state */
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  emptyCta?: React.ReactNode;
  /** Extra content rendered in the toolbar (right side) */
  toolbarExtra?: React.ReactNode;
  className?: string;
  /** Callback when a row is clicked */
  onRowClick?: (row: TRow) => void;
}

// =============================================================================
// SORT ICON
// =============================================================================

function SortIcon({
  columnKey,
  sortKey,
  sortDirection,
}: {
  columnKey: string;
  sortKey?: string | null;
  sortDirection?: SortDirection;
}) {
  if (sortKey !== columnKey) {
    return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />;
  }
  if (sortDirection === 'asc') {
    return <ChevronUp className="h-3.5 w-3.5 text-orange-500" />;
  }
  if (sortDirection === 'desc') {
    return <ChevronDown className="h-3.5 w-3.5 text-orange-500" />;
  }
  return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />;
}

// =============================================================================
// ROW ACTIONS MENU
// =============================================================================

function RowActionsMenu<TRow extends { id: string | number }>({
  row,
  actions,
}: {
  row: TRow;
  actions: RowAction<TRow>[];
}) {
  const visibleActions = actions.filter((a) => !a.hidden?.(row));

  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md',
            'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400',
            'transition-colors duration-150'
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open row actions</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className={cn(
            'z-50 min-w-[9rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg',
            'p-1',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2'
          )}
        >
          {visibleActions.map((action, idx) => (
            <DropdownMenu.Item
              key={idx}
              disabled={action.disabled?.(row)}
              onSelect={() => action.onClick(row)}
              className={cn(
                'flex cursor-pointer select-none items-center gap-2',
                'rounded-md px-3 py-2 text-sm outline-none',
                'transition-colors duration-100',
                action.danger
                  ? 'text-red-600 focus:bg-red-50 data-[disabled]:text-red-300'
                  : 'text-gray-700 focus:bg-gray-50 data-[disabled]:text-gray-300',
                'data-[disabled]:pointer-events-none'
              )}
            >
              {action.icon && (
                <span className="flex-shrink-0">{action.icon}</span>
              )}
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// =============================================================================
// DATA TABLE
// =============================================================================

export function DataTable<TRow extends { id: string | number }>({
  columns,
  data,
  rowActions,
  totalCount,
  page = 1,
  onPageChange,
  pageSize = 25,
  onPageSizeChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  loading = false,
  skeletonRows = 8,
  sortKey,
  sortDirection,
  onSortChange,
  emptyTitle = 'No results',
  emptyDescription = 'No records found.',
  emptyIcon,
  emptyCta,
  toolbarExtra,
  className,
  onRowClick,
}: DataTableProps<TRow>) {
  // ---- Local client-side sort (when onSortChange not provided) ----
  const [localSortKey, setLocalSortKey] = React.useState<string | null>(null);
  const [localSortDir, setLocalSortDir] = React.useState<SortDirection>(null);

  const activeSortKey = onSortChange ? sortKey : localSortKey;
  const activeSortDir = onSortChange ? sortDirection : localSortDir;

  function handleHeaderClick(colKey: string) {
    let newDir: SortDirection;
    if (activeSortKey !== colKey) {
      newDir = 'asc';
    } else if (activeSortDir === 'asc') {
      newDir = 'desc';
    } else {
      newDir = null;
    }

    if (onSortChange) {
      onSortChange(colKey, newDir);
    } else {
      setLocalSortKey(newDir === null ? null : colKey);
      setLocalSortDir(newDir);
    }
  }

  // ---- Client-side sort when no external handler ----
  const sortedData = React.useMemo(() => {
    if (onSortChange || !localSortKey || localSortDir === null) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[localSortKey];
      const bVal = (b as Record<string, unknown>)[localSortKey];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const cmp =
        typeof aVal === 'string' && typeof bVal === 'string'
          ? aVal.localeCompare(bVal)
          : (aVal as number) < (bVal as number)
          ? -1
          : (aVal as number) > (bVal as number)
          ? 1
          : 0;

      return localSortDir === 'desc' ? -cmp : cmp;
    });
  }, [data, localSortKey, localSortDir, onSortChange]);

  // ---- Pagination ----
  const effectiveTotal = totalCount ?? sortedData.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const showingFrom = Math.min((page - 1) * pageSize + 1, effectiveTotal);
  const showingTo = Math.min(page * pageSize, effectiveTotal);

  // ---- Columns with optional row actions column ----
  const hasActions = rowActions && rowActions.length > 0;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* TOOLBAR */}
      {(onSearchChange || toolbarExtra) && (
        <div className="flex items-center gap-3">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Input
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          )}
          {toolbarExtra && (
            <div className="ml-auto flex items-center gap-2">{toolbarExtra}</div>
          )}
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500',
                    col.sortable && 'cursor-pointer select-none',
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && handleHeaderClick(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <SortIcon
                        columnKey={col.key}
                        sortKey={activeSortKey}
                        sortDirection={activeSortDir}
                      />
                    )}
                  </span>
                </th>
              ))}
              {hasActions && (
                <th scope="col" className="w-12 px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {/* LOADING SKELETONS */}
            {loading &&
              Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3">
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </td>
                  )}
                </tr>
              ))}

            {/* DATA ROWS */}
            {!loading &&
              sortedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-orange-50/40'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-700',
                        col.cellClassName
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3 text-right">
                      <RowActionsMenu row={row} actions={rowActions!} />
                    </td>
                  )}
                </tr>
              ))}

            {/* EMPTY STATE */}
            {!loading && sortedData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="py-12"
                >
                  <EmptyState
                    icon={emptyIcon}
                    title={emptyTitle}
                    description={emptyDescription}
                    cta={emptyCta}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {(onPageChange || effectiveTotal > pageSize) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {effectiveTotal === 0
              ? 'No results'
              : `Showing ${showingFrom}–${showingTo} of ${effectiveTotal}`}
          </p>

          <div className="flex items-center gap-2">
            {/* Page size selector */}
            {onPageSizeChange && (
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange?.(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-gray-700">
              {page} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange?.(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
