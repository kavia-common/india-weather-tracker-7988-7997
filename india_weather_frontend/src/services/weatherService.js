const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

/**
 * PUBLIC_INTERFACE
 * fetchWeatherByCoords
 * Fetches current weather metrics given latitude and longitude using Open-Meteo.
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ temperature:number, windspeed:number, winddirection:number, weathercode:number, time:string, humidity?:number }>}
 */
export async function fetchWeatherByCoords(lat, lon) {
  const query = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current_weather: 'true',
    hourly: 'relativehumidity_2m',
    timezone: 'auto',
  });

  const url = `${OPEN_METEO_ENDPOINT}?${query.toString()}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Weather fetch failed: ${resp.status}`);
  }
  const data = await resp.json();

  // current_weather contains core metrics
  const current = data.current_weather || {};
  // Find humidity from the nearest hour index if available
  let humidity;
  try {
    if (data.hourly && data.hourly.time && data.hourly.relativehumidity_2m) {
      const idx = data.hourly.time.indexOf(current.time);
      if (idx !== -1) humidity = data.hourly.relativehumidity_2m[idx];
    }
  } catch {
    // ignore
  }

  return {
    temperature: current.temperature,
    windspeed: current.windspeed,
    winddirection: current.winddirection,
    weathercode: current.weathercode,
    time: current.time,
    humidity,
  };
}

/**
 * PUBLIC_INTERFACE
 * resolveLocationName
 * Reverse geocodes lat/lon to a human-readable location using Nominatim (OpenStreetMap).
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string>}
 */
export async function resolveLocationName(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;

  const resp = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
  });
  if (!resp.ok) return `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`;

  const data = await resp.json();
  const { city, town, village, state, county, country } = data.address || {};
  const cityLike = city || town || village || county;
  const parts = [cityLike, state, country].filter(Boolean);
  return parts.join(', ') || `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`;
}

/**
 * PUBLIC_INTERFACE
 * weatherCodeToText
 * Map Open-Meteo weather code to a human-friendly string.
 */
export function weatherCodeToText(code) {
  const map = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Freezing drizzle',
    57: 'Freezing drizzle (dense)',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm with hail',
  };
  return map[code] || 'Unknown';
}
