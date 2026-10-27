"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { LiveMap } from "./LiveMap";
import { SOSModal } from "./SOSModal";
import { FakeCallModal } from "./FakeCallModal";
import { EvidenceCaptureModal } from "./EvidenceCaptureModal";
import { LegalAssistant } from "./LegalAssistant";
import { SafetyAssistant } from "./SafetyAssistant";
import { EmergencyContactsManager } from "./EmergencyContactsManager";
import { EmpowermentDirectory } from "./EmpowermentDirectory";
import { CommunityFeed } from "./CommunityFeed";
import { MotionSOSListener } from "./MotionSOSListener";
import { SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";
import Link from "next/link";
import {
  Shield,
  MapPin,
  AlertOctagon,
  BookOpen,
  Users,
  Award,
  PhoneCall,
  Mic,
  Settings,
  HeartHandshake,
  CheckCircle2,
  ExternalLink,
  Phone,
  Flame,
  Navigation
} from "lucide-react";

interface SheShieldAppProps {
  initialUserEmail?: string | null;
  initialUserId?: string | null;
}

export function SheShieldApp({ initialUserEmail, initialUserId }: SheShieldAppProps) {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>("en");
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isFakeCallOpen, setIsFakeCallOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [enableShakeSOS, setEnableShakeSOS] = useState(false);

  const t = getTranslation(currentLang);

  // Load language preference from localStorage if saved
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sheshield_lang") as SupportedLanguage;
      if (saved && (saved === "en" || saved === "ta" || saved === "hi")) {
        setCurrentLang(saved);
      }
      const savedShake = localStorage.getItem("sheshield_shake_sos");
      if (savedShake !== null) {
        setEnableShakeSOS(savedShake === "true");
      }
    } catch {
      // LocalStorage access
    }
  }, []);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    try {
      localStorage.setItem("sheshield_lang", lang);
    } catch {}
  };

  const handleToggleShake = (enabled: boolean) => {
    setEnableShakeSOS(enabled);
    try {
      localStorage.setItem("sheshield_shake_sos", enabled ? "true" : "false");
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-rose-500/20 selection:text-rose-600">
      {/* Background Device Motion Gesture Listener */}
      <MotionSOSListener
        enabled={enableShakeSOS}
        sensitivity={18}
        onShakeDetected={() => setIsSOSOpen(true)}
      />

      {/* Global Navbar */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        onTriggerSOS={() => setIsSOSOpen(true)}
        onTriggerFakeCall={() => setIsFakeCallOpen(true)}
        userEmail={initialUserEmail}
      />

      {/* Main Content Sections */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-rose-500/10 via-purple-500/5 to-indigo-500/10 border border-rose-500/20 shadow-lg">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Predictive AI Safety Architecture Active</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              SheShield — The Predictive AI Guardian for Women&apos;s Safety
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Real-time interactive safety mapping, verifiable route risk analysis, immediate SOS dispatch with live coordinate streaming, and an AI-powered legal rights assistant with offline capability.
            </p>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsSOSOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>{t.sos_button}</span>
              </button>

              <Link
                href="/navigate"
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                <span>Safe Route</span>
              </Link>

              <Link
                href="/heatmap"
                className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Flame className="w-4 h-4" />
                <span>Safety Heatmap</span>
              </Link>

              <button
                onClick={() => setIsFakeCallOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-semibold text-xs sm:text-sm border border-border shadow-sm flex items-center gap-2 transition-colors"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Simulate Call</span>
              </button>

              <button
                onClick={() => setIsEvidenceOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-muted/80 hover:bg-muted text-foreground font-semibold text-xs sm:text-sm border border-border shadow-sm flex items-center gap-2 transition-colors"
              >
                <Mic className="w-4 h-4 text-rose-600" />
                <span>Evidence Capture</span>
              </button>
            </div>
          </div>
        </section>

        {/* Section 1: Real Live Safety Map */}
        <section id="map-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <MapPin className="w-6 h-6 text-rose-500" />
                <span>{t.nav_map}</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real device location tracking, turn-by-turn safe routing, and verified assistance layers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/navigate"
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Full Safe Navigation</span>
              </Link>
              <Link
                href="/heatmap"
                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Open Heatmap</span>
              </Link>
            </div>
          </div>

          <LiveMap currentLang={currentLang} />
        </section>

        {/* Section 2: AI Legal Assistant */}
        <section id="legal-section">
          <LegalAssistant currentLang={currentLang} />
        </section>

        {/* Section 3: Women's Community & Aid */}
        <section id="community-section">
          <CommunityFeed currentLang={currentLang} />
        </section>

        {/* Section 4: Empowerment Directory */}
        <section id="empowerment-section">
          <EmpowermentDirectory currentLang={currentLang} />
        </section>

        {/* Section 5: Settings & Emergency Contacts */}
        <section id="settings-section" className="space-y-6">
          <EmergencyContactsManager currentLang={currentLang} />

          {/* Device Gestures & Shake-to-SOS Card */}
          <div className="w-full bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-xl text-card-foreground">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">{t.settings_shake_sos}</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                  {t.settings_shake_sos_desc}
                </p>
              </div>
              <button
                onClick={() => handleToggleShake(!enableShakeSOS)}
                className={`w-12 h-6 rounded-full transition-colors p-1 relative ${
                  enableShakeSOS ? "bg-rose-600" : "bg-muted-foreground/30"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    enableShakeSOS ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Smart Safety Assistant Chatbot */}
      <SafetyAssistant
        currentLang={currentLang}
        onOpenSOSModal={() => setIsSOSOpen(true)}
        onOpenFakeCall={() => setIsFakeCallOpen(true)}
      />

      {/* Emergency Modals */}
      <SOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        currentLang={currentLang}
      />

      <FakeCallModal
        isOpen={isFakeCallOpen}
        onClose={() => setIsFakeCallOpen(false)}
        currentLang={currentLang}
      />

      <EvidenceCaptureModal
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        currentLang={currentLang}
      />

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/30 mt-16 py-10 px-4 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-600" />
            <span className="font-bold text-foreground">SheShield Safety Network</span>
            <span>— Pan-India Protective Guardian</span>
          </div>

          {/* Quick Helplines */}
          <div className="flex flex-wrap items-center gap-4 font-semibold">
            <a href="tel:112" className="hover:text-foreground flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Phone className="w-3.5 h-3.5" />
              <span>ERSS 112</span>
            </a>
            <a href="tel:1091" className="hover:text-foreground flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <Phone className="w-3.5 h-3.5" />
              <span>Women Helpline 1091</span>
            </a>
            <a href="tel:181" className="hover:text-foreground flex items-center gap-1 text-purple-600 dark:text-purple-400">
              <Phone className="w-3.5 h-3.5" />
              <span>Distress 181</span>
            </a>
            <a href="tel:7827170170" className="hover:text-foreground flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Phone className="w-3.5 h-3.5" />
              <span>NCW WhatsApp 7827170170</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
