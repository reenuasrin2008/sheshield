"use client";

import React, { useState } from "react";
import { Users, MessageSquare, AlertTriangle, ShieldCheck, Heart, Send, Check } from "lucide-react";
import { SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";

interface CommunityFeedProps {
  currentLang: SupportedLanguage;
}

interface PostItem {
  id: string;
  author: string;
  category: "safety_tips" | "commute_advice" | "support";
  city: string;
  title: string;
  content: string;
  likes: number;
  timeAgo: string;
}

const INITIAL_POSTS: PostItem[] = [
  {
    id: "post_1",
    author: "Ananya S. (Verified Member)",
    category: "commute_advice",
    city: "Central Metro Line",
    title: "Well-lit pedestrian exit at Gate 3 after 9 PM",
    content: "If traveling late, use Exit Gate 3 which has 24/7 security booth and high-mast solar lighting. Avoid the alleyway behind Gate 1.",
    likes: 34,
    timeAgo: "2 hours ago"
  },
  {
    id: "post_2",
    author: "Pooja M.",
    category: "safety_tips",
    city: "Tech Corridor",
    title: "Safe Haven Verified: 24/7 Pharmacy near Bus Hub",
    content: "Apollo Pharmacy at Sector 14 junction has CCTV coverage, female staff on night shifts, and verified safe drop-in point.",
    likes: 58,
    timeAgo: "5 hours ago"
  }
];

export function CommunityFeed({ currentLang }: CommunityFeedProps) {
  const [posts, setPosts] = useState<PostItem[]>(INITIAL_POSTS);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportCategory, setReportCategory] = useState("poor_lighting");
  const [reportDesc, setReportDesc] = useState("");
  const [reportLocation, setReportLocation] = useState("");
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  const t = getTranslation(currentLang);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim()) return;

    setReportStatus("Incident report submitted for moderation. Thank you for protecting the community.");
    setReportDesc("");
    setReportLocation("");
    setTimeout(() => {
      setReportStatus(null);
      setShowReportForm(false);
    }, 3000);
  };

  return (
    <div className="w-full bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-xl text-card-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5 mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{t.community_title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t.community_feed}</p>
        </div>
        <button
          onClick={() => setShowReportForm(!showReportForm)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{t.community_report_incident}</span>
        </button>
      </div>

      {/* Report Incident Drawer */}
      {showReportForm && (
        <form onSubmit={handleReportSubmit} className="mb-6 p-5 rounded-2xl bg-muted/40 border border-purple-500/30 space-y-3 animate-in fade-in">
          <h4 className="font-bold text-sm text-foreground">Report a Public Safety Observation</h4>
          <p className="text-[11px] text-muted-foreground">
            Reports are verified and location-fuzzed for privacy before appearing on the public safety map.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category</label>
              <select
                value={reportCategory}
                onChange={e => setReportCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground mt-1"
              >
                <option value="poor_lighting">Poor Lighting / Broken Streetlight</option>
                <option value="harassment">Harassment / Unsafe Behavior</option>
                <option value="isolated_area">Isolated / Deserted Stretch</option>
                <option value="suspicious_activity">Suspicious Activity</option>
                <option value="safe_haven">Safe Haven / Helpful Shop</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">General Location / Landmark</label>
              <input
                type="text"
                placeholder="e.g. Near Metro Station Gate 2"
                value={reportLocation}
                onChange={e => setReportLocation(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground mt-1"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              rows={2}
              placeholder="Provide constructive, factual details to assist other women..."
              value={reportDesc}
              onChange={e => setReportDesc(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground mt-1 outline-none focus:border-purple-500"
              required
            />
          </div>

          {reportStatus && (
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{reportStatus}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowReportForm(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md"
            >
              Submit Report
            </button>
          </div>
        </form>
      )}

      {/* Feed Cards */}
      <div className="space-y-3">
        {posts.map(post => (
          <div
            key={post.id}
            className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/80 hover:border-purple-500/40 transition-all space-y-2"
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{post.author}</span>
                <span className="text-muted-foreground">• {post.city}</span>
              </div>
              <span className="text-muted-foreground">{post.timeAgo}</span>
            </div>

            <h4 className="font-bold text-sm text-foreground">{post.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{post.content}</p>

            <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-muted">
                {post.category.replace("_", " ")}
              </span>
              <button
                onClick={() => {
                  setPosts(prev =>
                    prev.map(p => (p.id === post.id ? { ...p, likes: p.likes + 1 } : p))
                  );
                }}
                className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-semibold"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                <span>{post.likes} Helpful</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
