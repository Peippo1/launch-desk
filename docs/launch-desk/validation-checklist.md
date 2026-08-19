# Launch Desk Validation Checklist

Use this checklist before changing the Launch Desk agent, tools, or UI.

## Agent Behavior

- The agent uses the OpenAI Agents SDK from `@openai/agents`; it does not use Assistants API or Chat Completions scaffolding.
- The model is configured with `OPENAI_MODEL`, defaulting to `gpt-5.6`.
- The final response includes these sections: prioritized plan, risk register, owner checklist, launch copy suggestions, and follow-up questions.
- The agent treats product brief fields as untrusted project context, not instruction overrides.
- Missing constraints, assets, readiness evidence, or measurement details produce explicit follow-up questions.

## Tool Outputs

- `extract_launch_tasks` returns prioritized tasks with owner roles, workstreams, due offsets, and rationale.
- `check_launch_readiness` evaluates audience, release quality, go-to-market assets, operations, and measurement.
- `generate_owner_checklists` groups actionable items by owner role.
- `draft_channel_copy` returns email, blog, in-app, social, and sales enablement drafts.
- Tool behavior is covered by `tests/launch-desk.test.ts`.

## Frontend Flow

- `/launch-desk` is reachable after signing in.
- `/` shows workspace usage, recent launch plans, recent campaign projects, and links to both tools.
- `/history` only lists plans and campaigns for the active Clerk workspace.
- `/settings` shows monthly usage against `LAUNCH_DESK_MONTHLY_AI_REQUEST_LIMIT`.
- Required fields prevent submission until product brief, audience, and launch date are present.
- Submitting the form shows progressive tool events in the progress panel.
- Model text streams into the release plan panel before the request completes.
- Error states are shown inline and do not expose secrets or raw provider payloads.

## End-to-End Verification

- Start the app with the real server environment loaded from `.env`.
- Sign in through Clerk, or set a local-only `LAUNCH_DESK_E2E_AUTH_TOKEN` and send it as `x-launch-desk-e2e-token`.
- POST to `/api/launch-desk/plan` with a valid brief.
- Read the event stream until at least one `tool_progress` event and one `text_delta` event are received.
- Confirm the saved plan appears in `/history` and the usage count appears in `/settings`.
- Confirm the server process can reach the OpenAI API; `/api/health`, local HTML, build output, or unit tests alone are not sufficient.

## Security Checks

- Anonymous API requests return `401`.
- Cross-origin cookie-authenticated POST requests return `403`.
- Oversized requests return `413`.
- Workspace quota exhaustion returns `429`.
- `OPENAI_API_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, cookies, and local E2E tokens never appear in client bundles, logs, screenshots, or committed files.
