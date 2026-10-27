import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmergencySMS } from "@/lib/services/sms-provider";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const user = claimsData?.claims;

    const body = await req.json();
    const { action, isTest, latitude, longitude, accuracy, batteryLevel, eventId } = body;

    const userId = user?.sub || user?.id || "demo_guest_user";

    if (action === "trigger") {
      // 1. Fetch user's emergency contacts from Supabase
      let contactPhones: string[] = [];
      try {
        if (user) {
          const { data: contacts } = await supabase
            .from("emergency_contacts")
            .select("phone_number, notify_sms")
            .eq("user_id", userId);

          if (contacts && contacts.length > 0) {
            contactPhones = contacts
              .filter(c => c.notify_sms)
              .map(c => c.phone_number);
          }
        }
      } catch (err) {
        console.warn("Could not query contacts:", err);
      }

      // If no contacts in DB yet, add placeholder alert
      if (contactPhones.length === 0) {
        contactPhones = ["+919999999999"];
      }

      // 2. Insert SOS event into database
      let dbEventId = eventId || `sos_${Date.now()}`;
      try {
        if (user) {
          const { data: insertedEvent, error: insertError } = await supabase
            .from("sos_events")
            .insert({
              user_id: userId,
              status: isTest ? "test" : "active",
              trigger_type: "manual",
              is_test: !!isTest,
              latitude: latitude || null,
              longitude: longitude || null,
              accuracy: accuracy || null,
              battery_level: batteryLevel || null
            })
            .select("id")
            .single();

          if (insertedEvent?.id) {
            dbEventId = insertedEvent.id;
          }
        }
      } catch (dbErr) {
        console.warn("Could not insert SOS event to Supabase:", dbErr);
      }

      // 3. Dispatch SMS alerts to emergency contacts
      const alertMsg = isTest
        ? `[SheShield TEST ALERT] This is a test emergency alert from SheShield. No action required.`
        : `[EMERGENCY SOS - SheShield] I need immediate assistance! My current location is recorded in SheShield.`;

      const smsResult = await sendEmergencySMS({
        recipients: contactPhones,
        message: alertMsg,
        isTestMode: !!isTest,
        latitude,
        longitude
      });

      return NextResponse.json({
        success: true,
        eventId: dbEventId,
        status: isTest ? "test" : "active",
        dispatchedContacts: contactPhones.length,
        deliveryReport: smsResult
      });
    }

    if (action === "cancel") {
      if (eventId && user) {
        try {
          await supabase
            .from("sos_events")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString()
            })
            .eq("id", eventId)
            .eq("user_id", userId);
        } catch (cancelErr) {
          console.warn("Cancel SOS event DB error:", cancelErr);
        }
      }

      return NextResponse.json({
        success: true,
        status: "cancelled",
        message: "SOS event cancelled by user"
      });
    }

    return NextResponse.json({ error: "Invalid SOS action" }, { status: 400 });
  } catch (error: any) {
    console.error("SOS API Error:", error);
    return NextResponse.json({ error: error.message || "SOS processing error" }, { status: 500 });
  }
}
