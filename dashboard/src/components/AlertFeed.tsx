"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Alert } from "@/data/mockData";

const LEVEL_CONFIG = {
  low: { color: "var(--accent-green)", label: "ปกติ", icon: "●" },
  medium: { color: "var(--accent-yellow)", label: "ระวัง", icon: "▲" },
  high: { color: "var(--accent-red)", label: "วิกฤต", icon: "◆" },
};

export default function AlertFeed({
  alerts,
  onAlertClick,
}: {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
}) {
  const sorted = [...alerts].reverse();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--border-color)" }}>
        <span className="text-xs font-bold tracking-wider" style={{ color: "var(--accent-orange)" }}>
          ALERT FEED
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
          {alerts.filter((a) => !a.resolved).length} ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence>
          {sorted.map((alert) => {
            const cfg = LEVEL_CONFIG[alert.level];
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className={`flex items-start gap-2 px-2 py-2 rounded cursor-pointer transition-colors hover:brightness-125 ${
                  !alert.resolved ? "animate-alert-flash" : ""
                }`}
                style={{
                  background: alert.resolved ? "transparent" : "rgba(255,23,68,0.08)",
                  borderLeft: `3px solid ${cfg.color}`,
                }}
                onClick={() => onAlertClick(alert)}
              >
                <span style={{ color: cfg.color, fontSize: 10 }}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--text-primary)" }}>
                    {alert.message}
                  </p>
                  <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                    {alert.sector}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
