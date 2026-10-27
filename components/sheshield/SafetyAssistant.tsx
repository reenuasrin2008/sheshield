"use client";

import React, { useState } from "react";
import { MessageSquare, Send, Sparkles, Shield, X, Bot, User } from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";

interface SafetyAssistantProps {
  currentLang: SupportedLanguage;
  onOpenSOSModal: () => void;
  onOpenFakeCall: () => void;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  action?: "open_sos" | "open_fake_call";
}

export function SafetyAssistant({
  currentLang,
  onOpenSOSModal,
  onOpenFakeCall
}: SafetyAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m_1",
      sender: "bot",
      text:
        currentLang === "ta"
          ? "வணக்கம்! நான் உங்கள் ஷிஷீல்ட் AI பாதுகாவலன். அவசர உதவி, பாதுகாப்பான வழித்தடம் அல்லது சட்ட வழிகாட்டுதல் குறித்து என்னிடம் கேட்கலாம்."
          : currentLang === "hi"
          ? "नमस्ते! मैं आपका शीशील्ड एआई साथी हूँ। आप आपातकालीन सुरक्षा, सुरक्षित मार्ग या कानूनी अधिकारों के बारे में पूछ सकते हैं।"
          : "Hello! I am your SheShield AI Guardian. Ask me about emergency SOS protocols, safe route analysis, or your legal rights."
    }
  ]);
  const [inputText, setInputText] = useState("");

  const t = getTranslation(currentLang);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: inputText.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    const lower = inputText.toLowerCase();
    setInputText("");

    // Context-aware safety heuristics
    setTimeout(() => {
      let reply = "";
      let action: "open_sos" | "open_fake_call" | undefined = undefined;

      if (lower.includes("sos") || lower.includes("emergency") || lower.includes("danger") || lower.includes("help") || lower.includes("ஆபத்து") || lower.includes("खतरा")) {
        reply =
          currentLang === "ta"
            ? "அவசர எச்சரிக்கையைத் தொடங்க, மேலே உள்ள சிவப்பு SOS பட்டனை 2 வினாடிகள் அழுத்திப் பிடிக்கவும். அல்லது நேரடியாக 112 அல்லது 1091 அழைக்கலாம்."
            : currentLang === "hi"
            ? "आपातकालीन स्थिति में ऊपर लाल SOS बटन को 2 सेकंड तक दबाए रखें या 112/1091 पर कॉल करें।"
            : "To trigger immediate SOS, press and hold the red SOS button for 2 seconds. You can also dial Emergency 112 or Women Helpline 1091 immediately.";
        action = "open_sos";
      } else if (lower.includes("fake call") || lower.includes("escape") || lower.includes("uncomfortable") || lower.includes("அழைப்பு") || lower.includes("कॉल")) {
        reply =
          currentLang === "ta"
            ? "சங்கடமான சூழ்நிலைகளில் இருந்து பாதுகாப்பாக வெளியேற 'போலி அழைப்பு' சிமுலேஷனை பயன்படுத்தலாம்."
            : currentLang === "hi"
            ? "असहज स्थिति से सुरक्षित रूप से निकलने के लिए आप 'फेक कॉल' सिमुलेशन का उपयोग कर सकते हैं।"
            : "You can trigger a realistic simulated incoming call right now to give yourself an excuse to exit comfortably.";
        action = "open_fake_call";
      } else if (lower.includes("route") || lower.includes("map") || lower.includes("walk") || lower.includes("வழி") || lower.includes("मार्ग")) {
        reply =
          currentLang === "ta"
            ? "பாதுகாப்பான வரைபடத்தில் உங்கள் இலக்கைத் தேடுங்கள். அது 24/7 காவல் நிலையங்கள் மற்றும் வெளிச்சமுள்ள பாதைகளின் அடிப்படையில் வழிகாட்டும்."
            : currentLang === "hi"
            ? "लाइव मैप पर अपना गंतव्य खोजें। हमारा सिस्टम 24/7 सहायता केंद्रों के आधार पर सुरक्षित मार्ग की गणना करता है।"
            : "Search your destination on the Live Safety Map above. The route engine calculates real walking distances and factors nearby 24/7 police stations and hospitals.";
      } else {
        reply =
          currentLang === "ta"
            ? "நான் உங்கள் பாதுகாப்பிற்கு உதவ தயாராக உள்ளேன். அவசர உதவி (SOS), போலி அழைப்பு அல்லது சட்ட விழிப்புணர்வு குறித்து கேட்கலாம்."
            : currentLang === "hi"
            ? "मैं आपकी सहायता के लिए तैयार हूँ। आपातकालीन अलर्ट, सुरक्षित मार्ग या कानूनी अधिकारों के बारे में पूछें।"
            : "I am here to guide your safety. You can ask about emergency contacts, initiating live journey sharing, or exploring government women empowerment schemes.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: "bot",
          text: reply,
          action
        }
      ]);
    }, 400);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs"
        >
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline">AI Safety Assistant</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[460px] bg-background rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <p className="font-bold text-xs sm:text-sm">SheShield AI Guardian</p>
                <p className="text-[10px] text-white/80">Active Protective Companion</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
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
                  className={`p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-purple-600 text-white rounded-tr-none"
                      : "bg-muted text-foreground rounded-tl-none border border-border/60"
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.action === "open_sos" && (
                    <button
                      onClick={onOpenSOSModal}
                      className="mt-2 block w-full py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] text-center"
                    >
                      Open Emergency SOS
                    </button>
                  )}
                  {msg.action === "open_fake_call" && (
                    <button
                      onClick={onOpenFakeCall}
                      className="mt-2 block w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] text-center"
                    >
                      Trigger Simulated Call
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-border flex items-center gap-2 bg-muted/30">
            <input
              type="text"
              placeholder="Ask safety assistant..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSend}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
