"use client";

import { motion } from "framer-motion";
import type { Drone } from "@/data/mockData";

const STATUS_CONFIG = {
  flying: { color: "var(--accent-green)", label: "บินลาดตระเวน" },
  standby: { color: "var(--accent-blue)", label: "สแตนด์บาย" },
  charging: { color: "var(--accent-yellow)", label: "ชาร์จ" },
  dispatched: { color: "var(--accent-red)", label: "ส่งไปจุดเกิดเหตุ" },
};

export default function DroneStatus({ drones }: { drones: Drone[] }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <span className="text-xs font-bold tracking-wider" style={{ color: "var(--accent-green)" }}>
          MULTIROTOR STATUS
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
          {drones.filter((d) => d.status === "flying" || d.status === "dispatched").length}/{drones.length} ACTIVE
        </span>
      </div>

      <div className="p-2 space-y-1">
        {drones.map((drone) => {
          const cfg = STATUS_CONFIG[drone.status];
          return (
            <motion.div
              key={drone.id}
              layout
              className="flex items-center gap-2 px-2 py-1.5 rounded"
              style={{
                background: drone.status === "dispatched" ? "rgba(255,23,68,0.1)" : "transparent",
                borderLeft: `2px solid ${cfg.color}`,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    {drone.name}
                  </span>
                  <span className="text-[9px] px-1 py-0.5 rounded" style={{
                    background: drone.type === "vtol" ? "rgba(255,145,0,0.15)" : "rgba(0,176,255,0.15)",
                    color: drone.type === "vtol" ? "var(--accent-orange)" : "var(--accent-blue)",
                  }}>
                    {drone.type === "vtol" ? "VTOL" : "MR"}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded" style={{
                    background: `${cfg.color}22`,
                    color: cfg.color,
                  }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                    {drone.sector}
                  </span>
                </div>
              </div>

              {/* Battery */}
              <div className="flex items-center gap-1">
                <div className="w-8 h-2.5 rounded-sm border overflow-hidden"
                  style={{ borderColor: "var(--border-color)" }}>
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${drone.battery}%`,
                      background: drone.battery > 50 ? "var(--accent-green)"
                        : drone.battery > 20 ? "var(--accent-yellow)" : "var(--accent-red)",
                    }}
                  />
                </div>
                <span className="text-[9px] w-7 text-right" style={{ color: "var(--text-secondary)" }}>
                  {drone.battery}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
