# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

**Package Manager:** Always use `pnpm` (not npm or yarn).

```bash
pnpm dev                  # Start development server on :3000
pnpm build                # Production build
pnpm lint                 # Run ESLint
pnpm add-component        # Add shadcn component (e.g., pnpm add-component button)
pnpm db:gen               # Regenerate Supabase types from local DB
pnpm stripe:webhooks      # Forward Stripe webhooks to localhost for testing
```

**Local development requires:**
- Supabase local instance (localhost:54322) or cloud credentials
- Google OAuth credentials (AUTH_GOOGLE_ID/SECRET)
- OpenAI API key
- Stripe test credentials

## Architecture Overview

**Interview Coach** is a Next.js 16 SaaS application for AI-powered system design interview practice. Users practice design problems with real-time AI feedback and comprehensive evaluations.

### Core Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** NextAuth v5 (beta) with Google OAuth, custom Supabase adapter
- **AI:** Vercel AI SDK with Claude Haiku for interviews and evaluation
- **Payments:** Stripe (checkout, billing portal, webhooks)
- **UI:** shadcn/ui (Radix), Tailwind CSS 4, Excalidraw (whiteboard)
- **Monitoring:** Sentry, Vercel Analytics

### Interview State Machine

Interviews progress through explicit states:
```
GREETING → REQUIREMENTS → DESIGNING → CONCLUSION
```

State transitions are managed via AI tool calls and stored in `solution.state`.

### Key Architectural Patterns

**Authentication Flow:**
1. Google OAuth via NextAuth → Custom Supabase adapter stores sessions in DB
2. JWT tokens signed with `SUPABASE_JWT_SECRET` (using jose for Edge compatibility)
3. Middleware (`middleware.ts`) protects `/app/*` and `/admin/*` routes

**Prompt Architecture (lib/ai/):**
- Static base prompt (cached for token efficiency): persona, tools, problem context
- Dynamic context (per-turn): current state, whiteboard diff, checklist status
- State-specific prompts in `lib/ai/prompts/`

**Evaluation Pipeline (lib/evaluation/):**
- After interview concludes, conversation is filtered (removes tool calls)
- Claude Haiku evaluates against 21-item rubric across 4 categories
- Results stored in `solutions.evaluation`

**Supabase Clients (lib/supabase/):**
- `client.ts` - Browser client (anon key, public access)
- `server.ts` - Server client with cookies
- `service.ts` - Service role client (full access, admin operations)

### Route Structure

```
app/
├── (marketing)/           # Public pages (home, privacy, terms)
├── app/                   # Protected user dashboard & interviews
│   └── problems/[id]/     # Interview session
├── admin/                 # Admin dashboard (requires isAdmin)
└── api/
    ├── chat/              # Main interview endpoint
    ├── v1/solutions/[id]/ # Evaluation & conclusion endpoints
    ├── stripe/            # Checkout, webhooks, billing portal
    └── transcribe/        # Speech-to-text
```

### Key Files

- `middleware.ts` - Auth routing, admin checks
- `lib/auth.ts` - NextAuth config with Supabase adapter
- `lib/custom-supabase-adapter.ts` - Session/account storage in Supabase
- `app/api/chat/route.ts` - Interview streaming endpoint
- `lib/ai/interviewer-prompt-builder.ts` - Prompt construction with caching
- `lib/evaluation/evaluators.ts` - Interview evaluation logic
- `lib/database.types.ts` - Auto-generated Supabase types (run `pnpm db:gen` to update)

### Database Tables

Core tables: `users`, `accounts`, `sessions`, `problems`, `solutions`, `ai_usage_events`, `user_plans`

### Usage Limits & Billing

- Free tier: 2 interviews/month (tracked in `ai_usage_events`)
- Pro tier: Unlimited ($19.99/month via Stripe)
- `lib/usage-check.ts` and `lib/hooks/use-usage-limits.ts` handle limit enforcement
