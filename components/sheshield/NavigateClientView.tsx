"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/sheshield/Navbar";
import { SafeRouteNavigation } from "@/components/sheshield/SafeRouteNavigation";
import { SOSModal } from "@/components/sheshield/SOSModal";
import { FakeCallModal } from "@/components/sheshield/FakeCallModal";
import { Shield } from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";

interface NavigateClientViewProps {
  initialUserEmail?: string | null;
}

export function NavigateClientView({ initialUserEmail = null }: NavigateClientViewProps) {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("en");
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isFakeCallOpen, setIsFakeCallOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased">
      {/* Global Interactive Navbar with working client callbacks */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onTriggerSOS={() => setIsSosOpen(true)}
        onTriggerFakeCall={() => setIsFakeCallOpen(true)}
        userEmail={initialUserEmail}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <SafeRouteNavigation currentLang={currentLang} />
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

      {/* Emergency Overlays */}
      <SOSModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        currentLang={currentLang}
      />

      <FakeCallModal
        isOpen={isFakeCallOpen}
        onClose={() => setIsFakeCallOpen(false)}
        currentLang={currentLang}
      />
    </div>
  );
}
