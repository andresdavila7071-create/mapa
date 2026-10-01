# TravelNow

TravelNow is a responsive tourism discovery app that helps people decide what to do in a city or destination through a map-first interface and an AI guide.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/travelnow/src/App.tsx` — map-first home experience, search state, AI preference panel, local chat, and future capability states.
- `artifacts/travelnow/src/index.css` — TravelNow visual system, responsive layout, map surface, panel, and interaction states.
- `artifacts/travelnow` — deployable React + Vite web artifact.

## Architecture decisions

- The first release is frontend-only so the discovery flow can be validated before connecting map, places, events, weather, or route providers.
- The map surface is intentionally conceptual and contains no invented locations, markers, events, ratings, distances, or weather.
- AI recommendations and chat are clearly marked as preview states until real destination data is connected.
- The AI guide preferences are local state and can be combined; the selected search text is passed into the recommendation state for future provider-backed results.

## Product

- Responsive map-first home screen for desktop and mobile.
- Destination search input for countries, cities, and places with an explicit not-connected state.
- Floating AI assistant action with combinable culture, food/entertainment, and nature/adventure preferences.
- Local preview chat and recommendation state that are ready to be replaced by live AI and place data.
- Clearly labeled future areas for GPS, real-time events, restaurants, tourist places, weather, and routes.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
