# Frontend

React 18 + TypeScript + Vite portfolio frontend deployed to Vercel.

## Stack

- **React 18** + **TypeScript**
- **Vite** — build tool and dev server
- **Tailwind CSS** — utility-first styling
- **React Router v7** — client-side routing
- **Framer Motion** — animations
- **react-helmet-async** — per-page SEO meta tags
- **Vitest** — unit tests
- **Playwright** — E2E tests

## Local Setup

```bash
cd src
npm install
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:8000/api
npm run dev            # → http://localhost:5173
```

Or from the repo root:

```bash
./scripts/setup.sh
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✓ | Django API root (no trailing slash) |
| `VITE_SITE_URL` | | Canonical site URL for OG tags |
| `VITE_GITHUB_URL` | | GitHub profile URL |
| `VITE_TWITTER_HANDLE` | | Twitter handle (no @) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | | Stripe card payments frontend key |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the built output locally |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run format:check` | Prettier dry-run |

## Pages

| Route | Page |
|-------|------|
| `/` | Home |
| `/about` | About / bio |
| `/projects` | Projects gallery |
| `/projects/:slug` | Project detail |
| `/blog` | Blog article list |
| `/blog/:slug` | Article detail with reactions and comments |
| `/fashion` | Fashion photography gallery |
| `/music` | Music tracks |
| `/book` | Book landing page |
| `/great-men-moves` | Great Men Moves programme |
| `/contact` | Contact form |
| `/newsletter` | Newsletter signup |
| `/weather-forecast` | Weather widget |

## Deployment (Vercel)

Connect the repository to Vercel and set the root directory to `src/`. Add all `VITE_*` environment variables in the Vercel dashboard. The GitHub Actions `deploy-production.yml` workflow also triggers a Vercel production deploy on push to `production`.
