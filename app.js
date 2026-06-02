/* ----------------------------------------------------
   Skyflow Weather Dashboard - Core Javascript Application
   ---------------------------------------------------- */

// --- GLOBAL APPLICATION STATE ---
const state = {
    currentWeather: null, // Cached raw weather data in Celsius
    selectedLocation: {
        name: "San Francisco",
        country: "United States",
        latitude: 37.7749,
        longitude: -122.4194
    },
    useFahrenheit: false,
    theme: "theme-default"
};

// --- DOM ELEMENTS REFERENCE ---
const dom = {
    citySearch: document.getElementById("city-search"),
    clearSearch: document.getElementById("clear-search"),
    searchSuggestions: document.getElementById("search-suggestions"),
    gpsBtn: document.getElementById("gps-btn"),
    welcomeGpsBtn: document.getElementById("welcome-gps-btn"),
    unitCheckbox: document.getElementById("unit-checkbox"),
    installBtn: document.getElementById("install-btn"),
    loadingSpinner: document.getElementById("loading-spinner"),
    errorCard: document.getElementById("error-card"),
    errorMessage: document.getElementById("error-message"),
    errorRetryBtn: document.getElementById("error-retry-btn"),
    welcomeState: document.getElementById("welcome-state"),
    dashboardGrid: document.getElementById("dashboard-grid"),
    
    // Dashboard Components
    locationName: document.getElementById("location-name"),
    locationCountry: document.getElementById("location-country"),
    currentDate: document.getElementById("current-date"),
    currentTemp: document.getElementById("current-temp"),
    weatherDynamicIcon: document.getElementById("weather-dynamic-icon"),
    weatherDescription: document.getElementById("weather-description"),
    minMaxTemp: document.getElementById("min-max-temp"),
    
    // Metrics
    metricHumidity: document.getElementById("metric-humidity"),
    metricWind: document.getElementById("metric-wind"),
    metricWindDir: document.getElementById("metric-wind-dir"),
    metricUv: document.getElementById("metric-uv"),
    metricUvRisk: document.getElementById("metric-uv-risk"),
    metricRain: document.getElementById("metric-rain"),
    
    // Trends & Outlook
    hourlyTimeline: document.getElementById("hourly-timeline"),
    dailyForecast: document.getElementById("daily-forecast"),
    hourlyChart: document.getElementById("hourly-chart"),
    chartPathFill: document.getElementById("chart-path-fill"),
    chartPathLine: document.getElementById("chart-path-line"),
    chartDataNodes: document.getElementById("chart-data-nodes")
};

// --- CORE UTILITIES ---

/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds.
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Standard temperature conversion: Celsius to Fahrenheit
 */
function cToF(celsius) {
    return (celsius * 9 / 5) + 32;
}

/**
 * Formats a raw number to the active selected unit
 */
function formatTemp(tempC) {
    const value = state.useFahrenheit ? cToF(tempC) : tempC;
    return `${Math.round(value)}°`;
}

/**
 * Map standard WMO Weather Codes to descriptive strings, vector icons, and dynamic CSS themes.
 */
function getWeatherConfig(code, isDay = 1) {
    // Standard WMO weather interpretation codes
    const config = {
        0: { icon: isDay ? 'sun' : 'moon', label: 'Clear Sky', theme: isDay ? 'theme-sunny' : 'theme-night' },
        1: { icon: isDay ? 'cloud-sun' : 'cloud-moon', label: 'Mainly Clear', theme: isDay ? 'theme-sunny' : 'theme-night' },
        2: { icon: 'cloud', label: 'Partly Cloudy', theme: 'theme-cloudy' },
        3: { icon: 'cloud', label: 'Overcast', theme: 'theme-cloudy' },
        45: { icon: 'cloud-fog', label: 'Foggy', theme: 'theme-cloudy' },
        48: { icon: 'cloud-fog', label: 'Rime Fog', theme: 'theme-cloudy' },
        51: { icon: 'cloud-drizzle', label: 'Light Drizzle', theme: 'theme-rainy' },
        53: { icon: 'cloud-drizzle', label: 'Moderate Drizzle', theme: 'theme-rainy' },
        55: { icon: 'cloud-drizzle', label: 'Dense Drizzle', theme: 'theme-rainy' },
        56: { icon: 'snowflake', label: 'Light Freezing Drizzle', theme: 'theme-snowy' },
        57: { icon: 'snowflake', label: 'Heavy Freezing Drizzle', theme: 'theme-snowy' },
        61: { icon: 'cloud-rain', label: 'Slight Rain', theme: 'theme-rainy' },
        63: { icon: 'cloud-rain', label: 'Moderate Rain', theme: 'theme-rainy' },
        65: { icon: 'cloud-rain', label: 'Heavy Rain', theme: 'theme-rainy' },
        66: { icon: 'snowflake', label: 'Light Freezing Rain', theme: 'theme-snowy' },
        67: { icon: 'snowflake', label: 'Heavy Freezing Rain', theme: 'theme-snowy' },
        71: { icon: 'snowflake', label: 'Slight Snowfall', theme: 'theme-snowy' },
        73: { icon: 'snowflake', label: 'Moderate Snowfall', theme: 'theme-snowy' },
        75: { icon: 'snowflake', label: 'Heavy Snowfall', theme: 'theme-snowy' },
        77: { icon: 'snowflake', label: 'Snow Grains', theme: 'theme-snowy' },
        80: { icon: 'cloud-rain', label: 'Slight Rain Showers', theme: 'theme-rainy' },
        81: { icon: 'cloud-rain', label: 'Moderate Rain Showers', theme: 'theme-rainy' },
        82: { icon: 'cloud-rain', label: 'Violent Rain Showers', theme: 'theme-rainy' },
        85: { icon: 'cloud-snow', label: 'Slight Snow Showers', theme: 'theme-snowy' },
        86: { icon: 'cloud-snow', label: 'Heavy Snow Showers', theme: 'theme-snowy' },
        95: { icon: 'cloud-lightning', label: 'Thunderstorm', theme: 'theme-stormy' },
        96: { icon: 'cloud-lightning', label: 'Storm with Hail', theme: 'theme-stormy' },
        99: { icon: 'cloud-lightning', label: 'Heavy Storm with Hail', theme: 'theme-stormy' }
    };
    return config[code] || { icon: 'cloud', label: 'Cloudy', theme: 'theme-cloudy' };
}

/**
 * Converts wind direction in degrees to compass abbreviation
 */
function getWindCompass(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
}

/**
 * Returns qualitative UV risk rating label
 */
function getUvRiskLevel(uv) {
    if (uv < 3) return 'Low';
    if (uv < 6) return 'Moderate';
    if (uv < 8) return 'High';
    if (uv < 11) return 'Very High';
    return 'Extreme';
}

/**
 * Formats ISO timestamps to standard day name strings
 */
function formatDayName(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        return "Today";
    }
    return date.toLocaleDateString('en-US', { weekday: 'short' });
}

// --- DATA SERVICE CALLS (APIs) ---

/**
 * Fetches matching geocoding data for autocomplete city names.
 */
async function searchCities(query) {
    if (!query || query.trim().length < 2) {
        dom.searchSuggestions.classList.add("hidden");
        return;
    }

    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        if (!response.ok) throw new Error("Geocoding network error");
        
        const data = await response.json();
        renderSuggestions(data.results || []);
    } catch (err) {
        console.error("Geocoding API query failed: ", err);
    }
}

/**
 * Core function that fetches all relevant forecast details from the Open-Meteo Weather API
 */
async function fetchWeatherData(lat, lon) {
    showState("loading");
    
    // Core parameters mapping current condition, hourly trends, and daily outlook metrics
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_direction_10m,precipitation&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Forecast retrieval failed.");
        
        const data = await response.json();
        state.currentWeather = data;
        
        // Render all panels
        updateDashboardUI();
        showState("dashboard");
    } catch (err) {
        console.error("Weather API call failed: ", err);
        dom.errorMessage.textContent = "Unable to retrieve meteorological coordinates. Please verify your connection and try again.";
        showState("error");
    }
}

// --- UI RENDER & INTERACTIVE FUNCTIONS ---

/**
 * Switches the visual presentation state of the application
 */
function showState(currentState) {
    dom.loadingSpinner.classList.add("hidden");
    dom.errorCard.classList.add("hidden");
    dom.welcomeState.classList.add("hidden");
    dom.dashboardGrid.classList.add("hidden");

    if (currentState === "loading") {
        dom.loadingSpinner.classList.remove("hidden");
    } else if (currentState === "error") {
        dom.errorCard.classList.remove("hidden");
    } else if (currentState === "welcome") {
        dom.welcomeState.classList.remove("hidden");
        document.body.className = "theme-default";
    } else if (currentState === "dashboard") {
        dom.dashboardGrid.classList.remove("hidden");
    }
}

/**
 * Renders the city search autocomplete panel results
 */
function renderSuggestions(results) {
    if (results.length === 0) {
        dom.searchSuggestions.classList.add("hidden");
        return;
    }

    dom.searchSuggestions.innerHTML = "";
    results.forEach(loc => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        
        const namePart = loc.name;
        const regionPart = [loc.admin1, loc.country].filter(Boolean).join(", ");
        
        div.innerHTML = `
            <span class="suggestion-name">${namePart}</span>
            <span class="suggestion-region">${regionPart || "Unknown Region"} (Lat: ${loc.latitude.toFixed(2)}, Lon: ${loc.longitude.toFixed(2)})</span>
        `;
        
        // Item click handler to load this specific city's weather
        div.addEventListener("click", () => {
            state.selectedLocation = {
                name: loc.name,
                country: loc.country || "Global Coordinate",
                latitude: loc.latitude,
                longitude: loc.longitude
            };
            
            dom.citySearch.value = loc.name;
            dom.searchSuggestions.classList.add("hidden");
            dom.clearSearch.classList.remove("hidden");
            
            fetchWeatherData(loc.latitude, loc.longitude);
        });

        dom.searchSuggestions.appendChild(div);
    });

    dom.searchSuggestions.classList.remove("hidden");
}

/**
 * Computes, layouts, and renders the premium library-free interactive SVG Temperature Curve Chart.
 */
function renderHourlyChart(hourlyTemps) {
    const svgWidth = 800;
    const svgHeight = 180;
    const paddingX = 50;
    const paddingY = 40;

    // Identify temperature bounding scales in subset to dynamically center standard deviation range
    const temps = hourlyTemps.map(item => item.temp);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const tempRange = maxTemp - minTemp || 2; // Avoid divide by zero

    // Compute coordinate points mapping
    const points = hourlyTemps.map((item, idx) => {
        const x = paddingX + (idx * (svgWidth - 2 * paddingX) / (hourlyTemps.length - 1));
        const y = paddingY + (svgHeight - 2 * paddingY) * (1 - (item.temp - minTemp) / tempRange);
        return { x, y, temp: item.temp };
    });

    // Build standard Bezier curve path string
    let pathLine = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 3;
        const cpY1 = p0.y;
        const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
        const cpY2 = p1.y;
        pathLine += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Apply exact coordinate path outlines
    dom.chartPathLine.setAttribute("d", pathLine);

    // Dynamic Bezier path fill closed at bottom baseline coordinates
    const pathFill = `${pathLine} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;
    dom.chartPathFill.setAttribute("d", pathFill);

    // Injects hovering visual node circles and absolute text temperature nodes
    dom.chartDataNodes.innerHTML = "";
    points.forEach((pt) => {
        // Temperature float node circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", pt.x);
        circle.setAttribute("cy", pt.y);
        circle.setAttribute("r", "5.5");
        circle.setAttribute("class", "chart-dot");
        circle.setAttribute("fill", "var(--accent-color)");
        circle.setAttribute("stroke", "#ffffff");
        circle.setAttribute("stroke-width", "2");
        
        // Visual text label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", pt.x);
        text.setAttribute("y", pt.y - 12);
        text.setAttribute("class", "chart-label");
        text.textContent = formatTemp(pt.temp);

        dom.chartDataNodes.appendChild(circle);
        dom.chartDataNodes.appendChild(text);
    });
}

/**
 * Redraws, maps, and repopulates the entire Weather Dashboard interface using state caches
 */
function updateDashboardUI() {
    const data = state.currentWeather;
    if (!data) return;

    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;

    // 1. Resolve Weather Code config (icon, description, theme)
    const weatherConfig = getWeatherConfig(current.weather_code, current.is_day);

    // Apply the active dynamic CSS theme on body
    document.body.className = weatherConfig.theme;

    // 2. Load Location Details
    dom.locationName.textContent = state.selectedLocation.name;
    dom.locationCountry.textContent = state.selectedLocation.country;
    
    // Set formatted local time/date string
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    dom.currentDate.textContent = new Date().toLocaleDateString('en-US', options);

    // 3. Render Large Primary Weather Display
    dom.currentTemp.textContent = Math.round(state.useFahrenheit ? cToF(current.temperature_2m) : current.temperature_2m);
    dom.weatherDescription.textContent = weatherConfig.label;
    dom.weatherDynamicIcon.innerHTML = `<i data-lucide="${weatherConfig.icon}" class="main-weather-icon"></i>`;

    // 4. Set Daily high and low range badge
    const todayMax = daily.temperature_2m_max[0];
    const todayMin = daily.temperature_2m_min[0];
    dom.minMaxTemp.textContent = `Min: ${formatTemp(todayMin)} | Max: ${formatTemp(todayMax)}`;

    // 5. Populate Detailed Weather metrics
    dom.metricHumidity.textContent = `${current.relative_humidity_2m}%`;
    dom.metricWind.textContent = `${current.wind_speed_10m.toFixed(1)} km/h`;
    dom.metricWindDir.textContent = getWindCompass(current.wind_direction_10m);
    
    const uvIndex = daily.uv_index_max[0];
    dom.metricUv.textContent = uvIndex.toFixed(1);
    dom.metricUvRisk.textContent = getUvRiskLevel(uvIndex);
    
    // Fetch precipitation chance for the active current hour
    const currentHourIndex = new Date().getHours();
    dom.metricRain.textContent = `${hourly.precipitation_probability[currentHourIndex]}%`;

    // 6. Generate 8-Hour Consecutive Hourly Timeline Row & populate chart data points
    dom.hourlyTimeline.innerHTML = "";
    const currentHour = new Date().getHours();
    const hourlyDataPoints = [];

    for (let i = 0; i < 8; i++) {
        const targetIdx = currentHour + i;
        const timeStr = hourly.time[targetIdx];
        const temp = hourly.temperature_2m[targetIdx];
        const code = hourly.weather_code[targetIdx];
        
        // Cache node coordinates for SVG graph
        hourlyDataPoints.push({ temp });

        // Map hour time string to formatted clock layout
        const dateObj = new Date(timeStr);
        let hourLabel = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        if (i === 0) hourLabel = "Now";

        const hourConfig = getWeatherConfig(code, current.is_day);

        const item = document.createElement("div");
        item.className = `hourly-item ${i === 0 ? 'active' : ''}`;
        item.innerHTML = `
            <span class="hourly-time">${hourLabel}</span>
            <div class="hourly-icon-wrapper">
                <i data-lucide="${hourConfig.icon}"></i>
            </div>
            <span class="hourly-temp">${formatTemp(temp)}</span>
        `;
        dom.hourlyTimeline.appendChild(item);
    }

    // Call the SVG Line drawing function
    renderHourlyChart(hourlyDataPoints);

    // 7. Populates 7-Day Long range forecast list
    dom.dailyForecast.innerHTML = "";
    
    // Find aggregate bounding limits across all 7 days to size progress bars proportionately
    const globalMax = Math.max(...daily.temperature_2m_max);
    const globalMin = Math.min(...daily.temperature_2m_min);
    const globalRange = globalMax - globalMin || 2;

    for (let i = 0; i < 7; i++) {
        const timeStr = daily.time[i];
        const maxTemp = daily.temperature_2m_max[i];
        const minTemp = daily.temperature_2m_min[i];
        const code = daily.weather_code[i];

        const dayConfig = getWeatherConfig(code, 1); // Defaults to day icon on list

        // Compute proportional bar fill bounds
        const barLeft = ((minTemp - globalMin) / globalRange) * 100;
        const barRight = ((globalMax - maxTemp) / globalRange) * 100;

        const row = document.createElement("div");
        row.className = "daily-item";
        row.innerHTML = `
            <span class="daily-name">${formatDayName(timeStr)}</span>
            <div class="daily-icon-wrapper" title="${dayConfig.label}">
                <i data-lucide="${dayConfig.icon}"></i>
            </div>
            <div class="daily-temp-bar-container">
                <div class="daily-temp-bar-fill" style="left: ${barLeft}%; right: ${barRight}%;"></div>
            </div>
            <div class="daily-temps">
                <span class="daily-temp-max">${formatTemp(maxTemp)}</span>
                <span class="daily-temp-min">${formatTemp(minTemp)}</span>
            </div>
        `;
        dom.dailyForecast.appendChild(row);
    }

    // Refresh lucide SVG elements injected into DOM dynamically
    lucide.createIcons();
}

/**
 * Leverages standard HTML Geolocation to query and display local GPS coordinate weather
 */
function handleGPSLocate() {
    if (!navigator.geolocation) {
        alert("GPS telemetry is unsupported on this device.");
        return;
    }

    showState("loading");

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            state.selectedLocation = {
                name: "Current Location",
                country: `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° W`,
                latitude: lat,
                longitude: lon
            };

            dom.citySearch.value = "";
            dom.clearSearch.classList.add("hidden");

            fetchWeatherData(lat, lon);
        },
        (err) => {
            console.error("GPS access blocked: ", err);
            // Revert back to welcome or error if nothing is loaded
            if (!state.currentWeather) {
                showState("welcome");
            } else {
                showState("dashboard");
            }
            alert("Location access denied. Please verify browser permissions or search manually.");
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
}

// --- APP EVENT BINDINGS & LISTENERS ---

// Debounced autocomplete listener on search bar inputs
dom.citySearch.addEventListener("input", debounce((e) => {
    const val = e.target.value;
    if (val.trim().length >= 2) {
        dom.clearSearch.classList.remove("hidden");
        searchCities(val);
    } else {
        dom.clearSearch.classList.add("hidden");
        dom.searchSuggestions.classList.add("hidden");
    }
}, 350));

// Clears search block input and suggestions panels
dom.clearSearch.addEventListener("click", () => {
    dom.citySearch.value = "";
    dom.clearSearch.classList.add("hidden");
    dom.searchSuggestions.classList.add("hidden");
    dom.citySearch.focus();
});

// Closes autocomplete panel when clicking outside suggestions boundaries
document.addEventListener("click", (e) => {
    if (!dom.citySearch.contains(e.target) && !dom.searchSuggestions.contains(e.target)) {
        dom.searchSuggestions.classList.add("hidden");
    }
});

// GPS Navigation clicks
dom.gpsBtn.addEventListener("click", handleGPSLocate);
dom.welcomeGpsBtn.addEventListener("click", handleGPSLocate);

// temperature conversion toggle switch
dom.unitCheckbox.addEventListener("change", (e) => {
    state.useFahrenheit = e.target.checked;
    if (state.currentWeather) {
        updateDashboardUI();
    }
});

// Dismiss Error state button
dom.errorRetryBtn.addEventListener("click", () => {
    if (state.currentWeather) {
        showState("dashboard");
    } else {
        showState("welcome");
    }
});

// --- PWA INSTALL FUNCTIONALITY ---
let deferredPrompt; // Holds the install prompt event

window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent automatic install prompt
    e.preventDefault();
    deferredPrompt = e;
    
    // Show the install button
    if (dom.installBtn) {
        dom.installBtn.classList.remove("hidden");
    }
});

// Handle install button click
if (dom.installBtn) {
    dom.installBtn.addEventListener("click", async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            
            // Wait for user to respond
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            
            // Clear the deferred prompt
            deferredPrompt = null;
            
            // Hide the install button
            dom.installBtn.classList.add("hidden");
        }
    });
}

// Hide install button if app is already installed
window.addEventListener("appinstalled", () => {
    console.log("PWA was installed successfully");
    if (dom.installBtn) {
        dom.installBtn.classList.add("hidden");
    }
    deferredPrompt = null;
});

// --- INITIALIZE SYSTEM ---
window.addEventListener("DOMContentLoaded", () => {
    // Inject initial static Lucide Icons mapped in HTML templates
    lucide.createIcons();
    
    // Loads Default City (San Francisco) on bootstrap startup
    fetchWeatherData(state.selectedLocation.latitude, state.selectedLocation.longitude);

    // Register Progressive Web App (PWA) Service Worker for offline/install capabilities
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[Service Worker] Registered successfully: ', reg.scope))
            .catch(err => console.error('[Service Worker] Registration failed: ', err));
    }
});
