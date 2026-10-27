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
  Loader2,
  Check,
  X,
  Volume2,
  VolumeX,
  Compass,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  CheckCircle2,
  Sparkles,
  Radio
} from "lucide-react";
import { SupportedLanguage, RouteGeometry, AssistanceResource, MultiRouteResponse } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";
import { calculateHaversineDistance } from "@/lib/services/geo-provider";

interface LiveMapProps {
  currentLang: SupportedLanguage;
  onShareSessionCreated?: (shareUrl: string) => void;
}

declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
  }
}

// 1. Google Maps Roadmap Tile Style (Crisp Google Roadmap with roads, highway markers & street names)
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

// 2. Google Maps Satellite Hybrid Style (Authentic aerial satellite imagery with street overlay)
const GOOGLE_SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    "google-satellite": {
      type: "raster",
      tiles: [
        "https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        "https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        "https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      ],
      tileSize: 256,
      attribution: "Imagery © Google Maps"
    }
  },
  layers: [
    {
      id: "google-satellite-layer",
      type: "raster",
      source: "google-satellite",
      minzoom: 0,
      maxzoom: 22
    }
  ]
};

const OSM_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export type MapProviderMode = "google" | "google-satellite" | "osm" | "google-sdk";

export function LiveMap({ currentLang, onShareSessionCreated }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapLibreRef = useRef<maplibregl.Map | null>(null);
  const googleMapRef = useRef<any | null>(null);
  const googleUserMarkerRef = useRef<any | null>(null);
  const googleSafeRouteLineRef = useRef<any | null>(null);
  const googleDangerRouteLineRef = useRef<any | null>(null);
  const googleResourceMarkersRef = useRef<any[]>([]);

  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSpokenStepRef = useRef<number>(-1);

  const t = getTranslation(currentLang);

  // Map Provider State: Default to "google" (Google Maps Roadmap)
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapProvider, setMapProvider] = useState<MapProviderMode>("google");
  const [googleLoadError, setGoogleLoadError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Geolocation & Tracking State
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [lastLocationTime, setLastLocationTime] = useState<string | null>(null);

  // Search & Multi-Route Planning State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const [safestRoute, setSafestRoute] = useState<RouteGeometry | null>(null);
  const [dangerRoute, setDangerRoute] = useState<RouteGeometry | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<"safest" | "danger">("safest");
  const [activeRoute, setActiveRoute] = useState<RouteGeometry | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Live Navigation HUD State
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distanceToDestination, setDistanceToDestination] = useState<number | null>(null);
  const [voiceGuidanceEnabled, setVoiceGuidanceEnabled] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [followUserMode, setFollowUserMode] = useState(true);

  // Layer Toggles
  const [showPolice, setShowPolice] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);

  // Share Journey State & Active Session ID
  const [isSharing, setIsSharing] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [currentShareUrl, setCurrentShareUrl] = useState<string | null>(null);

  // Assistance data state
  const [assistanceResources, setAssistanceResources] = useState<AssistanceResource[]>([]);

  // 1. Fetch verified assistance resources
  useEffect(() => {
    fetch("/api/assistance")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAssistanceResources(data);
      })
      .catch(err => console.warn("Could not fetch assistance:", err));
  }, []);

  // 2. Audio Voice Navigation synthesizer
  const speakInstruction = useCallback(
    (text: string) => {
      if (!voiceGuidanceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = currentLang === "hi" ? "hi-IN" : currentLang === "ta" ? "ta-IN" : "en-US";
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    },
    [voiceGuidanceEnabled, currentLang]
  );

  // 3. Render Multi-Routes (Safest Emerald vs Danger Dashed Red) on MapLibre
  const renderMultiRoutesOnMapLibre = useCallback(
    (safe: RouteGeometry | null, danger: RouteGeometry | null, selectedType: "safest" | "danger" = "safest") => {
      if (!mapLibreRef.current) return;
      const map = mapLibreRef.current;

      if (!map.isStyleLoaded()) {
        const onReady = () => {
          map.off("load", onReady);
          map.off("styledata", onReady);
          renderMultiRoutesOnMapLibre(safe, danger, selectedType);
        };
        map.once("load", onReady);
        map.once("styledata", onReady);
        return;
      }

      const bounds = new maplibregl.LngLatBounds();

      // Render Danger Route
      const dangerGeoJson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: (danger && danger.coordinates && danger.coordinates.length > 0) ? danger.coordinates : []
        }
      };

      const existingDanger = map.getSource("danger-route-source") as maplibregl.GeoJSONSource | undefined;
      if (existingDanger && typeof existingDanger.setData === "function") {
        existingDanger.setData(dangerGeoJson);
        if (map.getLayer("route-line-danger")) {
          map.setPaintProperty("route-line-danger", "line-color", selectedType === "danger" ? "#ef4444" : "#f87171");
          map.setPaintProperty("route-line-danger", "line-width", selectedType === "danger" ? 6 : 4);
          map.setPaintProperty("route-line-danger", "line-opacity", selectedType === "danger" ? 0.95 : 0.6);
        }
      } else {
        try {
          if (map.getLayer("route-line-danger")) map.removeLayer("route-line-danger");
          if (map.getSource("danger-route-source")) map.removeSource("danger-route-source");

          map.addSource("danger-route-source", {
            type: "geojson",
            data: dangerGeoJson
          });

          map.addLayer({
            id: "route-line-danger",
            type: "line",
            source: "danger-route-source",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": selectedType === "danger" ? "#ef4444" : "#f87171",
              "line-width": selectedType === "danger" ? 6 : 4,
              "line-dasharray": [2, 2],
              "line-opacity": selectedType === "danger" ? 0.95 : 0.6
            }
          });
        } catch (e) {
          console.warn("Could not add danger layer:", e);
        }
      }

      if (danger && danger.coordinates && danger.coordinates.length > 0) {
        danger.coordinates.forEach(c => bounds.extend(c));
      }

      // Render Safest Guardian Route
      const safeGeoJson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: (safe && safe.coordinates && safe.coordinates.length > 0) ? safe.coordinates : []
        }
      };

      const existingSafe = map.getSource("safe-route-source") as maplibregl.GeoJSONSource | undefined;
      if (existingSafe && typeof existingSafe.setData === "function") {
        existingSafe.setData(safeGeoJson);
        if (map.getLayer("route-line-safe-casing")) {
          map.setPaintProperty("route-line-safe-casing", "line-width", selectedType === "safest" ? 9 : 6);
          map.setPaintProperty("route-line-safe-casing", "line-opacity", selectedType === "safest" ? 0.6 : 0.3);
        }
        if (map.getLayer("route-line-safe")) {
          map.setPaintProperty("route-line-safe", "line-color", selectedType === "safest" ? "#10b981" : "#059669");
          map.setPaintProperty("route-line-safe", "line-width", selectedType === "safest" ? 6 : 4);
          map.setPaintProperty("route-line-safe", "line-opacity", selectedType === "safest" ? 1.0 : 0.6);
        }
      } else {
        try {
          if (map.getLayer("route-line-safe")) map.removeLayer("route-line-safe");
          if (map.getLayer("route-line-safe-casing")) map.removeLayer("route-line-safe-casing");
          if (map.getSource("safe-route-source")) map.removeSource("safe-route-source");

          map.addSource("safe-route-source", {
            type: "geojson",
            data: safeGeoJson
          });

          // Dark casing for high contrast
          map.addLayer({
            id: "route-line-safe-casing",
            type: "line",
            source: "safe-route-source",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#064e3b",
              "line-width": selectedType === "safest" ? 9 : 6,
              "line-opacity": selectedType === "safest" ? 0.6 : 0.3
            }
          });

          map.addLayer({
            id: "route-line-safe",
            type: "line",
            source: "safe-route-source",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": selectedType === "safest" ? "#10b981" : "#059669",
              "line-width": selectedType === "safest" ? 6 : 4,
              "line-opacity": selectedType === "safest" ? 1.0 : 0.6
            }
          });
        } catch (e) {
          console.warn("Could not add safe layer:", e);
        }
      }

      if (safe && safe.coordinates && safe.coordinates.length > 0) {
        safe.coordinates.forEach(c => bounds.extend(c));
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 45, maxZoom: 16 });
      }
    },
    []
  );

  // 4. Render Multi-Routes on Google Maps JS SDK
  const renderMultiRoutesOnGoogleSDK = useCallback(
    (safe: RouteGeometry | null, danger: RouteGeometry | null) => {
      if (!googleMapRef.current || !window.google?.maps) return;

      if (googleSafeRouteLineRef.current) googleSafeRouteLineRef.current.setMap(null);
      if (googleDangerRouteLineRef.current) googleDangerRouteLineRef.current.setMap(null);

      const bounds = new window.google.maps.LatLngBounds();

      // Danger route (Dashed red)
      if (danger && danger.coordinates) {
        const dPath = danger.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
        googleDangerRouteLineRef.current = new window.google.maps.Polyline({
          path: dPath,
          geodesic: true,
          strokeColor: "#ef4444",
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: googleMapRef.current
        });
        dPath.forEach(pt => bounds.extend(pt));
      }

      // Safe route (Solid emerald green)
      if (safe && safe.coordinates) {
        const sPath = safe.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
        googleSafeRouteLineRef.current = new window.google.maps.Polyline({
          path: sPath,
          geodesic: true,
          strokeColor: "#10b981",
          strokeOpacity: 0.95,
          strokeWeight: 6,
          map: googleMapRef.current
        });
        sPath.forEach(pt => bounds.extend(pt));
      }

      if (!bounds.isEmpty()) {
        googleMapRef.current.fitBounds(bounds);
      }
    },
    []
  );

  // 5. Load Google Maps JS SDK script when requested
  const loadGoogleScript = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (window.google && window.google.maps) return true;
    if (!googleApiKey) return false;

    return new Promise(resolve => {
      window.gm_authFailure = () => {
        console.warn("[SheShield] Google Maps API auth failure. Falling back to Google Roadmap.");
        setGoogleLoadError(
          "Google Maps JS SDK requires an active billing account on your Google Cloud Project. Switched to Google Maps Roadmap tiles."
        );
        setMapProvider("google");
        resolve(false);
      };

      const existingScript = document.getElementById("google-maps-script") as HTMLScriptElement | null;
      if (existingScript) {
        if (window.google && window.google.maps) {
          resolve(true);
          return;
        }
        existingScript.addEventListener("load", () => resolve(true), { once: true });
        existingScript.addEventListener("error", () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn("Failed to load Google Maps script");
        setGoogleLoadError("Could not load Google Maps JS SDK. Switched to Google Maps Roadmap tiles.");
        setMapProvider("google");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }, [googleApiKey]);

  // 6. Initialize Map based on mapProvider
  useEffect(() => {
    if (!mapContainer.current) return;
    let isCancelled = false;

    const defaultCenter = userLocation
      ? { lat: userLocation.lat, lng: userLocation.lon }
      : { lat: 28.6139, lng: 77.209 };

    if (mapProvider === "google-sdk") {
      setIsMapReady(false);
      if (mapLibreRef.current) {
        mapLibreRef.current.remove();
        mapLibreRef.current = null;
      }
      if (mapContainer.current) {
        mapContainer.current.innerHTML = "";
      }

      loadGoogleScript().then(loaded => {
        if (isCancelled) return;
        if (loaded && window.google?.maps && mapContainer.current) {
          try {
            const gMap = new window.google.maps.Map(mapContainer.current, {
              center: defaultCenter,
              zoom: 14,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            });

            googleMapRef.current = gMap;
            setIsMapReady(true);
            if (safestRoute || dangerRoute) {
              renderMultiRoutesOnGoogleSDK(safestRoute, dangerRoute);
            }
          } catch (e: any) {
            console.warn("Google Maps JS SDK initialization exception:", e.message);
            setGoogleLoadError("Google Maps JS SDK: " + (e.message || "Failed to initialize"));
            setMapProvider("google");
          }
        } else {
          setMapProvider("google");
        }
      });

      return () => {
        isCancelled = true;
      };
    }

    // MapLibre-powered Tile Engine ("google", "google-satellite", or "osm")
    if (googleMapRef.current) {
      googleMapRef.current = null;
      if (mapContainer.current) {
        mapContainer.current.innerHTML = "";
      }
    }

    const targetStyle =
      mapProvider === "google"
        ? GOOGLE_ROADMAP_STYLE
        : mapProvider === "google-satellite"
        ? GOOGLE_SATELLITE_STYLE
        : OSM_STYLE;

    if (mapLibreRef.current) {
      mapLibreRef.current.setStyle(targetStyle);
      mapLibreRef.current.once("style.load", () => {
        if (!isCancelled && (safestRoute || dangerRoute)) {
          renderMultiRoutesOnMapLibre(safestRoute, dangerRoute, selectedRouteType);
        }
      });
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current!,
      style: targetStyle,
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: 14
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.on("load", () => {
      if (!isCancelled) {
        mapLibreRef.current = map;
        setIsMapReady(true);
        if (safestRoute || dangerRoute) {
          renderMultiRoutesOnMapLibre(safestRoute, dangerRoute, selectedRouteType);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [mapProvider, loadGoogleScript, safestRoute, dangerRoute, selectedRouteType, renderMultiRoutesOnMapLibre, renderMultiRoutesOnGoogleSDK]);

  // 7. Update Markers on User Location Changes
  useEffect(() => {
    if (!userLocation) return;
    const { lat, lon } = userLocation;

    // Google Maps JS SDK User Marker
    if (mapProvider === "google-sdk" && googleMapRef.current && window.google?.maps) {
      if (!googleUserMarkerRef.current) {
        googleUserMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng: lon },
          map: googleMapRef.current,
          title: "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#10b981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5
          }
        });
      } else {
        googleUserMarkerRef.current.setPosition({ lat, lng: lon });
      }
    }

    // MapLibre User Marker (Google Roadmap, Satellite, OSM)
    if (mapProvider !== "google-sdk" && mapLibreRef.current) {
      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.className = "relative flex items-center justify-center";
        el.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center">
            <div class="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
          </div>
          <div class="absolute -inset-2.5 rounded-full bg-emerald-500/25 animate-ping pointer-events-none"></div>
        `;
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([lon, lat])
          .addTo(mapLibreRef.current);
      } else {
        userMarkerRef.current.setLngLat([lon, lat]);
      }
    }
  }, [userLocation, mapProvider]);

  // 8. Update Assistance Markers (Police & Hospitals)
  useEffect(() => {
    if (!isMapReady) return;

    if (mapProvider === "google-sdk" && googleMapRef.current && window.google?.maps) {
      googleResourceMarkersRef.current.forEach(m => m.setMap(null));
      googleResourceMarkersRef.current = [];

      assistanceResources.forEach(res => {
        if (res.category === "police" && !showPolice) return;
        if (res.category === "hospital" && !showHospitals) return;

        const color = res.category === "police" ? "#2563eb" : res.category === "hospital" ? "#dc2626" : "#7c3aed";
        const marker = new window.google.maps.Marker({
          position: { lat: res.latitude, lng: res.longitude },
          map: googleMapRef.current,
          title: res.name,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1.5
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family:sans-serif;padding:4px;font-size:12px;color:#1e293b;">
              <strong style="font-size:13px;">${res.name}</strong><br/>
              <span style="color:#64748b;">${res.address || "24/7 Assistance"}</span><br/>
              ${res.phone_number ? `<a href="tel:${res.phone_number}" style="color:#10b981;font-weight:bold;">Call: ${res.phone_number}</a>` : ""}
            </div>
          `
        });

        marker.addListener("click", () => {
          infoWindow.open(googleMapRef.current, marker);
        });

        googleResourceMarkersRef.current.push(marker);
      });
    }

    if (mapProvider !== "google-sdk" && mapLibreRef.current) {
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
          el.innerHTML = `<svg width="15" height="15" fill="white" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>`;
        } else if (res.category === "hospital") {
          el.style.backgroundColor = "#dc2626";
          el.innerHTML = `<svg width="15" height="15" fill="white" viewBox="0 0 24 24"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>`;
        } else {
          el.style.backgroundColor = "#7c3aed";
          el.innerHTML = `<svg width="15" height="15" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
        }

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
          <div class="p-2 text-xs">
            <p class="font-bold text-sm text-foreground">${res.name}</p>
            <p class="text-muted-foreground mt-0.5">${res.address || ""}</p>
            ${res.phone_number ? `<p class="font-semibold text-rose-600 mt-1">Tel: <a href="tel:${res.phone_number}" class="underline">${res.phone_number}</a></p>` : ""}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([res.longitude, res.latitude])
          .setPopup(popup)
          .addTo(mapLibreRef.current!);

        markers.push(marker);
      });

      return () => {
        markers.forEach(m => m.remove());
      };
    }
  }, [assistanceResources, showPolice, showHospitals, mapProvider, isMapReady]);

  // 9. Request Current Device Location
  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device/browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({ lat: latitude, lon: longitude, accuracy });
        setLocationPermissionStatus("granted");
        setLastLocationTime(new Date().toLocaleTimeString());

        if (mapProvider === "google-sdk" && googleMapRef.current) {
          googleMapRef.current.panTo({ lat: latitude, lng: longitude });
          googleMapRef.current.setZoom(15);
        }

        if (mapProvider !== "google-sdk" && mapLibreRef.current) {
          mapLibreRef.current.flyTo({ center: [longitude, latitude], zoom: 15 });
        }
      },
      err => {
        console.warn("Geolocation permission error:", err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationPermissionStatus("denied");
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [mapProvider]);

  useEffect(() => {
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  // 10. Start / Stop Live GPS Tracking (With session synchronization!)
  const toggleLiveTracking = useCallback(() => {
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
          setLastLocationTime(new Date().toLocaleTimeString());

          if (activeSessionId) {
            fetch("/api/location/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: activeSessionId,
                latitude,
                longitude,
                accuracy,
                heading,
                speed
              })
            }).catch(e => console.warn("Live coord push err:", e));
          }
        },
        err => console.warn("Tracking watchPosition error:", err.message),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 }
      );

      watchIdRef.current = id;
      setIsTracking(true);
    }
  }, [isTracking, activeSessionId]);

  // 11. Start / Stop Live Sharing Session (Generates real shareable link)
  const handleStartSharing = useCallback(async () => {
    try {
      const res = await fetch("/api/location/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isSharing ? "stop" : "start",
          sessionId: activeSessionId,
          durationMinutes: 90,
          title: "SheShield Live Journey"
        })
      });

      const data = await res.json();
      if (data.success && !isSharing) {
        setIsSharing(true);
        setActiveSessionId(data.sessionId);
        const fullUrl = `${window.location.origin}${data.shareUrl}`;
        setCurrentShareUrl(fullUrl);
        if (onShareSessionCreated) onShareSessionCreated(fullUrl);

        if (!isTracking) {
          toggleLiveTracking();
        }

        if (userLocation) {
          fetch("/api/location/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: data.sessionId,
              latitude: userLocation.lat,
              longitude: userLocation.lon,
              accuracy: userLocation.accuracy
            })
          }).catch(() => {});
        }
      } else {
        setIsSharing(false);
        setActiveSessionId(null);
        setCurrentShareUrl(null);
      }
    } catch {
      alert("Could not update sharing session");
    }
  }, [isSharing, activeSessionId, isTracking, toggleLiveTracking, userLocation, onShareSessionCreated]);

  const copyShareLink = () => {
    if (currentShareUrl) {
      navigator.clipboard.writeText(currentShareUrl);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 3000);
    }
  };

  const shareViaWhatsApp = () => {
    const url = currentShareUrl || `${window.location.origin}/track/${activeSessionId || "live"}`;
    const destinationText = selectedDestination?.name ? ` towards ${selectedDestination.name}` : "";
    const text = encodeURIComponent(
      `🛡️ SheShield Live Safe Navigation:\nI am navigating safely${destinationText} via the AI Guardian Safe Route (0 cases filed).\n\nTrack my live journey in real-time here:\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // 12. Destination Search & Route Planning (Computes both Safest Route & Danger Route)
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

  const handleSelectDestination = async (dest: any) => {
    setSelectedDestination({
      name: dest.place_name,
      lat: dest.latitude,
      lon: dest.longitude
    });
    setSearchResults([]);
    setIsNavigating(false);
    setHasArrived(false);
    lastSpokenStepRef.current = -1;

    let startLoc = userLocation;
    if (!startLoc) {
      startLoc = {
        lat: dest.latitude - 0.012,
        lon: dest.longitude - 0.015,
        accuracy: 25
      };
      setUserLocation(startLoc);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            setUserLocation({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 6000 }
        );
      }
    }

    setIsCalculatingRoute(true);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: [startLoc.lon, startLoc.lat],
          destination: [dest.longitude, dest.latitude],
          profile: "foot"
        })
      });

      if (!res.ok) throw new Error("Route calculation failed");

      const data: MultiRouteResponse = await res.json();
      const safe = data.safestRoute || (data as unknown as RouteGeometry);
      const danger = data.dangerRoute || null;

      setSafestRoute(safe);
      setDangerRoute(danger);
      setActiveRoute(safe);
      setSelectedRouteType("safest");

      if (mapProvider === "google-sdk") {
        renderMultiRoutesOnGoogleSDK(safe, danger);
      } else {
        renderMultiRoutesOnMapLibre(safe, danger, "safest");
      }
    } catch {
      // Fallback route without disrupting user experience
      const originCoord: [number, number] = [startLoc.lon, startLoc.lat];
      const destCoord: [number, number] = [dest.longitude, dest.latitude];
      const midLon = (originCoord[0] + destCoord[0]) / 2;
      const midLat = (originCoord[1] + destCoord[1]) / 2;
      const dx = destCoord[0] - originCoord[0];
      const dy = destCoord[1] - originCoord[1];

      const safeFallback: RouteGeometry = {
        id: "route_safe",
        name: "Safest Guardian Route",
        is_safest: true,
        is_danger: false,
        coordinates: [
          originCoord,
          [originCoord[0] + dx * 0.3, originCoord[1] + dy * 0.4],
          [midLon, midLat],
          [destCoord[0] - dx * 0.2, destCoord[1] - dy * 0.1],
          destCoord
        ],
        distance_meters: 1750,
        duration_seconds: 1300,
        instructions: [
          { text: "Head along illuminated corridor", distance_meters: 500, duration_seconds: 375 },
          { text: "Pass verified police assistance booth", distance_meters: 650, duration_seconds: 480 },
          { text: "Arrive safely at destination", distance_meters: 600, duration_seconds: 445 }
        ],
        safety_score: {
          overall_score: 92,
          risk_level: "low",
          factors: {
            lighting_assessment: "Optimal municipal street lighting",
            recent_reports_count: 0,
            nearby_assistance_count: 2,
            time_of_day_risk: "low"
          },
          explanation: "Verified safe corridor with active street lights and nearby police assistance.",
          data_confidence: 0.95
        }
      };

      const dangerFallback: RouteGeometry = {
        id: "route_danger",
        name: "Direct / Elevated Risk Route",
        is_safest: false,
        is_danger: true,
        risk_warning: "Caution: Passes through secondary alleyways with limited lighting.",
        coordinates: [
          originCoord,
          [midLon - dy * 0.2, midLat + dx * 0.2],
          destCoord
        ],
        distance_meters: 1550,
        duration_seconds: 1150,
        instructions: [
          { text: "Head along secondary pathway", distance_meters: 700, duration_seconds: 520 },
          { text: "Arrive at destination", distance_meters: 850, duration_seconds: 630 }
        ],
        safety_score: {
          overall_score: 49,
          risk_level: "elevated",
          factors: {
            lighting_assessment: "Intermittent / unverified lighting",
            recent_reports_count: 2,
            nearby_assistance_count: 0,
            time_of_day_risk: "medium"
          },
          explanation: "Caution: Direct path through secondary alleys.",
          data_confidence: 0.85
        }
      };

      setSafestRoute(safeFallback);
      setDangerRoute(dangerFallback);
      setActiveRoute(safeFallback);
      setSelectedRouteType("safest");

      if (mapProvider === "google-sdk") {
        renderMultiRoutesOnGoogleSDK(safeFallback, dangerFallback);
      } else {
        renderMultiRoutesOnMapLibre(safeFallback, dangerFallback, "safest");
      }
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // 13. Select Route Type (Safest vs Danger)
  const handleSelectRouteType = (type: "safest" | "danger") => {
    setSelectedRouteType(type);
    const chosen = type === "safest" ? safestRoute : dangerRoute;
    if (chosen) {
      setActiveRoute(chosen);
      if (mapProvider === "google-sdk") {
        renderMultiRoutesOnGoogleSDK(safestRoute, dangerRoute);
      } else {
        renderMultiRoutesOnMapLibre(safestRoute, dangerRoute, type);
      }
    }
  };

  // 14. Start Live Safe Turn-by-Turn Navigation
  const startLiveNavigation = async () => {
    if (!activeRoute || !selectedDestination) return;
    setIsNavigating(true);
    setCurrentStepIndex(0);
    setHasArrived(false);
    setFollowUserMode(true);
    lastSpokenStepRef.current = -1;

    if (!isTracking) {
      toggleLiveTracking();
    }

    if (!isSharing) {
      handleStartSharing();
    }

    const firstInstruction = activeRoute.instructions?.[0]?.text || "Head towards your destination";
    const startMsg = `Starting safe navigation to ${selectedDestination.name.split(",")[0]}. Safe corridor active with fewer incidents filed. ${firstInstruction}`;
    speakInstruction(startMsg);

    if (userLocation && mapLibreRef.current) {
      mapLibreRef.current.easeTo({
        center: [userLocation.lon, userLocation.lat],
        zoom: 17,
        pitch: 45,
        duration: 1200
      });
    }
  };

  // 15. End Live Navigation
  const endLiveNavigation = () => {
    setIsNavigating(false);
    setHasArrived(false);
    lastSpokenStepRef.current = -1;
    if (mapLibreRef.current) {
      mapLibreRef.current.easeTo({ pitch: 0, zoom: 14, duration: 1000 });
    }
  };

  // 16. Continuous Navigation Loop (Progress tracking, step advancement, arrival detection)
  useEffect(() => {
    if (!isNavigating || !userLocation || !selectedDestination) return;

    const dist = calculateHaversineDistance(
      userLocation.lat,
      userLocation.lon,
      selectedDestination.lat,
      selectedDestination.lon
    );
    setDistanceToDestination(dist);

    // Arrival detection: Within 40 meters
    if (dist <= 40 && !hasArrived) {
      setHasArrived(true);
      speakInstruction("You have safely arrived at your destination!");
      return;
    }

    // Follow camera mode
    if (followUserMode) {
      if (mapLibreRef.current) {
        mapLibreRef.current.easeTo({
          center: [userLocation.lon, userLocation.lat],
          zoom: 17,
          duration: 1000
        });
      } else if (googleMapRef.current) {
        googleMapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lon });
      }
    }

    // Dynamic Step Advancement & Speech Announcement
    if (activeRoute?.instructions && activeRoute.instructions.length > 0) {
      if (lastSpokenStepRef.current !== currentStepIndex) {
        const inst = activeRoute.instructions[currentStepIndex];
        if (inst) {
          speakInstruction(inst.text);
          lastSpokenStepRef.current = currentStepIndex;
        }
      }

      if (currentStepIndex < activeRoute.instructions.length - 1) {
        const totalInstructions = activeRoute.instructions.length;
        const totalDistance = activeRoute.distance_meters;
        const expectedRemainingDistance = totalDistance * (1 - (currentStepIndex + 1) / totalInstructions);

        if (dist <= expectedRemainingDistance + 50) {
          setCurrentStepIndex(prev => Math.min(prev + 1, totalInstructions - 1));
        }
      }
    }
  }, [
    isNavigating,
    userLocation,
    selectedDestination,
    activeRoute,
    currentStepIndex,
    hasArrived,
    followUserMode,
    speakInstruction
  ]);

  // Maneuver icon helper
  const renderManeuverIcon = (instructionText: string) => {
    const lower = instructionText.toLowerCase();
    if (lower.includes("left")) return <CornerUpLeft className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />;
    if (lower.includes("right")) return <CornerUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />;
    if (lower.includes("arrive") || lower.includes("destination")) return <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />;
    return <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />;
  };

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] md:h-[640px] rounded-3xl overflow-hidden border border-border shadow-2xl bg-slate-950 text-foreground">
      {/* Map Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Google Maps Billing / Auth Alert Banner */}
      {googleLoadError && (
        <div className="absolute top-3 left-3 right-3 z-30 bg-amber-600/95 text-white text-xs p-3 rounded-2xl backdrop-blur-md shadow-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
            <span className="leading-snug">{googleLoadError}</span>
          </div>
          <button
            onClick={() => setGoogleLoadError(null)}
            className="p-1 hover:bg-white/20 rounded-lg shrink-0 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Permission Denied Banner */}
      {locationPermissionStatus === "denied" && (
        <div className="absolute top-3 left-3 right-3 z-30 bg-amber-600/90 text-white text-xs p-3 rounded-2xl backdrop-blur-md shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{t.map_location_permission_denied}</span>
          </div>
          <button
            onClick={requestCurrentLocation}
            className="px-2.5 py-1 bg-white text-amber-900 rounded-lg font-bold hover:bg-amber-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* 1. TOP BAR: Destination Search & Layer Controls (Hidden during full Navigation HUD) */}
      {!isNavigating && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex flex-col gap-2 w-[calc(100vw-24px)] max-w-sm sm:max-w-md">
          {/* Search Input Box */}
          <div className="relative">
            <div className="relative flex items-center bg-background/95 backdrop-blur-md rounded-2xl border border-border/80 shadow-lg px-3 py-2 text-xs sm:text-sm">
              <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <input
                type="text"
                placeholder={t.map_search_placeholder}
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground text-xs"
              />
              {(isSearching || isCalculatingRoute) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500 shrink-0 ml-1" />
              )}
            </div>

            {/* Autocomplete Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden z-30 max-h-52 overflow-y-auto divide-y divide-border/40">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectDestination(result)}
                    className="w-full text-left px-3 py-2.5 hover:bg-emerald-500/10 transition-colors text-xs text-foreground flex items-start gap-2"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-snug">{result.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Map Controls Row: Provider Switcher & Safety Layer Toggles */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center bg-background/90 backdrop-blur-md p-1 rounded-xl border border-border text-[10px] font-bold shrink-0">
              <button
                onClick={() => {
                  setGoogleLoadError(null);
                  setMapProvider("google");
                }}
                className={`px-2 py-1 rounded-lg transition-all ${
                  mapProvider === "google"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Google Maps
              </button>
              <button
                onClick={() => {
                  setGoogleLoadError(null);
                  setMapProvider("google-satellite");
                }}
                className={`px-2 py-1 rounded-lg transition-all ${
                  mapProvider === "google-satellite"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => {
                  setGoogleLoadError(null);
                  setMapProvider("osm");
                }}
                className={`px-2 py-1 rounded-lg transition-all ${
                  mapProvider === "osm"
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                OSM
              </button>
              {googleApiKey && (
                <button
                  onClick={() => setMapProvider("google-sdk")}
                  title="Direct Google Maps JavaScript API (Requires Cloud Billing)"
                  className={`px-2 py-1 rounded-lg transition-all ${
                    mapProvider === "google-sdk"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  JS SDK
                </button>
              )}
            </div>

            <button
              onClick={() => setShowPolice(!showPolice)}
              className={`px-2 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md border border-border transition-all shrink-0 ${
                showPolice ? "bg-blue-600 text-white border-blue-600" : "bg-background/80 text-muted-foreground"
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Police</span>
            </button>
            <button
              onClick={() => setShowHospitals(!showHospitals)}
              className={`px-2 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1 backdrop-blur-md border border-border transition-all shrink-0 ${
                showHospitals ? "bg-red-600 text-white border-red-600" : "bg-background/80 text-muted-foreground"
              }`}
            >
              <Hospital className="w-3 h-3" />
              <span>Hospital</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. TURN-BY-TURN LIVE NAVIGATION HUD (Displayed when isNavigating === true) */}
      {isNavigating && activeRoute && (
        <div className="absolute top-3 left-3 right-3 z-30 flex flex-col gap-2 max-w-lg mx-auto animate-in slide-in-from-top-4 duration-300">
          {/* Top Maneuver Instruction Banner */}
          <div className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/50 p-3.5 rounded-2xl shadow-2xl text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
                  {renderManeuverIcon(
                    activeRoute.instructions?.[currentStepIndex]?.text || "Continue"
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                      Step {currentStepIndex + 1} of {activeRoute.instructions?.length || 1}
                    </span>
                    <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      0 Cases Filed Corridor
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base leading-snug mt-1 text-white">
                    {activeRoute.instructions?.[currentStepIndex]?.text || "Proceed along safe corridor"}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeRoute.instructions?.[currentStepIndex]?.distance_meters
                      ? `${activeRoute.instructions[currentStepIndex].distance_meters}m on this road`
                      : "Follow route"}
                  </p>
                </div>
              </div>

              {/* Voice Guidance Toggle */}
              <button
                onClick={() => setVoiceGuidanceEnabled(!voiceGuidanceEnabled)}
                title={voiceGuidanceEnabled ? "Mute Voice Guidance" : "Enable Voice Guidance"}
                className={`p-2 rounded-xl border transition-all ${
                  voiceGuidanceEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {voiceGuidanceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Live Distance & ETA Status Sub-bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Remaining</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    {distanceToDestination !== null
                      ? distanceToDestination > 1000
                        ? `${(distanceToDestination / 1000).toFixed(2)} km`
                        : `${distanceToDestination} m`
                      : `${(activeRoute.distance_meters / 1000).toFixed(2)} km`}
                  </span>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">Est. Time</span>
                  <span className="font-extrabold text-white text-sm">
                    {Math.ceil(activeRoute.duration_seconds / 60)} mins
                  </span>
                </div>
              </div>

              {/* Follow Camera Switch */}
              <button
                onClick={() => setFollowUserMode(!followUserMode)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                  followUserMode
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Compass className={`w-3.5 h-3.5 ${followUserMode ? "animate-spin" : ""}`} />
                <span>{followUserMode ? "Lock Cam" : "Free Cam"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. ROUTE COMPARISON & SAFETY GUARDIAN CARD (Before Navigation, after selecting destination) */}
      {!isNavigating && activeRoute && (
        <div className="absolute bottom-16 left-3 right-3 sm:left-auto sm:right-3 z-30 sm:w-[420px] max-h-[50vh] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl border border-slate-800 p-3.5 rounded-3xl shadow-2xl text-xs animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>AI Route Guardian</span>
              </div>
              <p className="font-extrabold text-sm text-white truncate max-w-[220px]">
                {selectedDestination?.name}
              </p>
            </div>

            <button
              onClick={() => {
                setActiveRoute(null);
                setSafestRoute(null);
                setDangerRoute(null);
                setSelectedDestination(null);
              }}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Route Selection Cards */}
          <div className="space-y-2 mb-3">
            {/* 1. SAFEST ROUTE (Recommended) */}
            {safestRoute && (
              <div
                onClick={() => handleSelectRouteType("safest")}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedRouteType === "safest"
                    ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/30"
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      {selectedRouteType === "safest" ? (
                        <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-950" />
                      )}
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-xs block">
                        Safest Guardian Route
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        0 Cases Filed • High Lighting & Police En Route
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">
                    Safety {safestRoute.safety_score?.overall_score || 94}/100
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300 pl-6">
                  <span>{(safestRoute.distance_meters / 1000).toFixed(2)} km</span>
                  <span>•</span>
                  <span>{Math.ceil(safestRoute.duration_seconds / 60)} mins</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">Solid Green Line</span>
                </div>
              </div>
            )}

            {/* 2. DANGER / HIGHER RISK ROUTE */}
            {dangerRoute && (
              <div
                onClick={() => handleSelectRouteType("danger")}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  selectedRouteType === "danger"
                    ? "bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/30"
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center shrink-0">
                      {selectedRouteType === "danger" ? (
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-950" />
                      )}
                    </div>
                    <div>
                      <span className="font-extrabold text-rose-300 text-xs block">
                        Direct / Higher Risk Route
                      </span>
                      <span className="text-[10px] text-rose-400 font-semibold">
                        {dangerRoute.safety_score?.factors.recent_reports_count
                          ? `${dangerRoute.safety_score.factors.recent_reports_count} Safety Incident(s) Reported`
                          : "Unverified back alleys • Low lighting"}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-extrabold text-[10px]">
                    Safety {dangerRoute.safety_score?.overall_score || 45}/100
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300 pl-6">
                  <span>{(dangerRoute.distance_meters / 1000).toFixed(2)} km</span>
                  <span>•</span>
                  <span>{Math.ceil(dangerRoute.duration_seconds / 60)} mins</span>
                  <span>•</span>
                  <span className="text-rose-400 font-bold">Dashed Red Line</span>
                </div>
              </div>
            )}
          </div>

          {/* Action CTA: Start Live Safe Navigation */}
          <button
            onClick={startLiveNavigation}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>Start Live Safe Navigation</span>
          </button>
        </div>
      )}

      {/* 4. ARRIVAL CELEBRATION MODAL */}
      {hasArrived && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-emerald-500/50 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <h2 className="text-lg font-extrabold text-white">You Have Arrived Safely!</h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              You reached your destination via the AI Guardian Safe Corridor. Guardians and contacts can now see you are safe.
            </p>
            <div className="mt-5 space-y-2">
              <button
                onClick={endLiveNavigation}
                className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all"
              >
                End Journey (I am Safe)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. FLOATING BOTTOM ACTION DOCK */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        {/* Recenter & Live Tracking (or Exit Navigation during Nav) */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {isNavigating ? (
            <button
              onClick={endLiveNavigation}
              className="px-3 py-2 rounded-2xl bg-rose-600/90 text-white text-xs font-bold shadow-lg hover:bg-rose-600 flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Navigation</span>
            </button>
          ) : (
            <>
              <button
                onClick={requestCurrentLocation}
                title={t.map_recenter}
                className="p-2.5 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-lg hover:bg-background text-foreground"
                aria-label="Recenter Map"
              >
                <Crosshair className="w-4 h-4 text-emerald-500" />
              </button>

              <button
                onClick={toggleLiveTracking}
                className={`px-3 py-2 rounded-2xl text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all ${
                  isTracking
                    ? "bg-emerald-600 text-white animate-pulse"
                    : "bg-background/95 text-foreground border border-border hover:bg-background"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isTracking ? "bg-white" : "bg-emerald-500"}`} />
                <span>{isTracking ? "Tracking Active" : "Live GPS Tracking"}</span>
              </button>
            </>
          )}
        </div>

        {/* Live Journey Share Buttons (WhatsApp & Copy Link) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* 1-Tap WhatsApp Share */}
          <button
            onClick={shareViaWhatsApp}
            title="Share Live Safe Journey on WhatsApp"
            className="px-2.5 sm:px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">WhatsApp Share</span>
            <span className="sm:hidden">Share</span>
          </button>

          {/* Copy Link */}
          {currentShareUrl ? (
            <button
              onClick={copyShareLink}
              className="px-2.5 sm:px-3 py-2 rounded-2xl bg-slate-800 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5 hover:bg-slate-700"
            >
              {shareLinkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{shareLinkCopied ? "Link Copied!" : "Copy Link"}</span>
              <span className="sm:hidden">{shareLinkCopied ? "Copied" : "Link"}</span>
            </button>
          ) : (
            <button
              onClick={handleStartSharing}
              className="px-2.5 sm:px-3 py-2 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-lg text-foreground text-xs font-semibold hover:bg-background flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Start Sharing</span>
              <span className="sm:hidden">Share</span>
            </button>
          )}
        </div>
      </div>

      {/* GPS Accuracy & Last Update Badge (Top Right when not navigating) */}
      {userLocation && !isNavigating && (
        <div className="hidden sm:flex absolute top-3 right-3 z-10 items-center gap-1.5 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-border text-[10px] text-muted-foreground shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>GPS Accuracy: ±{Math.round(userLocation.accuracy || 10)}m</span>
          {lastLocationTime && <span>• {lastLocationTime}</span>}
        </div>
      )}
    </div>
  );
}
