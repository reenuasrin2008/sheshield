import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const user = claimsData?.claims;

    const body = await req.json();
    const { sessionId, latitude, longitude, accuracy, heading, speed } = body;

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Latitude and longitude required" }, { status: 400 });
    }

    const userId = user?.sub || user?.id || "guest_user";

    // Insert update into Supabase if session exists
    if (sessionId && sessionId.startsWith("sess_") === false) {
      try {
        await supabase.from("location_updates").insert({
          session_id: sessionId,
          user_id: userId,
          latitude,
          longitude,
          accuracy: accuracy || null,
          heading: heading || null,
          speed: speed || null
        });
      } catch (err) {
        console.warn("DB location update warning:", err);
      }
    }

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
