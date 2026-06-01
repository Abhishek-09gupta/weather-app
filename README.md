# 🌤️ Skyflow Weather Dashboard

Skyflow is an ultra-premium, interactive, and beautifully designed **Weather Dashboard** built with modern web technologies. It is fully responsive, highly performant, features stunning **glassmorphic design aesthetics**, and is configured as a **Progressive Web App (PWA)** for easy installation on desktop and mobile platforms.

Live API queries are powered by **Open-Meteo** (completely free, zero-key public atmospheric data).

---

## ✨ Features

- **🌈 Dynamic Aesthetic Themes:** The visual color scheme, ambient background meshes, and glowing accent circles shift dynamically matching real-time weather codes (Sunny, Cloudy, Rainy, Stormy, Snowy, Night).
- **📱 PWA Standalone App Integration:** Fully configure and installable directly from your browser as a desktop or mobile application. Includes a modern resizable vector branding icon (`icon.svg`).
- **📶 Offline Support:** Employs Service Workers (`sw.js`) to cache the application shell, layouts, styles, dynamic script states, and web fonts, enabling instantaneous launching and offline functionality.
- **📊 Library-Free SVG Curve Chart:** Lightweight, custom vector line chart drawn on-the-fly inside an SVG, mapping 8 hours of temperatures with bezier coordinates, glowing data nodes, and hover-triggered labels.
- **🔍 Geocoding Auto-Complete:** Fast, debounced (350ms) query auto-suggestions for searching cities across the globe.
- **📍 GPS Precision Locate:** Connects with the standard browser Geolocation telemetry to load coordinates and retrieve real-time atmospheric data.
- **⚡ In-Memory Temp Scale Conversion:** Instantly toggles between Celsius (°C) and Fahrenheit (°F) via standard caching without repeating network calls.

---

## 🛠️ Technology Stack

- **Core Structure:** HTML5 (Semantic and fully accessible)
- **Styling Architecture:** Vanilla CSS3 (Custom Glassmorphism, variables, fluid `@keyframes` micro-animations, and viewport grids)
- **Application Engine:** ES6+ JavaScript (Asynchronous fetch streams, SVG paths generation, debouncers, and states manager)
- **Icons & Typography:** Outfit & Inter (Google Web Fonts) and Lucide Vectors (CDN)
- **APIs:** 
  - [Open-Meteo Forecast Engine](https://open-meteo.com/) (Forecasts & UV Indicators)
  - [Open-Meteo Geocoding Search](https://open-meteo.com/en/docs/geocoding-api) (Autocomplete Suggestions)

---

## 📂 Project Structure

```
Weather App/
├── index.html       # Primary layout, grids container, and app header shell
├── style.css        # Responsive layouts, glassmorphic styles, keyframes, and themes
├── app.js           # API interfaces, SVG line charting, geolocating, and PWA setup
├── manifest.json    # PWA configuration metadata and mobile display controls
├── sw.js            # Service worker caching and offline request interception
├── icon.svg         # High-fidelity vector launcher icon and branding shield
└── README.md        # Technical project manual
```

---

## 🚀 Quick Start / How to Run

Because the application is built entirely as a high-performance client-side SPA with zero heavy bundlers or build steps, running it is exceptionally easy:

### Method A: Direct Launch
1. Clone or download this repository.
2. Double-click the **`index.html`** file in your local file explorer to open it instantly in any modern web browser.

### Method B: Standalone App Installation
1. Open the project folder using a simple local HTTP server (e.g., VS Code Live Server, `npx http-server`, or `python -m http.server`).
2. Navigate to the localhost address in your web browser.
3. Click the **Install Icon** (+ or monitor arrow) in the browser's address bar to install **Skyflow** as a native, standalone app on your system!
