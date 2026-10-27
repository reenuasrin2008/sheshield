"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, MapPin, AlertOctagon, BookOpen, Users, Award, Settings, PhoneCall, Globe, Menu, X } from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";

interface NavbarProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onTriggerSOS: () => void;
  onTriggerFakeCall: () => void;
  userEmail?: string | null;
}

export function Navbar({
  currentLang,
  onLanguageChange,
  onTriggerSOS,
  onTriggerFakeCall,
  userEmail
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = getTranslation(currentLang);

  // Cycle languages on single tap for small screens
  const cycleLanguage = () => {
    if (currentLang === "en") onLanguageChange("ta");
    else if (currentLang === "ta") onLanguageChange("hi");
    else onLanguageChange("en");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-15 sm:h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 fill-white/20 stroke-white stroke-[2.2]" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-rose-600 via-purple-700 to-indigo-800 bg-clip-text text-transparent dark:from-rose-400 dark:via-purple-300 dark:to-indigo-300">
              {t.app_name}
            </span>
            <span className="hidden sm:block text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
              AI Guardian
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-foreground/80">
          <Link
            href="/#map-section"
            className="px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors flex items-center gap-1.5"
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            {t.nav_map}
          </Link>
          <Link
            href="/#legal-section"
            className="px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-purple-500" />
            {t.nav_legal}
          </Link>
          <Link
            href="/#community-section"
            className="px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-indigo-500" />
            {t.nav_community}
          </Link>
          <Link
            href="/#empowerment-section"
            className="px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 transition-colors flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            {t.nav_empowerment}
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Fake Call Trigger */}
          <button
            onClick={onTriggerFakeCall}
            title={t.fake_call_title}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1 text-xs font-semibold"
            aria-label="Simulate Incoming Fake Call"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Fake Call</span>
          </button>

          {/* Language Selector: Compact Cycle Button on Mobile, Full Pills on Desktop */}
          <div className="hidden sm:flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-xl text-xs font-medium">
            <Globe className="w-3.5 h-3.5 text-muted-foreground ml-1 mr-0.5" />
            <button
              onClick={() => onLanguageChange("en")}
              className={`px-2 py-1 rounded-lg transition-all ${
                currentLang === "en"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange("ta")}
              className={`px-2 py-1 rounded-lg transition-all ${
                currentLang === "ta"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => onLanguageChange("hi")}
              className={`px-2 py-1 rounded-lg transition-all ${
                currentLang === "hi"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Mobile One-Tap Language Switcher */}
          <button
            onClick={cycleLanguage}
            className="sm:hidden px-2 py-1 rounded-xl bg-muted/80 text-foreground font-bold text-[11px] border border-border flex items-center gap-1"
            title="Switch Language"
          >
            <Globe className="w-3 h-3 text-muted-foreground" />
            <span>{currentLang === "en" ? "EN" : currentLang === "ta" ? "தமிழ்" : "हिन्दी"}</span>
          </button>

          {/* SOS Trigger Button */}
          <button
            onClick={onTriggerSOS}
            className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 animate-pulse shrink-0"
            aria-label="Trigger Emergency SOS"
          >
            <AlertOctagon className="w-4 h-4 stroke-[2.5]" />
            <span>SOS</span>
          </button>

          {/* Settings or Sign In */}
          {userEmail ? (
            <Link
              href="/#settings-section"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors hidden sm:inline-block"
              title={userEmail}
            >
              <Settings className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="hidden md:inline-block text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted"
            >
              {t.nav_signin}
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background/98 backdrop-blur-xl px-4 py-4 space-y-2 text-sm shadow-xl animate-in slide-in-from-top-2">
          <Link
            href="/#map-section"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted font-medium text-foreground"
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>{t.nav_map}</span>
          </Link>
          <Link
            href="/#legal-section"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted font-medium text-foreground"
          >
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span>{t.nav_legal}</span>
          </Link>
          <Link
            href="/#community-section"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted font-medium text-foreground"
          >
            <Users className="w-4 h-4 text-indigo-500" />
            <span>{t.nav_community}</span>
          </Link>
          <Link
            href="/#empowerment-section"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted font-medium text-foreground"
          >
            <Award className="w-4 h-4 text-emerald-500" />
            <span>{t.nav_empowerment}</span>
          </Link>
          <Link
            href="/#settings-section"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted font-medium text-foreground"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>{t.nav_settings}</span>
          </Link>

          {/* Full Language Selector inside Mobile Menu */}
          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span>Language:</span>
            <div className="flex gap-1">
              <button
                onClick={() => onLanguageChange("en")}
                className={`px-2.5 py-1 rounded-lg ${currentLang === "en" ? "bg-rose-600 text-white font-bold" : "bg-muted"}`}
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange("ta")}
                className={`px-2.5 py-1 rounded-lg ${currentLang === "ta" ? "bg-rose-600 text-white font-bold" : "bg-muted"}`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => onLanguageChange("hi")}
                className={`px-2.5 py-1 rounded-lg ${currentLang === "hi" ? "bg-rose-600 text-white font-bold" : "bg-muted"}`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
