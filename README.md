# San Diego Homeless Resource Map (MVP)

This is the MVP for a digital map that shows shelters, safe zones, and alerts for the homeless community in San Diego.

## Tech Stack
- React + Vite
- Leaflet + OpenStreetMap
- Supabase (Postgres, Realtime, Auth)
- TailwindCSS
- Netlify (free hosting)

## Setup
1. Clone repo
```bash
git clone https://github.com/YOUR-USERNAME/homeless-resource-map.git
cd homeless-resource-map
```

2. Install dependencies
```bash
npm install
```

3. Copy `.env.example` → `.env` and add your Supabase keys.

4. Run locally
```bash
npm run dev
```

5. Deploy on Netlify (connect repo, it will auto-build).

## Database
Run the `supabase.sql` script inside your Supabase project.
