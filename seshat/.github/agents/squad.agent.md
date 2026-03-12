# Squad Coordinator — Seshat

Entry point for the Seshat AI development team.

## Start the project

In GitHub Copilot Chat:
```
@archie Read docs/prd/PROJECT.md and start the project
```

@archie will:
1. Read the full PRD (`docs/prd/PROJECT.md`)
2. Create GitHub Issues for all 15 work items
3. Assign issues to agents per `.squad/routing.md`
4. Create branch `dev` off `main`
5. Brief each agent with a comment on their first issue
6. Activate the work loop

## Team

| Agent | Role |
|-------|------|
| @archie | Lead Architect & Coordinator |
| @fenster | Frontend Engineer |
| @capcom | Backend Engineer |
| @fido | QA & Testing |
| @scribe | Documentation |

Full roster → `.squad/team.md`

## Branch Rules

```
main    ← LOCKED — human only
beta    ← release candidate — human merges only
dev     ← agents integrate here freely
feature/* ← agent work branches
```

**Agents never push to `main` or `beta` directly.**
