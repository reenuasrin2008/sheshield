import { NextRequest, NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/services/geo-provider";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  const results = await geocodeAddress(q);
  return NextResponse.json(results);
}
