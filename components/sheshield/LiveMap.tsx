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
  Info,
  Map as MapIcon,
  Layers
} from "lucide-react";
import { SupportedLanguage, RouteGeometry, AssistanceResource } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";

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

export function LiveMap({ currentLang, onShareSessionCreated }: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapLibreRef = useRef<maplibregl.Map | null>(null);
  const googleMapRef = useRef<any | null>(null);
  const googleUserMarkerRef = useRef<any | null>(null);
  const googleRouteLineRef = useRef<any | null>(null);
  const googleResourceMarkersRef = useRef<any[]>([]);

  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const t = getTranslation(currentLang);

  // Map Provider State: 'google' or 'maplibre'
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapProvider, setMapProvider] = useState<"google" | "maplibre">(
    googleApiKey ? "google" : "maplibre"
  );
  const [googleLoadError, setGoogleLoadError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Geolocation & Tracking State
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [lastLocationTime, setLastLocationTime] = useState<string | null>(null);

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
  const [showIncidents, setShowIncidents] = useState(true);

  // Share Journey State & Active Session ID (Critical fix for live tracking!)
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

  // 2. Load Google Maps script when provider is google
  const loadGoogleScript = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (window.google && window.google.maps) return true;
    if (!googleApiKey) return false;

    return new Promise((resolve) => {
      // Capture auth failure callback
      window.gm_authFailure = () => {
        console.warn("[SheShield] Google Maps API auth failure. Falling back to MapLibre.");
        setGoogleLoadError("Google Maps Demo Key requires billing authorization. Switched to OpenStreetMap.");
        setMapProvider("maplibre");
        resolve(false);
      };

      const existingScript = document.getElementById("google-maps-script");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn("Failed to load Google Maps script");
        setGoogleLoadError("Could not load Google Maps script. Switched to OpenStreetMap.");
        setMapProvider("maplibre");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }, [googleApiKey]);

  // 3. Initialize Map based on mapProvider
  useEffect(() => {
    if (!mapContainer.current) return;
    let isCancelled = false;

    async function initMap() {
      setIsMapReady(false);
      const defaultCenter = userLocation
        ? { lat: userLocation.lat, lng: userLocation.lon }
        : { lat: 28.6139, lng: 77.209 };

      if (mapProvider === "google") {
        const loaded = await loadGoogleScript();
        if (isCancelled) return;

        if (loaded && window.google && window.google.maps) {
          try {
            // Cleanup MapLibre if previously active
            if (mapLibreRef.current) {
              mapLibreRef.current.remove();
              mapLibreRef.current = null;
            }

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
            return;
          } catch (e: any) {
            console.warn("Google Maps initialization exception:", e.message);
            setMapProvider("maplibre");
          }
        } else {
          setMapProvider("maplibre");
        }
      }

      // MapLibre Initialization
      if (mapProvider === "maplibre") {
        if (googleMapRef.current) {
          googleMapRef.current = null;
        }

        const mapStyle =
          process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
          "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

        const map = new maplibregl.Map({
          container: mapContainer.current!,
          style: mapStyle,
          center: [defaultCenter.lng, defaultCenter.lat],
          zoom: 14
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

        map.on("load", () => {
          if (!isCancelled) {
            mapLibreRef.current = map;
            setIsMapReady(true);
          }
        });
      }
    }

    initMap();

    return () => {
      isCancelled = true;
    };
  }, [mapProvider, loadGoogleScript]);

  // 4. Update Markers on User Location Changes
  useEffect(() => {
    if (!userLocation) return;
    const { lat, lon } = userLocation;

    // Google Maps User Marker
    if (mapProvider === "google" && googleMapRef.current && window.google?.maps) {
      if (!googleUserMarkerRef.current) {
        googleUserMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng: lon },
          map: googleMapRef.current,
          title: "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#e11d48",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5
          }
        });
      } else {
        googleUserMarkerRef.current.setPosition({ lat, lng: lon });
      }
    }

    // MapLibre User Marker
    if (mapProvider === "maplibre" && mapLibreRef.current) {
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
          .setLngLat([lon, lat])
          .addTo(mapLibreRef.current);
      } else {
        userMarkerRef.current.setLngLat([lon, lat]);
      }
    }
  }, [userLocation, mapProvider]);

  // 5. Update Assistance Markers (Police & Hospitals)
  useEffect(() => {
    if (!isMapReady) return;

    // Google Maps Assistance Markers
    if (mapProvider === "google" && googleMapRef.current && window.google?.maps) {
      // Clear old markers
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
              ${res.phone_number ? `<a href="tel:${res.phone_number}" style="color:#e11d48;font-weight:bold;">Call: ${res.phone_number}</a>` : ""}
            </div>
          `
        });

        marker.addListener("click", () => {
          infoWindow.open(googleMapRef.current, marker);
        });

        googleResourceMarkersRef.current.push(marker);
      });
    }

    // MapLibre Assistance Markers
    if (mapProvider === "maplibre" && mapLibreRef.current) {
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

  // 6. Request Current Device Location
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

        // Recenter Google Map
        if (mapProvider === "google" && googleMapRef.current) {
          googleMapRef.current.panTo({ lat: latitude, lng: longitude });
          googleMapRef.current.setZoom(15);
        }

        // Recenter MapLibre
        if (mapProvider === "maplibre" && mapLibreRef.current) {
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

  // 7. Start / Stop Live GPS Tracking (With session synchronization!)
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
          setLastLocationTime(new Date().toLocaleTimeString());

          // Send coordinates to backend with active session ID if sharing is active
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
  };

  // 8. Start / Stop Live Sharing Session (Generates real shareable link)
  const handleStartSharing = async () => {
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

        // Ensure tracking is active immediately
        if (!isTracking) {
          toggleLiveTracking();
        }

        // Push initial coordinate
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
  };

  const copyShareLink = () => {
    if (currentShareUrl) {
      navigator.clipboard.writeText(currentShareUrl);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 3000);
    }
  };

  // 9. Destination Search & Route Planning
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

    if (!userLocation) {
      alert("Please allow current location to calculate a walking route.");
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

      if (!res.ok) throw new Error("Route calculation failed");

      const route: RouteGeometry = await res.json();
      setActiveRoute(route);

      // Render on Google Maps
      if (mapProvider === "google" && googleMapRef.current && window.google?.maps) {
        if (googleRouteLineRef.current) {
          googleRouteLineRef.current.setMap(null);
        }

        const path = route.coordinates.map(coord => ({
          lat: coord[1],
          lng: coord[0]
        }));

        googleRouteLineRef.current = new window.google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: "#e11d48",
          strokeOpacity: 0.9,
          strokeWeight: 5,
          map: googleMapRef.current
        });

        const bounds = new window.google.maps.LatLngBounds();
        path.forEach(pt => bounds.extend(pt));
        googleMapRef.current.fitBounds(bounds);
      }

      // Render on MapLibre
      if (mapProvider === "maplibre" && mapLibreRef.current) {
        const map = mapLibreRef.current;
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
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#e11d48",
            "line-width": 5,
            "line-opacity": 0.85
          }
        });

        const bounds = new maplibregl.LngLatBounds();
        route.coordinates.forEach(c => bounds.extend(c));
        map.fitBounds(bounds, { padding: 40 });
      }
    } catch (err: any) {
      alert(err.message || "Failed to calculate route");
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  return (
    <div className="relative w-full h-[440px] sm:h-[540px] md:h-[620px] rounded-3xl overflow-hidden border border-border shadow-xl bg-slate-900 text-foreground">
      {/* Map Canvas */}
      <div ref={mapContainer} className="w-full h-full" />

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

      {/* Top Floating Bar: Provider Switcher & Destination Search */}
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
            {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500 shrink-0 ml-1" />}
          </div>

          {/* Autocomplete Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden z-30 max-h-52 overflow-y-auto divide-y divide-border/40">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectDestination(result)}
                  className="w-full text-left px-3 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-xs text-foreground flex items-start gap-2"
                >
                  <Navigation className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-snug">{result.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Map Controls Row: Provider Switcher & Safety Layer Toggles */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* Provider Pill */}
          <div className="flex items-center bg-background/90 backdrop-blur-md p-1 rounded-xl border border-border text-[10px] font-bold shrink-0">
            <button
              onClick={() => setMapProvider("google")}
              className={`px-2 py-1 rounded-lg transition-all ${
                mapProvider === "google"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Google Maps
            </button>
            <button
              onClick={() => setMapProvider("maplibre")}
              className={`px-2 py-1 rounded-lg transition-all ${
                mapProvider === "maplibre"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              OpenStreetMap
            </button>
          </div>

          {/* Layer toggles */}
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
            <span>24/7 Hospital</span>
          </button>
        </div>
      </div>

      {/* Floating Bottom Action Dock */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        {/* Recenter & Live Tracking */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={requestCurrentLocation}
            title={t.map_recenter}
            className="p-2.5 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-lg hover:bg-background text-foreground"
            aria-label="Recenter Map"
          >
            <Crosshair className="w-4 h-4 text-rose-600" />
          </button>

          <button
            onClick={toggleLiveTracking}
            className={`px-3 py-2 rounded-2xl text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all ${
              isTracking
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-background/95 text-foreground border border-border hover:bg-background"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isTracking ? "bg-white" : "bg-emerald-500"}`} />
            <span>{isTracking ? "Stop Tracking" : "Live GPS Tracking"}</span>
          </button>
        </div>

        {/* Live Journey Share Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {currentShareUrl ? (
            <button
              onClick={copyShareLink}
              className="px-3 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-semibold shadow-lg flex items-center gap-1.5"
            >
              {shareLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{shareLinkCopied ? "Link Copied!" : "Copy Link"}</span>
              <span className="sm:hidden">{shareLinkCopied ? "Copied" : "Share"}</span>
            </button>
          ) : (
            <button
              onClick={handleStartSharing}
              className="px-3 py-2 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-lg text-foreground text-xs font-semibold hover:bg-background flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Share Journey</span>
              <span className="sm:hidden">Share</span>
            </button>
          )}
        </div>
      </div>

      {/* GPS Accuracy & Last Update Badge (Top Right) */}
      {userLocation && (
        <div className="hidden sm:flex absolute top-3 right-3 z-10 items-center gap-1.5 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-border text-[10px] text-muted-foreground shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>GPS Accuracy: ±{Math.round(userLocation.accuracy || 10)}m</span>
          {lastLocationTime && <span>• {lastLocationTime}</span>}
        </div>
      )}

      {/* Active Route & Predictive Safety Assessment Card */}
      {activeRoute && (
        <div className="absolute bottom-16 left-3 right-3 sm:left-auto sm:right-3 z-30 sm:w-96 max-h-[45vh] overflow-y-auto bg-background/95 backdrop-blur-xl border border-border p-3.5 rounded-2xl shadow-2xl text-xs animate-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between border-b border-border/60 pb-2.5 mb-2">
            <div>
              <p className="font-bold text-xs sm:text-sm text-foreground">Safe Walking Route</p>
              <p className="text-muted-foreground text-[10px] sm:text-[11px] truncate max-w-[180px]">
                {selectedDestination?.name}
              </p>
            </div>
            {/* Safety Score Badge */}
            {activeRoute.safety_score && (
              <div
                className={`px-2 py-0.5 rounded-xl font-bold flex items-center gap-1 text-[10px] ${
                  activeRoute.safety_score.risk_level === "low"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : activeRoute.safety_score.risk_level === "moderate"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    : activeRoute.safety_score.risk_level === "insufficient_data"
                    ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>
                  {activeRoute.safety_score.risk_level === "insufficient_data"
                    ? "Standard Route"
                    : `Safety ${activeRoute.safety_score.overall_score}/100`}
                </span>
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-muted/50 p-1.5 rounded-xl text-center">
              <span className="text-[9px] text-muted-foreground uppercase font-medium">Distance</span>
              <p className="font-bold text-xs text-foreground">
                {(activeRoute.distance_meters / 1000).toFixed(2)} km
              </p>
            </div>
            <div className="bg-muted/50 p-1.5 rounded-xl text-center">
              <span className="text-[9px] text-muted-foreground uppercase font-medium">ETA</span>
              <p className="font-bold text-xs text-foreground">
                {Math.ceil(activeRoute.duration_seconds / 60)} mins
              </p>
            </div>
          </div>

          {/* Explainable Risk Factors */}
          {activeRoute.safety_score && (
            <div className="bg-muted/30 p-2 rounded-xl border border-border/50 text-[10px] space-y-1 mb-2">
              <div className="flex items-start gap-1 text-foreground/90">
                <Info className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                <p className="leading-snug">{activeRoute.safety_score.explanation}</p>
              </div>
            </div>
          )}

          {/* Next Navigation Instruction */}
          {activeRoute.instructions.length > 0 && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 pt-1">
              <Navigation className="w-3 h-3 text-rose-500 shrink-0" />
              <span className="truncate">{activeRoute.instructions[0].text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
