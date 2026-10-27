"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Flame,
  RefreshCw,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Eye,
  MapPin,
  Clock,
  CheckCircle2,
  PlusCircle,
  X,
  Loader2
} from "lucide-react";
import { SafetyReport, SupportedLanguage } from "@/types/sheshield";

interface SafetyHeatmapProps {
  currentLang?: SupportedLanguage;
}

const CATEGORIES = [
  { id: "all", label: "All Categories", icon: Flame },
  { id: "poor_lighting", label: "Poor Lighting", icon: Lightbulb, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
  { id: "harassment", label: "Harassment", icon: AlertTriangle, color: "text-rose-500 bg-rose-500/10 border-rose-500/30" },
  { id: "isolated_area", label: "Isolated Area", icon: Eye, color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
  { id: "suspicious_activity", label: "Suspicious Activity", icon: AlertTriangle, color: "text-orange-500 bg-orange-500/10 border-orange-500/30" },
  { id: "safe_haven", label: "Safe Haven", icon: ShieldCheck, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" }
];

const TIME_WINDOWS = [
  { id: "7", label: "Last 7 Days" },
  { id: "30", label: "Last 30 Days" },
  { id: "90", label: "Last 90 Days" },
  { id: "all", label: "All Time" }
];

const GOOGLE_ROADMAP_STYLE: any = {
  version: 8,
  sources: {
    "google-roadmap": {
      type: "raster",
      tiles: [
        "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      ],
      tileSize: 256,
      attribution: "Map data © Google Maps"
    }
  },
  layers: [
    {
      id: "google-roadmap-layer",
      type: "raster",
      source: "google-roadmap",
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

const OSM_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export function SafetyHeatmap({ currentLang = "en" }: SafetyHeatmapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [stats, setStats] = useState<{
    total_count: number;
    latest_report_date: string | null;
    latest_report_relative: string;
    time_window: string;
    source_status: string;
    verification_status: string;
  }>({
    total_count: 0,
    latest_report_date: null,
    latest_report_relative: "Loading...",
    time_window: "Last 30 Days",
    source_status: "Verified Public Records (RLS Protected)",
    verification_status: "100% Community Reviewed & Anonymized"
  });

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWindow, setSelectedWindow] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeReport, setActiveReport] = useState<SafetyReport | null>(null);
  const [mapStyleType, setMapStyleType] = useState<"google" | "osm">("google");

  // Quick report submission modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitCategory, setSubmitCategory] = useState("poor_lighting");
  const [submitDescription, setSubmitDescription] = useState("");
  const [submitSeverity, setSubmitSeverity] = useState<"low" | "medium" | "high">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportsRef = useRef<SafetyReport[]>([]);

  // 1. Fetch Safety Reports with active filters
  const fetchReports = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const url = `/api/reports?category=${selectedCategory}&days=${selectedWindow}&status=verified`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && Array.isArray(data.reports)) {
        setReports(data.reports);
        reportsRef.current = data.reports;
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.warn("Could not fetch safety reports:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, selectedWindow]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // 3. Update Heatmap & Clustered Markers Layer on Map
  const updateMapLayers = useCallback((map: maplibregl.Map, currentReports: SafetyReport[]) => {
    if (!map) return;
    if (!map.isStyleLoaded()) {
      const onReady = () => {
        map.off("load", onReady);
        map.off("styledata", onReady);
        updateMapLayers(map, currentReports);
      };
      map.once("load", onReady);
      map.once("styledata", onReady);
      return;
    }

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const validReports = currentReports.filter(
      r => typeof r.latitude === "number" && typeof r.longitude === "number" && !isNaN(r.latitude) && !isNaN(r.longitude)
    );

    const geojsonData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: validReports.map(r => ({
        type: "Feature",
        properties: {
          id: r.id,
          category: r.category,
          severity: r.severity,
          weight: r.severity === "high" ? 1.0 : r.severity === "medium" ? 0.6 : 0.3,
          is_demo: r.is_demo,
          reported_at: r.reported_at,
          description: r.description,
          location_name: r.location_name
        },
        geometry: {
          type: "Point",
          coordinates: [r.longitude, r.latitude]
        }
      }))
    };

    const existingSource = map.getSource("safety-reports-source") as maplibregl.GeoJSONSource;
    if (existingSource && typeof existingSource.setData === "function") {
      existingSource.setData(geojsonData);
    } else {
      try {
        if (map.getLayer("safety-heatmap-layer")) map.removeLayer("safety-heatmap-layer");
        if (map.getSource("safety-reports-source")) map.removeSource("safety-reports-source");

        map.addSource("safety-reports-source", {
          type: "geojson",
          data: geojsonData
        });

        map.addLayer({
          id: "safety-heatmap-layer",
          type: "heatmap",
          source: "safety-reports-source",
          maxzoom: 17,
          paint: {
            "heatmap-weight": ["get", "weight"],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0, 0, 0, 0)",
              0.2,
              "rgba(254, 215, 170, 0.7)",
              0.4,
              "rgba(251, 146, 60, 0.8)",
              0.7,
              "rgba(244, 63, 94, 0.85)",
              1,
              "rgba(190, 18, 60, 0.95)"
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 25, 15, 55],
            "heatmap-opacity": 0.85
          }
        });
      } catch (err) {
        console.warn("Could not add heatmap layer:", err);
      }
    }

    // Add Interactive Severity Pin Markers for each report
    const bounds = new maplibregl.LngLatBounds();

    validReports.forEach(r => {
      const el = document.createElement("div");
      el.className = "cursor-pointer group flex items-center justify-center";
      
      const isHigh = r.severity === "high";
      const isMed = r.severity === "medium";
      const isSafe = r.category === "safe_haven";

      const pinColor = isSafe
        ? "bg-emerald-500 ring-emerald-300"
        : isHigh
        ? "bg-rose-600 ring-rose-300"
        : isMed
        ? "bg-amber-500 ring-amber-300"
        : "bg-blue-500 ring-blue-300";

      el.innerHTML = `
        <div class="w-6 h-6 rounded-full ${pinColor} ring-4 ring-opacity-40 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-125">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(`
        <div style="font-family: sans-serif; padding: 6px; font-size: 11px; max-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
            <strong style="font-size: 12px; color: #0f172a; text-transform: capitalize;">${r.category.replace("_", " ")}</strong>
            <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 6px; background: ${isHigh ? "#ffe4e6" : "#fef3c7"}; color: ${isHigh ? "#be123c" : "#b45309"}; text-transform: uppercase;">${r.severity}</span>
          </div>
          <p style="color: #475569; margin: 2px 0 6px 0; line-height: 1.3;">${r.description}</p>
          <div style="font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 4px; display: flex; justify-content: space-between;">
            <span>📍 ${r.location_name || "Generalized Area"}</span>
            <span>${r.is_demo ? "Demo Record" : "Citizen Verified"}</span>
          </div>
        </div>
      `);

      el.addEventListener("click", () => {
        setActiveReport(r);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([r.longitude, r.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([r.longitude, r.latitude]);
    });

    if (!bounds.isEmpty() && validReports.length > 0) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    }
  }, []);

  // 2. Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainer.current) return;

    const style = mapStyleType === "google" ? GOOGLE_ROADMAP_STYLE : OSM_STYLE;

    if (mapRef.current) {
      mapRef.current.setStyle(style);
      const m = mapRef.current;
      const onReady = () => {
        m.off("load", onReady);
        m.off("styledata", onReady);
        updateMapLayers(m, reportsRef.current);
      };
      m.once("load", onReady);
      m.once("styledata", onReady);
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style,
      center: [77.2195, 28.6280],
      zoom: 13,
      pitch: 20
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.on("load", () => {
      mapRef.current = map;
      updateMapLayers(map, reportsRef.current);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapStyleType, updateMapLayers]);

  // Sync reports to map whenever reports change
  useEffect(() => {
    reportsRef.current = reports;
    if (mapRef.current) {
      if (mapRef.current.isStyleLoaded()) {
        updateMapLayers(mapRef.current, reports);
      } else {
        const m = mapRef.current;
        const onReady = () => {
          m.off("load", onReady);
          m.off("styledata", onReady);
          updateMapLayers(m, reportsRef.current);
        };
        m.once("load", onReady);
        m.once("styledata", onReady);
      }
    }
  }, [reports, updateMapLayers]);


  // Center map on clicked report card
  const handleSelectReportCard = (report: SafetyReport) => {
    setActiveReport(report);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [report.longitude, report.latitude],
        zoom: 16,
        essential: true
      });
    }
  };

  // Submit new incident report
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: submitCategory,
          description: submitDescription,
          severity: submitSeverity,
          latitude: 28.6280,
          longitude: 77.2195,
          location_name: "Central Transit Area (Generalized)"
        })
      });

      if (res.ok) {
        setIsSubmitModalOpen(false);
        setSubmitDescription("");
        fetchReports();
      }
    } catch (err) {
      console.warn("Failed to submit report:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Filters Row */}
      <div className="bg-card rounded-3xl border border-border p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>Community Safety Heatmap</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Safety Incident Density & Hotspots
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Visualizing review-approved community safety reports with generalized coordinates to protect victim privacy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Area</span>
            </button>

            <button
              onClick={fetchReports}
              disabled={isRefreshing}
              className="p-2.5 rounded-2xl border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50"
              title="Refresh Heatmap Data"
            >
              <RefreshCw className={`w-4 h-4 text-rose-600 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Time Window Pills */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs font-semibold shrink-0">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-1 mr-0.5" />
            {TIME_WINDOWS.map(win => (
              <button
                key={win.id}
                onClick={() => setSelectedWindow(win.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedWindow === win.id
                    ? "bg-background text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {win.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Data Freshness & Summary Metrics Panel (Calculated from filtered dataset, never hardcoded) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
            Verified Reports
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-foreground">{stats.total_count}</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">
            In {stats.time_window}
          </span>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
            Most Recent Report
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-foreground truncate">
              {stats.latest_report_relative}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">
            {stats.latest_report_date
              ? new Date(stats.latest_report_date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })
              : "No reports in scope"}
          </span>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
            Active Filter Window
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-foreground truncate">
              {stats.time_window}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block truncate capitalize">
            {selectedCategory.replace("_", " ")}
          </span>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
            Privacy & Integrity
          </span>
          <div className="flex items-baseline gap-1 mt-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold truncate">RLS & Fuzzed Coords</span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block truncate">
            Zero victim exposure
          </span>
        </div>
      </div>

      {/* 3. Main Split View: Heatmap Canvas + Interactive Reports Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Map & Heatmap Visualizer (7 or 8 columns on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-card rounded-3xl border border-border overflow-hidden shadow-sm relative">
          {/* Map Top Bar Controls */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-background/90 backdrop-blur-md p-1 rounded-xl border border-border text-[10px] font-bold shadow-md">
            <button
              onClick={() => setMapStyleType("google")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapStyleType === "google"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Google Roadmap
            </button>
            <button
              onClick={() => setMapStyleType("osm")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapStyleType === "osm"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Carto OSM
            </button>
          </div>

          {/* Density Heatmap Legend (Bottom Right of Map) */}
          <div className="absolute bottom-3 right-3 z-10 bg-background/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-border shadow-md text-[10px]">
            <span className="font-bold block text-foreground mb-1">Density Intensity</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[9px]">Low</span>
              <div className="w-20 h-2.5 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-600" />
              <span className="text-muted-foreground text-[9px]">High</span>
            </div>
          </div>

          {/* Map Canvas */}
          <div ref={mapContainer} className="w-full h-[450px] sm:h-[550px] lg:h-[620px]" />
        </div>

        {/* Right: Filtered Reports List (5 or 4 columns) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
              <span>Verified Incident Reports</span>
              <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                {reports.length}
              </span>
            </h2>
            <span className="text-[10px] text-muted-foreground">Click card to zoom</span>
          </div>

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
              <span className="text-xs">Loading verified safety reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-bold text-sm text-foreground">No Verified Reports in this Window</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                There are no public verified safety incidents matching the selected category and timeframe.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {reports.map(report => {
                const isSelected = activeReport?.id === report.id;
                const isHigh = report.severity === "high";
                const isMed = report.severity === "medium";
                const isSafe = report.category === "safe_haven";

                return (
                  <div
                    key={report.id}
                    onClick={() => handleSelectReportCard(report)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-rose-500/10 border-rose-500 shadow-sm"
                        : "bg-card border-border hover:border-rose-300 dark:hover:border-rose-900/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isSafe
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : isHigh
                              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                              : isMed
                              ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                              : "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {report.severity}
                        </span>

                        <span className="font-bold text-xs text-foreground capitalize">
                          {report.category.replace("_", " ")}
                        </span>
                      </div>

                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(report.reported_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/80 mt-2 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1 truncate max-w-[180px]">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{report.location_name || "Generalized Area"}</span>
                      </span>

                      <span className="px-1.5 py-0.5 rounded bg-muted font-medium text-[9px]">
                        {report.is_demo ? "Demo Seed" : "Citizen Verified"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Report Incident Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-base text-foreground">Submit Community Safety Report</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Coordinates are automatically fuzzed (+/- 300m) to preserve your privacy.
                </p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Incident Category</label>
                <select
                  value={submitCategory}
                  onChange={e => setSubmitCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground outline-none"
                >
                  <option value="poor_lighting">Poor Lighting</option>
                  <option value="harassment">Harassment</option>
                  <option value="isolated_area">Isolated Area</option>
                  <option value="suspicious_activity">Suspicious Activity</option>
                  <option value="safe_haven">Safe Haven</option>
                  <option value="other">Other Concern</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Severity Assessment</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map(sev => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setSubmitSeverity(sev)}
                      className={`py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        submitSeverity === sev
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">Incident Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe the safety concern (e.g., dark alley, broken streetlights)..."
                  value={submitDescription}
                  onChange={e => setSubmitDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
