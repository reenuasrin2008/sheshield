"use client";

import { useEffect, useRef } from "react";

interface MotionSOSListenerProps {
  enabled: boolean;
  sensitivity?: number; // default: 18
  onShakeDetected: () => void;
}

export function MotionSOSListener({
  enabled,
  sensitivity = 18,
  onShakeDetected
}: MotionSOSListenerProps) {
  const lastShakeTimeRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);
  const lastZRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      return;
    }

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const current = e.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;

      const deltaX = Math.abs(current.x - lastXRef.current);
      const deltaY = Math.abs(current.y - lastYRef.current);
      const deltaZ = Math.abs(current.z - lastZRef.current);

      lastXRef.current = current.x;
      lastYRef.current = current.y;
      lastZRef.current = current.z;

      const totalDelta = deltaX + deltaY + deltaZ;
      const now = Date.now();

      // Enforce 10-second cooldown between shake activations
      if (totalDelta > sensitivity && now - lastShakeTimeRef.current > 10000) {
        lastShakeTimeRef.current = now;
        console.info("[SheShield Motion] Rapid shake detected with magnitude:", totalDelta);
        onShakeDetected();
      }
    };

    window.addEventListener("devicemotion", handleDeviceMotion);
    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
    };
  }, [enabled, sensitivity, onShakeDetected]);

  return null;
}
