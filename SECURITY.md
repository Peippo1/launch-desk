# Security Policy

## Supported Version

This repository is moving toward a hosted v1. Keep production deployments on the latest `main` commit after CI passes.

## Secrets

Never commit `.env`, `.env.local`, production database URLs, OpenAI API keys, access tokens, cookies, or provider credentials. Local `.env*` files are ignored except `.env.example`.

Required production secrets:

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Optional OpenAI settings:

- `OPENAI_MODEL`
- `OPENAI_CAMPAIGN_TEXT_MODEL`
- `OPENAI_IMAGE_MODEL`
- `OPENAI_IMAGE_SIZE`

Rotate any secret immediately if it is accidentally exposed in a commit, log, issue, screenshot, or deployment output.

## Reporting

Open a private security advisory in GitHub or contact the repository owner directly. Do not open public issues containing exploit details or secrets.

## Production Baseline

- Run `npm ci`, `npx prisma validate`, `npm test`, and `npm run build` before deploy.
- Use hosted secret storage for all environment variables.
- Use HTTPS in production.
- Keep Clerk authentication and organization workspaces enabled.
- Confirm security headers are present at runtime.
- Keep `LAUNCH_DESK_E2E_AUTH_TOKEN` unset in production.
- Monitor OpenAI usage and set project spend limits in the OpenAI Platform.
- Review dependency alerts and run `npm audit --audit-level=moderate` before public releases.
