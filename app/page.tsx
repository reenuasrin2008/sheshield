import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SheShieldApp } from "@/components/sheshield/SheShieldApp";

export const metadata = {
  title: "SheShield — The Predictive AI Guardian for Women's Safety",
  description: "Production-oriented women's safety platform with live tracking, predictive safety routing, emergency SOS, AI legal rights assistant, and verified community support."
};

async function SheShieldWrapper() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  return (
    <SheShieldApp
      initialUserEmail={user?.email || null}
      initialUserId={user?.sub || user?.id || null}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SheShieldWrapper />
    </Suspense>
  );
}
