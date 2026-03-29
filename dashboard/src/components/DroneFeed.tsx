"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Drone } from "@/data/mockData";

// วิดีโอหลักฐานจากโดรน — เล่นตอนตรวจพบบุคคล
const EVIDENCE_VIDEO = "/videos/drone-evidence.mp4";

export default function DroneFeed({
  drones,
  activeDroneId,
  showDetection,
}: {
  drones: Drone[];
  activeDroneId: string | null;
  showDetection: boolean;
}) {
  const [cameraMode, setCameraMode] = useState<"hd" | "infrared">("hd");
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeDrone = drones.find((d) => d.id === activeDroneId) || drones.find((d) => d.status === "flying");

  // เมื่อ showDetection เปิด → เล่นวิดีโอหลักฐาน
  useEffect(() => {
    if (showDetection) {
      setCameraMode("infrared"); // วิดีโอเป็น IR → สลับอัตโนมัติ
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [showDetection]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <span className="text-xs font-bold tracking-wider" style={{ color: "var(--accent-blue)" }}>
          LIVE FEED — {activeDrone?.name || "N/A"}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setCameraMode("hd")}
            className="px-2 py-0.5 rounded text-[10px] font-bold"
            style={{
              background: cameraMode === "hd" ? "var(--accent-blue)" : "transparent",
              color: cameraMode === "hd" ? "#000" : "var(--text-secondary)",
              border: `1px solid ${cameraMode === "hd" ? "var(--accent-blue)" : "var(--border-color)"}`,
            }}
          >
            HD
          </button>
          <button
            onClick={() => setCameraMode("infrared")}
            className="px-2 py-0.5 rounded text-[10px] font-bold"
            style={{
              background: cameraMode === "infrared" ? "var(--accent-orange)" : "transparent",
              color: cameraMode === "infrared" ? "#000" : "var(--text-secondary)",
              border: `1px solid ${cameraMode === "infrared" ? "var(--accent-orange)" : "var(--border-color)"}`,
            }}
          >
            IR
          </button>
        </div>
      </div>

      {/* Camera view */}
      <div
        className="relative aspect-video m-2 rounded overflow-hidden border"
        style={{
          borderColor: showDetection ? "var(--accent-red)" : "var(--border-color)",
          boxShadow: showDetection ? "0 0 8px var(--glow-red)" : "none",
          background: cameraMode === "infrared"
            ? "linear-gradient(135deg, #1a0a2e 0%, #0d1b2a 50%, #1b2838 100%)"
            : "linear-gradient(135deg, #0d1b2a 0%, #1a2332 50%, #0a1628 100%)",
        }}
      >
        {/* === วิดีโอจริงจากโดรน — เล่นเมื่อตรวจพบบุคคล === */}
        {showDetection && (
          <video
            ref={videoRef}
            src={EVIDENCE_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              filter: cameraMode === "infrared"
                ? "hue-rotate(270deg) saturate(2) brightness(0.8)"
                : "none",
            }}
          />
        )}

        {/* === SIMULATED VIEW (ก่อนตรวจพบ — แสดงภาพจำลอง) === */}
        {!showDetection && (
          <>
            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute top-0 left-1/2 w-px h-6 -translate-x-1/2" style={{ background: "var(--accent-green)", opacity: 0.5 }} />
                <div className="absolute bottom-0 left-1/2 w-px h-6 -translate-x-1/2" style={{ background: "var(--accent-green)", opacity: 0.5 }} />
                <div className="absolute left-0 top-1/2 h-px w-6 -translate-y-1/2" style={{ background: "var(--accent-green)", opacity: 0.5 }} />
                <div className="absolute right-0 top-1/2 h-px w-6 -translate-y-1/2" style={{ background: "var(--accent-green)", opacity: 0.5 }} />
              </div>
            </div>

            {/* Terrain simulation */}
            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 225">
              <path d="M0,180 Q50,160 100,170 T200,150 T300,165 T400,155 V225 H0Z" fill={cameraMode === "infrared" ? "#4a148c" : "#1b5e20"} />
              <path d="M0,200 Q80,185 160,195 T320,185 T400,190 V225 H0Z" fill={cameraMode === "infrared" ? "#311b92" : "#2e7d32"} />
              {[50, 120, 180, 250, 310, 370].map((x, i) => (
                <circle key={i} cx={x} cy={165 + (i % 3) * 8} r={8 + (i % 2) * 4}
                  fill={cameraMode === "infrared" ? "#e91e63" : "#1b5e20"} opacity={0.4} />
              ))}
            </svg>

            {/* Scanning text */}
            {activeDroneId && (
              <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] px-3 py-1 rounded"
                style={{ background: "rgba(0,0,0,0.6)", color: "var(--accent-green)" }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                กำลังสแกนพื้นที่...
              </motion.div>
            )}
          </>
        )}

        {/* === OVERLAYS === */}

        {/* IR filter overlay */}
        {showDetection && cameraMode === "infrared" && (
          <div className="absolute inset-0" style={{ background: "rgba(75,0,130,0.15)", mixBlendMode: "color" }} />
        )}

        {/* AI Detection Label — วิดีโอมี crosshair track คนอยู่แล้ว แค่แสดง label */}
        <AnimatePresence>
          {showDetection && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1 rounded"
              style={{ background: "rgba(255,23,68,0.85)" }}
            >
              <motion.div className="w-2 h-2 rounded-full bg-white"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
              <span className="text-[10px] font-bold text-white whitespace-nowrap">
                AI DETECT: ตรวจพบบุคคล 2 คน — ความมั่นใจ 96%
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD Overlay */}
        <div className="absolute top-2 left-2 text-[9px]" style={{ color: "var(--accent-green)", opacity: 0.8 }}>
          <div className="px-1 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div>{activeDrone?.name} | {cameraMode.toUpperCase()}</div>
            <div>ALT: {activeDrone?.altitude || 0}m | SPD: {activeDrone?.speed || 0}km/h</div>
            <div>LAT: {activeDrone?.lat.toFixed(4)} LNG: {activeDrone?.lng.toFixed(4)}</div>
          </div>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <motion.div className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent-red)" }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-[9px] font-bold" style={{ color: "var(--accent-red)" }}>REC</span>
        </div>

        {/* Scanline effect for IR */}
        {cameraMode === "infrared" && (
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{ background: "rgba(156, 39, 176, 0.4)" }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
    </div>
  );
}
