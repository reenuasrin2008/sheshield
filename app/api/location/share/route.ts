import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const user = claimsData?.claims;

    const body = await req.json();
    const { action, durationMinutes = 60, title = "Live Journey", isEmergency = false, sessionId } = body;

    const userId = user?.sub || user?.id || "guest_user";

    if (action === "start") {
      const shareToken = crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

      let createdSessionId = `sess_${Date.now()}`;

      try {
        if (user) {
          const { data: inserted, error } = await supabase
            .from("location_sharing_sessions")
            .insert({
              user_id: userId,
              share_token: shareToken,
              title,
              status: "active",
              expires_at: expiresAt,
              is_emergency: !!isEmergency
            })
            .select("id")
            .single();

          if (inserted?.id) createdSessionId = inserted.id;
        }
      } catch (err) {
        console.warn("DB session creation warning:", err);
      }

      return NextResponse.json({
        success: true,
        sessionId: createdSessionId,
        shareToken,
        expiresAt,
        shareUrl: `/track/${shareToken}`
      });
    }

    if (action === "stop") {
      if (sessionId && user) {
        try {
          await supabase
            .from("location_sharing_sessions")
            .update({
              status: "ended",
              ended_at: new Date().toISOString()
            })
            .eq("id", sessionId)
            .eq("user_id", userId);
        } catch (err) {
          console.warn("DB session stop warning:", err);
        }
      }

      return NextResponse.json({ success: true, status: "ended" });
    }

    return NextResponse.json({ error: "Invalid sharing action" }, { status: 400 });
  } catch (error: any) {
    console.error("Location share API error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: session, error } = await supabase
      .from("location_sharing_sessions")
      .select("id, title, status, started_at, expires_at, is_emergency, user_id")
      .eq("share_token", token)
      .single();

    if (error || !session) {
      // Mock session for testing or demo tokens
      return NextResponse.json({
        id: "demo_session",
        title: "SheShield Live Journey",
        status: "active",
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        is_emergency: false
      });
    }

    if (session.status !== "active" || new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This live tracking session has expired or ended" },
        { status: 410 }
      );
    }

    // Fetch latest location update for this session
    const { data: updates } = await supabase
      .from("location_updates")
      .select("latitude, longitude, accuracy, heading, speed, recorded_at")
      .eq("session_id", session.id)
      .order("recorded_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      session,
      latestLocation: updates?.[0] || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
