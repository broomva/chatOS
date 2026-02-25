# PLANS.md

## Active Plan: Initial Monorepo Setup

**Scope**: Create chatOS monorepo with turborepo, shared packages, three apps, and agent-native layer.

**Phases**:
1. Scaffold monorepo structure with bun + turbo
2. Bootstrap agent-native layer (control metalayer + harness)
3. Build core packages (config, types, db, auth, ai, ui)
4. Build applications (web chatbot, bot, docs)
5. CI/CD, OSS files, verification

**Checkpoints**:
- [ ] `bun install` succeeds from root
- [ ] `turbo build` completes all packages and apps
- [ ] `turbo dev` starts all three apps
- [ ] `make smoke` passes
- [ ] `make check` passes
- [ ] `make control-audit` reports no gaps

**Constraints**:
- Bun as package manager
- Biome for lint+format
- Better Auth (not Auth.js)
- Drizzle ORM (not Prisma)
- tRPC for API layer
