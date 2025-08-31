OfOpsApi
========

Operational AI Companion Platform — API and Client

Overview
--------
OfOpsApi is a full‑stack TypeScript system that powers an AI companion workflow for creators. It unifies persona configuration, fan conversations, moderation, monetization (Stripe), analytics, and auditability into a cohesive architecture. The codebase is structured as a monorepo-style workspace with shared typed schema for strong end‑to‑end invariants.

Architecture
------------
- Client: React 18 (Vite, TanStack Query) with shadcn/ui (Radix primitives) and Tailwind CSS.
- Server: Express 4 with feature‑scoped services (LLM, moderation, audit, media), typed request validation via zod, and Drizzle ORM for Postgres.
- Shared: Single source of truth for DB schema and request/response types using Drizzle + drizzle‑zod.
- Storage: Neon serverless Postgres via `@neondatabase/serverless` with Drizzle SQL.
- External Integrations: OpenAI (conversational agent), Stripe (payments & webhooks).

Key Design Goals
----------------
- Type safety across the boundary: Shared schema (`shared/schema.ts`) defines tables, relations, and zod insert schemas used server‑side to parse/validate inputs.
- Separation of concerns: Routes are thin; domain logic lives in services (LLM, moderation, audit) and storage (`server/storage.ts`).
- Observability and safety: Every sensitive action is auditable; moderation gates risky content and enforces consent flows.

Repository Layout
-----------------
- `client/` — Vite React app
  - `src/pages/` — dashboard, analytics, safety, persona, etc.
  - `src/lib/` — `api.ts` (API client), `queryClient.ts` (React Query config)
  - `src/components/` — UI components and shadcn/ui wrappers
- `server/` — Express API
  - `index.ts` — app bootstrap, logging, error handling, dev server/Vite integration
  - `routes.ts` — REST endpoints (personas, fans, conversations, content, payments, moderation)
  - `services/` — `llm.ts`, `moderation.ts`, `audit.ts`, `media.ts`
  - `storage.ts` — typed data access via Drizzle
  - `db.ts` — Neon pool + Drizzle initialization
- `shared/schema.ts` — Drizzle schema, zod insert schemas, and exported types
- Tooling: `vite.config.ts`, `drizzle.config.ts`, `tailwind.config.ts`, `tsconfig.json`

Data Model (Selected Tables)
----------------------------
- `users`: creators and operators; holds Stripe customer/subscription IDs.
- `personas`: creator‑scoped AI persona config (voice keywords, do/don’t say, offer menu, disclosure).
- `fans`: end users with preferences/consent state and spend tier.
- `conversations`/`messages`: dialog threads and messages (AI/fan), with moderation status and scheduling fields.
- `content_items`: monetizable assets, with purchase/revenue counters.
- `payments`: Stripe intents with status lifecycle and metadata.
- `audit_logs`: append‑only trace of sensitive actions.
- `moderation_queue`: pending/approved/blocked items with severity and reviewer.

API Surface (Representative)
---------------------------
- Personas: `POST /api/personas`, `PUT /api/personas/:id`, `GET /api/personas/:id`, `GET /api/personas/creator/:creatorId`
- Fans: `POST /api/fans`, `PUT /api/fans/:id`, `GET /api/fans/:id`
- Conversations: `GET /api/conversations/active/:personaId`, `GET /api/messages/:conversationId?limit=`
- AI Reply: `POST /api/ai/reply` (moderation → consent gate → LLM → actions)
- Content: `GET /api/content/creator/:creatorId`, `POST /api/content`, `GET /api/content/top/:creatorId`
- Payments: `POST /api/create-payment-intent`, `POST /api/webhooks/stripe`
- Analytics: `GET /api/dashboard/metrics/:creatorId`, `GET /api/analytics/revenue/:creatorId`, `GET /api/analytics/safety`

Security, Safety, and Compliance
--------------------------------
- Moderation: layered regex heuristics for banned/suspicious/escalation patterns, with queueing and audit logging.
- Consent: explicit consent gate (age and romantic content) prior to flirty dialogue.
- Auditing: centralized service logs persona changes, content access, payments, moderation decisions, and stop requests.
- Recommendations:
  - Protect routes with authentication/authorization (dependencies include passport but not wired yet).
  - Stripe webhooks require raw body handling and signature verification.
  - Remove default OpenAI key fallbacks; require env configuration.
  - Rate limit and CSRF protections for sensitive endpoints.

Local Development
-----------------
Prerequisites
- Node.js 20+
- Postgres (Neon serverless recommended) and database URL
- Stripe account (optional for payments)
- OpenAI API key (for LLM features)

Environment Variables
Create `.env` at the project root:

```bash
DATABASE_URL=postgresql://...           # Neon or Postgres connection
OPENAI_API_KEY=sk-...                   # Required for LLM
STRIPE_SECRET_KEY=sk_live_or_test...    # Optional; enables payments
STRIPE_WEBHOOK_SECRET=whsec_...         # Required for webhook verification
NODE_ENV=development
PORT=5000
```

Install and Run
```bash
npm install
npm run db:push      # push Drizzle schema to the database
npm run dev          # runs Express API; Vite dev middleware in development
```

Build and Start (Production)
```bash
npm run build        # builds client and bundles server
npm start            # serves API and static client from dist
```

Testing
-------
The repo currently does not include a test suite. Suggested approach:
- Unit tests for services (moderation/LLM/audit) with Jest or Vitest
- Contract tests for routes with Supertest
- Integration tests against a temporary Postgres (e.g., Testcontainers)

Notable Implementation Details
------------------------------
- Type‑first storage interface (`server/storage.ts`) keeps route handlers slim.
- LLM service constrains outputs to JSON and post‑parses tool calls to actions.
- Dashboard metrics computed via aggregate queries with Drizzle SQL.
- Client uses React Query with a default `queryFn` that throws on non‑200 for consistent error handling.

Known Caveats (as of this commit)
---------------------------------
- Stripe webhook handler must read raw request body; ensure JSON middleware is bypassed for that route.
- Tool‑call dispatch in AI reply should call local helpers directly (avoid `this` in free functions).
- Conversation message ordering should be normalized before slicing for LLM context.
- Authentication is not yet enforced on API routes.

License
-------
MIT


