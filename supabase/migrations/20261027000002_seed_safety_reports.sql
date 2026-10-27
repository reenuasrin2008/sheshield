-- ==============================================================================
-- SheShield Database Migration: Seed Verified Safety Reports
-- Version: 20261027000002
-- Description: Seeds verified demonstration records into safety_reports with fuzzed coordinates
-- ==============================================================================

INSERT INTO public.safety_reports (
  id,
  category,
  description,
  latitude,
  longitude,
  location_name,
  fuzzed_latitude,
  fuzzed_longitude,
  severity,
  status,
  confidence_score,
  is_demo,
  reported_at
)
VALUES
  (
    'a1111111-1111-4111-a111-111111111101',
    'poor_lighting',
    'Streetlights dysfunctional along pedestrian path near Metro Station Exit 2. Low visibility after 8 PM.',
    28.6328,
    77.2195,
    'Connaught Place Sector 4 (Generalized Area)',
    28.6335,
    77.2202,
    'medium',
    'verified',
    0.92,
    true,
    now() - interval '2 days'
  ),
  (
    'a1111111-1111-4111-a111-111111111102',
    'harassment',
    'Group of loiterers catcalling near bus terminus after 9 PM. Municipal patrol requested.',
    28.6275,
    77.2120,
    'Janpath Transit Hub (Generalized Area)',
    28.6281,
    77.2126,
    'high',
    'verified',
    0.88,
    true,
    now() - interval '4 days'
  ),
  (
    'a1111111-1111-4111-a111-111111111103',
    'safe_haven',
    '24/7 Well-lit pharmacy with security guard and emergency contact board. Safe waiting point.',
    28.6350,
    77.2150,
    'Barakhamba Road Plaza (Generalized Area)',
    28.6355,
    77.2155,
    'low',
    'verified',
    0.95,
    true,
    now() - interval '5 days'
  ),
  (
    'a1111111-1111-4111-a111-111111111104',
    'isolated_area',
    'Narrow sub-way lane with obstructed view and absent security cameras during evening hours.',
    28.6220,
    77.2240,
    'Pragati Maidan Perimeter (Generalized Area)',
    28.6228,
    77.2245,
    'medium',
    'verified',
    0.85,
    true,
    now() - interval '12 days'
  ),
  (
    'a1111111-1111-4111-a111-111111111105',
    'suspicious_activity',
    'Unregistered vehicle lingering near park boundary during late hours without parking permit.',
    28.6185,
    77.2155,
    'India Gate Outer Ring (Generalized Area)',
    28.6190,
    77.2160,
    'medium',
    'verified',
    0.82,
    true,
    now() - interval '18 days'
  ),
  (
    'a1111111-1111-4111-a111-111111111106',
    'poor_lighting',
    'Overgrown tree foliage completely obscuring municipal lighting along bicycle boulevard.',
    28.6410,
    77.2280,
    'Pahar Ganj Approach (Generalized Area)',
    28.6416,
    77.2285,
    'low',
    'verified',
    0.90,
    true,
    now() - interval '24 days'
  ),
  (
    'a1111111-1111-4111-a111-111111111107',
    'harassment',
    'Reported eve-teasing near foot overbridge. Regular PCR van deployed following community review.',
    28.6290,
    77.2050,
    'Shivaji Stadium Link (Generalized Area)',
    28.6295,
    77.2055,
    'high',
    'verified',
    0.94,
    true,
    now() - interval '45 days'
  ),
  (
    'a1111111-1111-4111-a111-111111111108',
    'safe_haven',
    'All-women operated quick-service cafe with active CCTV and public distress phone.',
    28.6245,
    77.2180,
    'Kasturba Gandhi Marg (Generalized Area)',
    28.6250,
    77.2185,
    'low',
    'verified',
    0.98,
    true,
    now() - interval '60 days'
  )
ON CONFLICT (id) DO NOTHING;
