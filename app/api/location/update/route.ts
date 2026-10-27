import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateSessionLocation } from "@/lib/services/active-tracking-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, latitude, longitude, accuracy, heading, speed } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 });
    }

    // 1. Immediately update in-memory tracking session store
    let storeUpdated = false;
    if (sessionId) {
      storeUpdated = updateSessionLocation(sessionId, {
        latitude,
        longitude,
        accuracy,
        heading,
        speed
      });
    }

    // 2. Persist to Supabase if authenticated user and session ID exists
    try {
      const supabase = await createClient();
      const { data: claimsData } = await supabase.auth.getClaims();
      const user = claimsData?.claims;
      const userId = user?.sub || user?.id || "guest_user";

      if (sessionId && !sessionId.startsWith("sess_")) {
        await supabase.from("location_updates").insert({
          session_id: sessionId,
          user_id: userId,
          latitude,
          longitude,
          accuracy: accuracy || null,
          heading: heading || null,
          speed: speed || null
        });
      }
    } catch (err) {
      console.warn("DB location update warning:", err);
    }

    return NextResponse.json({
      success: true,
      storeUpdated,
      timestamp: Date.now()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
