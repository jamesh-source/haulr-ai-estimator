'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Search,
  LayoutGrid,
  List,
  Upload,
  Filter,
  X,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { CustomerKanban } from '@/components/customers/CustomerKanban';
import { createClient } from '@/lib/supabase/client';
import { CUSTOMER_STATUSES, LEAD_SOURCES } from '@/lib/constants';
import { formatPhone, formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Customer, CustomerStatus } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

// =============================================================================
// TYPES
// =============================================================================

type ViewMode = 'table' | 'kanban';

interface Stats {
  total: number;
  leads: number;
  active: number;
  completed: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// =============================================================================
// STAT CARD
// =============================================================================

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  bg: string;
  dot: string;
  onClick?: () => void;
  active?: boolean;
}

function StatCard({ label, value, color, bg, dot, onClick, active }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 min-w-0 px-4 py-3 rounded-xl border text-left transition-all',
        active
          ? `${bg} ${color} border-current shadow-sm`
          : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm text-gray-900'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('h-2 w-2 rounded-full', dot)} />
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </button>
  );
}

// =============================================================================
// TABLE ROW
// =============================================================================

function CustomerTableRow({ customer, onStatusChange }: { customer: Customer; onStatusChange: (id: string, s: CustomerStatus) => void }) {
  const router = useRouter();

  return (
    <tr
      className="hover:bg-gray-50 cursor-pointer transition-colors group"
      onClick={() => router.push(`/customers/${customer.id}`)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
            {customer.city && (
              <p className="text-xs text-gray-400">{customer.city}, {customer.state}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {customer.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3 w-3 flex-shrink-0" />
            {formatPhone(customer.phone)}
          </a>
        )}
      </td>
      <td className="px-4 py-3">
        {customer.email && (
          <a
            href={`mailto:${customer.email}`}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{customer.email}</span>
          </a>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={customer.status} size="sm" />
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-500">{formatDate(customer.updated_at)}</span>
      </td>
      <td className="px-4 py-3">
        {customer.total_revenue !== undefined && customer.total_revenue > 0 ? (
          <span className="text-sm font-semibold text-gray-900">{formatCurrency(customer.total_revenue)}</span>
        ) : (
          <span className="text-sm text-gray-300">—</span>
        )}
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/customers/${customer.id}`)}
            leftIcon={<Eye className="h-3.5 w-3.5" />}
          >
            View
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-white border border-gray-100 rounded-lg shadow-lg p-1 z-50">
              <DropdownMenuItem
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/quotes/new?customer_id=${customer.id}`)}
              >
                <FileText className="h-3.5 w-3.5" />
                Create Quote
              </DropdownMenuItem>
              <div className="h-px bg-gray-100 my-1" />
              {CUSTOMER_STATUSES.filter((s) => s.value !== customer.status).map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-50 cursor-pointer"
                  onClick={() => onStatusChange(customer.id, s.value as CustomerStatus)}
                >
                  Move to {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function CustomersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .order('updated_at', { ascending: false });

      if (statusFilter) query = query.eq('status', statusFilter);
      if (sourceFilter) query = query.eq('lead_source', sourceFilter);
      if (debouncedSearch) {
        query = query.or(
          `name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setCustomers(data ?? []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const stats: Stats = {
    total: customers.length,
    leads: customers.filter((c) => c.status === 'lead').length,
    active: customers.filter((c) =>
      ['contacted', 'quoted', 'follow_up', 'scheduled', 'in_progress'].includes(c.status)
    ).length,
    completed: customers.filter((c) => c.status === 'completed').length,
  };

  const handleStatusChange = async (customerId: string, newStatus: CustomerStatus) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', customerId);
      if (error) throw error;
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c))
      );
      toast.success('Customer status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleCSVImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      toast.info('CSV import coming soon');
    };
    input.click();
  };

  const hasFilters = statusFilter || sourceFilter || search;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-500" />
            Customers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your customer pipeline and relationships</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCSVImport}
            leftIcon={<Upload className="h-3.5 w-3.5" />}
          >
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/customers/new')}
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <StatCard
          label="Total"
          value={stats.total}
          color="text-gray-700"
          bg="bg-gray-50"
          dot="bg-gray-400"
          onClick={clearFilters}
          active={!statusFilter}
        />
        <StatCard
          label="Leads"
          value={stats.leads}
          color="text-gray-700"
          bg="bg-gray-50"
          dot="bg-gray-400"
          onClick={() => setStatusFilter('lead')}
          active={statusFilter === 'lead'}
        />
        <StatCard
          label="Active"
          value={stats.active}
          color="text-blue-700"
          bg="bg-blue-50"
          dot="bg-blue-400"
          onClick={() => setStatusFilter('contacted')}
          active={['contacted', 'quoted', 'follow_up', 'scheduled', 'in_progress'].includes(statusFilter)}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          color="text-green-700"
          bg="bg-green-50"
          dot="bg-green-400"
          onClick={() => setStatusFilter('completed')}
          active={statusFilter === 'completed'}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          leftIcon={<Filter className="h-3.5 w-3.5" />}
          rightIcon={<ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showFilters && 'rotate-180')} />}
          className={cn(hasFilters && 'border-orange-300 text-orange-700 bg-orange-50')}
        >
          Filters {hasFilters && '•'}
        </Button>

        {/* View toggle */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === 'kanban' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="py-3 flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Status:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All statuses</option>
                    {CUSTOMER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Lead Source:</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All sources</option>
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X className="h-3.5 w-3.5" />}>
                    Clear all
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No customers found</h3>
            <p className="text-sm text-gray-400 mb-4">
              {hasFilters ? 'Try adjusting your filters' : 'Add your first customer to get started'}
            </p>
            {!hasFilters && (
              <Button onClick={() => router.push('/customers/new')} leftIcon={<UserPlus className="h-4 w-4" />}>
                Add First Customer
              </Button>
            )}
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        <CustomerKanban customers={customers} onStatusChange={handleStatusChange} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((customer) => (
                  <CustomerTableRow
                    key={customer.id}
                    customer={customer}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50">
            <p className="text-xs text-gray-400">
              Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
