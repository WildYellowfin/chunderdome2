"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { CLAY_HOUSE } from "@/lib/trip";
import { mapStyle } from "@/lib/mapStyle";
import { clayHouseMarker } from "./PickupMap";

export interface Pin {
  name: string;
  lat: number;
  lng: number;
  driver: boolean;
  seats?: number;
  sub: string;
}

// Everyone's pickup pin: drivers as ink squares with their seat count, riders as red dots.
export default function AdminMap({ pins }: { pins: Pin[] }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let m: import("maplibre-gl").Map | null = null;
    let cancelled = false;
    (async () => {
      const ml = (await import("maplibre-gl")).default;
      if (cancelled || !box.current) return;
      m = new ml.Map({
        container: box.current,
        style: mapStyle,
        center: [CLAY_HOUSE.lng, CLAY_HOUSE.lat],
        zoom: 12,
        attributionControl: false,
        dragRotate: false,
        cooperativeGestures: true,
      });
      m.touchZoomRotate.disableRotation();
      m.addControl(new ml.AttributionControl({ compact: true, customAttribution: "OpenFreeMap © OpenStreetMap" }), "bottom-left");
      m.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      new ml.Marker({ element: clayHouseMarker(), anchor: "bottom-left", offset: [-7, 7] }).setLngLat([CLAY_HOUSE.lng, CLAY_HOUSE.lat]).addTo(m);

      const bounds = new ml.LngLatBounds([CLAY_HOUSE.lng, CLAY_HOUSE.lat], [CLAY_HOUSE.lng, CLAY_HOUSE.lat]);
      // Pins share ~100 m cells, so fan out exact duplicates a little.
      const seen = new Map<string, number>();
      for (const p of [...pins].sort((a, b) => Number(a.driver) - Number(b.driver))) {
        const k = `${p.lat},${p.lng}`;
        const n = seen.get(k) ?? 0;
        seen.set(k, n + 1);
        const el = document.createElement("button");
        el.type = "button";
        el.className = p.driver ? "mk-driver" : "mk-rider";
        el.textContent = p.driver ? String(p.seats ?? "") : "";
        el.setAttribute("aria-label", `${p.name}, ${p.sub}`);
        const popup = new ml.Popup({ offset: 14, closeButton: false, className: "mk-pop" });
        const strong = document.createElement("strong");
        strong.textContent = p.name;
        const sub = document.createElement("span");
        sub.textContent = p.sub;
        const wrap = document.createElement("div");
        wrap.append(strong, sub);
        popup.setDOMContent(wrap);
        const off = n ? [Math.cos(n * 2.1) * 9 * Math.ceil(n / 6), Math.sin(n * 2.1) * 9 * Math.ceil(n / 6)] : [0, 0];
        new ml.Marker({ element: el, offset: off as [number, number] }).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(m);
        bounds.extend([p.lng, p.lat]);
      }
      if (pins.length) m.fitBounds(bounds, { padding: 40, maxZoom: 14, duration: 0 });
    })();
    return () => {
      cancelled = true;
      m?.remove();
    };
  }, [pins]);

  return (
    <div className="amap">
      <div ref={box} className="amap-canvas" />
      <div className="amap-key mono">
        <span><i className="mk-driver" />Driver · seats</span>
        <span><i className="mk-rider" />Needs a seat</span>
      </div>
    </div>
  );
}
