# HSH Dashboard

Shared kiosk board for **HSH** workplaces. Every wall PC opens the same URL.

1. **Rooms** — today’s Outlook meeting-room calendars, with on-the-spot booking
2. **HSH Hub** — workplace notices
3. **SharePoint** — recent site files and pages

Outlook (Exchange room mailboxes) remains the system of record for bookings. This app is the shared display and the kiosk booking surface.

## Architecture

```
Kiosk PCs (Chrome kiosk)  →  this web app  →  /api/board  (poll every 12s)
                                            →  /api/bookings (create)
                                            →  Microsoft Graph when configured
                                               (room calendars + SharePoint)
                                            →  HSH Hub API when configured
```

- All PCs load one hosted URL. None of them talk to Outlook directly.
- The board feed is server-side, so a booking made at reception appears on every screen on the next poll.
- Today the feed is an in-memory mock of Graph. Put Graph credentials in the environment and the same routes can call `/users/{room}/calendar/calendarView` and `POST /users/{room}/events`.
- Firebase Hosting can serve this UI; Cloud Functions can replace the Next.js route handlers; Firestore can replace the in-memory cache so many Cloud Functions instances stay in sync. Do not store bookings only in Firebase — write them to Outlook.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).

Tap a free slot on a room column, enter a title and your name, and book. Use **Restore demo** to reset sample Outlook events.

Kiosk PCs: open that URL fullscreen (Chrome `--kiosk`). They do not need a Microsoft login.

## Connect Outlook later

Copy `.env.example` to `.env.local` and register an Entra ID app with application permissions:

- `Calendars.ReadWrite` on the room mailboxes
- `Place.Read.All`
- `Sites.Read.All` (SharePoint)

Until those values exist, the board uses the mock Graph adapter (`source: mock` in the header).
