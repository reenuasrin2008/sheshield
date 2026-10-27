import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateHaversineDistance } from "@/lib/services/geo-provider";
import { AssistanceResource } from "@/types/sheshield";

const FALLBACK_RESOURCES: AssistanceResource[] = [
  {
    id: "fb_1",
    name: "Emergency Response Support System (ERSS)",
    category: "helpline",
    phone_number: "112",
    address: "National Unified Emergency Response (Police, Fire, Ambulance)",
    latitude: 28.6139,
    longitude: 77.209,
    is_24x7: true,
    verified: true,
    is_demo: false
  },
  {
    id: "fb_2",
    name: "National Women Helpline",
    category: "helpline",
    phone_number: "1091",
    address: "Toll-Free Pan-India 24/7 Helpline",
    latitude: 28.6139,
    longitude: 77.209,
    is_24x7: true,
    verified: true,
    is_demo: false
  },
  {
    id: "fb_3",
    name: "Women in Distress Helpline",
    category: "helpline",
    phone_number: "181",
    address: "Ministry of Women & Child Development 24/7 Support",
    latitude: 28.6139,
    longitude: 77.209,
    is_24x7: true,
    verified: true,
    is_demo: false
  },
  {
    id: "fb_4",
    name: "NCW WhatsApp Grievance Helpline",
    category: "helpline",
    phone_number: "7827170170",
    address: "National Commission for Women Special WhatsApp Assistance",
    latitude: 28.6139,
    longitude: 77.209,
    is_24x7: true,
    verified: true,
    is_demo: false
  }
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  const lat = latStr ? parseFloat(latStr) : null;
  const lon = lonStr ? parseFloat(lonStr) : null;

  try {
    const supabase = await createClient();
    const { data: dbResources } = await supabase
      .from("assistance_resources")
      .select("*")
      .eq("verified", true);

    let resources: AssistanceResource[] = (dbResources as any) || [];
    if (resources.length === 0) {
      resources = [...FALLBACK_RESOURCES];
    }

    if (lat !== null && lon !== null) {
      resources = resources.map(res => ({
        ...res,
        distance_meters: calculateHaversineDistance(lat, lon, res.latitude, res.longitude)
      })).sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
    }

    return NextResponse.json(resources);
  } catch (error: any) {
    return NextResponse.json(FALLBACK_RESOURCES);
  }
}
