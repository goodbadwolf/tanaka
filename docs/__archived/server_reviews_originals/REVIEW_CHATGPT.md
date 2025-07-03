# Tanaka Server — Required Changes

## 1 Security

1. **Replace static shared‐token auth** with JWT or comparable short‑lived tokens; the current equality check (`token == shared_token`) is trivially replayable fileciteturn2file12L51-L57 and contradicts OWASP recommendations ([cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html?utm_source=chatgpt.com)).
2. **Lock down CORS**: swap `CorsLayer::permissive()` for an explicit allow‑origin/allow‑headers list (include `Authorization`) fileciteturn2file2L22-L25. Misconfigured CORS opens the door to cross‑domain attacks ([portswigger.net](https://portswigger.net/web-security/cors?utm_source=chatgpt.com)).
3. **Add CSRF protection** (double‑submit cookie or SameSite) for state‑changing routes.
4. **Enforce request size & rate limits** at the HTTP layer to mitigate DoS; reuse the rate‑limiter but add sliding‑window eviction to avoid unbounded DashMap growth.
5. **Mandate HTTPS even in dev** with `tls.dev_cert = true`; refuse plain HTTP except in test harness.

## 2 Data integrity

1. **Move ad‑hoc table creation to `sqlx` migrations**; current runtime `CREATE TABLE` logic fileciteturn2file14L6-L14 hides drift and blocks blue‑green deploys. SQLx migration files give versioned, repeatable schema ([app.studyraid.com](https://app.studyraid.com/en/read/14938/515210/versioning-your-database-schema?utm_source=chatgpt.com)).
2. **Add proper constraints & indexes** (e.g., `UNIQUE(entity_id)`, index `operations.clock`) to accelerate incremental sync queries.
3. **Wrap sync writes in a single transaction** instead of per‑row inserts.

## 3 CRDT & clock management

1. **Persist `node_id`**; hashing the bind address fileciteturn2file2L34-L40 causes identity shifts after redeploys, breaking Lamport ordering.
2. **Hard‑limit operations per request** (tests expect 1000) and return `413 Payload Too Large`; production code never checks length before iterating fileciteturn1file3L12-L18.
3. **Validate `since_clock < clock`** early to fail fast.

## 4 Performance

1. **Batch DB inserts** instead of looping fileciteturn2file13L51-L56; reduces round‑trips.
2. **Tune pool & add metrics** (SQLx `PoolOptions::connect_timeout`, `metric‑exporter‑prometheus`).
3. **Introduce read‑through cache (DashMap/LRU)** for hot CRDT state.

## 5 Maintainability

1. **Modularise services**: split `auth`, `sync`, `repository` into separate crates; expose interfaces via `pub trait`.
2. **Generate OpenAPI spec** using `utoipa` for typed client generation.
3. **Use structured `tracing` spans** and `tower-http` `TraceLayer` with JSON encoder.
4. **Integrate `cargo deny`, `cargo auditable`** in CI for dependency health.
5. **Replace placeholder JSON parsing** in window repository fileciteturn2file5L24-L31 with typed deserialisation.

## 6 Testing & QA

1. Add property‑based tests (`proptest`) for CRDT convergence.
2. Add CORS pre‑flight tests and CSRF negative cases.
3. Load‑test `/sync` with `k6` at 200 req/s; set SLO ≤ 50 ms P99.
4. Add fuzzing (`cargo fuzz`) targets for sync handler and CRDT deserialisation.

---

Addressing these items will harden security, improve scalability, and make the codebase easier to evolve.
