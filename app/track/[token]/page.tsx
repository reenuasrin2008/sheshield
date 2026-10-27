"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { maplibregl } from "@/lib/map/maplibre-init";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import { Shield, Clock, AlertTriangle, CheckCircle2, Phone, Loader2, Navigation, Crosshair } from "lucide-react";

function TrackViewer() {
  const params = useParams();
  const token = params?.token as string;

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [session, setSession] = useState<any | null>(null);
  const [latestLocation, setLatestLocation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<string>("");

  // Poll for live coordinates every 3 seconds while session is active
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/location/share?token=${token}`);
        if (!res.ok) {
          const errData = await res.json();
          if (isMounted) setError(errData.error || "Tracking session not found or expired");
          return;
        }

        const data = await res.json();
        if (isMounted) {
          setSession(data.session);
          setLatestLocation(data.latestLocation);
          setLastCheckTime(new Date().toLocaleTimeString());
        }
      } catch (e: any) {
        if (isMounted) setError(e.message || "Failed to load live tracking session");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSession();
    const interval = setInterval(fetchSession, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !latestLocation) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [latestLocation.longitude, latestLocation.latitude],
      zoom: 15
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    const el = document.createElement("div");
    el.className = "relative flex items-center justify-center";
    el.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-2xl flex items-center justify-center">
        <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
      </div>
      <div class="absolute -inset-2 rounded-full bg-rose-500/25 animate-ping pointer-events-none"></div>
    `;

    userMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([latestLocation.longitude, latestLocation.latitude])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latestLocation]);

  // Animate marker when coordinates update
  useEffect(() => {
    if (mapRef.current && userMarkerRef.current && latestLocation) {
      userMarkerRef.current.setLngLat([latestLocation.longitude, latestLocation.latitude]);
      mapRef.current.panTo([latestLocation.longitude, latestLocation.latitude], { duration: 1000 });
    }
  }, [latestLocation]);

  const recenter = () => {
    if (mapRef.current && latestLocation) {
      mapRef.current.flyTo({ center: [latestLocation.longitude, latestLocation.latitude], zoom: 16 });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-3 p-4 text-center">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-sm font-semibold">Connecting to SheShield Authorized Live Tracking Stream...</p>
        <p className="text-xs text-muted-foreground">Validating session cryptographic token</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Live Session Ended or Expired</h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">{error}</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-rose-600 text-white font-bold rounded-2xl text-xs hover:bg-rose-700 shadow-md transition-all"
        >
          Return to SheShield
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <h1 className="font-bold text-xs sm:text-sm leading-tight">{session?.title || "Live Journey"}</h1>
            <p className="text-[10px] sm:text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Authorized Live GPS Stream Active</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:112"
            className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 shadow-md shadow-red-600/20"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Emergency</span> 112
          </a>
        </div>
      </header>

      {/* Map Canvas */}
      <div className="flex-1 relative w-full h-[calc(100vh-61px)]">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Recenter Button */}
        <button
          onClick={recenter}
          className="absolute top-4 left-4 z-20 p-2.5 bg-background/95 backdrop-blur-md border border-border shadow-lg rounded-2xl text-foreground hover:bg-background"
          title="Recenter user location"
          aria-label="Recenter Map"
        >
          <Crosshair className="w-4 h-4 text-rose-600" />
        </button>

        {/* Live GPS Coordinates Card */}
        {latestLocation ? (
          <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-80 bg-background/95 backdrop-blur-xl border border-border p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 z-20">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span className="flex items-center gap-1.5 text-rose-600">
                <Navigation className="w-3.5 h-3.5 animate-pulse" />
                Live Tracking Active
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date(latestLocation.recordedAt || latestLocation.recorded_at || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-muted-foreground font-mono text-[11px] bg-muted/40 p-2 rounded-xl border border-border/50">
              Lat: {Number(latestLocation.latitude).toFixed(5)}, Lon: {Number(latestLocation.longitude).toFixed(5)}
              {latestLocation.accuracy && (
                <p className="text-[10px] text-emerald-600 font-sans mt-0.5 font-medium">
                  GPS Accuracy: ±{Math.round(latestLocation.accuracy)}m
                </p>
              )}
            </div>

            <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-0.5">
              <span>Stream: Real-time refresh</span>
              <span>Updated: {lastCheckTime}</span>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:w-80 bg-background/95 backdrop-blur-xl border border-border p-3 rounded-2xl shadow-2xl text-xs z-20 text-muted-foreground text-center">
            Waiting for first coordinate transmission from device...
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <TrackViewer />
    </Suspense>
  );
}
