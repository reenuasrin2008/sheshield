import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/sheshield/Navbar";
import { SafeRouteNavigation } from "@/components/sheshield/SafeRouteNavigation";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Safe Route Navigation — SheShield Predictive AI Guardian",
  description: "Road-network safe walking routing with real alternative corridors, safety score comparisons based on verified reports and lighting, and nearby 24/7 emergency services."
};

async function NavigateContent() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      {/* Global Navbar */}
      <Navbar
        currentLang="en"
        onLanguageChange={() => {}}
        onTriggerSOS={() => {}}
        onTriggerFakeCall={() => {}}
        userEmail={user?.email || null}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <SafeRouteNavigation currentLang="en" />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/30 py-8 px-4 text-xs text-muted-foreground mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-foreground">SheShield Safe Navigation</span>
            <span>— Real Road Routing & Risk Assessment</span>
          </div>
          <span className="text-[11px]">
            Powered by OpenStreetMap & OSRM • Proximity evaluations by SheShield Risk Engine
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function NavigatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <NavigateContent />
    </Suspense>
  );
}
