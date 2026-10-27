import { NextRequest, NextResponse } from "next/server";
import { calculateRoute } from "@/lib/services/geo-provider";
import { evaluateRouteSafety } from "@/lib/services/risk-engine";
import { createClient } from "@/lib/supabase/server";
import { SafetyReport, AssistanceResource } from "@/types/sheshield";

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

    const routeData = await calculateRoute(origin, destination, profile || "foot");
    if (!routeData) {
      return NextResponse.json(
        { error: "Could not calculate walking route between specified points" },
        { status: 404 }
      );
    }

    // Attempt to pull verified safety reports and assistance resources from Supabase
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
      // Fallback if db is empty during initial migration
    }

    // Add baseline assistance seed if empty
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

    // Evaluate explainable safety risk score
    const safetyScore = evaluateRouteSafety({
      routeCoordinates: routeData.coordinates,
      reports,
      resources
    });

    routeData.safety_score = safetyScore;

    return NextResponse.json(routeData);
  } catch (error: any) {
    console.error("API /api/route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
