# Control Loop

## Feedback Mechanism

```
   ┌─────────┐
   │ Measure  │ ← Run sensors (build, lint, test, audit)
   └────┬─────┘
        ▼
   ┌─────────┐
   │ Compare  │ ← Check against setpoints (pass_at_1, cycle_time)
   └────┬─────┘
        ▼
   ┌─────────┐
   │ Decide   │ ← Identify failing gates, root causes
   └────┬─────┘
        ▼
   ┌─────────┐
   │  Act     │ ← Apply fixes (code, config, docs, scripts)
   └────┬─────┘
        ▼
   ┌─────────┐
   │ Verify   │ ← Re-run sensors to confirm
   └─────────┘
```

## Gate Sequence

1. `make smoke` — environment + build sanity (< 10s)
2. `make check` — lint + typecheck (< 60s)
3. `make test` — full test suite (< 5 min)

Failing any gate blocks the next stage.

## Escalation

- Retry budget: 2 attempts per gate
- After exhaustion: escalate to human_oncall
- Recovery: `make recover` (clean reinstall + rebuild)

## Entropy Control

- Periodic audit: `make control-audit`
- CI runs audit on every PR
- Nightly workflow checks for doc drift and stale scripts
