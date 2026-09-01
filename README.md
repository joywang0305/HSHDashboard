# HSH Dashboard

Health, Safety & Hygiene board for **Northline Works**. Site leads log incidents, close out inspections, and track corrective actions without waiting on a spreadsheet.

This first slice is a working local app with seeded site data. Reports you add are stored in the browser (`localStorage`) so the board stays usable without a database.

## What you can do

- Scan open incidents, overdue inspections, LTI-free days, and hygiene scores on the overview.
- File a new incident from any page.
- Filter the incident board and move a report from open → investigating → closed.
- Mark an inspection complete with a 0–100 score.
- Close corrective actions, including overdue items.

Use **Maya Chen → Restore demo data** in the header if you want the original sample board back.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).

```bash
npm run build
npm start
```

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, and shadcn/ui. No auth or backend in this slice.
