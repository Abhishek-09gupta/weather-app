/* ----------------------------------------------------
   Skyflow Weather Dashboard - Core Javascript Application
   ---------------------------------------------------- */

// --- GLOBAL APPLICATION STATE ---
const state = {
    currentWeather: null,  // Cached parsed current weather data
    hourlyForecast: [],    // Next 8 forecast items (3-hour intervals)
    dailyForecast: [],     // 5-day processed forecast
    fullForecastList: [],  // Full forecast list (for day click details)
    selectedLocation: {
        name: "Mumbai",
        country: "India",
        latitude: 19.0760,
        longitude: 72.8777
    },
    useFahrenheit: false,
    theme: "theme-default",
    apiKey: localStorage.getItem("openweather_api_key") || ""
};

// --- DOM ELEMENTS REFERENCE ---
const dom = {
    apiKeyBtn: document.getElementById("api-key-btn"),
    apiKeyDropdown: document.getElementById("api-key-dropdown"),
    apiKeyInput: document.getElementById("api-key-input"),
    apiKeySaveBtn: document.getElementById("api-key-save-btn"),
    apiKeySetupState: document.getElementById("api-key-setup-state"),
    setupKeyInput: document.getElementById("setup-key-input"),
    setupKeySaveBtn: document.getElementById("setup-key-save-btn"),

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
 * Map OpenWeatherMap Condition IDs to descriptive strings, vector icons, and dynamic CSS themes.
 */
function getOpenWeatherConfig(id, iconCode) {
    const isDay = iconCode ? iconCode.endsWith('d') : true;
    
    // Clear sky
    if (id === 800) {
        return { icon: isDay ? 'sun' : 'moon', label: 'Clear Sky', theme: isDay ? 'theme-sunny' : 'theme-night' };
    }
    // Clouds
    if (id === 801 || id === 802) {
        return { icon: isDay ? 'cloud-sun' : 'cloud-moon', label: id === 801 ? 'Few Clouds' : 'Scattered Clouds', theme: isDay ? 'theme-sunny' : 'theme-night' };
    }
    if (id === 803 || id === 804) {
        return { icon: 'cloud', label: id === 803 ? 'Broken Clouds' : 'Overcast Clouds', theme: 'theme-cloudy' };
    }
    // Thunderstorm
    if (id >= 200 && id < 300) {
        return { icon: 'cloud-lightning', label: 'Thunderstorm', theme: 'theme-stormy' };
    }
    // Drizzle
    if (id >= 300 && id < 400) {
        return { icon: 'cloud-drizzle', label: 'Drizzle', theme: 'theme-rainy' };
    }
    // Rain
    if (id >= 500 && id < 600) {
        if (id === 511) {
            return { icon: 'snowflake', label: 'Freezing Rain', theme: 'theme-snowy' };
        }
        return { icon: 'cloud-rain', label: 'Rainy', theme: 'theme-rainy' };
    }
    // Snow
    if (id >= 600 && id < 700) {
        return { icon: 'snowflake', label: 'Snowy', theme: 'theme-snowy' };
    }
    // Atmosphere (fog, haze, etc.)
    if (id >= 700 && id < 800) {
        return { icon: 'cloud-fog', label: 'Foggy', theme: 'theme-cloudy' };
    }
    return { icon: 'cloud', label: 'Cloudy', theme: 'theme-cloudy' };
}

/**
 * Simple estimation of UV index based on weather ID and latitude
 */
function estimateUvIndex(weatherId, lat) {
    let base = 5.0; // Moderate
    if (weatherId === 800) base = 8.0; // Clear
    else if (weatherId < 800) base = 2.0; // Stormy/rainy/snowy
    else base = 4.0; // Cloudy
    
    // Reduce UV for higher latitudes
    const latFactor = Math.cos(lat * Math.PI / 180);
    return Math.max(0.5, Math.min(11, base * latFactor));
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
 * Utility to parse current weather and forecast responses from OpenWeatherMap into state variables.
 */
function parseWeatherData(currentData, forecastData) {
    // 1. Current condition parse
    const firstForecast = forecastData.list[0];
    const precipProbability = firstForecast && firstForecast.pop ? Math.round(firstForecast.pop * 100) : 0;
    
    state.currentWeather = {
        temp: currentData.main.temp,
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind.speed * 3.6, // m/s to km/h
        windDeg: currentData.wind.deg,
        weatherId: currentData.weather[0].id,
        iconCode: currentData.weather[0].icon,
        description: currentData.weather[0].description,
        isDay: currentData.weather[0].icon.endsWith('d') ? 1 : 0,
        feelsLike: currentData.main.feels_like,
        uvIndex: estimateUvIndex(currentData.weather[0].id, currentData.coord.lat),
        precipitation: precipProbability
    };
    
    // Cache raw list for daily select clicks
    state.fullForecastList = forecastData.list;
    
    // 2. Hourly forecast parse (first 8 slots, which covers 24 hours in 3-hour increments)
    state.hourlyForecast = forecastData.list.slice(0, 8).map(item => {
        return {
            time: item.dt * 1000,
            temp: item.main.temp,
            weatherId: item.weather[0].id,
            iconCode: item.weather[0].icon,
            description: item.weather[0].description,
            pop: Math.round((item.pop || 0) * 100)
        };
    });
    
    // 3. Process 5-Day Outlook (group 3-hour slots by day)
    const days = {};
    forecastData.list.forEach(item => {
        const dateStr = item.dt_txt.split(' ')[0]; // 'YYYY-MM-DD'
        if (!days[dateStr]) {
            days[dateStr] = {
                temps: [],
                weatherIds: {},
                pops: [],
                item: item
            };
        }
        days[dateStr].temps.push(item.main.temp);
        days[dateStr].pops.push(item.pop || 0);
        
        const wId = item.weather[0].id;
        days[dateStr].weatherIds[wId] = (days[dateStr].weatherIds[wId] || 0) + 1;
    });
    
    const dailyList = Object.keys(days).map(dateStr => {
        const dData = days[dateStr];
        const maxTemp = Math.max(...dData.temps);
        const minTemp = Math.min(...dData.temps);
        const maxPop = Math.max(...dData.pops);
        
        let dominantId = 800;
        let maxCount = 0;
        for (const [id, count] of Object.entries(dData.weatherIds)) {
            if (count > maxCount) {
                maxCount = count;
                dominantId = parseInt(id);
            }
        }
        
        return {
            dateStr,
            temp_max: maxTemp,
            temp_min: minTemp,
            pop: Math.round(maxPop * 100),
            weatherId: dominantId,
            iconCode: dData.item.weather[0].icon,
            description: dData.item.weather[0].description
        };
    });
    
    // Sort chronologically and take first 5 days
    state.dailyForecast = dailyList.sort((a, b) => a.dateStr.localeCompare(b.dateStr)).slice(0, 5);
}

/**
 * Core function that fetches all relevant forecast details from OpenWeatherMap Weather API.
 */
async function fetchWeatherData(lat, lon) {
    if (!state.apiKey) {
        showState("api-key-setup");
        return;
    }

    showState("loading");
    
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${state.apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${state.apiKey}&units=metric`;

    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);
        
        if (!currentRes.ok || !forecastRes.ok) {
            throw new Error("Unable to retrieve meteorological coordinates. Confirm your API Key is correct.");
        }
        
        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();
        
        parseWeatherData(currentData, forecastData);
        
        if (state.selectedLocation.name === "Current Location") {
            state.selectedLocation.name = currentData.name;
            state.selectedLocation.country = currentData.sys.country || "GPS Coordinate";
        }
        
        updateDashboardUI();
        showState("dashboard");
    } catch (err) {
        console.error("OpenWeatherMap coordinate fetch failed: ", err);
        dom.errorMessage.textContent = err.message || "Failed to load location coordinates. Check API key and network connection.";
        showState("error");
    }
}

/**
 * Fetches weather data directly by city name using OpenWeatherMap.
 */
async function fetchWeatherDataByName(cityName) {
    if (!state.apiKey) {
        showState("api-key-setup");
        return;
    }
    
    if (!cityName || cityName.trim().length < 2) return;
    
    showState("loading");
    
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${state.apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${state.apiKey}&units=metric`;
    
    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentUrl),
            fetch(forecastUrl)
        ]);
        
        if (!currentRes.ok || !forecastRes.ok) {
            throw new Error(`Could not locate the city "${cityName}". Please check your spelling and try again.`);
        }
        
        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();
        
        state.selectedLocation = {
            name: currentData.name,
            country: currentData.sys.country || "Global Region",
            latitude: currentData.coord.lat,
            longitude: currentData.coord.lon
        };
        
        dom.citySearch.value = currentData.name;
        dom.clearSearch.classList.remove("hidden");
        
        parseWeatherData(currentData, forecastData);
        
        updateDashboardUI();
        showState("dashboard");
    } catch (err) {
        console.error("OpenWeatherMap city search failed: ", err);
        dom.errorMessage.textContent = err.message || "City search query failed. Ensure spelling is correct.";
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
    if (dom.apiKeySetupState) dom.apiKeySetupState.classList.add("hidden");

    if (currentState === "loading") {
        dom.loadingSpinner.classList.remove("hidden");
    } else if (currentState === "error") {
        dom.errorCard.classList.remove("hidden");
    } else if (currentState === "welcome") {
        dom.welcomeState.classList.remove("hidden");
        document.body.className = "theme-default";
    } else if (currentState === "api-key-setup") {
        if (dom.apiKeySetupState) dom.apiKeySetupState.classList.remove("hidden");
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
 * Updates the hourly timeline display when a specific day is selected from 7-Day Outlook
 */
function renderHourlyTimeline(dateStr, dayHourlyRaw) {
    if (!dom.hourlyTimeline) return;
    
    dom.hourlyTimeline.innerHTML = "";
    
    // Display selected day header
    const header = document.createElement("div");
    header.style.fontSize = "14px";
    header.style.fontWeight = "600";
    header.style.color = "rgba(255,255,255,0.8)";
    header.style.marginBottom = "16px";
    header.style.paddingBottom = "12px";
    header.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
    header.textContent = `Hourly Forecast - ${formatDayName(dateStr)}`;
    dom.hourlyTimeline.appendChild(header);
    
    // Create hourly items for the selected day
    dayHourlyRaw.forEach(item => {
        const dateObj = new Date(item.dt * 1000);
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const tempStr = formatTemp(item.main.temp);
        const precipStr = `${Math.round((item.pop || 0) * 100)}%`;
        
        const hourItem = document.createElement("div");
        hourItem.style.display = "flex";
        hourItem.style.alignItems = "center";
        hourItem.style.justifyContent = "space-between";
        hourItem.style.padding = "10px 0";
        hourItem.style.fontSize = "13px";
        hourItem.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
        
        hourItem.innerHTML = `
            <span style="color: rgba(255,255,255,0.9);">${timeStr}</span>
            <span style="color: var(--accent-color); font-weight: 600;">${tempStr}</span>
            <span style="color: rgba(99, 150, 241, 0.8);" title="Precipitation chance">💧 ${precipStr}</span>
        `;
        
        dom.hourlyTimeline.appendChild(hourItem);
    });
}

/**
 * Redraws, maps, and repopulates the entire Weather Dashboard interface using state caches.
 */
function updateDashboardUI() {
    const current = state.currentWeather;
    if (!current) return;

    const hourly = state.hourlyForecast;
    const daily = state.dailyForecast;

    // 1. Resolve weather config ID to design variables
    const weatherConfig = getOpenWeatherConfig(current.weatherId, current.iconCode);

    // Apply active CSS theme on body
    document.body.className = weatherConfig.theme;

    // 2. Location name and country
    dom.locationName.textContent = state.selectedLocation.name;
    dom.locationCountry.textContent = state.selectedLocation.country;
    
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    dom.currentDate.textContent = new Date().toLocaleDateString('en-US', options);

    // 3. Main temperature display
    dom.currentTemp.textContent = Math.round(state.useFahrenheit ? cToF(current.temp) : current.temp);
    dom.weatherDescription.textContent = current.description.charAt(0).toUpperCase() + current.description.slice(1);
    dom.weatherDynamicIcon.innerHTML = `<i data-lucide="${weatherConfig.icon}" class="main-weather-icon"></i>`;

    // 4. Set Daily high and low range badge
    const todayMax = daily[0] ? daily[0].temp_max : current.temp;
    const todayMin = daily[0] ? daily[0].temp_min : current.temp;
    dom.minMaxTemp.textContent = `Min: ${formatTemp(todayMin)} | Max: ${formatTemp(todayMax)}`;

    // 5. Metric card data values
    dom.metricHumidity.textContent = `${current.humidity}%`;
    dom.metricWind.textContent = `${current.windSpeed.toFixed(1)} km/h`;
    dom.metricWindDir.textContent = getWindCompass(current.windDeg);
    
    dom.metricUv.textContent = current.uvIndex.toFixed(1);
    dom.metricUvRisk.textContent = getUvRiskLevel(current.uvIndex);
    dom.metricRain.textContent = `${current.precipitation}%`;

    // 6. Generate 8 consecutive hourly trend list items
    dom.hourlyTimeline.innerHTML = "";
    const hourlyDataPoints = [];

    hourly.forEach((hourData, i) => {
        hourlyDataPoints.push({ temp: hourData.temp });

        const dateObj = new Date(hourData.time);
        let hourLabel = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        if (i === 0) hourLabel = "Now";

        const hourConfig = getOpenWeatherConfig(hourData.weatherId, hourData.iconCode);

        const item = document.createElement("div");
        item.className = `hourly-item ${i === 0 ? 'active' : ''}`;
        item.innerHTML = `
            <span class="hourly-time">${hourLabel}</span>
            <div class="hourly-icon-wrapper">
                <i data-lucide="${hourConfig.icon}"></i>
            </div>
            <span class="hourly-temp">${formatTemp(hourData.temp)}</span>
        `;
        dom.hourlyTimeline.appendChild(item);
    });

    renderHourlyChart(hourlyDataPoints);

    // 7. Populates 5-day Outlook list rows
    dom.dailyForecast.innerHTML = "";
    
    const dailyMaxes = daily.map(d => d.temp_max);
    const dailyMines = daily.map(d => d.temp_min);
    const globalMax = Math.max(...dailyMaxes);
    const globalMin = Math.min(...dailyMines);
    const globalRange = globalMax - globalMin || 2;

    daily.forEach((dayData, i) => {
        const dayConfig = getOpenWeatherConfig(dayData.weatherId, dayData.iconCode);
        const barLeft = ((dayData.temp_min - globalMin) / globalRange) * 100;
        const barRight = ((globalMax - dayData.temp_max) / globalRange) * 100;

        const row = document.createElement("div");
        row.className = "daily-item";
        row.style.cursor = "pointer";
        row.innerHTML = `
            <span class="daily-name">${formatDayName(dayData.dateStr)}</span>
            <div class="daily-icon-wrapper" title="${dayConfig.label}">
                <i data-lucide="${dayConfig.icon}"></i>
            </div>
            <div class="daily-temp-bar-container">
                <div class="daily-temp-bar-fill" style="left: ${barLeft}%; right: ${barRight}%;"></div>
            </div>
            <div class="daily-temps">
                <span class="daily-temp-max">${formatTemp(dayData.temp_max)}</span>
                <span class="daily-temp-min">${formatTemp(dayData.temp_min)}</span>
            </div>
        `;
        
        // Add click handler to filter hourly data for that specific forecast day
        row.addEventListener("click", () => {
            document.querySelectorAll(".daily-item").forEach(item => {
                item.classList.remove("active");
            });
            
            row.classList.add("active");
            
            const dateStr = dayData.dateStr;
            const dayHourlyRaw = state.fullForecastList.filter(item => item.dt_txt.split(' ')[0] === dateStr);
            const dayHourlyTemps = dayHourlyRaw.map(item => ({ temp: item.main.temp }));
            
            renderHourlyChart(dayHourlyTemps);
            renderHourlyTimeline(dayData.dateStr, dayHourlyRaw);
        });
        
        if (i === 0) {
            row.classList.add("active");
        }
        
        dom.dailyForecast.appendChild(row);
    });

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

// Handles direct search when user presses Enter key in search input
dom.citySearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const val = e.target.value;
        if (val.trim().length >= 2) {
            dom.searchSuggestions.classList.add("hidden");
            fetchWeatherDataByName(val);
        }
    }
});

// Clears search block input and suggestions panels
dom.clearSearch.addEventListener("click", () => {
    dom.citySearch.value = "";
    dom.clearSearch.classList.add("hidden");
    dom.searchSuggestions.classList.add("hidden");
    dom.citySearch.focus();
});

// Closes suggestions and API Key dropdowns on outside boundaries click
document.addEventListener("click", (e) => {
    if (!dom.citySearch.contains(e.target) && !dom.searchSuggestions.contains(e.target)) {
        dom.searchSuggestions.classList.add("hidden");
    }
    if (dom.apiKeyDropdown && !dom.apiKeyDropdown.contains(e.target) && !dom.apiKeyBtn.contains(e.target)) {
        dom.apiKeyDropdown.classList.add("hidden");
    }
});

// Toggle API key configuration dropdown
if (dom.apiKeyBtn) {
    dom.apiKeyBtn.addEventListener("click", () => {
        dom.apiKeyDropdown.classList.toggle("hidden");
        if (!dom.apiKeyDropdown.classList.contains("hidden")) {
            dom.apiKeyInput.value = state.apiKey;
            dom.apiKeyInput.focus();
        }
    });
}

// Function to handle saving of the API key
function handleSaveAPIKey(newKey) {
    if (!newKey || newKey.trim() === "") {
        alert("Please enter a valid API Key.");
        return;
    }
    
    state.apiKey = newKey.trim();
    localStorage.setItem("openweather_api_key", state.apiKey);
    
    // Refresh weather information
    fetchWeatherData(state.selectedLocation.latitude, state.selectedLocation.longitude);
}

if (dom.apiKeySaveBtn) {
    dom.apiKeySaveBtn.addEventListener("click", () => {
        handleSaveAPIKey(dom.apiKeyInput.value);
        dom.apiKeyDropdown.classList.add("hidden");
    });
}

if (dom.setupKeySaveBtn) {
    dom.setupKeySaveBtn.addEventListener("click", () => {
        handleSaveAPIKey(dom.setupKeyInput.value);
    });
}

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
        if (!state.apiKey) {
            showState("api-key-setup");
        } else {
            showState("welcome");
        }
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
    
    // Checks if key is configured, else prompt onboard
    if (!state.apiKey) {
        showState("api-key-setup");
    } else {
        // Loads Default City (Mumbai, India) on bootstrap startup
        fetchWeatherData(state.selectedLocation.latitude, state.selectedLocation.longitude);
    }

    // Register Progressive Web App (PWA) Service Worker for offline/install capabilities
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('[Service Worker] Registered successfully: ', reg.scope))
            .catch(err => console.error('[Service Worker] Registration failed: ', err));
    }
});
