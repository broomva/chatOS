# AGENTS.md

## Project Goal

- Product objective: Best-in-class AI chatbot monorepo template with multi-platform bot support
- Quality objective: All packages type-safe, all apps buildable, E2E passing
- Reliability objective: Deterministic builds, cached pipelines, zero flaky tests

## Control Commands

| Intent | Command |
|---|---|
| Quick environment and build sanity | `make smoke` |
| Static quality gates | `make check` |
| Full verification | `make test` |
| Web integration E2E | `make web-e2e` |
| Install git hooks | `make hooks-install` |
| Recovery playbook | `make recover` |
| Metalayer audit | `make control-audit` |

## Rules

- Never bypass `check` or `test` without explicit escalation.
- Do not merge features without corresponding test coverage.
- Keep changes scoped to one plan objective at a time.
- Update control docs and policy when behavior changes.
- Escalate to human when retry budget is exhausted.
- Use Bun exclusively as package manager. Never npm/yarn/pnpm.
- Use Biome for lint+format. Never eslint/prettier.
- All new packages must follow the `packages/{name}` convention with proper exports.

## Execution Plans

- For tasks > 30 minutes, update `PLANS.md` before coding.
- Record checkpoints and final verification commands.

## Observability

- Include `run_id`, `trace_id`, and `task_id` in major workflow logs.
- Use structured logging in all API routes.
