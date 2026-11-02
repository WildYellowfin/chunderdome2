"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MLMap } from "maplibre-gl";
import { CLAY_HOUSE, kmBetween, placeName } from "@/lib/trip";
import { mapStyle } from "@/lib/mapStyle";
import type { LatLng } from "@/lib/types";

// Round to ~100 m: close enough to plan a pickup, not someone's front door.
const round = (n: number) => Math.round(n * 1000) / 1000;
const miles = (km: number) => km * 0.621371;

export function clayHouseMarker() {
  const el = document.createElement("div");
  el.className = "mk-house";
  el.innerHTML = `<span class="mk-house-dot"></span><span class="mk-house-tag">${CLAY_HOUSE.name}</span>`;
  return el;
}

export default function PickupMap({ value, onChange }: { value: LatLng | null; onChange: (v: LatLng, area: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const armed = useRef(false); // ignore camera moves the person didn't make
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const [moving, setMoving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ml = (await import("maplibre-gl")).default;
      if (cancelled || !box.current) return;
      const start = value ?? CLAY_HOUSE;
      const m = new ml.Map({
        container: box.current,
        style: mapStyle,
        center: [start.lng, start.lat],
        // Default view: the whole peninsula, ocean to bay, Clay House in the middle.
        zoom: value ? 13.5 : 11,
        minZoom: 9,
        maxZoom: 17.5,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        cooperativeGestures: false,
      });
      m.touchZoomRotate.disableRotation();
      m.addControl(new ml.AttributionControl({ compact: true, customAttribution: '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>' }), "bottom-left");
      new ml.Marker({ element: clayHouseMarker(), anchor: "bottom-left", offset: [-7, 7] }).setLngLat([CLAY_HOUSE.lng, CLAY_HOUSE.lat]).addTo(m);

      m.on("error", (e) => {
        // Missing tiles or fonts: still usable, but say so if nothing loaded at all.
        if (!m.isStyleLoaded()) setFailed(true);
        console.warn(e.error);
      });
      // Only a move the person makes (or asks for) sets the pin.
      m.on("movestart", (e) => {
        if ((e as { originalEvent?: Event }).originalEvent) armed.current = true;
        if (armed.current) setMoving(true);
      });
      m.on("moveend", () => {
        setMoving(false);
        if (!armed.current) return;
        const c = m.getCenter();
        const v = { lat: round(c.lat), lng: round(c.lng) };
        changeRef.current(v, placeName(v));
      });
      map.current = m;
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // The map owns its camera after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        armed.current = true;
        map.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15, speed: 1.6 });
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  function home() {
    armed.current = true;
    map.current?.flyTo({ center: [CLAY_HOUSE.lng, CLAY_HOUSE.lat], zoom: 16, speed: 1.6 });
  }

  const dist = value ? miles(kmBetween(value, CLAY_HOUSE)) : null;
  const atHouse = dist !== null && dist < 0.08;

  return (
    <div className="pmap">
      <div className="pmap-stage">
        <div ref={box} className="pmap-canvas" />
        <div className={`pmap-pin ${moving ? "up" : ""} ${value ? "set" : ""}`} aria-hidden>
          <svg viewBox="0 0 40 52" width="40" height="52">
            <path d="M20 50 C20 50 4 31 4 19 A16 16 0 0 1 36 19 C36 31 20 50 20 50 Z" fill="#dd4326" stroke="#14161b" strokeWidth="3" strokeLinejoin="round" />
            <circle cx="20" cy="19" r="6" fill="#f7f0e2" stroke="#14161b" strokeWidth="2.5" />
          </svg>
          <span className="pmap-shadow" />
        </div>
        <div className="pmap-tools">
          <button type="button" onClick={locate} aria-label="Use my location" disabled={locating}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="4" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
          </button>
          <button type="button" onClick={home} aria-label="Back to Clay House">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"><path d="M3 11 12 4l9 7v9H3z" /><path d="M10 20v-5h4v5" /></svg>
          </button>
        </div>
        {failed && <div className="pmap-fail">The map didn&apos;t load. Check your connection and come back to this step.</div>}
      </div>
      <div className="pmap-read" aria-live="polite">
        {value ? (
          <>
            <span className="mono faint">Pick me up near</span>
            <strong className="d d-s">{atHouse ? CLAY_HOUSE.name : placeName(value)}</strong>
            <span className="mono">{atHouse ? "Right here" : `${dist!.toFixed(dist! < 10 ? 1 : 0)} mi from ${CLAY_HOUSE.name}`}</span>
          </>
        ) : (
          <>
            <span className="mono faint">Drag the map</span>
            <strong>Put the pin where you&apos;d like a ride from</strong>
          </>
        )}
      </div>
    </div>
  );
}
