"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Camera, Check, AlertCircle, X, Loader2, ShieldAlert } from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";

interface EvidenceCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLanguage;
}

export function EvidenceCaptureModal({ isOpen, onClose, currentLang }: EvidenceCaptureModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTestMode, setIsTestMode] = useState(true); // Default to safe test mode as requested
  const [isSaved, setIsSaved] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const t = getTranslation(currentLang);

  const startRecording = async () => {
    setIsSaved(false);
    setAudioUrl(null);
    audioChunksRef.current = [];

    if (isTestMode) {
      // Safe test mode: Simulated recording with timer, no hardware access required
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
      return;
    }

    // Real hardware recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setIsSaved(true);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      alert("Microphone permission denied or hardware unavailable: " + err.message);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    if (isTestMode) {
      setIsSaved(true);
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancel = () => {
    if (isRecording) stopRecording();
    setIsSaved(false);
    setAudioUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-background rounded-3xl border border-border p-6 sm:p-7 shadow-2xl text-foreground space-y-6">
        <button
          onClick={handleCancel}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Mic className="w-5 h-5 text-rose-600" />
            <span>{t.evidence_title}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t.evidence_subtitle}
          </p>
        </div>

        {/* Test Mode Switch */}
        <div className="flex items-center justify-between bg-muted/60 px-3.5 py-2.5 rounded-xl text-xs">
          <div>
            <p className="font-bold">Safe Test Mode (Simulation)</p>
            <p className="text-[11px] text-muted-foreground">Does not access physical microphone hardware</p>
          </div>
          <button
            onClick={() => !isRecording && setIsTestMode(!isTestMode)}
            className={`w-10 h-5 rounded-full transition-colors p-0.5 relative ${
              isTestMode ? "bg-emerald-600" : "bg-muted-foreground/30"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                isTestMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Recording Visualizer */}
        <div className="text-center py-6 bg-muted/30 rounded-2xl border border-border/60 space-y-4">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            {isRecording ? (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/30 animate-ping" />
                <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl animate-pulse">
                  <Mic className="w-8 h-8" />
                </div>
              </>
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center">
                <MicOff className="w-8 h-8" />
              </div>
            )}
          </div>

          <div>
            <p className="text-2xl font-mono font-bold">
              00:{recordingSeconds.toString().padStart(2, "0")} / 00:30
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isRecording ? t.evidence_recording : "Ready to record emergency audio"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3 pt-2">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Stop Recording
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Mic className="w-4 h-4" />
                <span>{t.evidence_record_audio}</span>
              </button>
            )}
          </div>
        </div>

        {/* Completed status */}
        {isSaved && (
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{t.evidence_save_complete}</span>
          </div>
        )}
      </div>
    </div>
  );
}
