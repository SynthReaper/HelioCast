# HelioCast 🌟 — Real-time Space Weather at Your Fingertips

**HelioCast** is a premium, real-time Space Weather Dashboard that brings live NASA and NOAA solar telemetry to life. Track solar flares, aurora forecasts, geomagnetic storms, and understand how space weather impacts Earth's systems—all in a beautiful, dark-cosmic interactive interface.

Designed, developed, and maintained by **[SynthReaper](https://github.com/SynthReaper)**.

[![GitHub Version](https://img.shields.io/github/v/release/SynthReaper/HelioCast?color=blue)](https://github.com/SynthReaper/HelioCast)
[![License](https://img.shields.io/badge/license-MIT-green)](#-license)
[![Build Status](https://img.shields.io/badge/deployment-Vercel--Ready-brightgreen)](#-deployment)

---

## 🎯 Features

### Core Telemetry Tracking
- **Solar Flares** — Real-time detection with A/B/C/M/X intensity classification.
- **Aurora Probability** — Northern & Southern hemisphere forecasts with optimal viewing times.
- **Solar Wind Dynamics** — Live speed (km/s) and density (particles/cm³) streaming updates.
- **Geomagnetic Storms** — Live Kp Index (0-9 scale) with storm warnings.
- **Coronal Mass Ejections (CMEs)** — Earth-directed & off-flank event tracking.
- **Sunspot Count** — Active regions visible + Solar Cycle progress (Cycle 25).

### Advanced Capabilities
- 🎨 **Aurora Oval Visualizer** — Dynamic particle-driven canvas animation indicating forecast intensity.
- 📊 **Historical Charts** — Interactive custom-drawn line graphs showing Kp geomagnetic trend lines.
- 🛰️ **Infrastructure Impact Analysis** — Live assessment of solar weather risks on satellites, power grids, GPS, and radio communications.
- 🔔 **Smart Alerts** — Warnings for X-class solar events & G4+ (Kp >= 8) geomagnetic storms.
- 🌍 **Location-Based Aurora** — Latitudinal probability calculations.

---

## 🚀 Deployment on Vercel

HelioCast has been refactored into a high-performance **Next.js** application. You can deploy it to **Vercel** with one click.

### Setup and Build

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SynthReaper/HelioCast.git
   cd HelioCast
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run local server:**
   ```bash
   npm run dev
   ```

Open `http://localhost:3000` in your web browser.

---

## 📂 Architecture

```
HelioCast/
├── README.md                 # This file
├── package.json              # Next.js configurations
├── next.config.js            # Build rules
│
├── src/
│   ├── lib/
│   │   ├── cache.js          # In-memory Serverless cache
│   │   ├── nasa.js           # NASA Solar wind telemetry
│   │   └── noaa.js           # NOAA scale predictions
│   │
│   └── app/
│       ├── layout.js         # HTML core container
│       ├── globals.css       # Deep space stylesheet
│       ├── page.js           # React interactive component
│       └── api/
│           ├── kp-index/     # Geomagnetic storm api
│           ├── wind/         # Solar wind api
│           ├── solar-flares/ # Flare detection api
│           ├── aurora/       # Northern aurora api
│           ├── sunspots/     # Sunspot cycle api
│           └── impact/       # Infrastructure risks api
```

---

## 🌐 API Reference

All endpoints return JSON responses.

- `GET /api/kp-index` — Returns current geomagnetic storm status and historical 7-day trend.
- `GET /api/wind` — Retrieves solar wind speed, density, temperature, and averages.
- `GET /api/solar-flares` — Fetches active solar region flares.
- `GET /api/aurora` — Calculates aurora visibility probability by latitude.
- `GET /api/sunspots` — Monitors sunspots count and Cycle 25 metrics.
- `GET /api/impact` — Assesses space weather risk levels.

---

## 🤝 Contributing

We welcome contributions from the community! Please feel free to open a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See [LICENSE](https://github.com/SynthReaper/HelioCast/blob/main/LICENSE) for more information.

---

## 🙏 Credits & Data Sources
- **NASA** (OMNIWeb Data Services)
- **NOAA** (Space Weather Prediction Center)

---

Developed and maintained by **[SynthReaper](https://github.com/SynthReaper)**. For questions or support, please open an issue on the [SynthReaper/HelioCast Issues Page](https://github.com/SynthReaper/HelioCast/issues).
