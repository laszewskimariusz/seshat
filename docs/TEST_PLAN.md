# Seshat — Test Plan (Phase 1 / WI-11)

Stack: Jest (unit + integration) · Playwright (E2E) · Supertest (HTTP assertions)
Written before backend completion so tests are ready when Neo finishes.

---

## 1. Unit Tests (Jest)

Run with: `npm test -- --testPathPattern=__tests__/unit`

### 1.1 `lib/auth.ts`

File: `__tests__/unit/auth.test.ts`

#### `hashPassword(plaintext: string): Promise<string>`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-AUTH-01 | Returns a string | `expect(typeof hash).toBe('string')` |
| U-AUTH-02 | Returns a bcrypt hash (starts with `$2b$`) | `expect(hash).toMatch(/^\$2b\$/)` |
| U-AUTH-03 | Same input produces different hashes (salt is random) | `hash1 !== hash2` for same plaintext |
| U-AUTH-04 | Different input produces different hash | `hash('abc') !== hash('xyz')` |
| U-AUTH-05 | Empty string hashes without throwing | resolves without error |

#### `verifyPassword(plaintext: string, hash: string): Promise<boolean>`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-AUTH-06 | Correct password returns `true` | `expect(result).toBe(true)` |
| U-AUTH-07 | Wrong password returns `false` | `expect(result).toBe(false)` |
| U-AUTH-08 | Empty string against real hash returns `false` | `expect(result).toBe(false)` |
| U-AUTH-09 | Correct password against hash of different password returns `false` | `expect(result).toBe(false)` |

#### `signToken(payload: { userId: string; email: string }): string`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-AUTH-10 | Returns a string | `expect(typeof token).toBe('string')` |
| U-AUTH-11 | Token has three dot-separated segments (JWT structure) | `token.split('.').length === 3` |
| U-AUTH-12 | Decoded payload contains `userId` | decode and check `payload.userId` matches input |
| U-AUTH-13 | Decoded payload contains `email` | decode and check `payload.email` matches input |
| U-AUTH-14 | Two calls with same payload produce different tokens (iat differs or jti) | `token1 !== token2` — or at minimum both are valid |
| U-AUTH-15 | Uses `JWT_SECRET` from env; different secret would fail verify | sign with known secret, verify with wrong secret throws |

#### `verifyToken(token: string): JwtPayload`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-AUTH-16 | Valid token returns payload with `userId` and `email` | `payload.userId` and `payload.email` defined |
| U-AUTH-17 | Expired token throws `TokenExpiredError` | `expect(() => verifyToken(expired)).toThrow(/expired/i)` |
| U-AUTH-18 | Token signed with wrong secret throws `JsonWebTokenError` | tamper secret, expect throw |
| U-AUTH-19 | Tampered payload (base64 edited) throws | modify middle segment, expect throw |
| U-AUTH-20 | Empty string throws | `expect(() => verifyToken('')).toThrow()` |
| U-AUTH-21 | Malformed string (not a JWT) throws | `expect(() => verifyToken('not.a.token')).toThrow()` |

---

### 1.2 `lib/monitorService.ts`

File: `__tests__/unit/monitorService.test.ts`

Mock `axios`, `net.createConnection`, and Prisma client before all tests.

#### `checkAllServices(userId: string): Promise<StatusEntry[]>`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-MON-01 | Returns an array | `expect(Array.isArray(result)).toBe(true)` |
| U-MON-02 | Each element has `serviceId`, `status`, `checkedAt` fields | structural check on `result[0]` |
| U-MON-03 | `status` is one of `'online' \| 'offline' \| 'unknown'` | check enum membership |
| U-MON-04 | HTTP service returning 2xx → `status: 'online'` | mock `axios.get` to resolve `{status: 200}` |
| U-MON-05 | HTTP service returning 5xx → `status: 'offline'` | mock `axios.get` to resolve `{status: 503}` |
| U-MON-06 | HTTP service timing out → `status: 'offline'` | mock `axios.get` to reject with timeout error |
| U-MON-07 | TCP service connecting → `status: 'online'` | mock `net.createConnection` to emit `'connect'` |
| U-MON-08 | TCP service refusing → `status: 'offline'` | mock `net.createConnection` to emit `'error'` |
| U-MON-09 | User with no services returns empty array | mock Prisma to return `[]` |

#### `getLatestStatus(): Map<string, StatusEntry>`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-MON-10 | Returns a `Map` instance | `expect(result instanceof Map).toBe(true)` |
| U-MON-11 | Returns empty Map when no checks have run | `expect(result.size).toBe(0)` |
| U-MON-12 | After `checkAllServices`, Map contains entries for checked services | `expect(result.has(serviceId)).toBe(true)` |
| U-MON-13 | Map values are `StatusEntry` objects | check shape of `result.get(serviceId)` |

#### `getServiceStatus(serviceId: string): StatusEntry | undefined`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-MON-14 | Returns `StatusEntry` for a known `serviceId` | not undefined, has correct `serviceId` |
| U-MON-15 | Returns `undefined` for unknown `serviceId` | `expect(result).toBeUndefined()` |
| U-MON-16 | Returns the most recent entry after multiple checks | `checkedAt` equals latest timestamp |

#### `startMonitoring(): void`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-MON-17 | Can be called without throwing | no throw |
| U-MON-18 | Can be called twice without throwing (idempotent) | second call does not throw |

#### `stopMonitoring(): void`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-MON-19 | Can be called after `startMonitoring` without throwing | no throw |
| U-MON-20 | Can be called before `startMonitoring` without throwing (no-op) | no throw |

---

### 1.3 `lib/apiAuth.ts`

File: `__tests__/unit/apiAuth.test.ts`

Uses mocked `NextRequest` objects.

#### `getAuthUser(request: NextRequest): Promise<User | null>`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-API-01 | Returns `null` when no `Authorization` header present | `expect(result).toBeNull()` |
| U-API-02 | Returns `null` when `Authorization` is present but not `Bearer` scheme | `Authorization: Basic abc123` → null |
| U-API-03 | Returns `null` when `Bearer` token is malformed (not a JWT) | `Authorization: Bearer notajwt` → null |
| U-API-04 | Returns `null` when `Bearer` token is expired | sign token with `expiresIn: '-1s'` → null |
| U-API-05 | Returns `null` when `Bearer` token has tampered payload | modify payload segment → null |
| U-API-06 | Returns `User` object when valid `Bearer` token provided | mock Prisma user lookup → returns user |
| U-API-07 | Returns `null` when token is valid but user no longer exists in DB | mock Prisma to return `null` → null |
| U-API-08 | Also accepts token from `seshat_token` httpOnly cookie as fallback | set cookie header, no Authorization → returns user |

#### `requireAuth(request: NextRequest): Promise<User>`

| # | Test case | Assertion |
|---|-----------|-----------|
| U-API-09 | Throws (or returns 401 response) when no token present | `await expect(requireAuth(req)).rejects.toThrow()` or check response status |
| U-API-10 | Throws when token is invalid | same pattern |
| U-API-11 | Returns `User` when valid token present | `expect(user.email).toBe(testEmail)` |
| U-API-12 | Returned user has `id`, `email`, `displayName` fields | shape check |

---

## 2. Integration Tests (Jest + Supertest)

Run with: `npm test -- --testPathPattern=__tests__/integration`

**Setup per test file:**
```typescript
beforeAll(async () => {
  await prisma.$executeRaw`DELETE FROM StatusLog`
  await prisma.$executeRaw`DELETE FROM Service`
  await prisma.$executeRaw`DELETE FROM Node`
  await prisma.$executeRaw`DELETE FROM Cluster`
  await prisma.$executeRaw`DELETE FROM User`
  await seedTestUser() // email: test@seshat.local, password: Test1234!
})
afterAll(async () => { await prisma.$disconnect() })
```

---

### 2.1 Auth Endpoints

File: `__tests__/integration/auth.integration.test.ts`

#### `POST /api/auth/register`

| # | Scenario | Body | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-AUTH-01 | Valid new user | `{ email: "new@test.com", password: "Pass1234!" }` | 201 | `{ user: { id, email, displayName } }` — no passwordHash in response |
| I-AUTH-02 | Missing `email` field | `{ password: "Pass1234!" }` | 400 | `{ error: string }` |
| I-AUTH-03 | Missing `password` field | `{ email: "a@b.com" }` | 400 | `{ error: string }` |
| I-AUTH-04 | Empty `email` | `{ email: "", password: "Pass1234!" }` | 400 | `{ error: string }` |
| I-AUTH-05 | Invalid email format | `{ email: "notanemail", password: "Pass1234!" }` | 400 | `{ error: string }` |
| I-AUTH-06 | Duplicate email (already registered) | same email as I-AUTH-01 | 409 | `{ error: /already exists/i }` |
| I-AUTH-07 | Password too short (< 8 chars) | `{ email: "b@b.com", password: "short" }` | 400 | `{ error: string }` |

#### `POST /api/auth/login`

| # | Scenario | Body | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-AUTH-08 | Correct credentials | `{ email: "test@seshat.local", password: "Test1234!" }` | 200 | `{ user: { id, email } }` + `Set-Cookie: seshat_token` header |
| I-AUTH-09 | Wrong password | `{ email: "test@seshat.local", password: "wrongpass" }` | 401 | `{ error: /invalid/i }` |
| I-AUTH-10 | Unknown email | `{ email: "ghost@test.com", password: "Test1234!" }` | 401 | `{ error: /invalid/i }` — same message as I-AUTH-09 (no enumeration) |
| I-AUTH-11 | Missing `email` | `{ password: "Test1234!" }` | 400 | `{ error: string }` |
| I-AUTH-12 | Missing `password` | `{ email: "test@seshat.local" }` | 400 | `{ error: string }` |
| I-AUTH-13 | Empty body | `{}` | 400 | `{ error: string }` |

#### `GET /api/auth/me`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-AUTH-14 | Valid `seshat_token` cookie | set cookie from I-AUTH-08 | 200 | `{ user: { id, email, displayName, createdAt } }` |
| I-AUTH-15 | Valid `Bearer` token in header | `Authorization: Bearer <token>` | 200 | same shape |
| I-AUTH-16 | No token at all | none | 401 | `{ error: string }` |
| I-AUTH-17 | Expired token | sign token with `expiresIn: '-1s'` | 401 | `{ error: /expired/i }` |
| I-AUTH-18 | Tampered token | modify payload | 401 | `{ error: string }` |

#### `POST /api/auth/logout`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-AUTH-19 | Authenticated | valid cookie | 200 | `Set-Cookie: seshat_token=; Max-Age=0` (cookie cleared) |
| I-AUTH-20 | Not authenticated | none | 200 | still clears cookie (idempotent) |

---

### 2.2 Cluster Endpoints

File: `__tests__/integration/clusters.integration.test.ts`

#### `GET /api/clusters`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-CLU-01 | Authenticated, no clusters | valid token | 200 | `{ clusters: [] }` |
| I-CLU-02 | Authenticated, has clusters | valid token + seed clusters | 200 | `{ clusters: [ { id, name, type, color, emoji, posX, posY, nodes: [] } ] }` |
| I-CLU-03 | Not authenticated | none | 401 | `{ error: string }` |
| I-CLU-04 | Only returns own user's clusters | two users, each has clusters | 200 | only caller's clusters in array |

#### `POST /api/clusters`

| # | Scenario | Body | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-CLU-05 | Valid minimal data | `{ name: "Home Lab", type: "proxmox" }` | 201 | `{ cluster: { id, name, type, color: "blue", posX: 70, posY: 70 } }` |
| I-CLU-06 | Valid with all fields | `{ name: "K8s", type: "k8s", color: "green", emoji: "☸️", cidr: "10.0.0.0/24" }` | 201 | `{ cluster: { id, name, type, color, emoji, cidr } }` |
| I-CLU-07 | Missing `name` | `{ type: "proxmox" }` | 400 | `{ error: string }` |
| I-CLU-08 | Missing `type` | `{ name: "Lab" }` | 400 | `{ error: string }` |
| I-CLU-09 | Invalid `type` value | `{ name: "X", type: "notavalidtype" }` | 400 | `{ error: string }` |
| I-CLU-10 | Not authenticated | valid body | 401 | `{ error: string }` |

#### `GET /api/clusters/:id`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-CLU-11 | Own cluster, no nodes | valid token | 200 | `{ cluster: { id, name, nodes: [] } }` |
| I-CLU-12 | Own cluster, with nodes and services | valid token | 200 | nested `nodes[].services[]` included |
| I-CLU-13 | Another user's cluster id | valid token (different user) | 404 | `{ error: string }` |
| I-CLU-14 | Non-existent id | valid token | 404 | `{ error: string }` |
| I-CLU-15 | Not authenticated | none | 401 | `{ error: string }` |

#### `PUT /api/clusters/:id`

| # | Scenario | Body | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-CLU-16 | Update `name` | `{ name: "Renamed Cluster" }` | 200 | `{ cluster: { id, name: "Renamed Cluster" } }` |
| I-CLU-17 | Update `color` | `{ color: "red" }` | 200 | `{ cluster: { color: "red" } }` |
| I-CLU-18 | Not authenticated | valid body | 401 | `{ error: string }` |
| I-CLU-19 | Another user's cluster | valid token (different user) | 404 | `{ error: string }` |

#### `PUT /api/clusters/:id/position`

| # | Scenario | Body | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-CLU-20 | Update position | `{ posX: 200, posY: 350 }` | 200 | `{ cluster: { posX: 200, posY: 350 } }` |
| I-CLU-21 | Missing `posX` | `{ posY: 100 }` | 400 | `{ error: string }` |
| I-CLU-22 | Not authenticated | valid body | 401 | `{ error: string }` |

#### `DELETE /api/clusters/:id`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-CLU-23 | Own cluster | valid token | 200 | `{ success: true }` or `{}` |
| I-CLU-24 | Own cluster (verify cascade) | valid token, cluster has nodes/services | 200 | subsequent GET on deleted nodes returns 404 |
| I-CLU-25 | Not found | valid token | 404 | `{ error: string }` |
| I-CLU-26 | Another user's cluster | valid token (different user) | 404 | `{ error: string }` |
| I-CLU-27 | Not authenticated | none | 401 | `{ error: string }` |

---

### 2.3 Node Endpoints

File: `__tests__/integration/nodes.integration.test.ts`

Prereq: seed cluster belonging to test user (`clusterId`).

#### `POST /api/clusters/:id/nodes`

| # | Scenario | Body | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-NOD-01 | Valid minimal node | `{ name: "web-01", type: "vm", ip: "192.168.1.10" }` | 201 | `{ node: { id, name, type, ip, clusterId } }` |
| I-NOD-02 | Valid with optional fields | `{ name: "db-01", type: "ct", ip: "192.168.1.11", os: "Ubuntu 22.04", notes: "primary" }` | 201 | `{ node: { id, os, notes } }` |
| I-NOD-03 | Missing `name` | `{ type: "vm", ip: "192.168.1.10" }` | 400 | `{ error: string }` |
| I-NOD-04 | Missing `ip` | `{ name: "web-01", type: "vm" }` | 400 | `{ error: string }` |
| I-NOD-05 | Missing `type` | `{ name: "web-01", ip: "192.168.1.10" }` | 400 | `{ error: string }` |
| I-NOD-06 | Invalid `type` value | `{ name: "x", type: "helicopter", ip: "1.1.1.1" }` | 400 | `{ error: string }` |
| I-NOD-07 | Cluster belongs to another user | valid body, other user's clusterId | 404 | `{ error: string }` |
| I-NOD-08 | Cluster not found | valid body, fake clusterId | 404 | `{ error: string }` |
| I-NOD-09 | Not authenticated | valid body | 401 | `{ error: string }` |

#### `PUT /api/clusters/:id/nodes/:nid`

| # | Scenario | Body | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-NOD-10 | Update `name` | `{ name: "web-01-renamed" }` | 200 | `{ node: { id, name: "web-01-renamed" } }` |
| I-NOD-11 | Update `ip` | `{ ip: "192.168.1.99" }` | 200 | `{ node: { ip: "192.168.1.99" } }` |
| I-NOD-12 | Update `notes` | `{ notes: "updated notes" }` | 200 | `{ node: { notes: "updated notes" } }` |
| I-NOD-13 | Node not found | fake nid | 404 | `{ error: string }` |
| I-NOD-14 | Node belongs to another user's cluster | valid token (different user) | 404 | `{ error: string }` |
| I-NOD-15 | Not authenticated | valid body | 401 | `{ error: string }` |

#### `DELETE /api/clusters/:id/nodes/:nid`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-NOD-16 | Own node | valid token | 200 | `{ success: true }` |
| I-NOD-17 | Own node (verify cascade) | valid token, node has services | 200 | services also deleted |
| I-NOD-18 | Node not found | valid token | 404 | `{ error: string }` |
| I-NOD-19 | Another user's node | valid token (different user) | 404 | `{ error: string }` |
| I-NOD-20 | Not authenticated | none | 401 | `{ error: string }` |

---

### 2.4 Service Endpoints

File: `__tests__/integration/services.integration.test.ts`

Prereq: seed cluster + node (`clusterId`, `nodeId`).

#### `POST /api/clusters/:id/nodes/:nid/services`

| # | Scenario | Body | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-SVC-01 | Valid HTTP service | `{ name: "Nginx", port: 80, protocol: "http" }` | 201 | `{ service: { id, name, port, protocol, shareIp: true } }` |
| I-SVC-02 | Valid HTTPS service | `{ name: "Grafana", port: 3000, protocol: "https" }` | 201 | `{ service: { id, protocol: "https" } }` |
| I-SVC-03 | Valid TCP service with custom ip | `{ name: "Redis", port: 6379, protocol: "tcp", ip: "192.168.1.20", shareIp: false }` | 201 | `{ service: { ip: "192.168.1.20", shareIp: false } }` |
| I-SVC-04 | Missing `name` | `{ port: 80, protocol: "http" }` | 400 | `{ error: string }` |
| I-SVC-05 | Missing `port` | `{ name: "Nginx", protocol: "http" }` | 400 | `{ error: string }` |
| I-SVC-06 | Invalid `port` (0) | `{ name: "x", port: 0, protocol: "http" }` | 400 | `{ error: string }` |
| I-SVC-07 | Invalid `port` (>65535) | `{ name: "x", port: 99999, protocol: "http" }` | 400 | `{ error: string }` |
| I-SVC-08 | Invalid `protocol` | `{ name: "x", port: 80, protocol: "ftp" }` | 400 | `{ error: string }` |
| I-SVC-09 | Node not found | fake nid | 404 | `{ error: string }` |
| I-SVC-10 | Node belongs to another user | valid token (different user) | 404 | `{ error: string }` |
| I-SVC-11 | Not authenticated | valid body | 401 | `{ error: string }` |

#### `PUT /api/clusters/:id/nodes/:nid/services/:sid`

| # | Scenario | Body | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-SVC-12 | Update `name` | `{ name: "Nginx-v2" }` | 200 | `{ service: { name: "Nginx-v2" } }` |
| I-SVC-13 | Update `port` | `{ port: 8080 }` | 200 | `{ service: { port: 8080 } }` |
| I-SVC-14 | Update `protocol` | `{ protocol: "https" }` | 200 | `{ service: { protocol: "https" } }` |
| I-SVC-15 | Service not found | fake sid | 404 | `{ error: string }` |
| I-SVC-16 | Another user's service | valid token (different user) | 404 | `{ error: string }` |
| I-SVC-17 | Not authenticated | valid body | 401 | `{ error: string }` |

#### `DELETE /api/clusters/:id/nodes/:nid/services/:sid`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-SVC-18 | Own service | valid token | 200 | `{ success: true }` |
| I-SVC-19 | Service not found | valid token | 404 | `{ error: string }` |
| I-SVC-20 | Another user's service | valid token (different user) | 404 | `{ error: string }` |
| I-SVC-21 | Not authenticated | none | 401 | `{ error: string }` |

---

### 2.5 Status / Monitoring Endpoints

File: `__tests__/integration/status.integration.test.ts`

Prereq: seed cluster + node + service. Mock `axios` and `net` to avoid real network calls.

#### `GET /api/status`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-STA-01 | Authenticated, no services | valid token | 200 | `{ statuses: {} }` or `{ statuses: [] }` |
| I-STA-02 | Authenticated, services exist | valid token + seed + mock check | 200 | `{ statuses: { [serviceId]: { status, latencyMs, checkedAt } } }` |
| I-STA-03 | Each status entry has required shape | valid token | 200 | `status ∈ ['online','offline','unknown']`, `checkedAt` is ISO string |
| I-STA-04 | Not authenticated | none | 401 | `{ error: string }` |

#### `POST /api/status/check`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-STA-05 | Triggers check, returns results | valid token | 200 | `{ results: [{ serviceId, status, latencyMs }] }` |
| I-STA-06 | Empty results when no services | valid token, no services | 200 | `{ results: [] }` |
| I-STA-07 | Not authenticated | none | 401 | `{ error: string }` |

#### `GET /api/status/stream`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-STA-08 | Authenticated → SSE stream established | valid token | 200 | `Content-Type: text/event-stream` header |
| I-STA-09 | SSE response has `Cache-Control: no-cache` | valid token | 200 | check header |
| I-STA-10 | SSE response has `Connection: keep-alive` | valid token | 200 | check header |
| I-STA-11 | Not authenticated | none | 401 | `{ error: string }` |

#### `GET /api/health`

| # | Scenario | Auth | Expected Status | Expected Response |
|---|----------|------|-----------------|-------------------|
| I-STA-12 | DB reachable | none (public) | 200 | `{ status: "ok" }` or `{ db: "ok" }` |

---

## 3. E2E Tests (Playwright)

Run with: `npm run test:e2e`
Base URL: `http://localhost:3000`
Browser: Chromium (headless in CI, headed locally)

---

### E2E-01: Register + Login Flow

File: `e2e/auth.spec.ts`

```
Scenario: First-time user registers, then logs out, then logs in again.
```

**Steps:**
1. Navigate to `/` — assert login form is visible (`data-testid="login-form"` or `form[action*=login]`)
2. Click "Create account" / "Register" link → assert URL changes to `/register`
3. Fill `input[name="email"]` with `e2e-test@seshat.local`
4. Fill `input[name="password"]` with `E2eTest1234!`
5. Fill `input[name="displayName"]` (if present) with `E2E Tester`
6. Click submit button
7. Assert: URL becomes `/app` (or `/dashboard`)
8. Assert: canvas container is visible (`data-testid="canvas"` or `.canvas-root`)
9. Click logout button
10. Assert: URL returns to `/` or `/login`
11. Fill login form with same email + password
12. Click login submit
13. Assert: URL becomes `/app` again
14. Assert: user's display name appears in header/sidebar

**Failure checks:**
- Duplicate email on register → inline error message visible
- Wrong password on login → inline error message visible, URL stays `/`

---

### E2E-02: Create Cluster

File: `e2e/clusters.spec.ts`

```
Scenario: Authenticated user creates a new cluster and sees it on canvas.
```

**Steps:**
1. Login as test user, land on `/app`
2. Assert canvas is visible
3. Click "New Cluster" button (`data-testid="btn-new-cluster"`)
4. Assert: modal / drawer opens (`data-testid="modal-create-cluster"`)
5. Fill `input[name="name"]` with `Test Cluster`
6. Select type `proxmox` from dropdown/select (`select[name="type"]` or radio)
7. Select color `blue` (if color picker present)
8. Click "Create" / "Save" button
9. Assert: modal closes
10. Assert: cluster card with text "Test Cluster" appears on canvas (`data-testid="cluster-card"]`)
11. Assert: cluster card is within canvas viewport bounds

**Edge cases (separate `test.describe` block):**
- Submit with empty name → validation error shown in modal, modal stays open
- Close modal with Escape → no cluster created

---

### E2E-03: Add Node to Cluster

File: `e2e/clusters.spec.ts`

```
Scenario: Add a VM node to an existing cluster.
```

**Prereq:** Cluster "Test Cluster" exists (created in E2E-02 or via API seed before test).

**Steps:**
1. Login and navigate to `/app`
2. Locate cluster card for "Test Cluster" on canvas
3. Click "+ Add Node" button on cluster card (`data-testid="btn-add-node"`)
4. Assert: node creation modal opens
5. Fill `input[name="name"]` with `web-01`
6. Fill `input[name="ip"]` with `192.168.1.10`
7. Select type `vm` from dropdown
8. Click "Add" / "Save"
9. Assert: modal closes
10. Assert: node card with text "web-01" appears inside cluster card
11. Assert: IP `192.168.1.10` is visible on node card

**Edge cases:**
- Missing IP → validation error in modal
- Invalid IP format → validation error

---

### E2E-04: Add Service to Node

File: `e2e/clusters.spec.ts`

```
Scenario: Add an HTTP service to an existing node.
```

**Prereq:** Cluster + node "web-01" exist.

**Steps:**
1. Login and navigate to `/app`
2. Locate node card "web-01" within cluster card
3. Click "+ Service" / "+ Add Service" button on node card
4. Assert: service creation modal or inline form appears
5. Fill `input[name="name"]` with `Nginx`
6. Fill `input[name="port"]` with `80`
7. Select protocol `http`
8. Click "Add" / "Save"
9. Assert: service tag/badge with text "Nginx :80" (or similar) appears on node card
10. Assert: service shows protocol indicator (e.g. "HTTP" badge)
11. Assert: status dot is visible on service tag (may be `unknown` initially — grey)

**Edge cases:**
- Missing port → validation error
- Port = 0 → validation error
- Port > 65535 → validation error

---

### E2E-05: Edit Node via Detail Panel

File: `e2e/clusters.spec.ts`

```
Scenario: Click a node card to open the detail panel, edit name and IP, save, verify canvas updates.
```

**Prereq:** Node "web-01" with IP `192.168.1.10` exists.

**Steps:**
1. Login and navigate to `/app`
2. Click on node card "web-01"
3. Assert: detail panel slides open from right side of screen (`data-testid="detail-panel"`)
4. Assert: panel shows current name "web-01" and IP "192.168.1.10"
5. Clear `input[name="name"]` and type `web-01-edited`
6. Clear `input[name="ip"]` and type `192.168.1.50`
7. Click "Save" button
8. Assert: success toast/indicator appears
9. Assert: panel now shows updated values
10. Assert: node card on canvas updates to show "web-01-edited"
11. Assert: IP shown on canvas node card is now "192.168.1.50"
12. Click "Close" or click outside panel
13. Assert: panel closes

**Edge cases:**
- Clear name and save → validation error, panel stays open
- Edit then press Escape → changes discarded (or confirmation dialog)

---

### E2E-06: Canvas Pan and Zoom

File: `e2e/canvas.spec.ts`

```
Scenario: Verify canvas supports pan via drag and zoom via scroll wheel.
```

**Steps:**
1. Login and navigate to `/app`
2. Ensure at least one cluster card exists (seed via API if needed)

**Pan test:**
3. Record initial position of cluster card (getBoundingClientRect)
4. `page.mouse.move(400, 300)` → `page.mouse.down()` → `page.mouse.move(600, 400)` → `page.mouse.up()` (drag canvas)
5. Assert: cluster card bounding rect has changed (content moved with canvas)

**Zoom in test:**
6. Scroll up (zoom in) on canvas: `page.mouse.wheel(0, -300)`
7. Assert: cluster card bounding rect is larger (or CSS transform scale increased)

**Zoom out test:**
8. Scroll down (zoom out): `page.mouse.wheel(0, 300)`
9. Assert: cluster card bounding rect is smaller

**Reset test:**
10. Locate and click "Reset View" / "Fit" button (`data-testid="btn-reset-view"`)
11. Assert: canvas transform returns to default (scale ≈ 1, translate ≈ 0,0) — check via `evaluate(() => getComputedStyle(...).transform)`

---

### E2E-07: Live Status Dots

File: `e2e/monitoring.spec.ts`

```
Scenario: Service status dots update after monitoring cycle and manual check.
```

**Prereq:** Service "Nginx" on port 80 exists. Test server may mock responses.

**Manual check flow (fast path — does not wait 30s):**
1. Login and navigate to `/app`
2. Locate service tag for "Nginx" on canvas
3. Assert: status dot is present (`data-testid="status-dot"` or `.status-dot`)
4. Note initial dot color class (e.g. `bg-gray-400` for unknown)
5. Click "Check Status" button (`data-testid="btn-check-status"`)
6. Assert: loading spinner appears on button (or button disabled)
7. Wait for spinner to disappear (up to 10s: `waitForSelector` on spinner to be hidden)
8. Assert: status dot has updated (color class changed, or `aria-label` changed to "online" or "offline")

**SSE live update flow:**
9. Intercept SSE route: `page.route('/api/status/stream', ...)` to inject a status change event
10. Assert: dot color updates within 2s without page refresh

**30s auto-cycle (optional / can be marked `test.slow()`):**
11. `page.waitForTimeout(35000)` — wait for full monitoring cycle
12. Assert: at least one status dot has a color attribute other than "unknown" grey

---

## 4. Test Setup

### Database

```bash
# Before integration tests
DATABASE_URL=file:./data/test.db npx prisma migrate deploy
```

`.env.test`:
```
DATABASE_URL=file:./data/test.db
JWT_SECRET=test-secret-at-least-32-chars-long-for-jest
NODE_ENV=test
```

Jest `globalSetup` (`__tests__/setup/globalSetup.ts`):
```typescript
import { execSync } from 'child_process'

export default async function globalSetup() {
  process.env.DATABASE_URL = 'file:./data/test.db'
  execSync('npx prisma migrate deploy', { env: process.env })
}
```

### Test User Seed

`__tests__/setup/seed.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../src/lib/auth'

const prisma = new PrismaClient()

export async function seedTestUser() {
  const hash = await hashPassword('Test1234!')
  return prisma.user.upsert({
    where: { email: 'test@seshat.local' },
    update: {},
    create: {
      email: 'test@seshat.local',
      passwordHash: hash,
      displayName: 'Test User',
    },
  })
}
```

### Cleanup Between Tests

In each integration test file:
```typescript
beforeEach(async () => {
  // Truncate in FK-safe order (children before parents)
  await prisma.statusLog.deleteMany()
  await prisma.service.deleteMany()
  await prisma.node.deleteMany()
  await prisma.cluster.deleteMany()
  // DO NOT delete User — keep seeded test user
})
```

### E2E Base URL

`playwright.config.ts` → `baseURL: 'http://localhost:3000'`

Run the app before E2E: `npm run dev` or `npm run start` in a separate terminal.

Playwright `globalSetup` seeds a known user via API before the suite:
```typescript
// e2e/setup/global.setup.ts
import { chromium } from '@playwright/test'

export default async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.request.post('http://localhost:3000/api/auth/register', {
    data: { email: 'e2e@seshat.local', password: 'E2eTest1234!', displayName: 'E2E User' },
  })
  await browser.close()
}
```

### Playwright Config

```typescript
// playwright.config.ts
{
  testDir: './e2e',
  fullyParallel: false,   // SSE + shared DB — keep sequential
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  globalSetup: './e2e/setup/global.setup.ts',
}
```

---

## 5. Test File Structure

```
seshat/seshat/
├── __tests__/
│   ├── setup/
│   │   ├── globalSetup.ts        # prisma migrate deploy for test.db
│   │   └── seed.ts               # seedTestUser(), seedCluster(), etc.
│   ├── unit/
│   │   ├── auth.test.ts          # U-AUTH-01 → U-AUTH-21
│   │   ├── monitorService.test.ts # U-MON-01 → U-MON-20
│   │   └── apiAuth.test.ts       # U-API-01 → U-API-12
│   └── integration/
│       ├── auth.integration.test.ts      # I-AUTH-01 → I-AUTH-20
│       ├── clusters.integration.test.ts  # I-CLU-01 → I-CLU-27
│       ├── nodes.integration.test.ts     # I-NOD-01 → I-NOD-20
│       ├── services.integration.test.ts  # I-SVC-01 → I-SVC-21
│       └── status.integration.test.ts    # I-STA-01 → I-STA-12
└── e2e/
    ├── setup/
    │   └── global.setup.ts        # register E2E user via API
    ├── auth.spec.ts               # E2E-01: register + login
    ├── clusters.spec.ts           # E2E-02: create cluster, E2E-03: add node, E2E-04: add service, E2E-05: edit panel
    ├── canvas.spec.ts             # E2E-06: pan + zoom + reset
    └── monitoring.spec.ts         # E2E-07: status dots
```

---

## 6. Test ID Summary

| Range | Module | Count |
|-------|--------|-------|
| U-AUTH-01 → U-AUTH-21 | `lib/auth.ts` unit | 21 |
| U-MON-01 → U-MON-20 | `lib/monitorService.ts` unit | 20 |
| U-API-01 → U-API-12 | `lib/apiAuth.ts` unit | 12 |
| I-AUTH-01 → I-AUTH-20 | Auth endpoints integration | 20 |
| I-CLU-01 → I-CLU-27 | Cluster endpoints integration | 27 |
| I-NOD-01 → I-NOD-20 | Node endpoints integration | 20 |
| I-SVC-01 → I-SVC-21 | Service endpoints integration | 21 |
| I-STA-01 → I-STA-12 | Status endpoints integration | 12 |
| E2E-01 → E2E-07 | Playwright critical paths | 7 |
| **Total** | | **160** |

---

*Written by Tank (QA) · WI-11 · Phase 1*
