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
- (optional) REACT_APP_SITE_URL=your_site_base_url (used for auth redirects if you later enable auth)

If not provided, the app still runs; Supabase-based logging will be disabled.

## Supabase Setup

See assets/supabase.md for database schema and RLS policies.
If automated provisioning is unavailable, run the SQL in the Supabase Dashboard.

IMPORTANT: Supabase Configuration Required (Dashboard)
1. Go to Authentication > URL Configuration
   - Set Site URL to your production domain (e.g., https://yourapp.com)
   - Add Redirect URLs:
     * http://localhost:3000/**
     * https://yourapp.com/**
2. Update email templates as needed (optional).
3. Ensure the `events` table and RLS policies are applied (see assets/supabase.md).

## Data Sources

- Weather data: https://open-meteo.com/
- Reverse geocoding: https://nominatim.openstreetmap.org/

## Notes

- Users must allow location access in the browser for automatic detection.
- The UI is optimized for a modern, professional look with Ocean Professional styling as specified.
