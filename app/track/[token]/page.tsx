"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Suspense } from "react";
import { Shield, Clock, AlertTriangle, CheckCircle2, User, Phone, Loader2 } from "lucide-react";

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

  // Poll for live coordinates every 5 seconds while session is active
  useEffect(() => {
    if (!token) return;

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/location/share?token=${token}`);
        if (!res.ok) {
          const errData = await res.json();
          setError(errData.error || "Tracking session not found or expired");
          return;
        }

        const data = await res.json();
        setSession(data.session);
        setLatestLocation(data.latestLocation);
      } catch (e: any) {
        setError(e.message || "Failed to load live tracking session");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
    const interval = setInterval(fetchSession, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !latestLocation) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [latestLocation.longitude, latestLocation.latitude],
      zoom: 15
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const el = document.createElement("div");
    el.className = "relative flex items-center justify-center";
    el.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center">
        <div class="w-2 h-2 rounded-full bg-white"></div>
      </div>
      <div class="absolute -inset-2 rounded-full bg-rose-500/20 animate-ping pointer-events-none"></div>
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

  // Update marker position
  useEffect(() => {
    if (mapRef.current && userMarkerRef.current && latestLocation) {
      userMarkerRef.current.setLngLat([latestLocation.longitude, latestLocation.latitude]);
      mapRef.current.flyTo({ center: [latestLocation.longitude, latestLocation.latitude], zoom: 15 });
    }
  }, [latestLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-3">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-sm font-semibold">Connecting to SheShield Secure Tracking Session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Session Unavailable</h2>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        <Link
          href="/"
          className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700"
        >
          Return to SheShield Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white">
            <Shield className="w-5 h-5 fill-white/20" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">{session?.title || "Live Journey"}</h1>
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Protected Journey Active</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:112"
            className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Emergency 112</span>
          </a>
        </div>
      </header>

      {/* Map Body */}
      <div className="flex-1 relative w-full h-[calc(100vh-73px)]">
        <div ref={mapContainer} className="w-full h-full" />

        {latestLocation && (
          <div className="absolute bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 bg-background/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span>Current Position</span>
              <span className="text-[11px] text-muted-foreground font-mono">
                {new Date(latestLocation.recorded_at || Date.now()).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-muted-foreground font-mono text-[11px]">
              Lat: {latestLocation.latitude.toFixed(5)}, Lon: {latestLocation.longitude.toFixed(5)}
            </div>
            {latestLocation.accuracy && (
              <p className="text-[10px] text-emerald-600">
                GPS Accuracy: ±{Math.round(latestLocation.accuracy)}m
              </p>
            )}
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
