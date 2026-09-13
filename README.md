# Islampur Jame Masjid — Next.js (full-stack)

Your two-repo project (Vite/React client + Express/MongoDB server) merged into a
**single Next.js 15 app** (App Router). Every page and every Express endpoint now
lives in one project, same-origin, no CORS.

## Routes

| Path                 | Original file              | Notes                                                           |
| -------------------- | -------------------------- | --------------------------------------------------------------- |
| `/`                  | `pages/Home.jsx`           | "under construction" placeholder, links to `/fee`               |
| `/fee`               | `pages/FeePage.jsx`        | main member fee dashboard (client component)                    |
| `/signin`            | `pages/SignIn.jsx`         | member sign-in (UI only, same as original)                      |
| `/adminSignin`       | `pages/AdminSignIn.jsx`    | admin sign-in, sets `Number` + JWT in localStorage              |
| `/payment`           | `pages/PaymentHistory.jsx` | payment history browser                                         |
| `/profile`           | `components/Profile.jsx`   | static demo profile card                                        |
| `/addUser`           | `pages/AddUser.jsx`        | guarded by `AdminRoute`, same form used at `/dashboard/addUser` |
| `/dashboard/home`    | `pages/AdminDashboard.jsx` | admin stats, SMS sending, year closing                          |
| `/dashboard/addUser` | `pages/AddUser.jsx`        | same shared form component                                      |
| `/dashboard/rent`    | `pages/ShopRent.jsx`       | shop keeper rent tracking                                       |

`/` through `/addUser` share the `app/(main)/layout.js` layout (Navbar + Footer).
`/dashboard/*` has its own separate layout (`app/dashboard/layout.js`) with the
sidebar nav, matching the original `Layout/DashBoard.jsx` — this mirrors your
original router where `Main` and `DashBoard` were sibling top-level routes, not
nested inside each other.

## What changed

**Routing**

- `react-router-dom`'s `createBrowserRouter` → Next.js file-based routing (route groups: `(main)` for the member-facing pages, `dashboard/` for the admin section)
- `NavLink`/`Link`/`to=` → `next/link`'s `Link`/`href=`
- `useNavigate()` → `useRouter()` from `next/navigation`, `navigate(path)` → `router.push(path)`
- `<Navigate>` (used inside `AdminRoute`) → `AdminRoute` is now a client component that redirects with `router.replace()` inside a `useEffect`, rendering `null` while redirecting (declarative `<Navigate>` doesn't exist in Next.js)
- `Outlet` (in `Layout/Main.jsx` and `Layout/DashBoard.jsx`) → the `children` prop, since Next.js layouts receive nested routes as `children` directly

**Data fetching**

- `@tanstack/react-query` kept as-is; since Next's root layout is a Server Component by default, `components/Providers.jsx` is a new client component that wraps `children` in `QueryClientProvider` — everything else (`useAdmin`, `useUsers`, `useHomeName`, `useNumbers`) is otherwise unchanged
- `hooks/useAxiosPublic.js` — baseURL changed from the deployed backend URL (`https://islampur-jame-masjid-server.vercel.app`) to a relative `/api`, since the backend is now merged into this same Next.js app
- **`localStorage` guard**: in Vite everything ran only in the browser, so `localStorage.getItem(...)` at the top of a component/hook was always safe. Next.js server-renders client components too, so bare `localStorage` calls during that first render would throw. Added `lib/localStorage.js` (`getLocalStorage`/`setLocalStorage`/`removeLocalStorage`) that no-ops on the server, and everywhere `localStorage` was read outside an event handler (e.g. `useAdmin`, `Navbar`, `AdminRoute`) now goes through it

**Backend**

- Every Express route (`app.get/post/patch`) → a Next.js Route Handler (`app/api/<path>/route.js`), 33 in total
- `req.params.id` → Next.js dynamic segments, e.g. `app/api/user/[id]/route.js`
- MongoDB connection cached in `lib/mongodb.js` (standard Next.js pattern for serverless/hot-reload)
- `cors` middleware removed (same-origin now); `axios` on the server side replaced with native `fetch` for the SMS provider calls
- The old `GET /` health-check route is now `GET /api/health`
- The `verifyToken` JWT middleware from your original server was defined but never attached to any route — carried over as `lib/auth.js` for parity, still unused by default

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in .env.local:
#   DB_USER, DB_PASSWORD       (MongoDB Atlas)
#   ACCESS_TOKEN_SECRET        (JWT signing secret)
#   API_USERNAME, API_KEY      (mimsms SMS provider)
npm run dev
```

Visit http://localhost:3000.

## Deploying

Deploys to Vercel with zero extra config — Next.js API routes are detected
automatically, so the separate `vercel.json` rewrite rule from the old client
repo and the old server repo's Vercel config are both no longer needed. Just
set the same environment variables in your Vercel project settings.

## API routes reference

All 33 endpoints, same paths/methods as your original Express server, prefixed with `/api`:

| Method | Route                          |
| ------ | ------------------------------ |
| POST   | `/api/jwt`                     |
| GET    | `/api/check-balance`           |
| GET    | `/api/admin/[number]`          |
| GET    | `/api/verifyAdmin/[number]`    |
| GET    | `/api/users`                   |
| GET    | `/api/userByNumber/[number]`   |
| GET    | `/api/shopKeeper`              |
| GET    | `/api/shopKeeper/[id]`         |
| GET    | `/api/usersHome`               |
| GET    | `/api/usersNumber`             |
| GET    | `/api/usersName/[home]`        |
| GET    | `/api/user/[id]`               |
| POST   | `/api/addUser`                 |
| POST   | `/api/addShopKeeper`           |
| PATCH  | `/api/editUserData/[id]`       |
| PATCH  | `/api/editFee/[id]`            |
| PATCH  | `/api/monthStatus`             |
| PATCH  | `/api/combined-payment`        |
| PATCH  | `/api/tarabeePaid/[id]`        |
| PATCH  | `/api/payDue/[id]`             |
| PATCH  | `/api/activity`                |
| GET    | `/api/activeStatus`            |
| GET    | `/api/monthly-stats`           |
| GET    | `/api/tarabi-stats`            |
| POST   | `/api/payment`                 |
| GET    | `/api/paymentHistory`          |
| GET    | `/api/total-payment`           |
| POST   | `/api/sms`                     |
| POST   | `/api/sms-db`                  |
| PATCH  | `/api/closing-year`            |
| GET    | `/api/last-closing-year`       |
| PATCH  | `/api/next-year`               |
| GET    | `/api/userPayment/[id]/[year]` |
| GET    | `/api/health`                  |

## Notes

- `Notification.jsx` exists but isn't rendered anywhere by default (same as the
  original — it's imported by `Home` inside a `hidden` div).
- The `useUsers` hook exists but wasn't imported by any page in your source
  either — carried over for parity in case you use it later.
- `pages/AddUser.jsx` was used at two different routes (`/addUser` and
  `/dashboard/addUser`) in your original router, so it now lives once as
  `components/forms/AddUserForm.jsx` and both pages render it.
- The original router double-wrapped `/dashboard/addUser` etc. in `AdminRoute`
  (once on the parent `dashboard` route, once on each child). Since the
  `dashboard` layout already guards the whole section, the individual
  `dashboard/*` pages aren't re-wrapped — avoids a redundant loading flicker,
  same effective behavior.
