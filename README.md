# Launch Desk

Launch Desk is a hosted planning workspace for engineering and go-to-market teams. It includes two authenticated tools:

- Launch Desk: turns a rough product launch brief into a streamed release plan with prioritized work, risks, owner checklists, launch copy, and follow-up questions.
- Campaign Studio: turns a campaign brief into a structured campaign concept, copy variants, checklist, image directions, and generated visuals.

The app uses Next.js, Clerk organizations for workspaces, Prisma/Postgres for persistence, and server-side OpenAI calls. It does not use the deprecated Assistants API or legacy Chat Completions scaffolding.

## Product Routes

- `/`: dashboard with recent workspace plans, campaigns, usage, and primary actions.
- `/launch-desk`: streamed release planning agent.
- `/campaign-studio`: structured campaign generation.
- `/history`: saved plans and campaigns scoped to the active Clerk workspace.
- `/settings`: workspace usage and quota state.
- `/sign-in` and `/sign-up`: Clerk authentication pages.

Legacy Nereid Scout routes remain in the codebase temporarily, but product navigation hides them and `proxy.ts` redirects them unless `LAUNCH_DESK_ENABLE_LEGACY=1`.

## Stack

- Next.js App Router
- Clerk auth and organizations
- Prisma with Postgres, suitable for Neon or Vercel-managed Postgres
- OpenAI Agents SDK for Launch Desk streaming
- OpenAI Responses API for Campaign Studio structured text and images
- Vitest for unit and integration-style tests

## Environment

Copy the template and fill in server-side values:

```bash
cp .env.example .env
```

Required:

```bash
DATABASE_URL=""
OPENAI_API_KEY=""
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
```

Optional:

```bash
OPENAI_MODEL="gpt-5.6"
OPENAI_CAMPAIGN_TEXT_MODEL="gpt-5.6"
OPENAI_IMAGE_MODEL="gpt-image-2"
OPENAI_IMAGE_SIZE="1024x1024"
LAUNCH_DESK_MONTHLY_AI_REQUEST_LIMIT="100"
LAUNCH_DESK_ENABLE_LEGACY="0"
```

Local smoke tests can set `LAUNCH_DESK_E2E_AUTH_TOKEN` and send it as `x-launch-desk-e2e-token`. This path is disabled in production by code. If local Postgres is unavailable, set `LAUNCH_DESK_E2E_SKIP_DB=1` for the stream smoke only; do not use that flag in normal development or production.

## Local Development

```bash
npm install
npm run db:up
npx prisma migrate deploy
npm run dev
```

Open `http://localhost:3000`, sign in with Clerk, and create a plan or campaign. All OpenAI calls run on the server and read `OPENAI_API_KEY` from the process environment.

## Validation

```bash
npx prisma validate
npm test
npm run build
npm audit --audit-level=moderate
```

Launch Desk must also be verified with a real streamed POST through `/api/launch-desk/plan` using a server process that can reach `api.openai.com`. A valid stream includes at least one `tool_progress` event and one `text_delta` event.

## Project Structure

- `src/app/launch-desk/`: Launch Desk UI.
- `src/app/campaign-studio/`: Campaign Studio UI.
- `src/app/api/launch-desk/plan/route.ts`: authenticated SSE route for the Agents SDK planner.
- `src/app/api/campaign-studio/route.ts`: authenticated JSON route for campaign generation.
- `src/app/api/usage/route.ts`: authenticated workspace usage summary.
- `src/lib/auth/`: Clerk server helpers and local-only E2E auth guard.
- `src/lib/launch-desk/`: agent setup, schemas, and deterministic planning tools.
- `src/lib/product/`: workspace persistence, quota checks, and usage logging.
- `src/lib/security/`: request size, origin, IP, and rate-limit guards.
- `tests/`: focused unit and integration-style tests.
- `docs/launch-desk/validation-checklist.md`: manual validation checklist.
- `docs/production-readiness.md`: hosting and operational checklist.

## Deployment

Recommended production path:

1. Create a clean public GitHub repo named `launch-desk`.
2. Import the repo into Vercel.
3. Connect Clerk and Neon Postgres integrations.
4. Configure required environment variables in Vercel project settings.
5. Run `npx prisma migrate deploy` during release.
6. Deploy a preview, sign in, generate one Launch Desk plan and one Campaign Studio result, then confirm `/history` and `/settings`.

Do not publish `.env`, API keys, database URLs, Clerk secrets, cookies, screenshots containing secrets, or old private git history.
