export type SupportedLanguage = 'en' | 'ta' | 'hi';

export interface UserProfile {
  id: string;
  email?: string;
  full_name: string | null;
  phone_number: string | null;
  preferred_language: SupportedLanguage;
  blood_group: string | null;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  relationship: string | null;
  priority_order: number;
  notify_sms: boolean;
  notify_call: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface LocationSharingSession {
  id: string;
  user_id: string;
  share_token: string;
  title: string;
  status: 'active' | 'paused' | 'ended' | 'revoked';
  started_at: string;
  expires_at: string;
  ended_at?: string | null;
  recipient_contacts: string[];
  is_emergency: boolean;
  latest_coordinates?: LocationCoordinates;
}

export interface SOSEvent {
  id: string;
  user_id: string;
  status: 'triggered' | 'active' | 'cancelled' | 'resolved' | 'test';
  trigger_type: 'manual' | 'voice' | 'shake' | 'wearable' | 'fake_call_abort';
  is_test: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  battery_level?: number | null;
  sharing_session_id?: string | null;
  started_at: string;
  cancelled_at?: string | null;
  resolved_at?: string | null;
}

export interface SafetyReport {
  id: string;
  user_id?: string | null;
  category: 'poor_lighting' | 'harassment' | 'isolated_area' | 'suspicious_activity' | 'safe_haven' | 'other';
  description: string;
  latitude: number;
  longitude: number;
  location_name?: string | null;
  fuzzed_latitude: number;
  fuzzed_longitude: number;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'verified' | 'rejected' | 'archived';
  confidence_score: number;
  is_demo: boolean;
  reported_at: string;
}

export interface AssistanceResource {
  id: string;
  name: string;
  category: 'police' | 'hospital' | 'shelter' | 'helpline' | 'safe_store';
  phone_number: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  is_24x7: boolean;
  verified: boolean;
  is_demo: boolean;
  distance_meters?: number;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [longitude, latitude] pairs
  distance_meters: number;
  duration_seconds: number;
  instructions: NavigationInstruction[];
  safety_score?: RouteSafetyAssessment;
}

export interface NavigationInstruction {
  text: string;
  distance_meters: number;
  duration_seconds: number;
}

export interface RouteSafetyAssessment {
  overall_score: number; // 0 to 100 (higher is safer)
  risk_level: 'low' | 'moderate' | 'elevated' | 'high' | 'insufficient_data';
  factors: {
    lighting_assessment: string;
    recent_reports_count: number;
    nearby_assistance_count: number;
    time_of_day_risk: 'low' | 'medium' | 'high';
  };
  explanation: string;
  data_confidence: number; // 0.0 to 1.0
}

export interface LegalDocumentCitation {
  id: string;
  act_name: string;
  section: string;
  title: string;
  summary: {
    en: string;
    ta: string;
    hi: string;
  };
  key_provisions: {
    en: string[];
    ta: string[];
    hi: string[];
  };
  official_link?: string;
  last_verified: string;
}

export interface UserPreferences {
  user_id: string;
  theme: 'system' | 'light' | 'dark';
  language: SupportedLanguage;
  enable_shake_to_sos: boolean;
  shake_sensitivity: number;
  countdown_seconds: number;
  fake_caller_name: string;
  fake_call_delay_seconds: number;
  offline_cache_enabled: boolean;
}
