## Project Context

## Read Before Anything Else

Read in this exact order before any implementation:

1. context/project-overview.md
2. context/architecture.md
3. context/ui-tokens.md
4. context/ui-rules.md
5. context/ui-registry.md
6. context/code-standards.md
7. context/library-docs.md
8. context/build-plan.md
9. context/ai-workflow-rules.md
10. context/progress-tracker.md

If implementation changes the architecture, scope, or standards documented in the context files, update the relevant file before continuing.
Update `context/progress-tracker.md` after each meaningful implementation change.

## Rules That Never Change

- Never use hardcoded hex values or raw Tailwind color classes — use tokens from `ui-tokens.md`
- Update `progress-tracker.md` and `ui-registry.md` after every feature
- Before using any third-party library, check `context/library-docs.md` for project-specific rules
- If the same problem persists after one corrective prompt — stop and investigate root cause before continuing

## Available Skills

- `/orchestator` — for planning and coordinating multiple agents to work together on a complex feature.
- `/architect` — before any complex feature. Think before building.
- `/review` — after building a feature, verify it matches the plan before demo.
- `/recover` — when something breaks after one failed correction.
