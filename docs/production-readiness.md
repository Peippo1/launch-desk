# Production Readiness Plan

## V1 Scope

Launch Desk v1 is a public, authenticated workspace product with two OpenAI-backed tools:

- Launch Desk release planning.
- Campaign Studio campaign concepts, copy, checklists, image prompts, and generated visuals.

Clerk organizations are the workspace boundary. Every saved launch plan, campaign, and AI usage event is keyed by workspace and must be queried through workspace-scoped repository functions.

## Hosting

### Vercel

1. Create or import the clean public GitHub repository named `launch-desk`.
2. Add the Clerk Vercel integration and enable organizations in Clerk.
3. Add Neon Postgres or another managed Postgres database.
4. Set environment variables in Vercel Project Settings:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - Optional model and quota settings from `.env.example`
5. Use the default Next.js build command: `npm run build`.
6. Run `npx prisma migrate deploy` before serving production traffic.
7. Deploy a preview first, sign in, generate one plan and one campaign, then verify `/history` and `/settings`.

### Railway

1. Create a Railway service from the clean GitHub repository.
2. Attach Postgres or point `DATABASE_URL` at Neon.
3. Set the same environment variables listed above.
4. Use `npm run build` as the build command and `npm run start` as the start command.
5. Run `npx prisma migrate deploy` during release.

## Security Controls

- Clerk authentication protects app and API routes through `proxy.ts`.
- Clerk organizations define team workspaces; personal accounts fall back to a personal workspace key.
- Server-only OpenAI calls read `OPENAI_API_KEY` from the server process only.
- Runtime validation uses Zod before model calls or persistence.
- Payload limits reject oversized AI requests before reading large bodies.
- Same-origin checks protect cookie-authenticated POST routes from cross-site submission.
- Per-user fixed-window guards provide v1 abuse control for expensive AI routes.
- Monthly workspace quotas are enforced before AI generation and logged after successful output persistence.
- Security headers include clickjacking, MIME sniffing, referrer, permissions, and baseline CSP policies.
- `.env*` files are ignored except `.env.example`.
- `LAUNCH_DESK_E2E_AUTH_TOKEN` and `LAUNCH_DESK_E2E_SKIP_DB` are disabled in production and exist only for local API smoke tests.

## Validation Checklist

- `npm ci`
- `npx prisma validate`
- `npm test`
- `npm run build`
- `npm audit --audit-level=moderate`
- Secret scan before first commit and before push.
- Manual Clerk sign-in and organization workspace selection.
- Real Launch Desk streamed POST emits `tool_progress` and `text_delta`.
- Manual Campaign Studio sample brief returns structured JSON and saves history.
- Runtime header check for `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy`.

## Known V1 Limitations

- The fixed-window route limiter is in-memory. Use Redis, Upstash, Vercel Runtime Cache, or another shared store before running multiple server instances.
- Usage logging stores estimates rather than provider-grade token accounting.
- Generated images are persisted inside the campaign JSON result; move large media to object storage if volume increases.
- Legacy Nereid Scout code remains in the repo temporarily while public routes hide it.
