# DriveScape

DriveScape is a location-based discovery driving app. The current build shows a Mapbox-powered drive dashboard with scenic route suggestions, nearby landmark discoveries, score tracking, and check-in style game mechanics.

The long-term idea is to turn driving into a discovery game: instead of only finding the fastest route, DriveScape helps surface interesting roads, local landmarks, scenic stops, and travel facts around the driver.

## Current Features

- Full-screen Mapbox map with street and satellite modes
- Scenic route overlays rendered as GeoJSON `LineString` features
- Landmark discovery pins rendered as GeoJSON `Point` features
- Route cards with distance, curve count, difficulty, and vibe
- Landmark cards with facts, points, rarity, and check-in state
- Score and discovery progress tracking in the frontend
- Basic auth wiring with Supabase support
- Express backend with health, routes, and landmarks endpoints
- Mock landmark data, including the local "Humble Beginnings" test landmark

## Tech Stack

- Frontend: React, Vite, Mapbox GL JS
- Backend: Node.js, Express
- Auth: Supabase client support
- Data format: GeoJSON
- Planned later: PostgreSQL + PostGIS

## Project Structure

```text
DriveScape/
  backend/
    server.js
    landmarks.js
    scenicRoutes.js
    overpassRoutes.js
  frontend/
    src/
      DriveApp.jsx
      Hud.jsx
      Hud.css
      AuthContext.jsx
```

## Setup

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Environment Variables

Create `frontend/.env`:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_project_url_optional
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_optional
```

Create `backend/.env` if you want to override the default port:

```env
PORT=3000
```

Supabase is optional right now. If the Supabase variables are missing, the app can still run without real auth.

## Running Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173/app
```

## Backend API

Health check:

```http
GET /api/health
```

Nearby scenic routes:

```http
GET /api/routes/nearby?lat=39.91946870417404&lng=-83.1277664397881
```

Nearby landmarks:

```http
GET /api/landmarks/nearby?lat=39.91946870417404&lng=-83.1277664397881
```

Optional landmark radius:

```http
GET /api/landmarks/nearby?lat=39.91946870417404&lng=-83.1277664397881&radiusMi=20
```

Both route and landmark endpoints return GeoJSON `FeatureCollection` responses.

## Frontend Scripts

From `frontend/`:

```bash
npm run dev
npm run build
npm run lint
```

## Backend Scripts

From `backend/`:

```bash
npm run dev
npm start
```

## Roadmap

- Replace mock landmarks with a real global landmark database
- Add persistent user profiles and visited-place history
- Add Postgres/PostGIS for geospatial queries
- Improve check-in validation
- Add route generation tuned for scenic, twisty, tourist, and local-discovery drives
- Add leaderboards, badges, regions, and trip collections

## Status

DriveScape is in early prototype mode. The frontend experience, route rendering, landmark cards, and basic scoring loop are working, while the data layer is still mostly mocked or generated from public map data.
