import * as maplibregl from "maplibre-gl";

/**
 * Configure MapLibre GL JS Web Worker URL.
 * In Next.js with Turbopack, default relative resolution of worker chunk fails.
 * We point workerUrl to the local same-origin static script in public/maplibre-gl-worker.mjs.
 */
if (typeof window !== "undefined") {
  try {
    maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
  } catch (err) {
    console.warn("Could not set MapLibre workerUrl:", err);
  }
}

export { maplibregl };
export default maplibregl;
