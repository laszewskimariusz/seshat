# Seshat — Squad Team Roster

> **Project:** Seshat — HomeLab Map
> **Repo:** `laszewskimariusz/seshat`
> **Stack:** Next.js · SQLite (default) · Docker · TypeScript · Self-hosted
> **Deploy model:** Docker Compose on user's own machine — NO cloud dependency

---

## Team Members

| Handle | Role | Domain |
|--------|------|--------|
| @archie | Lead Architect & Coordinator | Architecture, PRD decomposition, PR review, routing, unblocking |
| @fenster | Frontend Engineer | Next.js, React, UI (Excalidraw/Notion aesthetic), canvas, Tailwind |
| @capcom | Backend Engineer | Node.js, SQLite/Prisma, REST API, auth, file service, monitoring cron |
| @fido | QA & Testing | Vitest, Playwright, E2E, integration tests |
| @scribe | Documentation & DevRel | README, API docs, decisions log, CHANGELOG, Docker setup docs |

---

## Branch Rules

```
main     ← LOCKED — human-only merge, agents never touch this
beta     ← release candidate — @archie opens PR here, human reviews & merges
dev      ← agents' integration branch — merge freely
feature/* ← individual work branches per agent/task
fix/*    ← bug fix branches
```

**Agents MUST NOT push to `main` — ever.**
**Agents MUST NOT push directly to `beta`.**
Agents work on `feature/*` → merge to `dev` → @archie opens PR `dev → beta` at milestone end.

---

## Issue Source

GitHub: `laszewskimariusz/seshat`

---

## Routing

See `.squad/routing.md`
