-- =========================================================================
-- LegacyLock: Supabase PostgreSQL Schema & Row Level Security (RLS)
-- File: supabase/migrations/20261011_initial_schema.sql
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'reviewer', 'beneficiary')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('Documents', 'Photos & Memories', 'Account Records', 'Personal Notes', 'Other')),
  tags TEXT[] DEFAULT '{}',
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  preview_url TEXT,
  is_encrypted_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can perform all actions on their own assets"
  ON public.assets FOR ALL
  USING (auth.uid() = user_id);

-- 3. Beneficiaries Table
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  assigned_asset_ids TEXT[] DEFAULT '{}',
  assigned_categories TEXT[] DEFAULT '{}',
  future_access_level TEXT NOT NULL DEFAULT 'specific_assets' CHECK (future_access_level IN ('full', 'specific_assets', 'instructions_only')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'confirmed')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own beneficiaries"
  ON public.beneficiaries FOR ALL
  USING (auth.uid() = user_id);

-- 4. Legacy Instructions Table
CREATE TABLE IF NOT EXISTS public.legacy_instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES public.beneficiaries(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('personal_message', 'general_directive', 'asset_distribution', 'digital_accounts')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_locked_until_inheritance BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.legacy_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own instructions"
  ON public.legacy_instructions FOR ALL
  USING (auth.uid() = user_id);

-- 5. Check-In Settings Table
CREATE TABLE IF NOT EXISTS public.check_in_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  frequency_days INT NOT NULL DEFAULT 30,
  grace_period_days INT NOT NULL DEFAULT 7,
  last_check_in_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  next_check_in_due TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'missed')),
  reminder_email TEXT NOT NULL,
  notify_beneficiaries_on_missed BOOLEAN DEFAULT true
);

ALTER TABLE public.check_in_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own check-in settings"
  ON public.check_in_settings FOR ALL
  USING (auth.uid() = user_id);

-- 6. Check-In Events Table
CREATE TABLE IF NOT EXISTS public.check_in_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('user_confirmed', 'reminder_sent', 'missed_flagged', 'frequency_updated')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ip_or_origin TEXT,
  notes TEXT
);

ALTER TABLE public.check_in_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own check-in events"
  ON public.check_in_events FOR ALL
  USING (auth.uid() = user_id);

-- 7. Inheritance Requests Table
CREATE TABLE IF NOT EXISTS public.inheritance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
  beneficiary_email TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Request submitted' CHECK (status IN ('No request', 'Request submitted', 'Awaiting review', 'Approved', 'Rejected', 'Access granted', 'Access revoked')),
  evidence_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.inheritance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their inheritance requests"
  ON public.inheritance_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Reviewers can review inheritance requests"
  ON public.inheritance_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'reviewer'
    )
  );

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  ip TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 9. Private Storage Bucket Setup (Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault-files', 'vault-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own vault files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vault-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read their own vault files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vault-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
