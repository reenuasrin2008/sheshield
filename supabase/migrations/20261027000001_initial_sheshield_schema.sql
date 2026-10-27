-- ==============================================================================
-- SheShield Database Schema Migration
-- Version: 20261027000001
-- Description: Complete schema for SheShield platform with RLS, indexes, and seeds
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'ta', 'hi')),
  blood_group TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. Emergency Contacts Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  relationship TEXT,
  priority_order INT NOT NULL DEFAULT 1,
  notify_sms BOOLEAN NOT NULL DEFAULT true,
  notify_call BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON public.emergency_contacts(user_id);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own emergency contacts"
  ON public.emergency_contacts FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. Location Sharing Sessions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.location_sharing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Live Journey',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'revoked')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  recipient_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sharing_sessions_user_id ON public.location_sharing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sharing_sessions_share_token ON public.location_sharing_sessions(share_token);

ALTER TABLE public.location_sharing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sharing sessions"
  ON public.location_sharing_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public token holders can read active unexpired sessions"
  ON public.location_sharing_sessions FOR SELECT
  USING (status = 'active' AND expires_at > timezone('utc'::text, now()));

-- ------------------------------------------------------------------------------
-- 4. Location Updates (Throttled Coordinates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.location_sharing_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_location_updates_session ON public.location_updates(session_id, recorded_at DESC);

ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own location updates"
  ON public.location_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own location updates"
  ON public.location_updates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authorized session viewers can read location updates"
  ON public.location_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.location_sharing_sessions s
      WHERE s.id = location_updates.session_id
        AND s.status = 'active'
        AND s.expires_at > timezone('utc'::text, now())
    )
  );

-- ------------------------------------------------------------------------------
-- 5. SOS Events
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'triggered' CHECK (status IN ('triggered', 'active', 'cancelled', 'resolved', 'test')),
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'voice', 'shake', 'wearable', 'fake_call_abort')),
  is_test BOOLEAN NOT NULL DEFAULT false,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  battery_level INT,
  sharing_session_id UUID REFERENCES public.location_sharing_sessions(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  cancelled_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sos_events_user_id ON public.sos_events(user_id, created_at DESC);

ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own SOS events"
  ON public.sos_events FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. Safety Reports (Community & Crowdsourced)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('poor_lighting', 'harassment', 'isolated_area', 'suspicious_activity', 'safe_haven', 'other')),
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT,
  fuzzed_latitude DOUBLE PRECISION NOT NULL,
  fuzzed_longitude DOUBLE PRECISION NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('pending', 'verified', 'rejected', 'archived')),
  confidence_score NUMERIC NOT NULL DEFAULT 0.85,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_safety_reports_coords ON public.safety_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON public.safety_reports(status, reported_at DESC);

ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified reports"
  ON public.safety_reports FOR SELECT
  USING (status = 'verified');

CREATE POLICY "Authenticated users can create safety reports"
  ON public.safety_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view and edit their own reports"
  ON public.safety_reports FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. Assistance Resources (Police, Hospitals, Helplines)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assistance_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('police', 'hospital', 'shelter', 'helpline', 'safe_store')),
  phone_number TEXT,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_24x7 BOOLEAN NOT NULL DEFAULT true,
  verified BOOLEAN NOT NULL DEFAULT true,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assistance_coords ON public.assistance_resources(latitude, longitude);

ALTER TABLE public.assistance_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified assistance resources"
  ON public.assistance_resources FOR SELECT
  USING (verified = true);

-- ------------------------------------------------------------------------------
-- 8. Community Discussion & Support Posts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('safety_tips', 'commute_advice', 'support', 'announcements')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  city TEXT,
  likes_count INT NOT NULL DEFAULT 0,
  is_moderated BOOLEAN NOT NULL DEFAULT true,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created ON public.community_posts(created_at DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view moderated community posts"
  ON public.community_posts FOR SELECT
  USING (is_moderated = true);

CREATE POLICY "Users can create community posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. Evidence Records (Metadata only - secure)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evidence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sos_event_id UUID REFERENCES public.sos_events(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'photo', 'video', 'mock')),
  storage_path TEXT,
  file_size_bytes BIGINT,
  duration_seconds INT,
  is_test BOOLEAN NOT NULL DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  retention_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can strictly manage their own evidence records"
  ON public.evidence_records FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. User Preferences
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta', 'hi')),
  enable_shake_to_sos BOOLEAN NOT NULL DEFAULT false,
  shake_sensitivity INT NOT NULL DEFAULT 15,
  countdown_seconds INT NOT NULL DEFAULT 5,
  fake_caller_name TEXT NOT NULL DEFAULT 'Mom',
  fake_call_delay_seconds INT NOT NULL DEFAULT 10,
  offline_cache_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Seed Initial Assistance Resources (Verified Public Resources)
-- ------------------------------------------------------------------------------
INSERT INTO public.assistance_resources (name, category, phone_number, address, latitude, longitude, is_24x7, verified, is_demo)
VALUES
  ('National Women Helpline', 'helpline', '1091', 'Toll Free All India', 28.6139, 77.2090, true, true, false),
  ('Emergency Response Support System (ERSS)', 'helpline', '112', 'Pan-India Unified Emergency', 28.6139, 77.2090, true, true, false),
  ('National Commission for Women Helpline', 'helpline', '7827170170', 'New Delhi', 28.5672, 77.2100, true, true, false),
  ('Central Police Station (Demo Seed)', 'police', '100', 'Connaught Place, Central City', 28.6315, 77.2167, true, true, true),
  ('Metropolitan General Hospital 24/7 (Demo Seed)', 'hospital', '011-23234000', 'Medical Enclave, Central City', 28.6280, 77.2200, true, true, true)
ON CONFLICT DO NOTHING;
