# 🌤️ Skyflow Weather Dashboard

Skyflow is an ultra-premium, interactive, and beautifully designed **Weather Dashboard** built with modern web technologies. It is fully responsive, highly performant, features stunning **glassmorphic design aesthetics**, and is configured as a cross-platform desktop application using **Electron** as well as a **Progressive Web App (PWA)** for easy installation on mobile and web platforms.

Under the hood, Skyflow integrates two meteorological APIs:
1. **[Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api):** Completely free, zero-key public atmospheric data API used for fast, debounced city auto-suggestions.
2. **[OpenWeatherMap API](https://openweathermap.org/api):** Standard weather condition and multi-day forecasting API. This requires a free API key, which can be configured directly inside the application UI and is persisted in local storage.

---

## ✨ Features

- **🌈 Dynamic Aesthetic Themes:** The visual color scheme, ambient background meshes, and glowing accent circles shift dynamically matching real-time weather codes (Sunny/Clear, Cloudy, Rainy, Stormy, Snowy, Night/Dark).
- **🖥️ Desktop Electron App:** Packaged as a native desktop application with a borderless/chromeless modern layout (`main.js`).
- **📱 PWA Standalone Integration:** Installable directly from a web browser as a standalone desktop or mobile application. Includes a modern vector branding icon (`icon.svg`).
- **📶 Offline Support:** Employs a custom Service Worker (`sw.js`) utilizing a cache-first network-fallback strategy to load the app shell, stylesheets, icons, and dynamic scripts instantly—even offline.
- **📊 Library-Free SVG Curve Chart:** A lightweight, interactive vector temperature line chart drawn dynamically using custom SVG Bezier paths, glowing data nodes, and custom labels.
- **📅 5-Day Outlook with Deep Dive:** Browse the 5-day forecast with custom range bar visualizations. Click on any forecast day to dynamically re-render the SVG temperature chart and populate a detailed hourly forecast timeline for that day.
- **🔍 Geocoding Auto-Complete:** Fast, debounced (350ms) suggestions for searching cities worldwide.
- **📍 GPS Precision Locate:** Integrates with the browser Geolocation API to quickly fetch local coordinate conditions.
- **⚡ In-Memory Temp Scale Conversion:** Instantly toggles between Celsius (°C) and Fahrenheit (°F) cached values without triggering redundant network calls.

---

## 🛠️ Technology Stack

- **Core Structure:** HTML5 (Semantic and fully accessible markup)
- **Styling Architecture:** Vanilla CSS3 (Custom Glassmorphism, CSS variables, fluid keyframe micro-animations, and viewport grid layouts)
- **Application Engine:** ES6+ JavaScript (Asynchronous fetch promises, SVG path generators, input debouncers, and client-side state management)
- **Desktop Runtime:** Electron (v42.3.2)
- **Icons & Typography:** Outfit & Inter (Google Fonts) and Lucide Vectors (CDN)

---

## 📂 Project Structure

```
Weather App/
├── index.html       # Primary layout, grid container, and application shell
├── style.css        # Glassmorphic styles, keyframes, variables, and weather themes
├── app.js           # API clients, SVG curve plotting, timeline renderers, and state logic
├── main.js          # Electron desktop main entry process and browser window controllers
├── package.json     # Node scripts, build configs, and package manager details
├── manifest.json    # PWA configuration metadata and mobile standalone controls
├── sw.js            # PWA Service Worker script for offline asset caching
├── icon.svg         # High-fidelity vector launcher and branding icon
└── README.md        # Technical project documentation
```

---

## 🚀 Quick Start / How to Run

### 🌐 Web Browser & PWA Mode

#### Method A: Direct Launch
1. Clone or download this repository.
2. Double-click the **`index.html`** file in your local file explorer to open it in any modern web browser.
*Note: Service Worker caching and PWA installation require a secure origin (HTTPS or localhost) and will not initialize via `file://` URLs.*

#### Method B: PWA Local Server Installation
1. Start a simple local HTTP server from the root directory:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (npx)
   npx http-server -p 8000
   ```
2. Navigate to `http://localhost:8000` in your web browser.
3. Click the **Install** button in the top navigation bar (or via the browser's address bar prompt) to install **Skyflow** as a native desktop or mobile app.

---

### 💻 Electron Desktop Mode

#### Prerequisites
- Make sure [Node.js](https://nodejs.org/) is installed on your computer.

#### 1. Install Dependencies
Run the following command in the workspace directory to install Electron:
```bash
npm install
```

#### 2. Run the Application
Start the Electron desktop frame locally:
```bash
npm start
```

#### 3. Package the Executable
To package the app into a standalone production installer/executable (e.g., Windows NSIS target):
```bash
npm run dist
```
The packaged assets and ready-to-use binaries will be generated inside the `dist/` directory.

---

## 🔑 API Configuration

1. Launch the app (web, PWA, or Electron desktop).
2. On initial startup, a setup card will guide you to enter an **OpenWeatherMap API Key**.
3. If you do not have one, register for free at [OpenWeatherMap App ID](https://openweathermap.org/appid) to obtain your key.
4. Input the key in the field and click **Save**. You can update this key anytime by clicking the **API Key** button in the header controls.
