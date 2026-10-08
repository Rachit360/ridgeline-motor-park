# Ridgeline Motor Park: track-day booking and operations platform

A full-stack booking system for a motorsport venue where guests drive their own cars. Guests book a session, register their car, sign a waiver and get a QR entry pass. Staff run the day from a dashboard with live track occupancy, a driver manifest and QR check-in at the gate.

Ridgeline is a fictional venue built as a portfolio project.

## Features

**Guest side**
- Live "Today on track" board on the home page showing places left in every session
- Three-step booking: session → driver and car → waiver and payment
- 10-minute place hold with a visible countdown, released automatically if the guest walks away
- Per-experience rules (for example, the dirt trail requires an SUV or 4x4)
- Online waiver signed by typing the driver's name, validated against the driver record
- Entry pass page with a QR code, plus a confirmation email
- Group and corporate enquiry form

**Staff side** (`/admin`, password-protected)
- Track sheet: occupancy bar per session for any day
- Driver manifest with car and registration details
- QR check-in: scanning a pass opens a check-in page on the staff phone; manual code entry also works
- Daily stats: cars booked, checked in, occupancy, takings
- Group enquiry inbox

**Automation**
- Confirmation email on booking (Nodemailer over SMTP)
- Daily cron (Vercel Cron) emails a reminder to everyone booked for tomorrow, once per booking

## The interesting engineering problem: no double-booking

Each session is one document in `slots` with `capacity` and `taken`. A place is claimed with a single conditional update:

```js
slots.findOneAndUpdate(
  { _id: slotId, $expr: { $lt: ["$taken", "$capacity"] } },
  { $inc: { taken: 1 } }
)
```

MongoDB applies this atomically to the document, so when two people race for the last place exactly one update matches and the other is told the session sold out. The claimed place becomes a booking in the `held` state with a 10-minute `expiresAt`.

- **Confirming** only succeeds if the booking is still `held` and inside its timer (one atomic `findOneAndUpdate`).
- **Expired holds** are swept before every availability read and every new hold. Each is flipped `held → expired` atomically before its place is returned, so concurrent sweeps never return the same place twice.
- **The first booking for a slot** creates it with an upsert; a racing duplicate-key error is caught and ignored.

## Stack

Next.js 15 (App Router, route handlers), TypeScript, Tailwind CSS, MongoDB (official driver), Zod, Nodemailer, qrcode, Vercel and Vercel Cron.

## Project structure

```
src/
  app/
    page.tsx                 home: live board, experiences, group enquiries
    book/                    booking flow
    pass/[code]/             entry pass with QR
    admin/                   dashboard, login, QR check-in page
    api/
      availability/          GET places left per session
      holds/                 POST claim a place for 10 min, DELETE release it
      bookings/              POST confirm a hold with driver, car and waiver
      leads/                 POST group enquiry
      admin/                 login, logout, check-in
      cron/reminders/        daily reminder emails
  lib/
    slots.ts                 booking engine (holds, confirmation, expiry)
    db.ts                    Mongo client, types, indexes
    experiences.ts           sessions, prices, capacities, schedules
    auth.ts                  HMAC-signed staff session cookie
    email.ts                 confirmation and reminder emails
  components/                BookingFlow, DayBoard, GroupEnquiry, admin check-in
```

## Run it locally

**Quickest:** double-click `start.bat` (Windows) or run `./start.sh` (Mac/Linux). It installs packages the first time, starts the site and opens http://localhost:3000.

Or by hand: `npm install`, then `npm run dev`.

No setup is needed locally. Without a `MONGODB_URI`, the app starts a temporary in-memory MongoDB (data resets when you stop the server), the staff password is `admin`, and emails are printed in the terminal instead of sent. To keep data between runs, put a MongoDB Atlas connection string in `.env.local` (see `.env.example`).

## Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add the variables from `.env.example` under Project Settings → Environment Variables. In production `MONGODB_URI`, `ADMIN_PASSWORD` and `AUTH_SECRET` are required. Set `APP_URL` to your Vercel URL so QR codes point to the right place.
3. In Atlas, allow access from anywhere (`0.0.0.0/0`) under Network Access, since Vercel's IPs change.
4. Deploy. The reminder cron in `vercel.json` runs daily at 18:00 IST.

## Not built yet

- Real payment gateway (Razorpay order plus signed webhook in place of demo mode)
- Guest cancellation and rescheduling
- Lap times and session history per driver
