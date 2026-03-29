# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ONCB — Border Area Defense Dashboard** (ระบบป้องกันพื้นที่ชายแดน)

A real-time surveillance dashboard for border area monitoring. Integrates drone feeds (infrared + high-res cameras), IoT sensors (sound, vibration, weather), and CCTV into a unified command interface with alerting and historical analysis.

## Tech Stack

- **Frontend:** Next.js (JavaScript)
- **Database:** PostgreSQL (via Prisma or Sequelize ORM)
- **Maps:** Leaflet or MapLibre (interactive map with sensor/drone/CCTV positions)
- **Charts:** Chart.js or Recharts (real-time IoT data visualization)
- **Backend:** Custom Node.js framework with API endpoints

## Key Data Sources

- **Drones:** GPS/GNSS positioning, infrared/high-res imagery, flight telemetry
- **IoT sensors:** Sound (level, frequency), vibration (intensity, frequency), weather (temp, humidity, pressure)
- **CCTV:** Video feeds with GPS-tagged positions

## Dashboard Components

- Interactive map showing all device positions
- Real-time IoT sensor graphs
- Drone and CCTV video/image feeds
- Threshold-based alert system for anomaly detection
- Historical data analysis views

## Development Phases

1. **Phase 1:** Base Next.js dashboard, drone/IoT data integration, initial UI
2. **Phase 2:** CCTV integration, alert system, chart visualizations
3. **Phase 3:** Data analysis features, performance optimization, backend API
