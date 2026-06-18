# Incident Report PWA

Installable Progressive Web App that replicates the original monday.com SuperForm
for reporting Auto Accidents, Work Injuries, and Property Damage incidents.

- Branching logic: Type of Incident → branch-specific fields. Auto Accident has
  three nested follow-up sections (Injury, Witness, Police), Work Injury and
  Property Damage are flat.
- On submit, creates an item on the "Incident Report Form (PWA)" monday board
  (id `18418451861`) in the matching group, with all answers mapped to columns.
- For Auto Accident submissions, also generates a filled PDF (template text +
  submitted answers together) and attaches it to the item's
  "Filled Accident Report PDF" file column.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in MONDAY_API_TOKEN
npm run dev
```

## Deployment

Deploy to Vercel and set `MONDAY_API_TOKEN` as an environment variable in the
Vercel project settings (Settings → Environment Variables). Never commit the
token to source control.

## Structure

- `lib/schema.ts` — board/column id mapping and form field definitions
- `lib/monday.ts` — monday.com GraphQL + file upload client
- `lib/pdf.ts` — PDF generation (template + submitted answers)
- `components/IncidentForm.tsx` — the multi-step conditional form UI
- `app/api/submit/route.ts` — submission API route
- `public/manifest.json`, `public/sw.js` — PWA support
