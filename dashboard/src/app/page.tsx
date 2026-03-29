"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import TopBar from "@/components/TopBar";
import AlertFeed from "@/components/AlertFeed";
import DroneFeed from "@/components/DroneFeed";
import CCTVFeed from "@/components/CCTVFeed";
import DroneStatus from "@/components/DroneStatus";
import WeatherWidget from "@/components/WeatherWidget";
import type { DroneAnimation } from "@/components/MapView";
import {
  SENSORS, DRONES, CCTVS, INITIAL_ALERTS, SIMULATION_ALERT,
  INITIAL_KPI, WEATHER,
  type Sensor, type Drone, type Alert, type KPIData, type CCTV,
} from "@/data/mockData";
import {
  soundDetect, soundAlert, soundDispatch, soundIdentify,
  soundEscalate, soundReturning, soundComplete,
} from "@/lib/sounds";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type SimPhase = "idle" | "detect" | "alert" | "dispatch" | "flying" | "identify" | "escalate" | "returning" | "complete";

// D06 (MR-04) ฐานขุนยาม → จุดเกิดเหตุริมชายแดนขุนยาม
const DISPATCH_DRONE_ID = "D06"; // MR-04 ขุนยาม — multirotor ที่ใกล้จุดเกิดเหตุสุด
const DRONE_ORIGIN: [number, number] = [97.90, 18.83]; // ฐานขุนยาม (ศูนย์กลางรัศมี)
const INCIDENT: [number, number] = [97.86, 18.83]; // จุด sensor S09 (~4km ทิศตะวันตกของฐาน อยู่ในรัศมี)
const FLIGHT_DURATION = 2500; // 2.5 วินาที — ระยะใกล้ ~4km

export default function DashboardPage() {
  const [sensors, setSensors] = useState<Sensor[]>(SENSORS);
  const [drones, setDrones] = useState<Drone[]>(DRONES);
  const cctvs = CCTVS; // CCTV อยู่ตรงด่านเท่านั้น ไม่เปลี่ยนสถานะตอน sim
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [kpi, setKpi] = useState<KPIData>(INITIAL_KPI);
  const [simPhase, setSimPhase] = useState<SimPhase>("idle");
  const [showDetection, setShowDetection] = useState(false);
  const [activeDroneId, setActiveDroneId] = useState<string | null>(null);
  const [dispatchLine, setDispatchLine] = useState<{ from: [number, number]; to: [number, number] } | null>(null);
  const [droneAnimation, setDroneAnimation] = useState<DroneAnimation | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [filters, setFilters] = useState({ drone: true, sensor: true, cctv: true });
  const [selectedCCTV, setSelectedCCTV] = useState<CCTV | null>(null);

  const mapRef = useRef<maplibregl.Map | null>(null);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  const now = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const resetSimulation = useCallback(() => {
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];
    setSensors(SENSORS);
    setDrones(DRONES);
    setAlerts(INITIAL_ALERTS);
    setKpi(INITIAL_KPI);
    setSimPhase("idle");
    setShowDetection(false);
    setActiveDroneId(null);
    setDispatchLine(null);
    setDroneAnimation(null);
    setStatusMessage("");
    setSelectedCCTV(null);
  }, []);

  // เมื่อโดรนบินกลับถึงฐาน
  const handleDroneReturned = useCallback(() => {
    setDroneAnimation(null);
    setDispatchLine(null);
    setSimPhase("complete");
    setStatusMessage("MR-04 กลับถึงฐานขุนยาม — ระบบตอบสนองสำเร็จ เวลาตอบสนอง 2.8 นาที");
    soundComplete();
    // คืนสถานะโดรนกลับเป็น flying ที่ฐานเดิม
    setDrones((prev) =>
      prev.map((d) =>
        d.id === DISPATCH_DRONE_ID ? { ...d, status: "flying" as const, lat: DRONE_ORIGIN[1], lng: DRONE_ORIGIN[0] } : d
      )
    );
    setKpi((prev) => ({
      ...prev,
      detectedToday: prev.detectedToday + 1,
      avgResponseMin: 2.8,
    }));
  }, []);

  // เมื่อโดรนบินถึงจุดเกิดเหตุ → เริ่ม AI detection → สำรวจ → บินกลับ
  const handleDroneArrived = useCallback(() => {
    setSimPhase("identify");
    setStatusMessage("MR-04 ถึงจุดเกิดเหตุ — กำลังสำรวจ...");
    setDroneAnimation(null);

    // อัปเดตตำแหน่งโดรนตรงจุดเกิดเหตุ
    setDrones((prev) =>
      prev.map((d) =>
        d.id === DISPATCH_DRONE_ID ? { ...d, lat: INCIDENT[1], lng: INCIDENT[0] } : d
      )
    );

    // 2s — AI ตรวจพบบุคคล + เปิดวิดีโอ IR
    const t1 = setTimeout(() => {
      soundIdentify();
      setStatusMessage("AI ตรวจพบบุคคล 2 คน — ความมั่นใจ 96% — กำลังบันทึกหลักฐาน...");
      setShowDetection(true);
    }, 2000);

    // 5s — Escalate
    const t2 = setTimeout(() => {
      soundEscalate();
      setSimPhase("escalate");
      setStatusMessage("ยกระดับเป็นวิกฤต — แจ้งส่วนกลางแล้ว");
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === "A-SIM" ? { ...a, level: "high" as const, message: "วิกฤต: ยืนยันบุคคลบุกรุก 2 คน บริเวณขุนยาม — แจ้งส่วนกลางแล้ว" } : a
        )
      );
    }, 5000);

    // 14s — วิดีโอจบ (12.4s) → โดรนเริ่มบินกลับฐาน
    const t3 = setTimeout(() => {
      soundReturning();
      setSimPhase("returning");
      setStatusMessage("MR-04 สำรวจเสร็จ — กำลังบินกลับฐานขุนยาม...");
      setShowDetection(false);
      setDispatchLine({ from: INCIDENT, to: DRONE_ORIGIN });
      setDroneAnimation({
        droneId: DISPATCH_DRONE_ID,
        from: INCIDENT,
        to: DRONE_ORIGIN,
        durationMs: FLIGHT_DURATION,
      });
    }, 14000);

    timeoutIds.current.push(t1, t2, t3);
  }, []);

  const runSimulation = useCallback(() => {
    if (simPhase !== "idle") {
      resetSimulation();
      return;
    }

    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(fn, delay);
      timeoutIds.current.push(id);
    };

    // Phase 1: Detect (0s) — กล้อง C10 ห้วยต้นนุ่น + sensor S09 แดง พร้อมกัน
    setSimPhase("detect");
    setStatusMessage("เซ็นเซอร์ ขุนยาม ตรวจพบสัญญาณผิดปกติ!");
    soundDetect();
    // S09 sensor แดง (เซ็นเซอร์ตรวจพบสัญญาณ)
    setSensors((prev) =>
      prev.map((s) => (s.id === "S09" ? { ...s, status: "alert" as const } : s))
    );
    // Zoom เข้าไปดูจุดเกิดเหตุ
    if (mapRef.current) {
      mapRef.current.flyTo({ center: INCIDENT, zoom: 12, duration: 1500 });
    }

    // Phase 2: Alert (3s) — alert ขึ้น + เสียง
    schedule(() => {
      setSimPhase("alert");
      setStatusMessage("แจ้งเตือน: ตรวจพบการเคลื่อนไหวผิดปกติ ชายแดนขุนยาม — ส่ง MR-04 สำรวจ");
      const simAlert: Alert = { ...SIMULATION_ALERT, time: now() };
      setAlerts((prev) => [...prev, simAlert]);
      soundAlert();
      // Zoom out เล็กน้อยเพื่อเห็นทั้งฐานและจุดเกิดเหตุ
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [97.88, 18.83], zoom: 12, duration: 1000 });
      }
    }, 3000);

    // Phase 3: Dispatch (5s) — โดรนเริ่มบินจากฐานไปจุด sensor ที่แดง
    schedule(() => {
      setSimPhase("dispatch");
      setStatusMessage("MR-04 เริ่มบินจากฐานขุนยาม → จุด sensor ที่ตรวจพบสัญญาณ...");

      soundDispatch();
      setDrones((prev) =>
        prev.map((d) =>
          d.id === DISPATCH_DRONE_ID ? { ...d, status: "dispatched" as const } : d
        )
      );
      setActiveDroneId(DISPATCH_DRONE_ID);
      setDispatchLine({ from: DRONE_ORIGIN, to: INCIDENT });

      setDroneAnimation({
        droneId: DISPATCH_DRONE_ID,
        from: DRONE_ORIGIN,
        to: INCIDENT,
        durationMs: FLIGHT_DURATION,
      });
    }, 5000);

    // หลังจากนี้ handleDroneArrived จะถูกเรียกเมื่อ animation จบ
    // ไม่ต้อง schedule Phase 4-6 ด้วย timeout แล้ว
  }, [simPhase, resetSimulation]);

  const handleAlertClick = useCallback((alert: Alert) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [alert.lng, alert.lat], zoom: 14, duration: 1000 });
    }
  }, []);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Top Bar */}
      <TopBar kpi={kpi} />

      {/* Status Message Bar */}
      {statusMessage && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="px-4 py-1.5 text-xs font-bold text-center"
          style={{
            background: simPhase === "escalate"
              ? "rgba(255,23,68,0.15)"
              : simPhase === "complete" ? "rgba(0,230,118,0.1)"
              : simPhase === "returning" ? "rgba(0,176,255,0.1)"
              : "rgba(0,176,255,0.1)",
            color: simPhase === "escalate" ? "var(--accent-red)"
              : simPhase === "complete" ? "var(--accent-green)"
              : simPhase === "returning" ? "var(--accent-blue)"
              : "var(--accent-blue)",
            borderBottom: `1px solid var(--border-color)`,
          }}
        >
          {simPhase === "escalate" && "⚠ "}{statusMessage}
        </motion.div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Map Area (62%) */}
        <div className="flex flex-col" style={{ width: "62%" }}>
          <div className="flex-1 relative">
            <MapView
              sensors={sensors}
              drones={drones}
              cctvs={cctvs}
              alerts={alerts}
              filters={filters}
              dispatchLine={dispatchLine}
              droneAnimation={droneAnimation}
              onDroneArrived={simPhase === "returning" ? handleDroneReturned : handleDroneArrived}
              onCCTVClick={(c) => { setSelectedCCTV(c); if (mapRef.current) mapRef.current.flyTo({ center: [c.lng, c.lat], zoom: 14, duration: 1000 }); }}
              onMapReady={(m) => { mapRef.current = m; }}
            />
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between px-3 py-2 border-t"
            style={{ borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={runSimulation}
                className="px-4 py-1.5 rounded font-bold text-xs tracking-wider"
                style={{
                  background: simPhase === "idle" ? "var(--accent-red)" : "var(--bg-panel)",
                  color: simPhase === "idle" ? "#fff" : "var(--text-secondary)",
                  border: `1px solid ${simPhase === "idle" ? "var(--accent-red)" : "var(--border-color)"}`,
                  boxShadow: simPhase === "idle" ? "0 0 12px var(--glow-red)" : "none",
                }}
              >
                {simPhase === "idle" ? "SIMULATE EVENT" : "RESET"}
              </motion.button>

              {(["drone", "sensor", "cctv"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => toggleFilter(key)}
                  className="px-2 py-1 rounded text-[10px] font-bold uppercase"
                  style={{
                    background: filters[key] ? "var(--bg-panel)" : "transparent",
                    color: filters[key] ? "var(--accent-blue)" : "var(--text-secondary)",
                    border: `1px solid ${filters[key] ? "var(--accent-blue)" : "var(--border-color)"}`,
                  }}
                >
                  {key === "drone" ? "Drone" : key === "sensor" ? "Sensor" : "CCTV"}
                </button>
              ))}
            </div>

            <WeatherWidget weather={WEATHER} />
          </div>
        </div>

        {/* Right Panel (38%) */}
        <div className="flex flex-col border-l"
          style={{ width: "38%", borderColor: "var(--border-color)", background: "var(--bg-secondary)" }}>
          <div className="border-b" style={{ height: "40%", borderColor: "var(--border-color)" }}>
            <AlertFeed alerts={alerts} onAlertClick={handleAlertClick} />
          </div>
          <div className="border-b" style={{ height: "35%", borderColor: "var(--border-color)" }}>
            {selectedCCTV && !showDetection ? (
              <CCTVFeed cctv={selectedCCTV} onClose={() => setSelectedCCTV(null)} />
            ) : (
              <DroneFeed drones={drones} activeDroneId={activeDroneId} showDetection={showDetection} />
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <DroneStatus drones={drones} />
          </div>
        </div>
      </div>
    </div>
  );
}
