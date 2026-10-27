"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlertOctagon,
  X,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Volume2,
  VolumeX
} from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
}

export function SOSModal({ isOpen, onClose, currentLang }: SOSModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<any | null>(null);
  const [audioSirenEnabled, setAudioSirenEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const t = getTranslation(currentLang);

  // Intentional Activation: Long Press Progress
  const [pressProgress, setPressProgress] = useState(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Play Synthetic Siren Sound via Web Audio API
  const playSirenPulse = () => {
    if (!audioSirenEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // AudioContext policy
    }
  };

  // Start Long Press
  const handlePressStart = () => {
    if (countdown !== null || isSOSActive) return;

    setPressProgress(10);
    let current = 10;
    pressTimerRef.current = setInterval(() => {
      current += 20;
      setPressProgress(current);
      if (current >= 100) {
        clearInterval(pressTimerRef.current!);
        pressTimerRef.current = null;
        startCountdown();
      }
    }, 200);
  };

  const handlePressEnd = () => {
    if (pressTimerRef.current) {
      clearInterval(pressTimerRef.current);
      pressTimerRef.current = null;
      setPressProgress(0);
    }
  };

  // 5-Second Countdown
  const startCountdown = () => {
    setCountdown(5);
    playSirenPulse();

    let count = 5;
    timerRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      playSirenPulse();

      if (count <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        setCountdown(null);
        dispatchSOS();
      }
    }, 1000);
  };

  // Cancel Countdown or Active SOS
  const handleCancel = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);

    if (isSOSActive && eventId) {
      try {
        await fetch("/api/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", eventId })
        });
      } catch (e) {
        console.warn("Cancel event error:", e);
      }
    }

    setIsSOSActive(false);
    setEventId(null);
    setDeliveryResult(null);
    setPressProgress(0);
  };

  // Dispatch SOS to Server
  const dispatchSOS = async () => {
    setIsTriggering(true);

    let lat = null;
    let lon = null;
    let acc = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        acc = pos.coords.accuracy;
      } catch (err) {
        console.warn("Could not retrieve instant location for SOS:", err);
      }
    }

    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger",
          isTest: isTestMode,
          latitude: lat,
          longitude: lon,
          accuracy: acc
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsSOSActive(true);
        setEventId(data.eventId);
        setDeliveryResult(data.deliveryReport);
      } else {
        alert("Failed to initiate SOS alert. Please use direct emergency call.");
      }
    } catch (err) {
      alert("Network failure. Please dial emergency services directly.");
    } finally {
      setIsTriggering(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-background rounded-3xl border border-red-500/30 shadow-2xl p-6 sm:p-8 text-foreground overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Test Mode Toggle */}
        <div className="flex items-center justify-between bg-muted/60 px-3.5 py-2 rounded-xl mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider">{t.sos_test_mode}</span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              ({t.sos_test_mode_desc})
            </span>
          </div>
          <button
            onClick={() => setIsTestMode(!isTestMode)}
            className={`w-11 h-6 rounded-full transition-colors p-1 relative ${
              isTestMode ? "bg-amber-600" : "bg-muted-foreground/30"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                isTestMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* STATE 1: ACTIVE EMERGENCY ALERT */}
        {isSOSActive ? (
          <div className="text-center space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-600/20 border-4 border-red-600 flex items-center justify-center text-red-600 animate-pulse">
              <AlertOctagon className="w-10 h-10 stroke-[2.5]" />
            </div>

            <h2 className="text-2xl font-black text-red-600">{t.sos_active_title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t.sos_active_desc}
            </p>

            {/* Delivery Report Display */}
            {deliveryResult && (
              <div className="bg-muted/40 p-3 rounded-2xl border border-border text-xs text-left space-y-2">
                <div className="flex items-center justify-between font-semibold">
                  <span>Dispatch Gateway: {deliveryResult.provider}</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {deliveryResult.status}
                  </span>
                </div>
                <div className="text-muted-foreground space-y-1">
                  {deliveryResult.deliveryLog?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>Recipient: {item.recipient}</span>
                      <span className="text-foreground">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Emergency Call Links */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href="tel:112"
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Phone className="w-4 h-4" />
                <span>{t.sos_call_police}</span>
              </a>
              <a
                href="tel:1091"
                className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
              >
                <Phone className="w-4 h-4" />
                <span>{t.sos_call_women_helpline}</span>
              </a>
            </div>

            {/* Cancellation Action */}
            <button
              onClick={handleCancel}
              className="w-full py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors border border-border"
            >
              {t.sos_cancel_button}
            </button>
          </div>
        ) : countdown !== null ? (
          /* STATE 2: 5-SECOND COUNTDOWN */
          <div className="text-center space-y-6 animate-in zoom-in-95">
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-red-600/20 animate-ping" />
              <div className="w-28 h-28 rounded-full bg-red-600 text-white flex items-center justify-center text-5xl font-black shadow-2xl shadow-red-600/50">
                {countdown}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-red-600">{t.sos_countdown_title}</h2>
              <p className="text-xs text-muted-foreground mt-1">{t.sos_countdown_desc}</p>
            </div>

            <button
              onClick={handleCancel}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
            >
              {t.sos_cancel_button}
            </button>
          </div>
        ) : (
          /* STATE 3: READY TO TRIGGER (PRESS & HOLD TO PREVENT ACCIDENTAL ACTIVATION) */
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">{t.sos_button}</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {t.sos_instruction}
              </p>
            </div>

            {/* Intentional Hold-to-Activate Button */}
            <div className="relative w-40 h-40 mx-auto">
              <button
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                className="w-full h-full rounded-full bg-gradient-to-tr from-red-600 to-rose-600 text-white font-black text-xl shadow-2xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 select-none"
              >
                <AlertOctagon className="w-10 h-10 stroke-[2.5]" />
                <span className="tracking-wider">HOLD SOS</span>
              </button>

              {/* Circular Hold Progress Ring */}
              {pressProgress > 0 && (
                <div
                  className="absolute -inset-2 rounded-full border-4 border-red-500 pointer-events-none transition-all"
                  style={{ opacity: pressProgress / 100 }}
                />
              )}
            </div>

            {/* One-Click Quick Fallback */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={startCountdown}
                className="text-xs text-muted-foreground hover:text-red-500 font-medium underline underline-offset-4"
              >
                Or tap once to trigger 5-second countdown
              </button>
            </div>

            {/* Emergency Direct Call Links */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
              <a
                href="tel:112"
                className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <span>Call Police 112</span>
              </a>
              <a
                href="tel:1091"
                className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-rose-500" />
                <span>Helpline 1091</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
