# MEEZAN (ميزان) — Student Spending Tracker

A bilingual (English / العربية) PWA for tracking student spending in Omani Rial (OMR),
styled after Google Fit / Cronometer. Data is stored locally in the browser via
**IndexedDB** (no localStorage).

## Run

```bash
npm install
npm run dev        # dev server
npm run build      # production build (generates the PWA service worker)
npm run preview    # preview the production build
```

## Backend URL

Set the Flask backend base URL in `.env` (copy from `.env.example`):

```
VITE_API_URL=http://localhost:5000
```

Endpoints used:
- `POST /spending-analysis` — **SSE stream** (status: parsing → forecasting → reviewing → done, then result)
- `POST /extract-receipt` — receipt photo extraction

## Structure

- `src/screens/` — LanguagePick, Onboarding, Home, EditSpendings, Settings, Guide
- `src/screens/sheets/` — AddSpend, ExtraIncome, AdjustBudget bottom sheets
- `src/components/` — Rial (traced SVG), Money (3-decimal baisa), NumPad, ScaleGauge, UI primitives
- `src/lib/` — db (IndexedDB), store (context), budget math, api (SSE client)
- `src/i18n/` — EN + AR strings, direction handling
- `src/styles/` — theme tokens (light/dark), components, screens

## Notes / known limitations

- Not visually verified via screenshots (no browser in the build environment).
  Check the no-scroll layout and RTL mirroring when you run it locally.
- "Adjust budget" commit timing (this week / 4 weeks / next month) is recorded and
  applied immediately; a deferred scheduler for "next month" is left as a TODO.
- Per-category forecast on the onboarding preview uses a fixed weighting heuristic
  over the backend's daily-total forecast; real per-category data accrues from logs.
