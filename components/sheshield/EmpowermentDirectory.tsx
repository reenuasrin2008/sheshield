"use client";

import React, { useState } from "react";
import { Award, ExternalLink, Search, CheckCircle2, DollarSign, GraduationCap, Briefcase } from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";

interface SchemeItem {
  id: string;
  title: string;
  category: "finance" | "education" | "skill" | "legal";
  description: string;
  eligibility: string;
  sourceUrl: string;
  lastVerified: string;
}

const SCHEMES: SchemeItem[] = [
  {
    id: "scheme_mssc",
    title: "Mahila Samman Savings Certificate (MSSC)",
    category: "finance",
    description: "Government-backed small savings scheme offering 7.5% fixed interest per annum with partial withdrawal options for women and girls.",
    eligibility: "Any woman or guardian on behalf of a minor girl.",
    sourceUrl: "https://www.indiapost.gov.in",
    lastVerified: "2026-08-01"
  },
  {
    id: "scheme_standup_india",
    title: "Stand-Up India Scheme for Women Entrepreneurs",
    category: "finance",
    description: "Bank loans between ₹10 lakh and ₹1 crore for setting up greenfield enterprises in manufacturing, services, agri-allied, or trading sectors.",
    eligibility: "Women entrepreneurs (above 18 years) holding at least 51% shareholding.",
    sourceUrl: "https://www.standupmitra.in",
    lastVerified: "2026-07-15"
  },
  {
    id: "scheme_mudra",
    title: "Pradhan Mantri Mudra Yojana (Mudra Tarun / Kishore)",
    category: "finance",
    description: "Collateral-free micro-credit loans up to ₹10 lakh for self-employed women and small business enterprises.",
    eligibility: "Non-corporate, non-farm small/micro-enterprises.",
    sourceUrl: "https://www.mudra.org.in",
    lastVerified: "2026-09-10"
  },
  {
    id: "scheme_pragati_scholarship",
    title: "AICTE Pragati Scholarship for Girls",
    category: "education",
    description: "Scholarship of ₹50,000 per annum towards technical degree/diploma education for meritorious girl students.",
    eligibility: "Girls admitted to first-year AICTE-approved degree/diploma programs with family income under ₹8 lakh.",
    sourceUrl: "https://www.aicte-india.org",
    lastVerified: "2026-06-20"
  },
  {
    id: "scheme_pmkvy_women",
    title: "PMKVY Skill India — Women Empowerment Centers",
    category: "skill",
    description: "Industry-aligned certified vocational skill development training programs with 100% government fee subsidy and stipend.",
    eligibility: "Any Indian citizen seeking employment or skill upgrading.",
    sourceUrl: "https://www.skillindia.gov.in",
    lastVerified: "2026-08-25"
  }
];

interface EmpowermentDirectoryProps {
  currentLang: SupportedLanguage;
}

export function EmpowermentDirectory({ currentLang }: EmpowermentDirectoryProps) {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const t = getTranslation(currentLang);

  const filteredSchemes = SCHEMES.filter(s => {
    const matchesFilter = filter === "all" || s.category === filter;
    const matchesQuery =
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="w-full bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-xl text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5 mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{t.empowerment_title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t.empowerment_subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          {["all", "finance", "education", "skill"].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                filter === cat
                  ? "bg-background text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Schemes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchemes.map(scheme => (
          <div
            key={scheme.id}
            className="flex flex-col justify-between p-5 rounded-2xl bg-muted/30 border border-border/80 hover:border-emerald-500/50 hover:shadow-lg transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {scheme.category}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Verified {scheme.lastVerified}
                </span>
              </div>
              <h4 className="font-bold text-sm text-foreground leading-snug">{scheme.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{scheme.description}</p>
              <div className="pt-2 text-[11px] text-foreground/80">
                <span className="font-semibold text-foreground">Eligibility: </span>
                {scheme.eligibility}
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-border/50 flex justify-between items-center">
              <a
                href={scheme.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Official Scheme Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
