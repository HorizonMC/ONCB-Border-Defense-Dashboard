"use client";

import { motion } from "framer-motion";
import type { KPIData } from "@/data/mockData";

export default function TopBar({ kpi }: { kpi: KPIData }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border-color)" }}>

      {/* Left: Title + Heartbeat */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold tracking-wider" style={{ color: "var(--accent-green)" }}>
          BORDER DEFENSE SYSTEM
        </h1>
        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
          ระบบป้องกันพื้นที่ชายแดน
        </span>
        <motion.div
          className="w-2.5 h-2.5 rounded-full ml-2"
          style={{ background: "var(--accent-green)" }}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
          ONLINE
        </span>
      </div>

      {/* Right: KPI Cards */}
      <div className="flex items-center gap-4">
        <KPICard label="ตรวจจับวันนี้" value={kpi.detectedToday} unit="ครั้ง" color="var(--accent-blue)" />
        <KPICard label="สกัดสำเร็จ" value={kpi.interceptRate} unit="%" color="var(--accent-green)" />
        <KPICard label="ตอบสนองเฉลี่ย" value={kpi.avgResponseMin} unit="นาที" color="var(--accent-orange)" />
        <KPICard label="ครอบคลุมพื้นที่" value={kpi.coveragePercent} unit="%" color="var(--accent-green)" />
        <KPICard
          label="อุปกรณ์"
          value={kpi.devicesOnline}
          unit={`/${kpi.devicesTotal}`}
          color="var(--accent-blue)"
        />
        <div className="flex items-center gap-1 px-3 py-1 rounded border"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-panel)" }}>
          <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>UPTIME</span>
          <span className="text-sm font-bold" style={{ color: "var(--accent-green)" }}>{kpi.uptime}%</span>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded border"
      style={{ borderColor: "var(--border-color)", background: "var(--bg-panel)" }}>
      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <motion.span
        key={value}
        className="text-lg font-bold"
        style={{ color }}
        initial={{ scale: 1.3, color: "#fff" }}
        animate={{ scale: 1, color }}
        transition={{ duration: 0.5 }}
      >
        {value}
      </motion.span>
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{unit}</span>
    </div>
  );
}
