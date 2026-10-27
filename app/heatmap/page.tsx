import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { HeatmapClientView } from "@/components/sheshield/HeatmapClientView";

export const metadata = {
  title: "Safety Heatmap — SheShield Predictive AI Guardian",
  description: "Interactive incident density map visualizing review-approved community safety reports, poorly lit areas, and safe havens with privacy-preserving fuzzed coordinates."
};

async function HeatmapContent() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  return <HeatmapClientView initialUserEmail={user?.email || null} />;
}

export default function HeatmapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HeatmapContent />
    </Suspense>
  );
}
