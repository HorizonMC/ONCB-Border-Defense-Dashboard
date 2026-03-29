# Border Defense System Dashboard

> ระบบป้องกันพื้นที่ชายแดน — Real-time border surveillance demo

Dark military-themed command dashboard for monitoring the Thai-Myanmar border. Built as a demo prototype with mock data, real GADM border coordinates, and actual drone/CCTV video feeds.

## Features

- **Interactive Map** — MapLibre GL with Thailand outline + Myanmar border highlight (GADM 4.1)
- **8 Drones** — 2 VTOL (50km range) + 6 Multirotor (10km range) with animated patrol radius
- **12 CCTV Checkpoints** — Real border crossing locations with live video playback
- **18 Sensors** — Sound/vibration detection along the border
- **Simulate Event** — Full incident flow: sensor alert > drone dispatch (animated flight) > IR video + AI detection > escalation > return to base
- **ZeroTier Ready** — Accessible from anywhere via VPN

## Demo Flow

```
1. Sensor detects anomaly          → red alert on map
2. Alert notification fires        → sound + zoom to incident
3. Drone dispatches from base      → animated flight path
4. Drone arrives, starts survey    → real IR drone video plays
5. AI detects 2 persons            → "AI DETECT: 2 persons — 96%"
6. Escalation to HQ                → critical alert sent
7. Drone returns to base           → animated return flight
8. Mission complete                → KPI updates
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 (dark military theme) |
| Map | MapLibre GL JS |
| Animation | Framer Motion |
| Charts | Recharts |
| Border Data | GADM 4.1 (University of California Davis) |

## Quick Start

```bash
cd dashboard
npm install
npm run dev
```

Open http://localhost:3000

### Remote Access (ZeroTier)

The dev server binds to `0.0.0.0` — accessible on all network interfaces including ZeroTier.

## Project Structure

```
dashboard/
  src/
    app/
      page.tsx          # Main dashboard + simulation engine
      layout.tsx        # Root layout
      globals.css       # Dark military theme + animations
    components/
      MapView.tsx       # MapLibre map + markers + drone animation
      TopBar.tsx        # KPI scoreboard + system heartbeat
      AlertFeed.tsx     # Alert timeline panel
      DroneFeed.tsx     # Drone IR video feed + AI detection
      CCTVFeed.tsx      # CCTV checkpoint video player
      DroneStatus.tsx   # Drone fleet status panel
      WeatherWidget.tsx # Weather conditions bar
    data/
      mockData.ts       # All mock data: borders, devices, alerts
  public/
    videos/             # Drone + CCTV video files
```

## Border Data

- **Thailand outline**: 806 points from GADM 4.1 (full country boundary)
- **Myanmar border**: 205 points highlighted segment
- **Checkpoints**: Real GPS coordinates from Wikipedia, Google Maps, OSM
- **Military bases**: Approximate positions near Pha Muang Force / Naresuan Force areas

## Equipment (Mock)

| Type | Count | Coverage |
|------|-------|----------|
| VTOL Drone | 2 | 50km radius each |
| Multirotor Drone | 6 | 10km radius each |
| CCTV | 12 | At border checkpoints |
| Sensor (sound/vibration) | 14 | Between patrol bases |
| Weather Station | 4 | Along border |

## Screenshots

Run `npm run dev` and press **SIMULATE EVENT** to see the full demo.

---

Built with Claude Code (claude.ai/code)
