import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { NavigateClientView } from "@/components/sheshield/NavigateClientView";

export const metadata = {
  title: "Safe Route Navigation — SheShield Predictive AI Guardian",
  description: "Road-network safe walking routing with real alternative corridors, safety score comparisons based on verified reports and lighting, and nearby 24/7 emergency services."
};

async function NavigateContent() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  return <NavigateClientView initialUserEmail={user?.email || null} />;
}

export default function NavigatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <NavigateContent />
    </Suspense>
  );
}
