# Islampur Jame Masjid

Website and member fee management system for Islampur Jame Masjid — [islampurjamemasjid.org](https://islampurjamemasjid.org)

## What it does

- Members' monthly, Tarabi and due fee tracking
- Online payment via bKash, with admin approval
- Payment history and SMS notifications
- Admin dashboard for members, messages, rent and yearly closing
- Prayer times and Quran on the homepage

## Tech stack

Next.js 15 (App Router) · React · Tailwind CSS · MongoDB · React Query · JWT

## Getting started

```bash
npm install
npm run dev
```

Create a `.env.local` file with:

```
DB_USER=
DB_PASSWORD=
ACCESS_TOKEN_SECRET=
API_USERNAME=
API_KEY=
NEXT_PUBLIC_BKASH_NUMBER=
```

Then open <http://localhost:3000>.

## Deployment

Deploys to Vercel. Add the same environment variables in your project settings.
