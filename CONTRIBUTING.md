# Contributing to chatOS

## Development Setup

1. **Prerequisites**: [Bun](https://bun.sh) >= 1.3, [Node.js](https://nodejs.org) >= 22
2. Clone the repo and install: `bun install`
3. Copy `env.example` to `.env.local` and fill in required values
4. Start development: `turbo dev`

## Workflow

1. Create a branch from `main`
2. Make changes
3. Run gates: `make smoke` then `make check` then `make test`
4. Commit with conventional commits (`feat:`, `fix:`, `docs:`, etc.)
5. Open a PR against `main`

## Adding a Package

1. Create `packages/{name}/` with `package.json`, `tsconfig.json`, `src/index.ts`
2. Name it `@chatos/{name}`
3. Extend `@chatos/config/tsconfig/library.json`
4. Add to consuming apps' dependencies
5. Run `bun install`

## Conventions

- **Bun** — only package manager
- **Biome** — lint + format (run `bunx biome check .`)
- **TypeScript** — strict mode, no `any` unless justified
- **Imports** — workspace packages via `@chatos/{name}`

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
