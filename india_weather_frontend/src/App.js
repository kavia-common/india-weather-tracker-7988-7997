import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { fetchWeatherByCoords, resolveLocationName, weatherCodeToText } from './services/weatherService';
import { logEvent } from './supabaseClient';
import WeatherBackground from './components/WeatherBackground';

/**
 * PUBLIC_INTERFACE
 * App
 * Home page component for the India Weather frontend.
 * - Detects user location via Geolocation API
 * - Fetches real-time weather for detected coordinates
 * - Displays metrics in card-style UI with Ocean Professional theme
 * - Provides a refresh action
 * - Logs basic events to Supabase if configured
 */
function App() {
  const [coords, setCoords] = useState(null); // { lat, lon }
  const [locationName, setLocationName] = useState('');
  const [weather, setWeather] = useState(null); // weather object
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [permission, setPermission] = useState('prompt'); // prompt | granted | denied
  const [error, setError] = useState('');

  const canGeolocate = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Determine India locale clock format (IST offset used for display note)
  const timeLabel = useMemo(() => {
    if (!weather?.time) return '';
    try {
      const d = new Date(weather.time);
      return d.toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return weather.time;
    }
  }, [weather]);

  useEffect(() => {
    async function checkPerm() {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const res = await navigator.permissions.query({ name: 'geolocation' });
          setPermission(res.state);
          res.onchange = () => setPermission(res.state);
        }
      } catch {
        // ignore
      }
    }
    checkPerm();
  }, []);

  useEffect(() => {
    handleRefresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function detectLocation() {
    if (!canGeolocate) {
      throw new Error('Geolocation is not supported by this browser.');
    }
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    });
  }

  // PUBLIC_INTERFACE
  async function handleRefresh(isInitial = false) {
    setLoading(true);
    setError('');
    setStatus(isInitial ? 'Detecting location...' : 'Refreshing...');

    try {
      const c = await detectLocation();
      setCoords(c);
      setStatus('Resolving location name...');
      const name = await resolveLocationName(c.lat, c.lon);
      setLocationName(name);

      setStatus('Fetching weather...');
      const w = await fetchWeatherByCoords(c.lat, c.lon);
      setWeather(w);
      setStatus('Up to date');

      await logEvent(isInitial ? 'initial_load' : 'refresh', { coords: c, location: name });
      if (permission !== 'granted') setPermission('granted');
    } catch (e) {
      console.warn('Refresh error:', e);
      let msg = 'Unable to fetch weather.';
      if (e && e.code === 1) {
        msg = 'Location permission denied. Please allow location access.';
        setPermission('denied');
        await logEvent('location_denied', {});
      } else if (e && e.message) {
        msg = e.message;
      }
      setError(msg);
      setStatus('Idle');
    } finally {
      setLoading(false);
    }
  }

  const temp = weather?.temperature != null ? `${Math.round(weather.temperature)}°C` : '--';
  const wind = weather?.windspeed != null ? `${Math.round(weather.windspeed)} km/h` : '--';
  const humidity = weather?.humidity != null ? `${Math.round(weather.humidity)}%` : '—';
  const direction = weather?.winddirection != null ? `${Math.round(weather.winddirection)}°` : '—';
  const condition = weather ? weatherCodeToText(weather.weathercode) : '—';

  return (
    <WeatherBackground
      scope="document"
      weatherCode={weather?.weathercode}
      conditionText={condition}
    >
    <main className="container">
      <section className="hero" aria-live="polite">
        <div className="hero-top">
          <div className="location">
            <span className="kicker">Your location</span>
            <div className="location-line">
              <span role="img" aria-label="location">📍</span>
              <span>{locationName || (permission === 'denied' ? 'Permission denied' : 'Detecting...')}</span>
              {coords && (
                <span className="location-pill" title="Coordinates">
                  {coords.lat.toFixed(2)}°, {coords.lon.toFixed(2)}°
                </span>
              )}
            </div>
            <div className="status">{status}{timeLabel ? ` • ${timeLabel} (local)` : ''}</div>
          </div>

          <div className="actions">
            <button
              className="btn btn-ghost"
              onClick={() => handleRefresh(false)}
              disabled={loading}
              aria-busy={loading ? 'true' : 'false'}
              aria-label="Refresh weather"
              title="Refresh"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            {!coords && permission === 'denied' && (
              <button
                className="btn btn-primary"
                onClick={() => handleRefresh(false)}
              >
                Retry Location
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="card" role="alert" style={{ borderColor: 'rgba(239,68,68,0.35)' }}>
            <div className="card-title" style={{ color: 'var(--error)' }}>
              ⚠️ Error
            </div>
            <div className="card-value" style={{ fontSize: '1rem', fontWeight: 600 }}>
              {error}
            </div>
            <div className="footer-note">
              Tip: Check browser settings to allow location access for this site.
            </div>
          </div>
        )}

        <div className="cards" role="list">
          <div className="card" role="listitem">
            <div className="card-title">Temperature</div>
            <div className="card-value" aria-live="polite">{temp}</div>
          </div>
          <div className="card" role="listitem">
            <div className="card-title">Condition</div>
            <div className="card-value">{condition}</div>
          </div>
          <div className="card" role="listitem">
            <div className="card-title">Wind</div>
            <div className="card-value">{wind}</div>
            <div className="footer-note">Dir: {direction}</div>
          </div>
          <div className="card" role="listitem">
            <div className="card-title">Humidity</div>
            <div className="card-value">{humidity}</div>
          </div>
        </div>
      </section>

      <p className="footer-note" style={{ marginTop: 10 }}>
        Data by Open‑Meteo • Reverse geocoding by OpenStreetMap Nominatim
      </p>
    </main>
    </WeatherBackground>
  );
}

export default App;
