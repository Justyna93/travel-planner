# Travel Planner

Mobile-first PWA for planning trips. Five tabs per trip (Places, Info, Plan, Buy, Pack).

Built with Next.js 16 (App Router) + TypeScript + Tailwind 4 + **Dexie / IndexedDB** — all data lives locally on your device.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To test on your iPhone over the local network:

```bash
npm run dev -- -H 0.0.0.0
```

Then visit `http://<your-laptop-ip>:3000` from Safari.

No backend, no env vars, no accounts.

## How it works

| Route | Purpose |
|---|---|
| `/` | Trip list. |
| `/trip/[id]/{places,info,plan,buy,pack,settings}` | Per-trip tabs. |
| `/templates` | Manage reusable pack-list templates (e.g. "Me", "Child"). |
| `/data` | Export / import all data as JSON (with images). |

**Pack templates:** define once on `/templates`; when you create a per-trip pack list from a template, its items are **copied** so per-trip changes don't leak back.

**Backup & device transfer:** there's no cloud. To move data to another device — or back it up — open `/data`, export the JSON file (it embeds images as base64), then import it on the other device.

## PWA / iPhone install

The app ships a `manifest.json` and Apple meta tags. To install on iPhone:

1. Open the site in **Safari**.
2. Share → **Add to Home Screen**.

After install the app uses the iPhone's IndexedDB just like a regular site — back it up via `/data` since iOS may evict storage from sites you haven't visited in a long time.

⚠️ Replace the placeholder PNGs in `public/icons/` with real icons before deploying — see `public/icons/README.txt`. A solid-color 1024×1024 source PNG fed through https://realfavicongenerator.net/ produces every size you need.

## Deploy

Any static host works since there's no server logic worth running. Vercel is the easy default:

1. Push to GitHub.
2. Import into Vercel.
3. No env vars needed.

## Architecture notes

- **All pages are Client Components.** They read Dexie via `useLiveQuery` (from `dexie-react-hooks`) so the UI reacts to local writes automatically.
- **Dexie schema** lives in `lib/db.ts`. Ten tables: `trips`, `places`, `info_items`, `info_images` (Blob storage), `plan_items`, `buy_items`, `pack_templates`, `pack_template_items`, `pack_lists`, `pack_items`. Domain types are in `lib/types.ts`.
- **Mutations** in `lib/actions/*` are plain async functions that wrap Dexie writes. Cascading deletes (e.g. deleting a trip removes its places, info items, plan items, buy items, pack lists, pack items, and orphan image blobs) use Dexie transactions.
- **Info-tab images** are stored as Blobs in the `info_images` table. The `useImageUrl` hook in `lib/imageUrl.ts` issues a `URL.createObjectURL` for rendering and revokes it on unmount.
- **Export / import** (`lib/exportImport.ts`) serializes every table to JSON. Blobs are base64-encoded so the file is portable. Import supports merge (upsert by id) or replace (wipe first).
- **No share links, no auth.** Sharing data across people means exporting the JSON and sending it — they can import it on their own device.
