# India Weather Frontend

A modern React web app that detects the user's current location in India and displays real-time weather using an Ocean Professional theme with blue and amber accents. Includes optional Supabase integration for basic event logging.

## Features

- Automatic location detection (browser geolocation)
- Real-time weather fetch (Open-Meteo)
- Reverse geocoding for location names (OpenStreetMap Nominatim)
- Minimalist modern UI with rounded cards, shadows, gradients, and subtle transitions
- Refresh button
- Supabase integration via environment variables (optional)

## Getting Started

Install dependencies:
- npm install

Run in development:
- npm start
Open http://localhost:3000 in your browser.

Build for production:
- npm run build

## Environment Variables

Set these in a .env file at the project root (or via your deployment environment). Do not commit secrets.

- REACT_APP_SUPABASE_URL=your_supabase_project_url
- REACT_APP_SUPABASE_KEY=your_supabase_anon_key

If not provided, the app still runs; Supabase-based logging will be disabled.

## Data Sources

- Weather data: https://open-meteo.com/
- Reverse geocoding: https://nominatim.openstreetmap.org/

## Notes

- Users must allow location access in the browser for automatic detection.
- The UI is optimized for a modern, professional look with Ocean Professional styling as specified.
