/**
 * SheShield Active Tracking Store
 * Provides low-latency in-memory coordination of live GPS tracking sessions,
 * complementing Supabase PostgreSQL persistence and ensuring real-time location sharing
 * works reliably across devices and test sessions.
 */

export interface ActiveSession {
  id: string;
  userId: string;
  shareToken: string;
  title: string;
  status: "active" | "ended" | "revoked";
  startedAt: string;
  expiresAt: string;
  isEmergency: boolean;
  latestLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
    recordedAt: string;
  };
  locationHistory: Array<{
    latitude: number;
    longitude: number;
    recordedAt: string;
  }>;
}

// Global in-memory cache preserved across Next.js API route invocations in same node process
const globalSessionStore = (globalThis as any).__sheshield_sessions || new Map<string, ActiveSession>();
(globalThis as any).__sheshield_sessions = globalSessionStore;

export function registerActiveSession(session: Omit<ActiveSession, "locationHistory">): ActiveSession {
  const fullSession: ActiveSession = {
    ...session,
    locationHistory: []
  };
  // Index by both sessionId and shareToken
  globalSessionStore.set(session.id, fullSession);
  globalSessionStore.set(`token_${session.shareToken}`, fullSession);
  return fullSession;
}

export function getSessionByToken(token: string): ActiveSession | null {
  const session = globalSessionStore.get(`token_${token}`);
  if (!session) return null;

  // Check if expired
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    session.status = "ended";
  }
  return session;
}

export function getSessionById(id: string): ActiveSession | null {
  return globalSessionStore.get(id) || null;
}

export function updateSessionLocation(
  sessionId: string,
  update: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  }
): boolean {
  const session = globalSessionStore.get(sessionId);
  if (!session || session.status !== "active") return false;

  const nowIso = new Date().toISOString();
  session.latestLocation = {
    latitude: update.latitude,
    longitude: update.longitude,
    accuracy: update.accuracy,
    heading: update.heading,
    speed: update.speed,
    recordedAt: nowIso
  };

  // Keep last 30 location updates for breadcrumbs
  session.locationHistory.push({
    latitude: update.latitude,
    longitude: update.longitude,
    recordedAt: nowIso
  });
  if (session.locationHistory.length > 30) {
    session.locationHistory.shift();
  }

  return true;
}

export function endSession(sessionId: string): boolean {
  const session = globalSessionStore.get(sessionId);
  if (!session) return false;
  session.status = "ended";
  return true;
}
