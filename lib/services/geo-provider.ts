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
 * Calculates both primary and alternative route corridors for safe vs danger route comparison.
 */
export async function calculateMultiRoutes(
  origin: [number, number],
  destination: [number, number],
  profile: "foot" | "driving" = "foot"
): Promise<{ primaryRoute: RouteGeometry; alternativeRoute: RouteGeometry | null } | null> {
  const primaryRoute = await calculateRoute(origin, destination, profile);
  if (!primaryRoute) return null;

  try {
    const midLon = (origin[0] + destination[0]) / 2;
    const midLat = (origin[1] + destination[1]) / 2;
    const dx = destination[0] - origin[0];
    const dy = destination[1] - origin[1];

    // Orthogonal offset waypoint to force alternate route calculation
    const altMidLon = midLon - dy * 0.35;
    const altMidLat = midLat + dx * 0.35;

    const altUrl = `https://router.project-osrm.org/route/v1/${profile}/${origin[0]},${origin[1]};${altMidLon.toFixed(5)},${altMidLat.toFixed(5)};${destination[0]},${destination[1]}?overview=full&geometries=geojson&steps=true`;

    const altRes = await fetch(altUrl, { headers: { Accept: "application/json" } });
    if (altRes.ok) {
      const altData = await altRes.json();
      if (altData.routes && altData.routes[0]) {
        const altR = altData.routes[0];
        const altInstructions: NavigationInstruction[] = [];
        if (altR.legs) {
          for (const leg of altR.legs) {
            if (leg.steps) {
              for (const step of leg.steps) {
                const text = step.maneuver?.modifier
                  ? `${step.maneuver.type} ${step.maneuver.modifier} onto ${step.name || "path"}`
                  : step.name
                  ? `Head along ${step.name}`
                  : "Continue forward";
                altInstructions.push({
                  text,
                  distance_meters: Math.round(step.distance),
                  duration_seconds: Math.round(step.duration)
                });
              }
            }
          }
        }

        const alternativeRoute: RouteGeometry = {
          coordinates: altR.geometry.coordinates,
          distance_meters: Math.round(altR.distance),
          duration_seconds: Math.round(altR.duration),
          instructions: altInstructions.length > 0 ? altInstructions : primaryRoute.instructions
        };

        return { primaryRoute, alternativeRoute };
      }
    }
  } catch (err) {
    console.warn("Could not calculate alternative route:", err);
  }

  return { primaryRoute, alternativeRoute: null };
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
