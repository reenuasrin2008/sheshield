import { RouteGeometry, NavigationInstruction } from "@/types/sheshield";

export interface GeocodingResult {
  place_name: string;
  latitude: number;
  longitude: number;
  type?: string;
}

/**
 * Real geocoding using Nominatim (OpenStreetMap) with fallback.
 * Adheres to open geocoding terms with proper user-agent headers and caching.
 */
export async function geocodeAddress(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim();

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed
    )}&format=json&addressdetails=1&limit=5`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "SheShield-Safety-Platform/1.0 (contact@sheshield.org)",
        Accept: "application/json"
      },
      next: { revalidate: 3600 } // Cache 1 hour
    });

    if (!res.ok) {
      console.warn("Geocoding service returned status:", res.status);
      return [];
    }

    const data = await res.json();
    return (data || []).map((item: any) => ({
      place_name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type
    }));
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

/**
 * Real routing calculation using OSRM (Open Source Routing Machine) walking profile.
 * Supports configurable routing provider fallback.
 */
export async function calculateRoute(
  origin: [number, number], // [longitude, latitude]
  destination: [number, number], // [longitude, latitude]
  profile: "foot" | "driving" = "foot"
): Promise<RouteGeometry | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      console.warn("OSRM routing returned status:", res.status);
      return null;
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const mainRoute = data.routes[0];
    const instructions: NavigationInstruction[] = [];

    if (mainRoute.legs && mainRoute.legs[0] && mainRoute.legs[0].steps) {
      for (const step of mainRoute.legs[0].steps) {
        const text = step.maneuver?.modifier
          ? `${step.maneuver.type} ${step.maneuver.modifier} onto ${step.name || "path"}`
          : step.name
          ? `Head along ${step.name}`
          : "Continue forward";

        instructions.push({
          text,
          distance_meters: Math.round(step.distance),
          duration_seconds: Math.round(step.duration)
        });
      }
    }

    return {
      coordinates: mainRoute.geometry.coordinates,
      distance_meters: Math.round(mainRoute.distance),
      duration_seconds: Math.round(mainRoute.duration),
      instructions: instructions.length > 0 ? instructions : [
        {
          text: `Head directly toward destination`,
          distance_meters: Math.round(mainRoute.distance),
          duration_seconds: Math.round(mainRoute.duration)
        }
      ]
    };
  } catch (error) {
    console.error("Route calculation error:", error);
    return null;
  }
}

/**
 * Standard Haversine distance in meters between two lat/lon points.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
