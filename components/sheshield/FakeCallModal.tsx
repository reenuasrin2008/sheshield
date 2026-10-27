"use client";

import React, { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, User, Volume2, Shield } from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";

interface FakeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
}

export function FakeCallModal({ isOpen, onClose, currentLang }: FakeCallModalProps) {
  const [callerName, setCallerName] = useState("Mom");
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [scheduledTimestamp, setScheduledTimestamp] = useState<number | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const t = getTranslation(currentLang);
  const ringtoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play realistic ringing tone via Web Audio API oscillator
  const playRingtone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      // Standard North American / European dual frequency ring cadence (440Hz + 480Hz)
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + 1.8);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + 1.81);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.8);
      osc2.stop(ctx.currentTime + 1.8);
    } catch (e) {
      // AudioContext policy
    }
  };

  // Schedule Call
  const scheduleFakeCall = (seconds: number) => {
    setDelaySeconds(seconds);
    const targetTime = Date.now() + seconds * 1000;
    setScheduledTimestamp(targetTime);

    setTimeout(() => {
      setIsRinging(true);
      setScheduledTimestamp(null);
      playRingtone();
      ringtoneTimerRef.current = setInterval(playRingtone, 4000);
    }, seconds * 1000);
  };

  const handleAccept = () => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
    setIsRinging(false);
    setIsCallActive(true);
    setCallDuration(0);
  };

  const handleDecline = () => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
    setIsRinging(false);
    setIsCallActive(false);
    setScheduledTimestamp(null);
    onClose();
  };

  // Call duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* SCREEN 1: INCOMING CALL (REALISTIC FULL SCREEN PHONE SIMULATION) */}
      {isRinging ? (
        <div className="w-full max-w-sm h-[500px] sm:h-[560px] max-h-[92vh] bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white rounded-3xl p-5 sm:p-6 flex flex-col justify-between items-center shadow-2xl border border-white/10 animate-in zoom-in-95">
          <div className="text-center space-y-3 pt-8">
            <span className="text-xs uppercase tracking-widest text-white/60 font-medium">
              {t.fake_call_incoming}
            </span>
            <div className="w-24 h-24 mx-auto rounded-full bg-slate-700/80 border-2 border-white/20 flex items-center justify-center shadow-xl">
              <User className="w-12 h-12 text-white/70" />
            </div>
            <h3 className="text-2xl font-bold text-white">{callerName}</h3>
            <p className="text-xs text-white/50">Mobile +91 98765 43210</p>
          </div>

          {/* Accept / Decline Slider Controls */}
          <div className="w-full grid grid-cols-2 gap-8 pb-8 px-4">
            <button
              onClick={handleDecline}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-110 transition-transform">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/80">{t.fake_call_decline}</span>
            </button>

            <button
              onClick={handleAccept}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-600/40 group-hover:scale-110 transition-transform animate-bounce">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/80">{t.fake_call_accept}</span>
            </button>
          </div>
        </div>
      ) : isCallActive ? (
        /* SCREEN 2: ACTIVE CONNECTED CALL */
        <div className="w-full max-w-sm h-[500px] sm:h-[560px] max-h-[92vh] bg-gradient-to-b from-slate-900 via-slate-800 to-black text-white rounded-3xl p-5 sm:p-6 flex flex-col justify-between items-center shadow-2xl border border-white/10 animate-in zoom-in-95">
          <div className="text-center space-y-3 pt-8">
            <h3 className="text-2xl font-bold text-white">{callerName}</h3>
            <p className="text-sm font-mono text-emerald-400">{formatCallTime(callDuration)}</p>
            <div className="w-20 h-20 mx-auto rounded-full bg-slate-700/80 border-2 border-white/20 flex items-center justify-center shadow-xl">
              <User className="w-10 h-10 text-white/70" />
            </div>
          </div>

          <div className="w-full pb-8 flex justify-center">
            <button
              onClick={handleDecline}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-lg shadow-red-600/40">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-white/80">End Simulation</span>
            </button>
          </div>
        </div>
      ) : (
        /* SCREEN 3: SETUP & TRIGGER SIMULATION */
        <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-background rounded-3xl border border-border p-5 sm:p-7 shadow-2xl text-foreground space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold">{t.fake_call_title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t.fake_call_subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
            >
              ✕
            </button>
          </div>

          {/* Caller Identity Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.fake_call_caller}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["Mom", "Boss", "Friend", "Police"].map(name => (
                <button
                  key={name}
                  onClick={() => setCallerName(name)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    callerName === name
                      ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Trigger Timers */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Call Timing
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => scheduleFakeCall(5)}
                disabled={scheduledTimestamp !== null}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                {t.fake_call_trigger_now}
              </button>
              <button
                onClick={() => scheduleFakeCall(10)}
                disabled={scheduledTimestamp !== null}
                className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
              >
                {t.fake_call_trigger_10s}
              </button>
              <button
                onClick={() => scheduleFakeCall(30)}
                disabled={scheduledTimestamp !== null}
                className="py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
              >
                {t.fake_call_trigger_30s}
              </button>
            </div>
          </div>

          {scheduledTimestamp && (
            <div className="p-3 bg-muted rounded-xl text-xs text-center text-muted-foreground">
              Simulated call from <strong className="text-foreground">{callerName}</strong> scheduled in a few seconds...
            </div>
          )}

          <p className="text-[11px] text-muted-foreground italic border-t border-border pt-3">
            Note: This is an in-browser simulation designed to create a believable excuse to depart uncomfortable situations. It does not initiate a carrier telephone call.
          </p>
        </div>
      )}
    </div>
  );
}
