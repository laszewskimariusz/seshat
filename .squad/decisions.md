# Squad Decisions

## Active Decisions

### 2026-03-12 — Phase 1 documentation and beta PR

**Context:** WI-12 finalises Phase 1. All backend (WI-01–06), frontend (WI-07–10), and QA (WI-11) work is merged into `dev`.

**Decisions:**
- README replaced with user-facing quickstart (Docker Compose first, dev second).
- `docs/API.md` created as the canonical endpoint reference for all 19 routes.
- `CHANGELOG.md` created at repo root to track releases going forward.
- `dev` → `beta` PR opened for human review before any production deployment.
- Phase 2 scope (search, bulk import, Prometheus metrics) deferred until beta sign-off.

**Owner:** Oracle (Documentation)

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
