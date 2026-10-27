# SheShield — Engineering Setup & Architecture Guide

## 1. Overview
SheShield is an AI-powered women's safety platform built with Next.js 16 (App Router), Supabase (PostgreSQL, Auth, Realtime), MapLibre GL JS (interactive live geospatial maps and routing), and client-side sensor APIs (geolocation, device motion, media capture).

---

## 2. Environment Variables (.env.local)

The application expects the following configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Optional: Map & Routing Overrides (Defaults to open Carto & OSRM)
NEXT_PUBLIC_MAP_STYLE_URL=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
# ROUTING_PROVIDER=osrm (default) or mapbox
# ROUTING_API_KEY=your_mapbox_token_if_using_mapbox

# Optional: SMS Provider Credentials (MSG91, Exotel, or Twilio)
# SMS_PROVIDER=test (default) or msg91 or twilio
# SMS_API_KEY=your_sms_key
# SMS_SENDER_ID=SHESHLD

# Optional: Server-side LLM Provider (Defaults to local RAG fallback)
# LLM_PROVIDER=openai or groq or anthropic
# LLM_API_KEY=your_llm_key
```

---

## 3. Database Migration Setup

SheShield provides version-controlled SQL migrations located in:
`supabase/migrations/20261027000001_initial_sheshield_schema.sql`

To apply the migration:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to your project -> **SQL Editor**.
3. Open `supabase/migrations/20261027000001_initial_sheshield_schema.sql` and click **Run**.
4. All tables (`profiles`, `emergency_contacts`, `location_sharing_sessions`, `location_updates`, `sos_events`, `safety_reports`, `assistance_resources`, `community_posts`, `evidence_records`, `user_preferences`), RLS policies, spatial indexes, and demo datasets will be created.

---

## 4. Key Development Commands

```bash
# Start development server
npm run dev

# Run TypeScript checks
npm run build

# Run automated tests
npm test

# Lint code
npm run lint
```
