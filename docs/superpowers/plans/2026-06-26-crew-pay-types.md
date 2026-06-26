# Crew Pay Types & Job Payout Breakdown — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hourly/percent pay types to crew members and build a job detail page with crew assignment and live payout breakdown.

**Architecture:** A Supabase migration adds three schema changes (two columns on existing tables, one new junction table). The crew settings UI and API gain pay type fields. Three new API endpoints manage job-crew assignments. The job detail page — currently all mock data — is replaced with real API calls plus a new Crew & Payout section.

**Tech Stack:** Next.js 14 App Router, TypeScript, TailwindCSS, Supabase (admin client bypassing RLS), Clerk auth (`auth()` from `@clerk/nextjs/server`), Zod validation, Sonner toasts, Lucide icons.

## Global Constraints

- All API routes use `createAdminClient()` from `@/lib/supabase/server` (service role, bypasses RLS). Never use `createClient()`.
- All API routes call `const { userId } = await auth()` from `@clerk/nextjs/server` and return 401 if null.
- DB column names differ from UI field names — map carefully (e.g. `hourly_rate` in DB ↔ `ratePerHour` in UI).
- No TypeScript `any` — use proper interfaces.
- No placeholder/mock data left in committed code.
- Tailwind dark theme: `bg-gray-900` pages, `bg-gray-800` cards, `text-gray-200` primary text, `text-gray-500` labels, `text-emerald-400` money values, `bg-orange-600` primary buttons.
- Commit after every task using PowerShell (`git commit -m "..."`) — do NOT use bash heredoc syntax.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/004_crew_pay_types.sql` | Create | DB schema changes |
| `src/components/settings/CrewManager.tsx` | Modify | Add pay type toggle + percent field |
| `src/app/api/crew/route.ts` | No change needed | Already passes body through |
| `src/app/api/crew/[id]/route.ts` | No change needed | Already passes body through |
| `src/app/api/jobs/[id]/crew/route.ts` | Create | GET assigned crew, POST assign crew |
| `src/app/api/jobs/[id]/crew/[crewId]/route.ts` | Create | DELETE unassign crew member |
| `src/app/api/jobs/[id]/route.ts` | Modify | Fix crew loading, add estimated_hours |
| `src/app/(dashboard)/jobs/[id]/page.tsx` | Rewrite | Replace all mock data with real API, add crew assignment + payout UI |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/004_crew_pay_types.sql`

**Interfaces:**
- Produces: `crew_members.pay_type` (text, 'hourly'|'percent', default 'hourly'), `crew_members.pay_percent` (numeric(5,2), default 0), `jobs.estimated_hours` (numeric(4,1), nullable), `job_crew` table (id, job_id, crew_member_id, clerk_user_id, assigned_at)

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/004_crew_pay_types.sql` with this exact content:

```sql
-- ============================================================
-- Migration 004: Crew pay types and job crew assignment
-- ============================================================

-- 1. Add pay type fields to crew_members
ALTER TABLE crew_members
  ADD COLUMN IF NOT EXISTS pay_type    text          NOT NULL DEFAULT 'hourly'
    CHECK (pay_type IN ('hourly', 'percent')),
  ADD COLUMN IF NOT EXISTS pay_percent numeric(5,2)  NOT NULL DEFAULT 0;

-- 2. Add estimated hours to jobs
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS estimated_hours numeric(4,1);

-- 3. Create job_crew junction table
CREATE TABLE IF NOT EXISTS job_crew (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  crew_member_id  uuid        NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  clerk_user_id   text        NOT NULL,
  assigned_at     timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, crew_member_id)
);

CREATE INDEX IF NOT EXISTS idx_job_crew_job_id        ON job_crew (job_id);
CREATE INDEX IF NOT EXISTS idx_job_crew_crew_member_id ON job_crew (crew_member_id);
CREATE INDEX IF NOT EXISTS idx_job_crew_clerk_user_id  ON job_crew (clerk_user_id);

-- RLS on job_crew
ALTER TABLE job_crew ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_crew_select_own" ON job_crew
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "job_crew_insert_own" ON job_crew
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "job_crew_delete_own" ON job_crew
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "job_crew_service_role_all" ON job_crew
  FOR ALL USING (auth.role() = 'service_role');
```

- [ ] **Step 2: Run the migration in Supabase SQL Editor**

Go to your Supabase project → SQL Editor → paste the file contents → click Run.
Expected: "Success. No rows returned."

If you get "column already exists" errors, the `IF NOT EXISTS` clauses handle that safely.

- [ ] **Step 3: Commit**

```powershell
cd C:\Users\james\haulr-ai-estimator
git add supabase/migrations/004_crew_pay_types.sql
git commit -m "feat: add migration 004 - crew pay types, estimated_hours, job_crew table"
git push
```

---

## Task 2: CrewManager — Pay Type Toggle

**Files:**
- Modify: `src/components/settings/CrewManager.tsx`

**Interfaces:**
- Consumes: `crew_members` rows now include `pay_type: string` and `pay_percent: number` from DB
- Produces: `CrewMember` interface gains `payType: 'hourly' | 'percent'` and `payPercent: number`; `memberToPayload` sends `pay_type` and `pay_percent` to API

- [ ] **Step 1: Update `CrewMember` and `CrewRow` interfaces**

Replace the existing `CrewMember` and `CrewRow` interfaces at the top of `src/components/settings/CrewManager.tsx`:

```tsx
interface CrewMember {
  id: string;
  name: string;
  role: 'driver' | 'laborer' | 'supervisor' | 'helper';
  phone: string;
  email: string;
  ratePerHour: number;
  payType: 'hourly' | 'percent';
  payPercent: number;
  active: boolean;
}

interface CrewRow {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  hourly_rate: number;
  pay_type: string;
  pay_percent: number;
  status: string;
  clerk_user_id?: string;
}
```

- [ ] **Step 2: Update `rowToMember`, `memberToPayload`, and `EMPTY_MEMBER`**

Replace those three functions/constants:

```tsx
function rowToMember(row: CrewRow): CrewMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role as CrewMember['role'],
    phone: row.phone ?? '',
    email: row.email ?? '',
    ratePerHour: row.hourly_rate ?? 0,
    payType: (row.pay_type ?? 'hourly') as 'hourly' | 'percent',
    payPercent: row.pay_percent ?? 0,
    active: row.status === 'active',
  };
}

function memberToPayload(m: Omit<CrewMember, 'id'>) {
  return {
    name: m.name,
    role: m.role,
    phone: m.phone,
    email: m.email,
    hourly_rate: m.ratePerHour,
    pay_type: m.payType,
    pay_percent: m.payPercent,
    status: m.active ? 'active' : 'inactive',
  };
}

const EMPTY_MEMBER: Omit<CrewMember, 'id'> = {
  name: '',
  role: 'laborer',
  phone: '',
  email: '',
  ratePerHour: 22,
  payType: 'hourly',
  payPercent: 20,
  active: true,
};
```

- [ ] **Step 3: Update `startEdit` to include new fields**

Replace the `startEdit` function:

```tsx
const startEdit = (member: CrewMember) => {
  setEditingId(member.id);
  setEditForm({
    name: member.name,
    role: member.role,
    phone: member.phone,
    email: member.email,
    ratePerHour: member.ratePerHour,
    payType: member.payType,
    payPercent: member.payPercent,
    active: member.active,
  });
  setAddingNew(false);
};
```

- [ ] **Step 4: Add pay type toggle + conditional rate field to `MemberForm`**

Replace the entire `MemberForm` function with this updated version:

```tsx
function MemberForm({ form, onChange, onSave, onCancel }: {
  form: Omit<CrewMember, 'id'>;
  onChange: (f: Omit<CrewMember, 'id'>) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-gray-800/70 border border-orange-500/30 rounded-xl p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Full Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="John Smith"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Role</label>
          <select
            value={form.role}
            onChange={(e) => onChange({ ...form, role: e.target.value as CrewMember['role'] })}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            placeholder="(555) 000-0000"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>
        <div>
          <label className="text-gray-500 text-xs block mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
            placeholder="john@company.com"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Pay type toggle + rate field */}
        <div className="col-span-2">
          <label className="text-gray-500 text-xs block mb-1.5">Pay Type</label>
          <div className="flex items-center gap-3">
            {/* Pill toggle */}
            <div className="flex bg-gray-900 border border-gray-700 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onChange({ ...form, payType: 'hourly' })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  form.payType === 'hourly'
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Hourly
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...form, payType: 'percent' })}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  form.payType === 'percent'
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Percent
              </button>
            </div>

            {/* Conditional input */}
            {form.payType === 'hourly' ? (
              <div className="relative flex-1">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="number"
                  value={form.ratePerHour}
                  onChange={(e) => onChange({ ...form, ratePerHour: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-7 pr-8 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">/hr</span>
              </div>
            ) : (
              <div className="relative flex-1">
                <input
                  type="number"
                  value={form.payPercent}
                  min={0}
                  max={100}
                  onChange={(e) => onChange({ ...form, payPercent: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => onChange({ ...form, active: !form.active })}
              className={`rounded-full transition-colors cursor-pointer relative ${form.active ? 'bg-orange-500' : 'bg-gray-700'}`}
              style={{ width: 40, height: 22 }}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-gray-400 text-sm">{form.active ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update crew list card rate display**

Find the rate display section in the crew list (currently shows `${member.ratePerHour}/hr`). Replace it:

```tsx
{/* Rate */}
<div className="text-right flex-shrink-0">
  <div className="text-emerald-400 font-semibold text-sm">
    {member.payType === 'percent'
      ? `${member.payPercent}%`
      : `$${member.ratePerHour}/hr`}
  </div>
</div>
```

- [ ] **Step 6: Verify it builds**

```powershell
cd C:\Users\james\haulr-ai-estimator
npx tsc --noEmit
```

Expected: no errors. Fix any type errors before proceeding.

- [ ] **Step 7: Commit**

```powershell
git add src/components/settings/CrewManager.tsx
git commit -m "feat: add pay type toggle (hourly/percent) to crew member form"
git push
```

---

## Task 3: Job Crew API Endpoints

**Files:**
- Create: `src/app/api/jobs/[id]/crew/route.ts`
- Create: `src/app/api/jobs/[id]/crew/[crewId]/route.ts`

**Interfaces:**
- Consumes: `job_crew` table (from Task 1), `crew_members` table
- Produces:
  - `GET /api/jobs/[id]/crew` → `{ data: AssignedCrewRow[], error: null }`
  - `POST /api/jobs/[id]/crew` → body `{ crew_member_id: string }` → `{ data: AssignedCrewRow, error: null }`
  - `DELETE /api/jobs/[id]/crew/[crewId]` → `{ data: { success: true }, error: null }`
  - `AssignedCrewRow = { id, job_id, crew_member_id, assigned_at, crew_members: { id, name, role, phone, email, hourly_rate, pay_type, pay_percent, status } }`

- [ ] **Step 1: Create `src/app/api/jobs/[id]/crew/route.ts`**

```typescript
// GET /api/jobs/[id]/crew  — list crew assigned to a job
// POST /api/jobs/[id]/crew — assign a crew member to a job

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const AssignCrewSchema = z.object({
  crew_member_id: z.string().uuid(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id: jobId } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('job_crew')
      .select(`
        id,
        job_id,
        crew_member_id,
        assigned_at,
        crew_members (
          id, name, role, phone, email,
          hourly_rate, pay_type, pay_percent, status
        )
      `)
      .eq('job_id', jobId)
      .eq('clerk_user_id', userId)
      .order('assigned_at');

    if (error) {
      console.error('[jobs/crew GET]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [], error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/crew GET] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id: jobId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: { message: 'Invalid JSON body' } }, { status: 400 });
    }

    const parsed = AssignCrewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: 'crew_member_id (uuid) is required', details: parsed.error.flatten().fieldErrors } },
        { status: 422 }
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('job_crew')
      .insert({
        job_id: jobId,
        crew_member_id: parsed.data.crew_member_id,
        clerk_user_id: userId,
      })
      .select(`
        id,
        job_id,
        crew_member_id,
        assigned_at,
        crew_members (
          id, name, role, phone, email,
          hourly_rate, pay_type, pay_percent, status
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: { message: 'This crew member is already assigned to the job' } },
          { status: 409 }
        );
      }
      console.error('[jobs/crew POST]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/crew POST] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `src/app/api/jobs/[id]/crew/[crewId]/route.ts`**

```typescript
// DELETE /api/jobs/[id]/crew/[crewId] — remove a crew member from a job

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; crewId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id: jobId, crewId } = await params;
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('job_crew')
      .delete()
      .eq('job_id', jobId)
      .eq('crew_member_id', crewId)
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[jobs/crew DELETE]', error.message);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[jobs/crew DELETE] Unhandled:', msg);
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify it builds**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add src/app/api/jobs/[id]/crew/route.ts "src/app/api/jobs/[id]/crew/[crewId]/route.ts"
git commit -m "feat: add job crew assignment API endpoints"
git push
```

---

## Task 4: Fix Jobs GET API + Add `estimated_hours` to PUT

**Files:**
- Modify: `src/app/api/jobs/[id]/route.ts`

**Interfaces:**
- Consumes: `job_crew` table, `crew_members` table (both from Task 1)
- Produces: Job GET response gains `crew` array populated from `job_crew` join; PUT accepts `estimated_hours: number | null`

- [ ] **Step 1: Fix the crew loading in GET and add `estimated_hours` to `UpdateJobSchema`**

Open `src/app/api/jobs/[id]/route.ts`. Make these three changes:

**Change 1** — Replace `UpdateJobSchema` (remove `crew_ids`, add `estimated_hours`):

```typescript
const UpdateJobSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  scheduled_date: z.string().optional(),
  scheduled_time: z.string().optional(),
  estimated_hours: z.number().min(0).max(24).optional().nullable(),
  truck_id: z.string().uuid().optional().nullable(),
  notes: z.string().max(2000).optional(),
  before_photos: z.array(z.string()).optional(),
  after_photos: z.array(z.string()).optional(),
  quote_id: z.string().uuid().optional().nullable(),
});
```

**Change 2** — Replace the crew-loading block in GET (lines 60–68, the `// Load crew details if crew_ids present` block):

```typescript
// Load crew assigned via job_crew junction table
const { data: crewData } = await supabase
  .from('job_crew')
  .select(`
    crew_member_id,
    assigned_at,
    crew_members (
      id, name, role, phone, email,
      hourly_rate, pay_type, pay_percent, status
    )
  `)
  .eq('job_id', id)
  .eq('clerk_user_id', userId);
const crew = (crewData ?? []).map((row) => row.crew_members).filter(Boolean);
```

**Change 3** — Also remove the `APP_CONFIG` import if `crew_ids` was the only thing using it. Check by searching for other usages of `APP_CONFIG` in the file — if none remain, remove:
```typescript
import { APP_CONFIG } from '@/lib/constants';
```

- [ ] **Step 2: Verify it builds**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/api/jobs/[id]/route.ts"
git commit -m "fix: load crew from job_crew table, add estimated_hours to job schema"
git push
```

---

## Task 5: Job Detail Page — Real Data + Crew Assignment + Payout

**Files:**
- Rewrite: `src/app/(dashboard)/jobs/[id]/page.tsx`

This is the biggest task. The current file uses entirely mock data. We replace it with real API calls and add the crew assignment + payout section.

**Interfaces:**
- Consumes:
  - `GET /api/jobs/[id]` → job with customer, quote, truck, photos
  - `GET /api/jobs/[id]/crew` → assigned crew with pay fields
  - `GET /api/crew` → full active roster for the assignment picker
  - `POST /api/jobs/[id]/crew` with `{ crew_member_id }` → assign
  - `DELETE /api/jobs/[id]/crew/[crewId]` → unassign
  - `PUT /api/jobs/[id]` with `{ estimated_hours }` → save hours
- Produces: Fully functional job detail page

**Key types needed:**

```typescript
interface AssignedCrewMember {
  id: string;           // crew_members.id
  name: string;
  role: string;
  phone: string;
  email: string;
  hourly_rate: number;
  pay_type: 'hourly' | 'percent';
  pay_percent: number;
  status: string;
}

interface JobCrewRow {
  crew_member_id: string;
  assigned_at: string;
  crew_members: AssignedCrewMember;
}
```

- [ ] **Step 1: Read the full current file before editing**

Read all of `src/app/(dashboard)/jobs/[id]/page.tsx` to understand the full component structure (it's ~600+ lines). Note all the sections: header, status, customer card, crew section, truck section, photos, notes, action buttons. You will keep the visual structure but replace mock data with real state + API calls, and replace the crew section.

- [ ] **Step 2: Rewrite the file**

Replace the entire file with the implementation below. This keeps all existing UI sections intact (header, status, customer, truck, photos, notes, actions) and replaces mock data with real fetches, then adds the new Crew & Payout section.

```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Clock, Users, Truck, FileText, Camera,
  StickyNote, Play, CheckCircle2, Timer, DollarSign, User,
  MapPin, Phone, Mail, ExternalLink, Save, Loader2, X, Plus,
  CalendarCheck, UserMinus, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssignedCrewMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  hourly_rate: number;
  pay_type: 'hourly' | 'percent';
  pay_percent: number;
  status: string;
}

interface JobCrewRow {
  crew_member_id: string;
  assigned_at: string;
  crew_members: AssignedCrewMember;
}

interface RosterMember {
  id: string;
  name: string;
  role: string;
  hourly_rate: number;
  pay_type: 'hourly' | 'percent';
  pay_percent: number;
  status: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_hours: number | null;
  service_address: string | null;
  notes: string | null;
  completion_notes: string | null;
  before_photos: string[];
  after_photos: string[];
  actual_revenue: number | null;
  actual_dump_fee: number | null;
  customers: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  quotes: {
    id: string;
    quote_number: string;
    total: number;
    status: string;
  } | null;
  truck_id: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft:       'bg-gray-500/20 text-gray-400',
  quoted:      'bg-blue-500/20 text-blue-400',
  scheduled:   'bg-purple-500/20 text-purple-400',
  in_progress: 'bg-orange-500/20 text-orange-400',
  completed:   'bg-emerald-500/20 text-emerald-400',
  cancelled:   'bg-red-500/20 text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', quoted: 'Quoted', scheduled: 'Scheduled',
  in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};

const ROLE_COLORS: Record<string, string> = {
  driver: 'bg-blue-500/20 text-blue-400',
  laborer: 'bg-orange-500/20 text-orange-400',
  supervisor: 'bg-purple-500/20 text-purple-400',
  helper: 'bg-gray-500/20 text-gray-400',
  lead: 'bg-purple-500/20 text-purple-400',
  worker: 'bg-orange-500/20 text-orange-400',
};

// ---------------------------------------------------------------------------
// Payout calculation
// ---------------------------------------------------------------------------

function calcCrewPayout(
  member: AssignedCrewMember,
  jobTotal: number,
  estimatedHours: number | null
): number {
  if (member.pay_type === 'percent') {
    return (jobTotal * member.pay_percent) / 100;
  }
  return member.hourly_rate * (estimatedHours ?? 0);
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [assignedCrew, setAssignedCrew] = useState<AssignedCrewMember[]>([]);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Load job data
  const loadJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to load job');
      setJob(json.data);
      setEstimatedHours(json.data.estimated_hours?.toString() ?? '');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load job');
    }
  }, [jobId]);

  // Load assigned crew
  const loadCrew = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/crew`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to load crew');
      setAssignedCrew((json.data as JobCrewRow[]).map((r) => r.crew_members).filter(Boolean));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load crew');
    }
  }, [jobId]);

  // Load full active roster for picker
  const loadRoster = useCallback(async () => {
    try {
      const res = await fetch('/api/crew');
      const json = await res.json();
      if (!res.ok) return;
      setRoster((json.data as RosterMember[]).filter((m) => m.status === 'active'));
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    Promise.all([loadJob(), loadCrew(), loadRoster()]).finally(() => setLoading(false));
  }, [loadJob, loadCrew, loadRoster]);

  // Save estimated hours
  const saveEstimatedHours = async () => {
    setSavingHours(true);
    try {
      const hours = estimatedHours === '' ? null : Number(estimatedHours);
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimated_hours: hours }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to save');
      setJob((prev) => prev ? { ...prev, estimated_hours: hours } : prev);
      toast.success('Hours saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save hours');
    } finally {
      setSavingHours(false);
    }
  };

  // Assign crew member
  const assignCrew = async (crewMemberId: string) => {
    setAssigning(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/crew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crew_member_id: crewMemberId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to assign crew');
      await loadCrew();
      setPickerOpen(false);
      toast.success('Crew member assigned');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign crew');
    } finally {
      setAssigning(false);
    }
  };

  // Remove crew member
  const removeCrew = async (crewMemberId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/crew/${crewMemberId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to remove crew');
      setAssignedCrew((prev) => prev.filter((m) => m.id !== crewMemberId));
      toast.success('Crew member removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove crew');
    }
  };

  // Update job status
  const updateStatus = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update status');
      setJob((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success(`Job marked as ${STATUS_LABELS[newStatus]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-gray-400">Job not found.</p>
        <Link href="/jobs" className="text-orange-400 text-sm mt-2 block">← Back to Jobs</Link>
      </div>
    );
  }

  // Payout calculations
  const jobTotal = job.quotes?.total ?? job.actual_revenue ?? 0;
  const dumpFee = job.actual_dump_fee ?? 0;
  const estimatedHoursNum = job.estimated_hours;
  const crewPayouts = assignedCrew.map((m) => ({
    member: m,
    payout: calcCrewPayout(m, jobTotal, estimatedHoursNum),
  }));
  const totalCrewCost = crewPayouts.reduce((sum, c) => sum + c.payout, 0);
  const ownerTake = jobTotal - totalCrewCost - dumpFee;

  // Crew not yet in picker (exclude already assigned)
  const assignedIds = new Set(assignedCrew.map((m) => m.id));
  const availableRoster = roster.filter((m) => !assignedIds.has(m.id));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/jobs"
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-gray-100 text-xl font-bold truncate">{job.title || 'Untitled Job'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status] ?? 'bg-gray-500/20 text-gray-400'}`}>
              {STATUS_LABELS[job.status] ?? job.status}
            </span>
            {job.scheduled_date && (
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(parseISO(job.scheduled_date), 'MMM d, yyyy')}
                {job.scheduled_time && ` at ${job.scheduled_time}`}
              </span>
            )}
          </div>
        </div>
        {/* Status action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {job.status === 'scheduled' && (
            <button
              onClick={() => updateStatus('in_progress')}
              disabled={statusUpdating}
              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Play className="w-4 h-4" />
              Start Job
            </button>
          )}
          {job.status === 'in_progress' && (
            <button
              onClick={() => updateStatus('completed')}
              disabled={statusUpdating}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Job
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Description */}
          {job.description && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />Job Details
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">{job.description}</p>
            </div>
          )}

          {/* Crew assignment section */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />Crew
              </h3>
              <div className="relative">
                <button
                  onClick={() => setPickerOpen((v) => !v)}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors border border-gray-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Crew
                  <ChevronDown className={`w-3 h-3 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown picker */}
                {pickerOpen && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 overflow-hidden">
                    {availableRoster.length === 0 ? (
                      <p className="text-gray-500 text-xs p-3">
                        {roster.length === 0 ? 'No active crew members' : 'All crew already assigned'}
                      </p>
                    ) : (
                      availableRoster.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => assignCrew(m.id)}
                          disabled={assigning}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-orange-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-gray-200 text-sm font-medium truncate">{m.name}</div>
                            <div className="text-gray-500 text-xs">
                              {m.pay_type === 'percent' ? `${m.pay_percent}%` : `$${m.hourly_rate}/hr`}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {assignedCrew.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">No crew assigned yet</p>
            ) : (
              <div className="space-y-2">
                {assignedCrew.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5"
                  >
                    <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-200 text-sm font-medium">{member.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[member.role] ?? 'bg-gray-500/20 text-gray-400'}`}>
                          {member.role}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {member.pay_type === 'percent'
                          ? `${member.pay_percent}% of job`
                          : `$${member.hourly_rate}/hr`}
                      </div>
                    </div>
                    <button
                      onClick={() => removeCrew(member.id)}
                      className="text-gray-600 hover:text-red-400 p-1 rounded transition-colors"
                      title="Remove from job"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payout summary — only shown when crew assigned and job has a total */}
          {assignedCrew.length > 0 && jobTotal > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" />Payout Breakdown
              </h3>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Job total</span>
                  <span className="font-semibold">${jobTotal.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-800 my-2" />

                {crewPayouts.map(({ member, payout }) => (
                  <div key={member.id} className="flex justify-between">
                    <span className="text-gray-400">
                      {member.name}
                      <span className="text-gray-600 ml-1.5 text-xs">
                        {member.pay_type === 'percent'
                          ? `${member.pay_percent}%`
                          : `$${member.hourly_rate}/hr × ${estimatedHoursNum ?? 0}h`}
                      </span>
                    </span>
                    <span className="text-orange-300 font-medium">${payout.toFixed(2)}</span>
                  </div>
                ))}

                {dumpFee > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Dump fee</span>
                    <span className="text-red-400">${dumpFee.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-gray-800 my-2" />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-200">Your take</span>
                  <span className={ownerTake >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    ${ownerTake.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {job.notes && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5" />Notes
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{job.notes}</p>
            </div>
          )}
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-4">

          {/* Estimated hours */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
              <Timer className="w-3.5 h-3.5" />Estimated Duration
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  min={0}
                  step={0.5}
                  placeholder="e.g. 2.5"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 pr-8 py-2 text-gray-200 text-sm focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">hrs</span>
              </div>
              <button
                onClick={saveEstimatedHours}
                disabled={savingHours}
                className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingHours ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-1.5">Used to calculate hourly crew pay</p>
          </div>

          {/* Customer */}
          {job.customers && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-3.5 h-3.5" />Customer
              </h3>
              <div className="space-y-1.5">
                <p className="text-gray-200 font-medium text-sm">{job.customers.name}</p>
                {job.customers.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-400 text-xs">{job.customers.phone}</span>
                  </div>
                )}
                {job.customers.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-gray-600" />
                    <span className="text-gray-400 text-xs truncate">{job.customers.email}</span>
                  </div>
                )}
                {job.customers.address && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-400 text-xs">
                      {job.customers.address}, {job.customers.city}, {job.customers.state} {job.customers.zip}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Linked quote */}
          {job.quotes && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />Quote
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-200 text-sm font-medium">{job.quotes.quote_number}</p>
                  <p className="text-emerald-400 font-semibold text-sm mt-0.5">${job.quotes.total.toFixed(2)}</p>
                </div>
                <Link
                  href={`/quotes/${job.quotes.id}`}
                  className="text-gray-600 hover:text-orange-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* Service address */}
          {job.service_address && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />Service Address
              </h3>
              <p className="text-gray-300 text-sm">{job.service_address}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Close picker when clicking outside**

Add a `useEffect` to close the picker when the user clicks outside. Add this inside the component, after the state declarations:

```tsx
useEffect(() => {
  if (!pickerOpen) return;
  const handle = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-crew-picker]')) setPickerOpen(false);
  };
  document.addEventListener('mousedown', handle);
  return () => document.removeEventListener('mousedown', handle);
}, [pickerOpen]);
```

Then add `data-crew-picker` to the relative div wrapping the Add Crew button and dropdown:

```tsx
<div className="relative" data-crew-picker>
```

- [ ] **Step 4: Verify it builds**

```powershell
npx tsc --noEmit
```

Fix any type errors. The `Button` and `cn` imports from the old file may still be referenced — remove them if so. Also remove any remaining mock data constants (`MOCK_ALL_CREW`, `MOCK_ALL_TRUCKS`, `getMockJob`).

- [ ] **Step 5: Commit**

```powershell
git add "src/app/(dashboard)/jobs/[id]/page.tsx"
git commit -m "feat: replace mock job detail with real data, add crew assignment and payout breakdown"
git push
```

---

## Self-Review

**Spec coverage check:**
- ✅ `pay_type` / `pay_percent` columns on `crew_members` — Task 1 + Task 2
- ✅ `estimated_hours` on `jobs` — Task 1 + Task 4
- ✅ `job_crew` junction table — Task 1 + Task 3
- ✅ Pay type toggle in crew form (pill-style) — Task 2
- ✅ Conditional hourly/percent field — Task 2
- ✅ Both values always stored — `memberToPayload` sends both in Task 2
- ✅ Crew list card shows active pay type — Task 2
- ✅ Crew assignment on job page (not at booking) — Task 5
- ✅ No max crew limit — Task 3 POST has no limit, Task 5 picker has no cap
- ✅ Payout breakdown with per-member calc — Task 5
- ✅ Owner take-home calculation — Task 5
- ✅ Estimated hours editable on job page — Task 5 sidebar
- ✅ Remove crew member from job — Task 3 DELETE + Task 5 UI
- ✅ No changes to quote pricing — confirmed, not touched

**Type consistency:** `AssignedCrewMember` used in Task 3 response and Task 5 state. `JobCrewRow` maps `crew_members` join consistently. `RosterMember` used only for picker display.

**Placeholder scan:** No TBDs, no "similar to above", all code blocks complete.
