'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, Mail, MapPin, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { LEAD_SOURCES, CUSTOMER_STATUSES } from '@/lib/constants';
import { toast } from 'sonner';
import type { CustomerStatus, LeadSource } from '@/types';

// =============================================================================
// SCHEMA
// =============================================================================

const schema = z.object({
  name:        z.string().min(2, 'Name must be at least 2 characters'),
  email:       z.string().email('Invalid email').or(z.literal('')),
  phone:       z.string().min(7, 'Phone is required'),
  address:     z.string().optional(),
  city:        z.string().optional(),
  state:       z.string().optional(),
  zip:         z.string().optional(),
  status:      z.string(),
  lead_source: z.string(),
  notes:       z.string().optional(),
  tags:        z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// =============================================================================
// FORM FIELD COMPONENT
// =============================================================================

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400 text-gray-900';

// =============================================================================
// PAGE
// =============================================================================

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'lead',
      lead_source: 'website',
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const tags = data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const { data: customer, error } = await supabase
        .from('customers')
        .insert({
          name: data.name,
          email: data.email || null,
          phone: data.phone,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip: data.zip || null,
          status: data.status as CustomerStatus,
          lead_source: data.lead_source as LeadSource,
          notes: data.notes || null,
          tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`${data.name} added as a customer`);
      router.push(`/customers/${customer.id}`);
    } catch (err) {
      console.error('Failed to create customer:', err);
      toast.error('Failed to create customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Customer</h1>
          <p className="text-sm text-gray-500">Add a new customer to your CRM</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-orange-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Full Name" error={errors.name?.message} required>
              <input
                {...register('name')}
                className={inputClass}
                placeholder="John Smith"
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Status" error={errors.status?.message}>
                <select {...register('status')} className={inputClass}>
                  {CUSTOMER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Lead Source" error={errors.lead_source?.message}>
                <select {...register('lead_source')} className={inputClass}>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-orange-500" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" error={errors.phone?.message} required>
                <input
                  {...register('phone')}
                  type="tel"
                  className={inputClass}
                  placeholder="(555) 555-1234"
                />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input
                  {...register('email')}
                  type="email"
                  className={inputClass}
                  placeholder="john@example.com"
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-orange-500" />
              Service Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Street Address" error={errors.address?.message}>
              <input
                {...register('address')}
                className={inputClass}
                placeholder="123 Main St"
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Field label="City" error={errors.city?.message}>
                  <input
                    {...register('city')}
                    className={inputClass}
                    placeholder="Austin"
                  />
                </Field>
              </div>
              <Field label="State" error={errors.state?.message}>
                <input
                  {...register('state')}
                  className={inputClass}
                  placeholder="TX"
                  maxLength={2}
                />
              </Field>
              <Field label="ZIP" error={errors.zip?.message}>
                <input
                  {...register('zip')}
                  className={inputClass}
                  placeholder="78701"
                  maxLength={10}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4 text-orange-500" />
              Notes & Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Notes" error={errors.notes?.message}>
              <textarea
                {...register('notes')}
                className={inputClass}
                rows={3}
                placeholder="Any additional notes about this customer..."
              />
            </Field>
            <Field label="Tags (comma separated)" error={errors.tags?.message}>
              <input
                {...register('tags')}
                className={inputClass}
                placeholder="residential, referral, repeat"
              />
            </Field>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" loading={saving} size="lg">
            Create Customer
          </Button>
        </div>
      </form>
    </div>
  );
}
