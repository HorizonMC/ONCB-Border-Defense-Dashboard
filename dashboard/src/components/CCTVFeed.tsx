"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { CCTV } from "@/data/mockData";

export default function CCTVFeed({ cctv, onClose }: { cctv: CCTV; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [cctv.id]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <span className="text-xs font-bold tracking-wider" style={{ color: "var(--accent-blue)" }}>
          CCTV — {cctv.name}
        </span>
        <button
          onClick={onClose}
          className="px-2 py-0.5 rounded text-[10px] font-bold"
          style={{ background: "var(--bg-panel)", color: "var(--text-secondary)", border: "1px solid var(--border-color)" }}
        >
          CLOSE
        </button>
      </div>

      <div
        className="relative aspect-video m-2 rounded overflow-hidden border"
        style={{ borderColor: "var(--accent-blue)", boxShadow: "0 0 6px rgba(0,176,255,0.3)" }}
      >
        {cctv.video ? (
          <video
            ref={videoRef}
            src={cctv.video}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ background: "#000" }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: "var(--bg-panel)" }}>
            <motion.div className="w-8 h-8 rounded-full border-2 border-t-transparent"
              style={{ borderColor: "var(--accent-blue)", borderTopColor: "transparent" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>กำลังเชื่อมต่อสัญญาณ...</span>
            <span className="text-[10px]" style={{ color: "var(--text-secondary)", opacity: 0.5 }}>{cctv.name}</span>
          </div>
        )}

        {/* HUD overlay */}
        <div className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.6)", color: "var(--accent-blue)" }}>
          <div>{cctv.name}</div>
          <div>{cctv.sector} | {cctv.status === "online" ? "ONLINE" : "OFFLINE"}</div>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <motion.div className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent-green)" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[9px] font-bold" style={{ color: "var(--accent-green)" }}>LIVE</span>
        </div>
        <div className="absolute bottom-2 left-2 text-[8px] px-1.5 py-0.5 rounded"
          style={{ background: "rgba(0,0,0,0.6)", color: "var(--text-secondary)" }}>
          LAT: {cctv.lat.toFixed(4)} LNG: {cctv.lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
}
