# Crew Pay Types & Job Payout Breakdown

**Date:** 2026-06-26  
**Status:** Approved

---

## Overview

Crew members can be paid either by hourly rate or by a percentage of the job total. The owner has a bench of ~6–7 friends; only 1+ are pulled per job based on availability. After a job is booked, crew are assigned on the job detail page (not at booking time), reflecting the real workflow of texting friends to see who's free.

The feature shows a payout breakdown on each job — what each crew member earns and what the owner takes home — so the owner can verify margin before heading out.

---

## Data Model Changes

### 1. `crew_members` table — two new columns

| Column | Type | Default | Notes |
|---|---|---|---|
| `pay_type` | text | `'hourly'` | `'hourly'` or `'percent'` |
| `pay_percent` | numeric(5,2) | `0` | e.g. `20` = 20% |

Both values are always stored. The `pay_type` column controls which is used for payout calculations. Switching pay type on a crew member doesn't erase the other value, so you can freely toggle between modes.

### 2. `jobs` table — one new column

| Column | Type | Default | Notes |
|---|---|---|---|
| `estimated_hours` | numeric(4,1) | `null` | Used for hourly crew payout calc |

### 3. New `job_crew` junction table

Links crew members to specific jobs. No limit on crew per job.

```sql
CREATE TABLE job_crew (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  crew_member_id  uuid NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  clerk_user_id   text NOT NULL,
  assigned_at     timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, crew_member_id)
);
```

---

## Crew Manager UI (Settings → Crew & Trucks)

### Crew member form

The existing form gains a **pay type toggle** between `Hourly` and `Percent` (pill-style, consistent with existing active/inactive toggle).

- **Hourly selected:** shows the existing `$/hr` input
- **Percent selected:** replaces it with a `%` input (e.g. `20`)
- Both values always saved to DB regardless of which is active

### Crew list card

The rate display in the top-right of each crew card changes based on `pay_type`:
- Hourly: `$22/hr` (green, existing style)
- Percent: `20%` (green, same style)

---

## Job Detail Page

### Crew assignment section

A new **Crew** section on the job detail page with:
- A searchable picker to add crew from the active roster
- No maximum — any number of crew can be assigned
- Each assigned crew member shows as a card: name, role, pay type indicator
- A remove button per card to swap someone out

### Payout summary box

Shown below the crew cards whenever at least one crew member is assigned:

```
Job total:   $600
─────────────────────────────
Mike         20%      → $120
Tom          $22/hr × 3h → $66
─────────────────────────────
Dump fee:    $55
Your take:   $359
```

**Percent crew:** `job_total × (pay_percent / 100)`  
**Hourly crew:** `hourly_rate × estimated_hours` (estimated_hours editable inline on the card)

The `estimated_hours` field also appears as an editable field on the job detail page (not just inside the payout card), so it can be set independently of crew assignment.

---

## API Changes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/jobs/[id]/crew` | List crew assigned to a job |
| POST | `/api/jobs/[id]/crew` | Assign a crew member to a job |
| DELETE | `/api/jobs/[id]/crew/[crewId]` | Remove a crew member from a job |

The existing `/api/crew` and `/api/crew/[id]` endpoints are updated to include `pay_type` and `pay_percent` fields.

The existing `/api/jobs/[id]` PUT endpoint accepts `estimated_hours`.

---

## Migration

One SQL migration file:
1. Add `pay_type`, `pay_percent` to `crew_members`
2. Add `estimated_hours` to `jobs`
3. Create `job_crew` table with RLS policies and service role policy

---

## Out of Scope

- No changes to quote pricing — crew pay is a post-booking payout tool, not a pricing input
- No SMS/notification integration — owner handles crew communication externally
- No payment processing — payout summary is informational only
