"use client";

import type { WeatherData } from "@/data/mockData";

export default function WeatherWidget({ weather }: { weather: WeatherData[] }) {
  return (
    <div className="flex gap-2">
      {weather.map((w) => (
        <div key={w.sector} className="flex items-center gap-2 px-2 py-1 rounded border text-[10px]"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-panel)",
          }}>
          <span style={{ color: "var(--text-secondary)" }}>{w.sector}</span>
          <span style={{ color: "var(--accent-blue)" }}>{w.temp}°C</span>
          <span style={{ color: w.droneReady ? "var(--accent-green)" : "var(--accent-red)" }}>
            {w.droneReady ? "โดรนบินได้" : "โดรนบินไม่ได้"}
          </span>
        </div>
      ))}
    </div>
  );
}
