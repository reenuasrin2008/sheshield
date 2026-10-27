"use client";

import React, { useState } from "react";
import { BookOpen, Search, ExternalLink, ShieldAlert, Sparkles, Loader2, CheckCircle2, WifiOff } from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";
import { searchLegalCorpus, LEGAL_DOCUMENTS } from "@/lib/services/legal-corpus";

interface LegalAssistantProps {
  currentLang: SupportedLanguage;
}

export function LegalAssistant({ currentLang }: LegalAssistantProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const t = getTranslation(currentLang);

  const handleAsk = async (userQuestion: string) => {
    const q = userQuestion || query;
    if (!q.trim()) return;

    setQuery(q);
    setIsLoading(true);

    // Online search via API with instant local RAG fallback
    try {
      const res = await fetch("/api/legal-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, lang: currentLang })
      });

      if (!res.ok) throw new Error("API offline");

      const data = await res.json();
      setAnswer(data.answer);
      setCitations(data.citations || []);
      setIsOffline(false);
    } catch {
      // Local deterministic RAG fallback (works 100% offline)
      setIsOffline(true);
      const results = searchLegalCorpus(q, currentLang);
      if (results.length > 0) {
        const top = results[0].document;
        const summary = top.summary[currentLang] || top.summary.en;
        const provisions = top.key_provisions[currentLang] || top.key_provisions.en;

        setAnswer(`${top.title} (${top.section})\n\n${summary}\n\nKey Provisions:\n${provisions.map(p => `• ${p}`).join("\n")}`);
        setCitations(results.map(r => ({
          id: r.document.id,
          act_name: r.document.act_name,
          section: r.document.section,
          title: r.document.title,
          official_link: r.document.official_link
        })));
      } else {
        setAnswer("No specific statutory match in offline corpus. Call Women Helpline 1091.");
        setCitations([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-xl text-card-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t.legal_title}</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{t.legal_subtitle}</p>
        </div>

        {/* Offline Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-xl text-xs font-semibold text-muted-foreground self-start sm:self-auto">
          {isOffline ? <WifiOff className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          <span>{isOffline ? "Offline Corpus Active" : "Online Knowledge Base"}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAsk(query)}
          placeholder={t.legal_ask_placeholder}
          className="w-full bg-muted/50 border border-border rounded-2xl px-4 py-3.5 pl-11 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple-500 transition-colors shadow-inner"
        />
        <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
        <button
          onClick={() => handleAsk(query)}
          disabled={isLoading || !query.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          <span>{t.legal_ask_button}</span>
        </button>
      </div>

      {/* Quick Sample Questions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[t.legal_sample_q1, t.legal_sample_q2, t.legal_sample_q3].map((sample, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(sample)}
            className="text-[11px] font-medium bg-muted/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 border border-border/80 px-3 py-1.5 rounded-xl transition-colors text-left"
          >
            {sample}
          </button>
        ))}
      </div>

      {/* Response Answer Card */}
      {answer && (
        <div className="bg-muted/40 rounded-2xl border border-border/80 p-5 mb-6 space-y-4 animate-in fade-in">
          <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-foreground/90 font-sans">
            {answer}
          </div>

          {/* Citations Box */}
          {citations.length > 0 && (
            <div className="pt-4 border-t border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                {t.legal_citations}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {citations.map((cite, idx) => (
                  <div key={idx} className="bg-background p-2.5 rounded-xl border border-border text-xs flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-foreground">{cite.section}</p>
                      <p className="text-[11px] text-muted-foreground">{cite.act_name}</p>
                    </div>
                    {cite.official_link && (
                      <a
                        href={cite.official_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 hover:text-purple-700 p-1"
                        title="View Official Statute"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statutory Disclaimer */}
      <p className="text-[11px] text-muted-foreground italic leading-normal">
        {t.legal_disclaimer}
      </p>
    </div>
  );
}
