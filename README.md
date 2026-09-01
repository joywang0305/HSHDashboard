# The Hongkong and Shanghai Hotels Limited

Shared kiosk board for **The Hongkong and Shanghai Hotels Limited** (HSH) workplaces. Every wall PC opens the same URL.

The chrome follows The Peninsula homepage: a single-row white header with a centered wordmark, and a gray footer panel. Pages stay typographic — no photography — so a wall PC reads as a concierge board rather than a gallery.

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

Use **<** and **>** beside the date to move one day at a time, or tap the date to pick another day. Other days start empty in the mock until someone books them.

Kiosk PCs: open that URL fullscreen (Chrome `--kiosk`). They do not need a Microsoft login.

## Ubuntu wall PC (Chromium kiosk)

`http://127.0.0.1:43127` is this app on **the same machine**. It is not a public address. If Chromium returns you to the terminal after a few seconds, either nothing is listening on 43127 on that PC, or snap Chromium crashed on the GPU.

On the ThinkCentre, first run the board and confirm it answers:

```bash
git clone https://github.com/joywang0305/HSHDashboard.git
cd HSHDashboard
npm install
npm run build
npm start
```

In another terminal:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:43127
```

You want `200`. Then open kiosk mode. On Haswell ThinkCentre PCs, disable GPU and use X11 so snap Chromium does not exit:

```bash
chromium --kiosk --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble \
  --password-store=basic \
  --ozone-platform=x11 \
  --disable-gpu \
  --disable-software-rasterizer \
  "http://127.0.0.1:43127"
```

These lines in the terminal are noise and can be ignored:

- `Not loading module "atk-bridge"`
- `Haswell Vulkan support is incomplete`
- `iHD_drv_video.so init failed`
- `IdleMonitor.AddIdleWatch` / AppArmor `AccessDenied`
- `DEPRECATED_ENDPOINT`

They come from snap Chromium and the old Intel GPU, not from this dashboard. The window should stay open until you leave kiosk (often Alt+F4).

To start the board on boot, run `npm start` from a systemd user service (or a desktop autostart entry), then launch the Chromium command above from autostart as well. Every wall PC can instead open one hosted URL once you deploy; they do not each need Node if they share that URL.

## Connect Outlook later

Copy `.env.example` to `.env.local` and register an Entra ID app with application permissions:

- `Calendars.ReadWrite` on the room mailboxes
- `Place.Read.All`
- `Sites.Read.All` (SharePoint)

Until those values exist, the board uses the mock Graph adapter (`source: mock` in the header).
