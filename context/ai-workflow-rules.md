# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. The `context/` files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch.

All implementation must follow **test-driven development (TDD)** with the red-green-refactor cycle. Never write implementation code before a failing test. The cycle is:

1. **Red** — Write a minimal test that fails because the feature doesn't exist yet. Verify it fails for the right reason.
2. **Green** — Write the minimum implementation code to make the test pass. Do not over-engineer.
3. **Refactor** — Clean up both test and implementation code. Remove duplication, improve naming, ensure the code follows project conventions. Tests must stay green throughout.

## Scoping Rules

- Work on one feature unit at a time as defined in `build-plan.md`.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.
- Each unit must be independently testable and demonstrable.

## When to Split Work

Split an implementation step if it combines:

- Frontend and backend changes that can be built and tested independently.
- Multiple unrelated API routes or use cases (e.g. collections CRUD and bookmarks CRUD).
- UI changes spanning multiple pages with no shared dependency.
- Behavior not clearly defined in the context files.

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing. Propose the resolution and wait for confirmation.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Protected Files

Do not modify the following unless explicitly instructed:

- `/backend/prisma/migrations/*` generated migrations — create new migrations, do not edit existing ones.
- Prisma generated client (`/backend/node_modules/.prisma`).
- Any third-party library internals.
- `context/` files are updated through the documented sync rules, not rewritten wholesale mid-feature.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries → `architecture.md`
- Storage model decisions → `architecture.md`
- Code conventions or standards → `code-standards.md`
- Feature scope, goals, or user flow → `project-overview.md`
- Theme, colors, typography → `ui-tokens.md`
- Layout patterns, component conventions → `ui-rules.md`
- Third-party library usage rules → `library-docs.md`

`progress-tracker.md` and `ui-registry.md` must be updated after every meaningful implementation change.

## TDD Discipline

- Every feature or bugfix begins with a failing test. No exceptions.
- Tests must be written at the appropriate level:
  - **Backend**: Unit tests for services and DTO validation. Integration tests for controllers/guards against a test database where ownership scoping is asserted.
  - **Frontend**: Component tests for UI behavior. Integration tests for page-level flows with mocked API.
- Tests must cover both happy paths and error/edge cases — including the security invariants (a user can never read another user's collections/bookmarks).
- Mocks are used only at system boundaries (Auth0, external URL fetch, database in pure unit tests). Do not mock business logic.
- A test that doesn't fail before implementation is invalid — prove the red phase before going green.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` (and `ui-registry.md` for UI work) reflects the completed work.

## Validation Gate (no-mistakes)

Once the current unit is committed on a feature branch, validate it through the `no-mistakes` pipeline instead of running manual build/lint/test checks:

```sh
no-mistakes axi run --intent "<what the user set out to accomplish>"
```

The pipeline handles review, test, lint, build, push, PR, and CI automatically. Follow the validate-and-decide loop in the `/no-mistakes` skill — respond to gates as they appear, escalate `ask-user` findings to the user, and only proceed past a `checks-passed` outcome.

- Never hand-rebase, force-push, or manually fix findings while a run is active — the pipeline owns the branch.
- Do not treat local build/lint/test as a substitute for the gate — the pipeline validates what you committed, not your working tree.