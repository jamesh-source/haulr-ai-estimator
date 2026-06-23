'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, UserPlus, X, Phone, Mail, MapPin, Loader2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { cn, formatPhone } from '@/lib/utils';
import type { Customer, LeadSource } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  lead_source: LeadSource;
}

interface CustomerSearchProps {
  value: Customer | CustomerFormValues | null;
  onChange: (customer: Customer | CustomerFormValues | null) => void;
  className?: string;
}

const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'google', label: 'Google' },
  { value: 'website', label: 'Website' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referral', label: 'Referral' },
  { value: 'yard_sign', label: 'Yard Sign' },
  { value: 'flyer', label: 'Flyer' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM: CustomerFormValues = {
  name: '',
  phone: '',
  email: '',
  address: '',
  lead_source: 'other',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isExistingCustomer(v: Customer | CustomerFormValues | null): v is Customer {
  return !!v && 'id' in v;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerSearch({ value, onChange, className }: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [newForm, setNewForm] = useState<CustomerFormValues>(EMPTY_FORM);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // -------------------------------------------------------------------------
  // Debounced search
  // -------------------------------------------------------------------------

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, email, phone, address, city, state, zip, lead_source, status, created_at, updated_at')
          .or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
          .order('name')
          .limit(8);

        if (!error && data) {
          setResults(data as Customer[]);
        }
      } finally {
        setSearching(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  function selectCustomer(c: Customer) {
    onChange(c);
    setOpen(false);
    setQuery('');
    setResults([]);
  }

  function clearSelection() {
    onChange(null);
    setQuery('');
    setMode('search');
    setNewForm(EMPTY_FORM);
  }

  function handleNewFormChange(field: keyof CustomerFormValues, val: string) {
    const updated = { ...newForm, [field]: val };
    setNewForm(updated);
    onChange(updated);
  }

  function switchToNew() {
    setMode('new');
    setOpen(false);
    const partial: CustomerFormValues = {
      name: query,
      phone: '',
      email: '',
      address: '',
      lead_source: 'other',
    };
    setNewForm(partial);
    onChange(partial);
  }

  // -------------------------------------------------------------------------
  // Render: existing customer badge
  // -------------------------------------------------------------------------

  if (isExistingCustomer(value)) {
    return (
      <div className={cn('rounded-xl border border-blue-200 bg-blue-50 p-4', className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Existing Customer
              </span>
            </div>
            <p className="font-semibold text-gray-900 text-base">{value.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
              {value.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {formatPhone(value.phone)}
                </span>
              )}
              {value.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {value.email}
                </span>
              )}
              {value.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  {value.address}{value.city ? `, ${value.city}` : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="rounded-full p-1.5 text-gray-400 hover:bg-blue-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: new customer form
  // -------------------------------------------------------------------------

  if (mode === 'new') {
    return (
      <div className={cn('rounded-xl border border-gray-200 bg-white p-4 space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900">New Customer</span>
          </div>
          <button
            onClick={() => { setMode('search'); onChange(null); setNewForm(EMPTY_FORM); }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Search instead
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newForm.name}
              onChange={e => handleNewFormChange('name', e.target.value)}
              placeholder="Jane Smith"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={newForm.phone}
              onChange={e => handleNewFormChange('phone', e.target.value)}
              placeholder="(555) 000-0000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={newForm.email}
              onChange={e => handleNewFormChange('email', e.target.value)}
              placeholder="jane@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Service Address</label>
            <input
              type="text"
              value={newForm.address}
              onChange={e => handleNewFormChange('address', e.target.value)}
              placeholder="123 Main St, City, State"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Lead Source</label>
            <div className="relative">
              <select
                value={newForm.lead_source}
                onChange={e => handleNewFormChange('lead_source', e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 text-sm pr-8 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {LEAD_SOURCES.map(ls => (
                  <option key={ls.value} value={ls.value}>{ls.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: search combobox
  // -------------------------------------------------------------------------

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name, phone, or email…"
          className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {open && (query.trim() || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
          >
            {/* Existing results */}
            {results.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                  Existing Customers
                </div>
                {results.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {customer.phone && formatPhone(customer.phone)}
                        {customer.phone && customer.email && ' · '}
                        {customer.email}
                      </p>
                      {customer.address && (
                        <p className="text-xs text-gray-400 truncate">{customer.address}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {results.length === 0 && query.trim() && !searching && (
              <div className="px-3 py-3 text-sm text-gray-500 text-center">
                No customers found for &ldquo;{query}&rdquo;
              </div>
            )}

            {/* Create new divider */}
            <div className="border-t border-gray-100">
              <button
                onClick={switchToNew}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Create new customer
                {query.trim() && (
                  <span className="ml-1 text-blue-500 font-normal">&ldquo;{query}&rdquo;</span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
