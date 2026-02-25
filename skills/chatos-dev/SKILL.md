---
name: chatos-dev
description: Development workflow skill for the chatOS monorepo. Use when setting up, building, testing, or contributing to chatOS.
---

# chatOS Development

## Setup

```bash
bun install          # Install all deps
make smoke           # Verify environment
turbo dev            # Start all apps
```

## Build & Test

```bash
turbo build          # Build all packages and apps
make check           # Lint (biome) + typecheck
make test            # Full test suite
make web-e2e         # Playwright E2E tests
```

## Adding a New Package

1. Create `packages/{name}/package.json` with name `@chatos/{name}`
2. Create `packages/{name}/tsconfig.json` extending `@chatos/config/tsconfig/library.json`
3. Create `packages/{name}/src/index.ts`
4. Add to consuming apps' `package.json` dependencies
5. Run `bun install` from root

## Conventions

- Bun only (never npm/yarn/pnpm)
- Biome for lint+format (never eslint/prettier)
- All packages export from `src/index.ts`
- Shared types in `@chatos/types`
- Database schema in `@chatos/db`
- UI components in `@chatos/ui`

## Control Gates

Always run before merge: `make smoke` → `make check` → `make test`
