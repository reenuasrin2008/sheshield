"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Navigation,
  Crosshair,
  Search,
  Share2,
  ShieldCheck,
  AlertTriangle,
  Hospital,
  ShieldAlert,
  Loader2,
  Check,
  Flame,
  Info
} from "lucide-react";
import { SupportedLanguage, RouteGeometry, AssistanceResource } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";

interface LiveMapProps {
  currentLang: SupportedLanguage;
  onShareSessionCreated?: (shareUrl: string) => void;
}

export function LiveMap({ currentLang, onShareSessionCreated }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const t = getTranslation(currentLang);

  // Geolocation & Tracking State
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [locationTimestamp, setLocationTimestamp] = useState<number | null>(null);

  // Search & Routing State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteGeometry | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Layer Toggles
  const [showPolice, setShowPolice] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);

  // Share Journey State
  const [isSharing, setIsSharing] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [currentShareUrl, setCurrentShareUrl] = useState<string | null>(null);

  // Assistance data state
  const [assistanceResources, setAssistanceResources] = useState<AssistanceResource[]>([]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Use Carto Voyager or configurable map style
    const mapStyle =
      process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
      "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [77.209, 28.6139], // Default: India Capital Region
      zoom: 12
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    mapRef.current = map;

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fetch verified assistance resources
  useEffect(() => {
    fetch("/api/assistance")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAssistanceResources(data);
      })
      .catch(err => console.warn("Could not fetch assistance:", err));
  }, []);

  // Update Markers for Assistance Resources
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Add Markers when map loads
    const markers: maplibregl.Marker[] = [];

    assistanceResources.forEach(res => {
      if (res.category === "police" && !showPolice) return;
      if (res.category === "hospital" && !showHospitals) return;

      const el = document.createElement("div");
      el.className = "flex items-center justify-center cursor-pointer shadow-lg rounded-full";
      el.style.width = "28px";
      el.style.height = "28px";

      if (res.category === "police") {
        el.style.backgroundColor = "#2563eb";
        el.innerHTML = `<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>`;
      } else if (res.category === "hospital") {
        el.style.backgroundColor = "#dc2626";
        el.innerHTML = `<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>`;
      } else {
        el.style.backgroundColor = "#7c3aed";
        el.innerHTML = `<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
      }

      const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
        <div class="p-2 text-xs">
          <p class="font-bold text-sm text-foreground">${res.name}</p>
          <p class="text-muted-foreground mt-0.5">${res.address || ""}</p>
          ${res.phone_number ? `<p class="font-semibold text-rose-600 mt-1">Tel: <a href="tel:${res.phone_number}" class="underline">${res.phone_number}</a></p>` : ""}
          <span class="inline-block mt-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-medium">Verified 24/7</span>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([res.longitude, res.latitude])
        .setPopup(popup)
        .addTo(map);

      markers.push(marker);
    });

    return () => {
      markers.forEach(m => m.remove());
    };
  }, [assistanceResources, showPolice, showHospitals]);

  // Request Actual Device Location
  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lon: longitude, accuracy });
        setLocationPermissionStatus("granted");
        setLocationTimestamp(Date.now());

        const map = mapRef.current;
        if (map) {
          map.flyTo({ center: [longitude, latitude], zoom: 15 });

          // Update or create user marker
          if (!userMarkerRef.current) {
            const el = document.createElement("div");
            el.className = "relative flex items-center justify-center";
            el.innerHTML = `
              <div class="w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <div class="absolute -inset-2 rounded-full bg-rose-500/20 animate-ping pointer-events-none"></div>
            `;
            userMarkerRef.current = new maplibregl.Marker({ element: el })
              .setLngLat([longitude, latitude])
              .addTo(map);
          } else {
            userMarkerRef.current.setLngLat([longitude, latitude]);
          }
        }
      },
      err => {
        console.warn("Geolocation permission error:", err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationPermissionStatus("denied");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Automatically request on mount
  useEffect(() => {
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  // Start / Stop Live Foreground Tracking
  const toggleLiveTracking = () => {
    if (isTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
    } else {
      if (!navigator.geolocation) return;

      const id = navigator.geolocation.watchPosition(
        pos => {
          const { latitude, longitude, accuracy, heading, speed } = pos.coords;
          setUserLocation({ lat: latitude, lon: longitude, accuracy });
          setLocationTimestamp(Date.now());

          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([longitude, latitude]);
          }

          // If journey is being shared, transmit throttled coordinates to server
          if (isSharing) {
            fetch("/api/location/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                latitude,
                longitude,
                accuracy,
                heading,
                speed
              })
            }).catch(e => console.warn("Live coord push err:", e));
          }
        },
        err => console.warn("Tracking error:", err.message),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );

      watchIdRef.current = id;
      setIsTracking(true);
    }
  };

  // Destination Search
  const handleSearch = async (queryText: string) => {
    setSearchQuery(queryText);
    if (queryText.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(queryText)}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Geocode query error:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Select Destination & Compute Route
  const handleSelectDestination = async (dest: any) => {
    setSelectedDestination({
      name: dest.place_name,
      lat: dest.latitude,
      lon: dest.longitude
    });
    setSearchResults([]);

    if (!userLocation) {
      alert("Please enable current location to calculate a walking route.");
      return;
    }

    setIsCalculatingRoute(true);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: [userLocation.lon, userLocation.lat],
          destination: [dest.longitude, dest.latitude],
          profile: "foot"
        })
      });

      if (!res.ok) {
        throw new Error("Route could not be calculated");
      }

      const route: RouteGeometry = await res.json();
      setActiveRoute(route);

      // Render Route on MapLibre
      const map = mapRef.current;
      if (map) {
        // Remove existing route layer & source if present
        if (map.getLayer("route-line")) map.removeLayer("route-line");
        if (map.getSource("route-source")) map.removeSource("route-source");

        map.addSource("route-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: route.coordinates
            }
          }
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#e11d48", // Rose-600
            "line-width": 5,
            "line-opacity": 0.85
          }
        });

        // Fit bounds around origin and destination
        const bounds = new maplibregl.LngLatBounds();
        route.coordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 60 });
      }
    } catch (err: any) {
      alert(err.message || "Failed to calculate route");
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Start Live Sharing Session
  const handleStartSharing = async () => {
    try {
      const res = await fetch("/api/location/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isSharing ? "stop" : "start",
          durationMinutes: 90,
          title: "SheShield Live Journey"
        })
      });

      const data = await res.json();
      if (data.success && !isSharing) {
        setIsSharing(true);
        const fullUrl = `${window.location.origin}${data.shareUrl}`;
        setCurrentShareUrl(fullUrl);
        if (onShareSessionCreated) onShareSessionCreated(fullUrl);
      } else {
        setIsSharing(false);
        setCurrentShareUrl(null);
      }
    } catch (err) {
      alert("Could not update sharing session");
    }
  };

  const copyShareLink = () => {
    if (currentShareUrl) {
      navigator.clipboard.writeText(currentShareUrl);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 3000);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-border shadow-xl bg-slate-900">
      {/* MapLibre Canvas Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Permission Denied Banner */}
      {locationPermissionStatus === "denied" && (
        <div className="absolute top-4 left-4 right-4 z-20 bg-amber-500/90 text-white text-xs p-3 rounded-xl backdrop-blur-md shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{t.map_location_permission_denied}</span>
          </div>
          <button
            onClick={requestCurrentLocation}
            className="px-2.5 py-1 bg-white text-amber-900 rounded font-bold hover:bg-amber-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Floating Search & Destination Bar */}
      <div className="absolute top-4 left-4 z-10 w-80 sm:w-96 max-w-[calc(100vw-32px)]">
        <div className="relative">
          <div className="relative flex items-center bg-background/90 backdrop-blur-md rounded-xl border border-border/80 shadow-lg px-3 py-2 text-sm">
            <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              placeholder={t.map_search_placeholder}
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground text-xs sm:text-sm"
            />
            {isSearching && <Loader2 className="w-4 h-4 animate-spin text-rose-500 shrink-0 ml-1" />}
          </div>

          {/* Autocomplete Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden z-30 max-h-56 overflow-y-auto divide-y divide-border/40">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectDestination(result)}
                  className="w-full text-left px-3 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-xs text-foreground flex items-start gap-2"
                >
                  <Navigation className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">{result.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Layer Controls & Recenter Panel (Top Left below search) */}
      <div className="absolute top-20 left-4 z-10 flex flex-col gap-1.5 bg-background/85 backdrop-blur-md p-1.5 rounded-xl border border-border/70 shadow-md text-[11px]">
        <button
          onClick={() => setShowPolice(!showPolice)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
            showPolice ? "bg-blue-600 text-white font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t.map_layer_police}</span>
        </button>
        <button
          onClick={() => setShowHospitals(!showHospitals)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
            showHospitals ? "bg-red-600 text-white font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Hospital className="w-3.5 h-3.5" />
          <span>{t.map_layer_hospitals}</span>
        </button>
        <button
          onClick={() => setShowIncidents(!showIncidents)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
            showIncidents ? "bg-purple-600 text-white font-semibold" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t.map_layer_reports}</span>
        </button>
      </div>

      {/* Map Action Floating Dock (Bottom Center) */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Recenter & Live Tracking Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={requestCurrentLocation}
            title={t.map_recenter}
            className="p-2.5 rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-md hover:bg-background text-foreground"
          >
            <Crosshair className="w-4 h-4 text-rose-600" />
          </button>
          <button
            onClick={toggleLiveTracking}
            className={`px-3 py-2 rounded-xl text-xs font-bold shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all ${
              isTracking
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-background/90 text-foreground border border-border hover:bg-background"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isTracking ? "bg-white" : "bg-emerald-500"}`} />
            <span>{isTracking ? t.map_stop_tracking : t.map_start_tracking}</span>
          </button>
        </div>

        {/* Live Journey Share Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {currentShareUrl ? (
            <button
              onClick={copyShareLink}
              className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              {shareLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{shareLinkCopied ? t.map_link_copied : t.map_copy_link}</span>
            </button>
          ) : (
            <button
              onClick={handleStartSharing}
              className="px-3 py-2 rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-md text-foreground text-xs font-semibold hover:bg-background flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.map_share_journey}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Route & Predictive Safety Assessment Card */}
      {activeRoute && (
        <div className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-4 z-20 sm:w-96 bg-background/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl text-xs animate-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between border-b border-border/60 pb-3 mb-2.5">
            <div>
              <p className="font-bold text-sm text-foreground">Safe Walking Route</p>
              <p className="text-muted-foreground text-[11px] truncate max-w-[200px]">
                {selectedDestination?.name}
              </p>
            </div>
            {/* Safety Score Badge */}
            {activeRoute.safety_score && (
              <div
                className={`px-2.5 py-1 rounded-xl font-bold flex items-center gap-1 text-[11px] ${
                  activeRoute.safety_score.risk_level === "low"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : activeRoute.safety_score.risk_level === "moderate"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    : activeRoute.safety_score.risk_level === "insufficient_data"
                    ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {activeRoute.safety_score.risk_level === "insufficient_data"
                    ? "Standard Route"
                    : `Safety ${activeRoute.safety_score.overall_score}/100`}
                </span>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-muted/50 p-2 rounded-xl text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">{t.map_route_distance}</span>
              <p className="font-bold text-sm text-foreground">
                {(activeRoute.distance_meters / 1000).toFixed(2)} km
              </p>
            </div>
            <div className="bg-muted/50 p-2 rounded-xl text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">{t.map_route_duration}</span>
              <p className="font-bold text-sm text-foreground">
                {Math.ceil(activeRoute.duration_seconds / 60)} mins
              </p>
            </div>
          </div>

          {/* Explainable Risk Factors */}
          {activeRoute.safety_score && (
            <div className="bg-muted/30 p-2 rounded-xl border border-border/50 text-[11px] space-y-1 mb-2">
              <div className="flex items-start gap-1.5 text-foreground/90">
                <Info className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="leading-snug">{activeRoute.safety_score.explanation}</p>
              </div>
            </div>
          )}

          {/* Next Navigation Instruction */}
          {activeRoute.instructions.length > 0 && (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
              <Navigation className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{activeRoute.instructions[0].text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
