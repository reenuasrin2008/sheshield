import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/sheshield/Navbar";
import { SafetyHeatmap } from "@/components/sheshield/SafetyHeatmap";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Safety Heatmap — SheShield Predictive AI Guardian",
  description: "Interactive incident density map visualizing review-approved community safety reports, poorly lit areas, and safe havens with privacy-preserving fuzzed coordinates."
};

async function HeatmapContent() {
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
        <SafetyHeatmap currentLang="en" />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/30 py-8 px-4 text-xs text-muted-foreground mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-600" />
            <span className="font-bold text-foreground">SheShield Safety Heatmap</span>
            <span>— Verified Public Data Only</span>
          </div>
          <span className="text-[11px]">
            Zero victim identification • Coordinates fuzzed for community privacy
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function HeatmapPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HeatmapContent />
    </Suspense>
  );
}
