# HAULR AI Estimator

AI-powered junk removal estimating for modern hauling businesses. Upload photos, get instant AI-generated quotes, manage customers, schedule jobs, and collect payments — all in one place.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repo](#2-clone-the-repo)
3. [Install Dependencies](#3-install-dependencies)
4. [Set Up Supabase](#4-set-up-supabase)
5. [Set Up Clerk](#5-set-up-clerk)
6. [Set Up OpenAI](#6-set-up-openai)
7. [Set Up Google Maps](#7-set-up-google-maps)
8. [Set Up Stripe](#8-set-up-stripe)
9. [Configure Environment Variables](#9-configure-environment-variables)
10. [Run Database Migrations](#10-run-database-migrations)
11. [Run the Dev Server](#11-run-the-dev-server)
12. [Deploy to Vercel](#12-deploy-to-vercel)

---

## 1. Prerequisites

Make sure you have the following installed:

- **Node.js** 18.17 or later ([nodejs.org](https://nodejs.org))
- **npm** 9+ (comes with Node)
- **Git** ([git-scm.com](https://git-scm.com))

You will also need accounts at:

- [Supabase](https://supabase.com) (database + storage)
- [Clerk](https://clerk.com) (authentication)
- [OpenAI](https://platform.openai.com) (GPT-4 Vision)
- [Google Cloud Console](https://console.cloud.google.com) (Maps APIs)
- [Stripe](https://stripe.com) (payments)
- [Vercel](https://vercel.com) (deployment)

---

## 2. Clone the Repo

```bash
git clone https://github.com/your-org/haulr-ai-estimator.git
cd haulr-ai-estimator
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your users (e.g., `us-east-1`).
3. Note your **Project URL** and **anon (public) key** from **Settings > API**.
4. Also note your **service_role key** (keep this secret — server-side only).

### Create the Storage Bucket

1. In your Supabase dashboard, go to **Storage**.
2. Click **New bucket**.
3. Name it `job-photos`.
4. Set it to **Public** (photos need to be accessible by the AI).
5. Under **Policies**, add a policy to allow authenticated users to upload:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-photos');

-- Allow public read access
CREATE POLICY "Public can read job photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-photos');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'job-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 5. Set Up Clerk

1. Go to [clerk.com](https://clerk.com) and create a new application.
2. Choose **Email + Password** and/or **Social logins** as sign-in options.
3. From the dashboard, note your **Publishable Key** and **Secret Key**.
4. Under **Paths**, configure:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/sign-up`
   - **After sign-in URL**: `/dashboard`
   - **After sign-up URL**: `/dashboard`
5. Under **Webhooks**, create a webhook pointing to:
   ```
   https://your-domain.com/api/webhooks/clerk
   ```
   Subscribe to events: `user.created`, `user.updated`, `user.deleted`
6. Note the **Webhook Signing Secret**.

---

## 6. Set Up OpenAI

1. Go to [platform.openai.com](https://platform.openai.com).
2. Create an API key under **API Keys**.
3. Ensure your account has access to **GPT-4o** (required for Vision).
4. Set a spending limit to avoid unexpected charges.

---

## 7. Set Up Google Maps

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (or use an existing one).
3. Enable these APIs:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Distance Matrix API**
   - **Places API** (optional, for address autocomplete)
4. Create an API key under **APIs & Services > Credentials**.
5. Restrict the key to your domain in production.

---

## 8. Set Up Stripe

1. Go to [stripe.com](https://stripe.com) and create/log into your account.
2. From the dashboard, note your **Publishable Key** and **Secret Key**.
3. Create a **Webhook** endpoint pointing to:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
4. Subscribe to these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Note the **Webhook Signing Secret**.
6. Create a **Product** and **Price** for the monthly subscription ($149/mo) and record the **Price ID**.

---

## 9. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI
OPENAI_API_KEY=sk-...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 10. Run Database Migrations

Push the SQL migration files to your Supabase project via the SQL Editor:

1. Open your Supabase dashboard > **SQL Editor**.
2. Run each file in `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - (any additional migration files)

Or use the Supabase CLI if you have it installed:

```bash
npx supabase db push
```

---

## 11. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- Landing page: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard` (requires sign-in)
- Health check: `http://localhost:3000/api/health`

---

## 12. Deploy to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. On first deploy, set all environment variables when asked.

### Option B: GitHub Integration

1. Push your repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **New Project**.
3. Import your GitHub repository.
4. Add all environment variables from `.env.local` in the Vercel dashboard.
5. Click **Deploy**.

### After Deployment

1. Update your Clerk webhook URL to your Vercel domain.
2. Update your Stripe webhook URL to your Vercel domain.
3. Update `NEXT_PUBLIC_APP_URL` to your Vercel domain.
4. Restrict your Google Maps API key to your Vercel domain.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| AI | OpenAI GPT-4o Vision |
| Payments | Stripe |
| Maps | Google Maps API |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Deployment | Vercel |

---

## License

Private — All rights reserved.
