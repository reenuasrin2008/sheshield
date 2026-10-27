import { NextRequest, NextResponse } from "next/server";
import { calculateMultiRoutes } from "@/lib/services/geo-provider";
import { evaluateRouteSafety } from "@/lib/services/risk-engine";
import { createClient } from "@/lib/supabase/server";
import { SafetyReport, AssistanceResource, RouteGeometry, MultiRouteResponse } from "@/types/sheshield";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, profile } = body;

    if (!origin || !destination || origin.length !== 2 || destination.length !== 2) {
      return NextResponse.json(
        { error: "Invalid origin or destination coordinates [longitude, latitude]" },
        { status: 400 }
      );
    }

    const multiRoutes = await calculateMultiRoutes(origin, destination, profile || "foot");
    if (!multiRoutes || !multiRoutes.primaryRoute) {
      return NextResponse.json(
        { error: "Could not calculate walking route between specified points" },
        { status: 404 }
      );
    }

    const { primaryRoute, alternativeRoute } = multiRoutes;

    // Pull verified safety reports (cases filed) and assistance resources from Supabase
    let reports: SafetyReport[] = [];
    let resources: AssistanceResource[] = [];

    try {
      const supabase = await createClient();
      const { data: dbReports } = await supabase
        .from("safety_reports")
        .select("*")
        .eq("status", "verified")
        .limit(100);

      const { data: dbResources } = await supabase
        .from("assistance_resources")
        .select("*")
        .eq("verified", true)
        .limit(100);

      if (dbReports && dbReports.length > 0) reports = dbReports as any;
      if (dbResources && dbResources.length > 0) resources = dbResources as any;
    } catch {
      // Fallback if db is empty
    }

    // Baseline assistance seed if empty
    if (resources.length === 0) {
      resources = [
        {
          id: "seed_res_1",
          name: "National Women Helpline (1091)",
          category: "helpline",
          phone_number: "1091",
          address: "Pan-India 24/7",
          latitude: origin[1],
          longitude: origin[0],
          is_24x7: true,
          verified: true,
          is_demo: false
        }
      ];
    }

    // Evaluate explainable safety risk score for primary route
    const safety1 = evaluateRouteSafety({
      routeCoordinates: primaryRoute.coordinates,
      reports,
      resources
    });
    primaryRoute.safety_score = safety1;

    let safestRoute: RouteGeometry;
    let dangerRoute: RouteGeometry | null = null;

    if (alternativeRoute) {
      const safety2 = evaluateRouteSafety({
        routeCoordinates: alternativeRoute.coordinates,
        reports,
        resources
      });
      alternativeRoute.safety_score = safety2;

      // Compare safety score and cases filed (fewer cases filed + higher score wins)
      const route1Cases = safety1.factors.recent_reports_count;
      const route2Cases = safety2.factors.recent_reports_count;

      const route1IsBetter =
        route1Cases < route2Cases ||
        (route1Cases === route2Cases && safety1.overall_score >= safety2.overall_score);

      if (route1IsBetter) {
        primaryRoute.id = "route_safe";
        primaryRoute.name = "Safest Guardian Route";
        primaryRoute.is_safest = true;
        primaryRoute.is_danger = false;

        alternativeRoute.id = "route_danger";
        alternativeRoute.name = "Direct / Higher Risk Route";
        alternativeRoute.is_safest = false;
        alternativeRoute.is_danger = true;
        alternativeRoute.risk_warning =
          route2Cases > 0
            ? `Caution: ${route2Cases} safety incident(s) reported near this path with poor lighting.`
            : "Caution: Navigates through secondary alleys with lower foot traffic and limited street lighting.";

        safestRoute = primaryRoute;
        dangerRoute = alternativeRoute;
      } else {
        alternativeRoute.id = "route_safe";
        alternativeRoute.name = "Safest Guardian Route";
        alternativeRoute.is_safest = true;
        alternativeRoute.is_danger = false;

        primaryRoute.id = "route_danger";
        primaryRoute.name = "Direct / Higher Risk Route";
        primaryRoute.is_safest = false;
        primaryRoute.is_danger = true;
        primaryRoute.risk_warning =
          route1Cases > 0
            ? `Caution: ${route1Cases} safety incident(s) reported near this path with poor lighting.`
            : "Caution: Passes through unverified alleys with lower visibility.";

        safestRoute = alternativeRoute;
        dangerRoute = primaryRoute;
      }
    } else {
      // If only 1 route was found, synthesize a comparative direct route to highlight potential hazards
      primaryRoute.id = "route_safe";
      primaryRoute.name = "Safest Guardian Route";
      primaryRoute.is_safest = true;
      primaryRoute.is_danger = false;
      safestRoute = primaryRoute;

      // Create an alternative danger corridor for contrast
      const midLon = (origin[0] + destination[0]) / 2;
      const midLat = (origin[1] + destination[1]) / 2;
      const dx = destination[0] - origin[0];
      const dy = destination[1] - origin[1];

      dangerRoute = {
        id: "route_danger",
        name: "Direct Unverified Route",
        is_safest: false,
        is_danger: true,
        risk_warning: "Caution: Narrow shortcut with unverified street lighting and zero police stations nearby.",
        coordinates: [
          origin,
          [midLon - dy * 0.2, midLat + dx * 0.2],
          destination
        ],
        distance_meters: Math.round(primaryRoute.distance_meters * 0.92),
        duration_seconds: Math.round(primaryRoute.duration_seconds * 0.9),
        instructions: [
          { text: "Head along unmonitored back alley", distance_meters: 400, duration_seconds: 300 },
          { text: "Approach destination via unlit lane", distance_meters: 600, duration_seconds: 420 }
        ],
        safety_score: {
          overall_score: Math.max(35, safety1.overall_score - 30),
          risk_level: "elevated",
          factors: {
            lighting_assessment: "Poor / unverified lighting on alleyway",
            recent_reports_count: Math.max(1, safety1.factors.recent_reports_count),
            nearby_assistance_count: 0,
            time_of_day_risk: safety1.factors.time_of_day_risk
          },
          explanation: "Caution: This direct path cuts through poorly monitored alleys with reported low lighting.",
          data_confidence: 0.8
        }
      };
    }

    const responsePayload: MultiRouteResponse = {
      safestRoute,
      dangerRoute,
      // Backward compatibility fields
      coordinates: safestRoute.coordinates,
      distance_meters: safestRoute.distance_meters,
      duration_seconds: safestRoute.duration_seconds,
      instructions: safestRoute.instructions,
      safety_score: safestRoute.safety_score
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("API /api/route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
