"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, X, Loader2, AlertCircle, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";

interface SafetyAssistantProps {
  currentLang: SupportedLanguage;
  onOpenSOSModal: () => void;
  onOpenFakeCall: () => void;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  suggestedAction?: "open_sos" | "open_fake_call" | "view_map" | "call_112" | "call_1091";
  provider?: "gemini" | "sheshield_safety_engine";
  metaNote?: string;
  failed?: boolean;
}

export function SafetyAssistant({
  currentLang,
  onOpenSOSModal,
  onOpenFakeCall
}: SafetyAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const initialBotGreeting: Record<SupportedLanguage, string> = {
    en: "Hello! I am your SheShield AI Guardian. Ask me anything about situational safety, how to activate/cancel SOS, safe transit routes, or your legal rights under Indian law.",
    ta: "வணக்கம்! நான் உங்கள் ஷிஷீல்ட் AI பாதுகாவலன். அவசர SOS பாதுகாப்பு, பாதுகாப்பான வழித்தடங்கள் அல்லது இந்திய சட்ட உரிமைகள் (Zero FIR, POSH) குறித்து என்னிடம் கேட்கலாம்.",
    hi: "नमस्ते! मैं आपका शीशील्ड एआई साथी हूँ। आप आपातकालीन सुरक्षा, सुरक्षित मार्ग या भारतीय कानूनी अधिकारों (जीरो एफआईआर, घरेलू हिंसा) के बारे में पूछ सकते हैं।"
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "greeting",
      sender: "bot",
      text: initialBotGreeting[currentLang] || initialBotGreeting.en,
      provider: "sheshield_safety_engine"
    }
  ]);

  // Update greeting when language changes if only greeting is present
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === "greeting") {
        return [
          {
            id: "greeting",
            sender: "bot",
            text: initialBotGreeting[currentLang] || initialBotGreeting.en,
            provider: "sheshield_safety_engine"
          }
        ];
      }
      return prev;
    });
  }, [currentLang]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (userText?: string) => {
    const textToSend = (userText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputText("");
    setIsLoading(true);

    try {
      // Build API history
      const formattedHistory = messages
        .filter(m => !m.failed)
        .slice(-6)
        .map(m => ({
          role: m.sender === "user" ? ("user" as const) : ("model" as const),
          text: m.text
        }));

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: formattedHistory,
          lang: currentLang
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: data.reply || "I am available to assist your personal safety.",
        suggestedAction: data.suggestedAction,
        provider: data.provider,
        metaNote: data.meta?.geminiStatus
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.warn("Safety assistant fetch error:", err);
      const failedMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "bot",
        text:
          currentLang === "ta"
            ? "இணைப்பு பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும் அல்லது அவசர உதவிக்கு 112 அழைக்கவும்."
            : currentLang === "hi"
            ? "कनेक्शन में समस्या आई। कृपया पुनः प्रयास करें या आपातकालीन सहायता के लिए 112 डायल करें।"
            : "Network connection error. Please tap retry or call Emergency 112 directly if in immediate danger.",
        failed: true
      };
      setMessages(prev => [...prev, failedMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3 sm:p-3.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
          aria-label="Open AI Safety Assistant"
        >
          <Bot className="w-5 h-5 shrink-0" />
          <span className="hidden sm:inline">AI Safety Assistant</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="w-[calc(100vw-24px)] max-w-sm sm:w-96 h-[460px] max-h-[85vh] bg-background rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-rose-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>SheShield AI Guardian</span>
                  <Sparkles className="w-3 h-3 text-amber-300" />
                </p>
                <p className="text-[10px] text-white/80">Active Protective Guidance</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/90"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-purple-600 text-white rounded-tr-none"
                      : msg.failed
                      ? "bg-red-500/10 border border-red-500/30 text-red-600 rounded-tl-none"
                      : "bg-muted text-foreground rounded-tl-none border border-border/60"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Diagnostic provider attribution note */}
                  {msg.metaNote && (
                    <p className="mt-1.5 text-[9px] text-muted-foreground/80 italic border-t border-border/40 pt-1">
                      {msg.metaNote}
                    </p>
                  )}

                  {/* Interactive Action Buttons */}
                  {msg.suggestedAction === "open_sos" && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenSOSModal();
                      }}
                      className="mt-2.5 block w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-[11px] text-center shadow-md active:scale-95 transition-all"
                    >
                      Open Emergency SOS
                    </button>
                  )}
                  {msg.suggestedAction === "open_fake_call" && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenFakeCall();
                      }}
                      className="mt-2.5 block w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] text-center shadow-md active:scale-95 transition-all"
                    >
                      Trigger Simulated Call
                    </button>
                  )}
                  {msg.suggestedAction === "view_map" && (
                    <a
                      href="#map-section"
                      onClick={() => setIsOpen(false)}
                      className="mt-2.5 block w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] text-center shadow-md active:scale-95 transition-all"
                    >
                      View Live Safety Map
                    </a>
                  )}

                  {msg.failed && (
                    <button
                      onClick={() => {
                        const lastUser = [...messages].reverse().find(m => m.sender === "user");
                        if (lastUser) sendMessage(lastUser.text);
                      }}
                      className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-red-600 underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry question</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start items-center text-muted-foreground text-xs py-1">
                <div className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-2.5 rounded-2xl bg-muted border border-border/50 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span className="text-[11px]">AI Guardian thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-1.5 bg-muted/40 border-t border-border/40 flex gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
            <button
              onClick={() => sendMessage("I am being followed, what should I do?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-background border border-border hover:bg-muted text-foreground"
            >
              Being followed
            </button>
            <button
              onClick={() => sendMessage("What is Zero FIR and my right to file it?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-background border border-border hover:bg-muted text-foreground"
            >
              Zero FIR rights
            </button>
            <button
              onClick={() => sendMessage("How do I trigger fake call?")}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-background border border-border hover:bg-muted text-foreground"
            >
              Fake Call guide
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-2.5 border-t border-border flex items-center gap-2 bg-background">
            <input
              type="text"
              placeholder="Ask safety or legal questions..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              disabled={isLoading}
              className="flex-1 bg-muted/60 border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition-colors shrink-0"
              aria-label="Send Message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
