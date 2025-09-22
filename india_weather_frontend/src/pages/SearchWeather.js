import React, { useState } from 'react';
import { fetchWeatherByCoords, weatherCodeToText } from '../services/weatherService';
import WeatherBackground from '../components/WeatherBackground';

/**
 * PUBLIC_INTERFACE
 * SearchWeather
 * Allows authenticated users to search Indian locations (city/town/pin) and view current weather
 * in the same card-style UI as the home page.
 */
export default function SearchWeather() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]); // [{ display_name, lat, lon }]
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null); // { name, lat, lon }
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState('Enter a city/town or pin code within India');

  const searchLocations = async (e) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setSelected(null);
    setWeather(null);

    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setStatus('Searching locations...');
    try {
      // Nominatim forward geocoding confined to India (countrycodes=in)
      const url =
        'https://nominatim.openstreetmap.org/search?' +
        new URLSearchParams({
          q,
          format: 'json',
          addressdetails: '1',
          countrycodes: 'in',
          limit: '8',
        }).toString();

      const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!resp.ok) throw new Error(`Search failed: ${resp.status}`);
      const data = await resp.json();
      setResults(data || []);
      setStatus(`${(data || []).length} result(s)`);
    } catch (e2) {
      setError(e2?.message || 'Search failed');
      setStatus('Idle');
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = async (r) => {
    setSelected({
      name: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    });
    setWeather(null);
    setError('');
    setStatus('Fetching weather...');
    setLoading(true);
    try {
      const w = await fetchWeatherByCoords(parseFloat(r.lat), parseFloat(r.lon));
      setWeather(w);
      setStatus('Up to date');
    } catch (e3) {
      setError(e3?.message || 'Unable to fetch weather');
      setStatus('Idle');
    } finally {
      setLoading(false);
    }
  };

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
            <span className="kicker">Search India</span>
            <div className="location-line">
              <span role="img" aria-label="search">🔎</span>
              <span>Find weather by city, town, or pin code</span>
            </div>
            <div className="status">{status}</div>
          </div>
          <div className="actions"></div>
        </div>

        <form onSubmit={searchLocations} style={{ display: 'flex', gap: 10 }}>
          <input
            aria-label="Search location"
            placeholder="e.g. Mumbai, 560001, Varanasi"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
            style={{
              flex: 1,
              borderRadius: 10,
              border: '1px solid rgba(17,24,39,0.12)',
              padding: '10px 12px',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(17,24,39,0.04)',
            }}
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="card" role="alert" style={{ borderColor: 'rgba(239,68,68,0.35)', marginTop: 12 }}>
            <div className="card-title" style={{ color: 'var(--error)' }}>
              ⚠️ Error
            </div>
            <div className="card-value" style={{ fontSize: '1rem', fontWeight: 600 }}>
              {error}
            </div>
          </div>
        )}

        {!!results.length && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title">Results</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {results.map((r) => (
                <li key={`${r.place_id}`}>
                  <button
                    onClick={() => selectLocation(r)}
                    className="btn btn-ghost"
                    style={{ width: '100%', justifyContent: 'space-between' }}
                    title="Select this location"
                  >
                    <span style={{ textAlign: 'left' }}>
                      {r.display_name}
                    </span>
                    <span className="location-pill">
                      {parseFloat(r.lat).toFixed(2)}°, {parseFloat(r.lon).toFixed(2)}°
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selected && (
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title">Selected location</div>
            <div className="card-value" style={{ fontSize: '1rem' }}>{selected.name}</div>
            <div className="footer-note">
              Coords: {selected.lat.toFixed(2)}°, {selected.lon.toFixed(2)}°
            </div>
          </div>
        )}

        {weather && (
          <div className="cards" role="list" style={{ marginTop: 12 }}>
            <div className="card" role="listitem">
              <div className="card-title">Temperature</div>
              <div className="card-value">{temp}</div>
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
        )}
      </section>
      <p className="footer-note" style={{ marginTop: 10 }}>
        Data by Open‑Meteo • Geocoding by OpenStreetMap Nominatim
      </p>
      </main>
    </WeatherBackground>
  );
}
