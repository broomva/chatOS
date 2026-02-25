# METALAYER

This repository operates as a control loop for autonomous agent development.

## Setpoints

- pass_at_1 target: 100% (all turbo tasks pass)
- merge_cycle_time target: < 30 min
- revert_rate target: < 5%
- human_intervention_rate target: < 10%

## Sensors

- CI checks (GitHub Actions)
- `turbo build` / `turbo check-types` / `turbo lint` outcomes
- Web E2E outcomes (Playwright)
- Biome static analysis
- Control audit results

## Controller Policy

- Gate sequence: smoke → check → test
- Retry budget: 2
- Escalation: human_oncall after retry budget exhausted

## Actuators

- Code edits
- Package configuration updates
- Script updates
- Policy updates
- Documentation updates
- CI workflow updates

## Feedback Loop

1. **Measure**: Run sensors (build, lint, test, audit)
2. **Compare**: Check against setpoints
3. **Decide**: Identify failing gates and root causes
4. **Act**: Apply fixes via actuators
5. **Verify**: Re-run sensors to confirm resolution
