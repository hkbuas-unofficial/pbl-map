# Cloudflare Worker + D1 Deployment Guide

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

Login to Cloudflare:
```bash
npx wrangler login
```

## Step 2: Create D1 Database

```bash
cd api
npx wrangler d1 create pbl-map-db
```

Copy the `database_id` from the output.

## Step 3: Update wrangler.toml

Open `api/wrangler.toml` and replace `<YOUR_DATABASE_ID>` with the actual ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "pbl-map-db"
database_id = "your-actual-database-id-here"
```

## Step 4: Create Tables

```bash
npx wrangler d1 execute pbl-map-db --local --file=./schema.sql
```

Then deploy to remote:
```bash
npx wrangler d1 execute pbl-map-db --remote --file=./schema.sql
```

## Step 5: Deploy the Worker

```bash
npx wrangler deploy
```

Your Worker will be live at:
```
https://pbl-map-api.YOUR_SUBDOMAIN.workers.dev
```

## Step 6: Update App API URL

Open `src/lib/tracking.js` and replace the placeholder:

```javascript
const API_BASE = 'https://pbl-map-api.YOUR_SUBDOMAIN.workers.dev';
```

with your actual Worker URL.

## Step 7: Rebuild & Deploy the App

```bash
cd ..
npm run deploy
```

## Dashboard Access

- Open the app, go to the **📊 Dashboard** tab
- Enter the admin password: `pbl5**`
- Stats auto-refresh every 10 seconds
- Click **"Export All Data"** to download a JSON file

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/track` | POST | Log an event |
| `/api/stats` | GET | Get aggregated dashboard stats |
| `/api/admin/verify` | POST | Verify admin password |
| `/api/admin/export` | GET | Export all data as JSON |
| `/api/health` | GET | Health check |

## Tracked Events

| Event | When Fired |
|-------|-----------|
| `booth_tap` | User taps a booth pin on the map |
| `scan` | User scans a booth QR code |
| `stamp_earned` | User answers quiz correctly |
| `quiz_wrong` | User answers quiz incorrectly |
| `quiz_locked` | User runs out of attempts |
| `redemption` | User redeems a souvenir |
