import { SafetyReport } from "@/types/sheshield";

/**
 * Curated demonstration safety reports for SheShield.
 * Clearly marked with `is_demo: true` and generalized/fuzzed coordinates
 * to ensure privacy and compliance with data integrity guidelines.
 *
 * Dates are dynamically generated relative to current time to ensure
 * date filtering (7 days, 30 days, 90 days, all-time) works accurately.
 */
const now = Date.now();
const ONE_DAY = 24 * 60 * 60 * 1000;

export const DEMO_SAFETY_REPORTS: SafetyReport[] = [
  // --- Last 7 Days (Recent) ---
  {
    id: "rep_demo_01",
    category: "poor_lighting",
    description: "Streetlights dysfunctional along pedestrian path near Metro Station Exit 2. Low visibility after 8 PM.",
    latitude: 28.6328,
    longitude: 77.2195,
    location_name: "Connaught Place Sector 4 (Generalized Area)",
    fuzzed_latitude: 28.6335,
    fuzzed_longitude: 77.2202,
    severity: "medium",
    status: "verified",
    confidence_score: 0.92,
    is_demo: true,
    reported_at: new Date(now - 2 * ONE_DAY).toISOString() // 2 days ago
  },
  {
    id: "rep_demo_02",
    category: "harassment",
    description: "Group of loiterers catcalling near bus terminus after 9 PM. Municipal patrol requested.",
    latitude: 28.6275,
    longitude: 77.2120,
    location_name: "Janpath Transit Hub (Generalized Area)",
    fuzzed_latitude: 28.6281,
    fuzzed_longitude: 77.2126,
    severity: "high",
    status: "verified",
    confidence_score: 0.88,
    is_demo: true,
    reported_at: new Date(now - 4 * ONE_DAY).toISOString() // 4 days ago
  },
  {
    id: "rep_demo_03",
    category: "safe_haven",
    description: "24/7 Well-lit pharmacy with security guard and emergency contact board. Safe waiting point.",
    latitude: 28.6350,
    longitude: 77.2150,
    location_name: "Barakhamba Road Plaza (Generalized Area)",
    fuzzed_latitude: 28.6355,
    fuzzed_longitude: 77.2155,
    severity: "low",
    status: "verified",
    confidence_score: 0.95,
    is_demo: true,
    reported_at: new Date(now - 5 * ONE_DAY).toISOString() // 5 days ago
  },

  // --- Last 30 Days (8 to 30 days) ---
  {
    id: "rep_demo_04",
    category: "isolated_area",
    description: "Narrow sub-way lane with obstructed view and absent security cameras during evening hours.",
    latitude: 28.6220,
    longitude: 77.2240,
    location_name: "Pragati Maidan Perimeter (Generalized Area)",
    fuzzed_latitude: 28.6228,
    fuzzed_longitude: 77.2245,
    severity: "medium",
    status: "verified",
    confidence_score: 0.85,
    is_demo: true,
    reported_at: new Date(now - 12 * ONE_DAY).toISOString() // 12 days ago
  },
  {
    id: "rep_demo_05",
    category: "suspicious_activity",
    description: "Unregistered vehicle lingering near park boundary during late hours without parking permit.",
    latitude: 28.6185,
    longitude: 77.2155,
    location_name: "India Gate Outer Ring (Generalized Area)",
    fuzzed_latitude: 28.6190,
    fuzzed_longitude: 77.2160,
    severity: "medium",
    status: "verified",
    confidence_score: 0.82,
    is_demo: true,
    reported_at: new Date(now - 18 * ONE_DAY).toISOString() // 18 days ago
  },
  {
    id: "rep_demo_06",
    category: "poor_lighting",
    description: "Overgrown tree foliage completely obscuring municipal lighting along bicycle boulevard.",
    latitude: 28.6410,
    longitude: 77.2280,
    location_name: "Pahar Ganj Approach (Generalized Area)",
    fuzzed_latitude: 28.6416,
    fuzzed_longitude: 77.2285,
    severity: "low",
    status: "verified",
    confidence_score: 0.90,
    is_demo: true,
    reported_at: new Date(now - 24 * ONE_DAY).toISOString() // 24 days ago
  },

  // --- Last 90 Days (31 to 90 days) ---
  {
    id: "rep_demo_07",
    category: "harassment",
    description: "Reported eve-teasing near foot overbridge. Regular PCR van deployed following community review.",
    latitude: 28.6290,
    longitude: 77.2050,
    location_name: "Shivaji Stadium Link (Generalized Area)",
    fuzzed_latitude: 28.6295,
    fuzzed_longitude: 77.2055,
    severity: "high",
    status: "verified",
    confidence_score: 0.94,
    is_demo: true,
    reported_at: new Date(now - 45 * ONE_DAY).toISOString() // 45 days ago
  },
  {
    id: "rep_demo_08",
    category: "safe_haven",
    description: "All-women operated quick-service cafe with active CCTV and public distress phone.",
    latitude: 28.6245,
    longitude: 77.2180,
    location_name: "Kasturba Gandhi Marg (Generalized Area)",
    fuzzed_latitude: 28.6250,
    fuzzed_longitude: 77.2185,
    severity: "low",
    status: "verified",
    confidence_score: 0.98,
    is_demo: true,
    reported_at: new Date(now - 60 * ONE_DAY).toISOString() // 60 days ago
  },
  {
    id: "rep_demo_09",
    category: "isolated_area",
    description: "Desolate stretch under construction flyover with zero commercial shops open past 7 PM.",
    latitude: 28.6450,
    longitude: 77.2150,
    location_name: "New Delhi Railway Bypass (Generalized Area)",
    fuzzed_latitude: 28.6455,
    fuzzed_longitude: 77.2158,
    severity: "high",
    status: "verified",
    confidence_score: 0.89,
    is_demo: true,
    reported_at: new Date(now - 75 * ONE_DAY).toISOString() // 75 days ago
  },

  // --- Older / All-time (> 90 days) ---
  {
    id: "rep_demo_10",
    category: "suspicious_activity",
    description: "Unauthorized taxi solicitation reported. Area marked for vigilance.",
    latitude: 28.6100,
    longitude: 77.2250,
    location_name: "Khan Market South Enclave (Generalized Area)",
    fuzzed_latitude: 28.6108,
    fuzzed_longitude: 77.2256,
    severity: "medium",
    status: "verified",
    confidence_score: 0.86,
    is_demo: true,
    reported_at: new Date(now - 120 * ONE_DAY).toISOString() // 120 days ago
  }
];
