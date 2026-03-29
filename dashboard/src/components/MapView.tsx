"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import type { Sensor, Drone, CCTV, Alert } from "@/data/mockData";
import { MAP_CENTER, MAP_ZOOM, THAILAND_OUTLINE, MYANMAR_BORDER } from "@/data/mockData";

// สร้างวงกลม GeoJSON จากจุดศูนย์กลาง + รัศมี (กิโลเมตร)
function createCircleGeoJSON(center: [number, number], radiusKm: number, points = 64) {
  const coords: [number, number][] = [];
  const kmPerDegreeLat = 111.32;
  const kmPerDegreeLng = 111.32 * Math.cos((center[1] * Math.PI) / 180);
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = (radiusKm * Math.cos(angle)) / kmPerDegreeLng;
    const dy = (radiusKm * Math.sin(angle)) / kmPerDegreeLat;
    coords.push([center[0] + dx, center[1] + dy]);
  }
  return coords;
}

export interface DroneAnimation {
  droneId: string;
  from: [number, number]; // [lng, lat]
  to: [number, number];
  durationMs: number;
}

interface MapViewProps {
  sensors: Sensor[];
  drones: Drone[];
  cctvs: CCTV[];
  alerts: Alert[];
  filters: { drone: boolean; sensor: boolean; cctv: boolean };
  dispatchLine: { from: [number, number]; to: [number, number] } | null;
  droneAnimation: DroneAnimation | null;
  onDroneArrived?: () => void;
  onCCTVClick?: (cctv: CCTV) => void;
  onMapReady?: (map: maplibregl.Map) => void;
}

export default function MapView({
  sensors, drones, cctvs, alerts, filters, dispatchLine,
  droneAnimation, onDroneArrived, onCCTVClick, onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  // เก็บตำแหน่งฐานเริ่มต้นของโดรน — รัศมีจะอ้างอิงจุดนี้เสมอ ไม่ย้ายตามโดรน
  const droneBasesRef = useRef<Map<string, { lng: number; lat: number }>>(new Map());
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const droneMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const animFrameRef = useRef<number>(0);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    droneMarkersRef.current.forEach((m) => m.remove());
    droneMarkersRef.current.clear();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "dark-tiles": {
            type: "raster",
            tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"],
            tileSize: 256,
            attribution: "&copy; CARTO",
          },
        },
        layers: [
          { id: "dark-base", type: "raster", source: "dark-tiles" },
        ],
      },
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      attributionControl: false,
    });

    m.on("load", () => {
      // === Thailand outline (ทุกชายแดน: พม่า ลาว กัมพูชา มาเลเซีย + ชายฝั่ง) ===
      m.addSource("thailand-outline", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [THAILAND_OUTLINE] },
        },
      });
      // Fill ฝั่งไทย (โปร่งใสเล็กน้อย เพื่อให้เห็นขอบเขต)
      m.addLayer({
        id: "thailand-fill",
        type: "fill",
        source: "thailand-outline",
        paint: { "fill-color": "#00e676", "fill-opacity": 0.03 },
      });
      // เส้นขอบประเทศ (ทุกด้าน)
      m.addLayer({
        id: "thailand-border-glow",
        type: "line",
        source: "thailand-outline",
        paint: { "line-color": "#4fc3f7", "line-width": 5, "line-opacity": 0.15, "line-blur": 4 },
      });
      m.addLayer({
        id: "thailand-border-line",
        type: "line",
        source: "thailand-outline",
        paint: { "line-color": "#4fc3f7", "line-width": 1.2, "line-opacity": 0.5, "line-dasharray": [6, 4] },
      });

      // === Myanmar border highlight (เน้นเส้นชายแดนเมียนมาเขียวสว่าง) ===
      m.addSource("myanmar-border", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: MYANMAR_BORDER },
        },
      });
      m.addLayer({
        id: "myanmar-border-glow",
        type: "line",
        source: "myanmar-border",
        paint: { "line-color": "#00e676", "line-width": 8, "line-opacity": 0.2, "line-blur": 6 },
      });
      m.addLayer({
        id: "myanmar-border-line",
        type: "line",
        source: "myanmar-border",
        paint: { "line-color": "#00e676", "line-width": 2, "line-opacity": 0.8, "line-dasharray": [4, 4] },
      });

      // Dispatch line source
      m.addSource("dispatch-line", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "dispatch-line-glow",
        type: "line",
        source: "dispatch-line",
        paint: { "line-color": "#ff1744", "line-width": 6, "line-opacity": 0.3, "line-blur": 4 },
      });
      m.addLayer({
        id: "dispatch-line-main",
        type: "line",
        source: "dispatch-line",
        paint: { "line-color": "#ff1744", "line-width": 2, "line-opacity": 0.9, "line-dasharray": [6, 4] },
      });

      // Dispatch trail (animated drone path so far)
      m.addSource("dispatch-trail", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "dispatch-trail-line",
        type: "line",
        source: "dispatch-trail",
        paint: { "line-color": "#ff9100", "line-width": 3, "line-opacity": 0.7 },
      });

      // Multirotor patrol radius (เส้นประสีเหลือง)
      m.addSource("mr-radius", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "mr-radius-fill",
        type: "fill",
        source: "mr-radius",
        paint: { "fill-color": "#ffd600", "fill-opacity": 0.04 },
      });
      m.addLayer({
        id: "mr-radius-line",
        type: "line",
        source: "mr-radius",
        paint: { "line-color": "#ffd600", "line-width": 1.5, "line-opacity": 0.5, "line-dasharray": [4, 4] },
      });

      // VTOL patrol radius (เส้นประสีส้ม — วงใหญ่กว่า)
      m.addSource("vtol-radius", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "vtol-radius-fill",
        type: "fill",
        source: "vtol-radius",
        paint: { "fill-color": "#ff9100", "fill-opacity": 0.03 },
      });
      m.addLayer({
        id: "vtol-radius-line",
        type: "line",
        source: "vtol-radius",
        paint: { "line-color": "#ff9100", "line-width": 1.5, "line-opacity": 0.4, "line-dasharray": [6, 6] },
      });

      setMapReady(true);
      onMapReady?.(m);
    });

    map.current = m;
    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    clearMarkers();

    // Sensors
    if (filters.sensor) {
      sensors.forEach((s) => {
        const isAlert = s.status === "alert";
        const el = document.createElement("div");
        if (isAlert) {
          // Sensor alert — ใหญ่ + label + กระพริบ
          el.style.cssText = `display:flex;flex-direction:column;align-items:center;cursor:pointer;`;
          el.innerHTML = `
            <div style="background:#ff1744;color:#fff;font-size:9px;font-weight:bold;padding:1px 6px;border-radius:4px;white-space:nowrap;margin-bottom:2px;font-family:monospace;">ผิดปกติ</div>
            <div style="width:24px;height:24px;border-radius:50%;background:#ff1744;box-shadow:0 0 20px rgba(255,23,68,0.9);border:2px solid #fff;" class="animate-pulse-dot"></div>
          `;
        } else {
          el.style.cssText = `width:12px;height:12px;border-radius:50%;background:#00e676;box-shadow:0 0 8px rgba(0,230,118,0.5);cursor:pointer;`;
        }

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([s.lng, s.lat])
          .setPopup(new maplibregl.Popup({ offset: 8 }).setHTML(
            `<div><b>${s.name}</b><br/>${s.sector}<br/>สถานะ: ${s.status === "normal" ? "ปกติ" : "ผิดปกติ"}</div>`
          ))
          .addTo(m);
        markersRef.current.push(marker);
      });
    }

    // Drones
    if (filters.drone) {
      drones.forEach((d) => {
        if (d.status === "charging") return;
        const el = document.createElement("div");
        const isDispatched = d.status === "dispatched";
        const isVtol = d.type === "vtol";
        const color = isDispatched ? "#ff1744" : isVtol ? "#ffd600" : "#00b0ff";

        if (isVtol) {
          // VTOL icon — fixed-wing shape ปีกกว้าง + หาง
          el.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 4L8 14v1l8-4 8 4v-1L16 4z" fill="${color}" opacity="0.9"/>
            <path d="M16 15L8 19v1l8-3 8 3v-1L16 15z" fill="${color}" opacity="0.5"/>
            <rect x="14.5" y="4" width="3" height="22" rx="1.5" fill="${color}" opacity="0.7"/>
            <path d="M12 24l4 4 4-4" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.6"/>
          </svg>`;
        } else {
          // Multirotor icon — quadcopter 4 rotors
          el.innerHTML = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <line x1="16" y1="16" x2="6" y2="6" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
            <line x1="16" y1="16" x2="26" y2="6" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
            <line x1="16" y1="16" x2="6" y2="26" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
            <line x1="16" y1="16" x2="26" y2="26" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
            <circle cx="6" cy="6" r="4" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 1" opacity="0.6"/>
            <circle cx="26" cy="6" r="4" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 1" opacity="0.6"/>
            <circle cx="6" cy="26" r="4" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 1" opacity="0.6"/>
            <circle cx="26" cy="26" r="4" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 1" opacity="0.6"/>
            <circle cx="16" cy="16" r="3.5" fill="${color}" opacity="0.9"/>
            <circle cx="16" cy="16" r="1.5" fill="${isDispatched ? "#fff" : "#001a33"}"/>
          </svg>`;
        }

        el.style.cssText = `cursor:pointer;transition:filter 0.3s;filter:drop-shadow(0 0 5px ${
          isDispatched ? "rgba(255,23,68,0.8)" : isVtol ? "rgba(255,214,0,0.6)" : "rgba(0,176,255,0.6)"
        });`;

        const typeLabel = isVtol ? "VTOL ไฟฟ้า" : "Multirotor";
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([d.lng, d.lat])
          .setPopup(new maplibregl.Popup({ offset: 14 }).setHTML(
            `<div><b>${d.name}</b> (${typeLabel})<br/>แบตเตอรี่: ${d.battery}%<br/>สถานะ: ${
              d.status === "flying" ? "บินลาดตระเวน" : d.status === "dispatched" ? "ส่งไปจุดเกิดเหตุ" : d.status === "standby" ? "สแตนด์บาย" : d.status
            }<br/>ความสูง: ${d.altitude}m | ความเร็ว: ${d.speed}km/h<br/>รัศมี: ${d.patrolRadiusKm}km</div>`
          ))
          .addTo(m);
        markersRef.current.push(marker);
        droneMarkersRef.current.set(d.id, marker);
      });
    }

    // CCTVs — กดที่จุดเพื่อดูวิดีโอ
    if (filters.cctv) {
      cctvs.forEach((c) => {
        const hasVideo = !!c.video;
        const el = document.createElement("div");
        el.style.cssText = `display:flex;flex-direction:column;align-items:center;cursor:pointer;`;
        el.innerHTML = `
          ${hasVideo ? `<div style="background:#00b0ff;color:#000;font-size:8px;font-weight:bold;padding:0px 4px;border-radius:3px;margin-bottom:1px;font-family:monospace;">CCTV</div>` : ""}
          <div style="width:${hasVideo ? 14 : 10}px;height:${hasVideo ? 14 : 10}px;border:2px solid #00b0ff;background:rgba(0,176,255,0.3);border-radius:2px;"></div>
        `;
        // กดที่ CCTV → เปิดวิดีโอ
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onCCTVClick?.(c);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([c.lng, c.lat])
          .setPopup(new maplibregl.Popup({ offset: 8 }).setHTML(
            `<div><b>${c.name}</b><br/>สถานะ: ออนไลน์<br/>${c.sector}${hasVideo ? "<br/><b style='color:#00b0ff'>กดเพื่อดูวิดีโอ</b>" : ""}</div>`
          ))
          .addTo(m);
        markersRef.current.push(marker);
      });
    }

    // Alert markers ลบออก — sensor แดง + label "ผิดปกติ" เพียงพอแล้ว
  }, [sensors, drones, cctvs, alerts, filters, clearMarkers, mapReady]);

  // Update drone patrol radius circles (แยก VTOL vs Multirotor)
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const mrSrc = m.getSource("mr-radius") as maplibregl.GeoJSONSource | undefined;
    const vtolSrc = m.getSource("vtol-radius") as maplibregl.GeoJSONSource | undefined;
    if (!mrSrc || !vtolSrc) return;

    if (filters.drone) {
      // บันทึกตำแหน่งฐานครั้งแรกที่เห็นโดรน (ไม่เปลี่ยนเมื่อ dispatch)
      drones.forEach((d) => {
        if (!droneBasesRef.current.has(d.id)) {
          droneBasesRef.current.set(d.id, { lng: d.lng, lat: d.lat });
        }
      });

      const makeFeatures = (list: typeof drones) => list
        .filter((d) => d.patrolRadiusKm > 0)
        .map((d) => {
          const base = droneBasesRef.current.get(d.id) || { lng: d.lng, lat: d.lat };
          return {
            type: "Feature" as const,
            properties: { droneId: d.id, name: d.name },
            geometry: {
              type: "Polygon" as const,
              coordinates: [createCircleGeoJSON([base.lng, base.lat], d.patrolRadiusKm)],
            },
          };
        });
      mrSrc.setData({ type: "FeatureCollection", features: makeFeatures(drones.filter(d => d.type === "multirotor")) });
      vtolSrc.setData({ type: "FeatureCollection", features: makeFeatures(drones.filter(d => d.type === "vtol")) });
    } else {
      mrSrc.setData({ type: "FeatureCollection", features: [] });
      vtolSrc.setData({ type: "FeatureCollection", features: [] });
    }
  }, [drones, filters.drone, mapReady]);

  // Update dispatch line (dashed route line)
  useEffect(() => {
    const m = map.current;
    if (!m || !mapReady) return;
    const src = m.getSource("dispatch-line") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    if (dispatchLine) {
      src.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [dispatchLine.from, dispatchLine.to] },
      });
    } else {
      src.setData({ type: "FeatureCollection", features: [] });
    }
  }, [dispatchLine]);

  // === DRONE ANIMATION — smooth movement on map ===
  useEffect(() => {
    if (!droneAnimation) return;
    const m = map.current;
    if (!m) return;

    const { droneId, from, to, durationMs } = droneAnimation;
    const marker = droneMarkersRef.current.get(droneId);
    if (!marker) return;

    const startTime = performance.now();
    const trail: [number, number][] = [from];

    // Ease-in-out cubic
    const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const rawT = Math.min(elapsed / durationMs, 1);
      const t = ease(rawT);

      const lng = from[0] + (to[0] - from[0]) * t;
      const lat = from[1] + (to[1] - from[1]) * t;

      marker.setLngLat([lng, lat]);

      // Update trail
      trail.push([lng, lat]);
      const trailSrc = m.getSource("dispatch-trail") as maplibregl.GeoJSONSource | undefined;
      if (trailSrc) {
        trailSrc.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: trail },
        });
      }

      if (rawT < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        onDroneArrived?.();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [droneAnimation, onDroneArrived]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
