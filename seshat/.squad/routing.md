# Routing Rules — Seshat Squad

## Default Routing

| Trigger | Assigned To |
|---------|-------------|
| `type:feature` + UI / canvas / frontend | @fenster |
| `type:feature` + API / DB / auth / monitoring | @capcom |
| `type:bug` + frontend | @fenster |
| `type:bug` + backend / API | @capcom |
| `type:bug` + unknown origin | @archie triages first |
| `type:test` | @fido |
| `type:docs` | @scribe |
| `type:epic` / `type:spike` / `type:chore` infra | @archie |
| `priority:p0` any domain | @archie reviews immediately, then routes |

## Parallel Work Policy

Tasks with no declared dependency in the PRD may be picked up in parallel.
@archie confirms dependency order before fan-out begins.

## Blocked Policy

If an agent is blocked > 30 minutes:
1. Comment on the issue: `BLOCKED: <reason>`
2. Notify @archie
3. Move to next available unblocked task

## Review Policy

- PRs to `dev`: @archie reviews architecture-impacting changes
- PR `dev → beta`: @archie writes description + checklist, @fido confirms all tests green
- `beta → main`: human (`@laszewskimariusz`) only — no agent ever merges this
