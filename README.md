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



## Automatic advance adjustment

- Admins can manually allocate an existing advance balance to selected unpaid months before the scheduled monthly run. Each allocation is limited to that month's outstanding fee and is recorded in the advance-use ledger.
- Any remaining advance is automatically applied to the current month's unpaid monthly fee from the 1st of each month (Bangladesh time). The scheduled endpoint is checked daily, but it completes the month's allocation only once: on the 1st when the year is ready, or on the first successful retry if year opening or a prior run was delayed. After completion, later daily checks cannot deduct newly added advance in the same month.
- If the balance is smaller than the monthly fee, the month stores a partial advance payment and only the remaining amount stays due.
- Unused advance remains on the member account and carries into following months and across year boundaries. For example, ৳250 can cover December (৳100), January (৳100), and ৳50 toward February.
- The scheduled endpoint is `/api/cron/monthly-advance`. Vercel runs it daily at 18:00 UTC (midnight in Bangladesh) after this branch is deployed to Production. Vercel Cron does not execute on Preview deployments. The endpoint checks the current Dhaka month, waits until the year-closing workflow has opened that year, and uses a unique year/month/member record to prevent duplicate deductions.

### Deployment setting

Add `CRON_SECRET` as a server-side environment variable in the Vercel project (Production and Preview as appropriate). Use a long random secret. Vercel sends it as `Authorization: Bearer <CRON_SECRET>`; requests without the matching secret are rejected. Do not expose this value through a `NEXT_PUBLIC_` variable.
