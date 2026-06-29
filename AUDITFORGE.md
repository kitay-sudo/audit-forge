# AuditForge — Universal AI-Agent Security Audit Playbook

> **What this file is.** A single, self-contained operating manual you can hand to *any* coding agent
> (Claude Code, Cursor, Codex, Aider, a custom LLM harness, etc.). When an agent reads this file it must
> understand: *what the project is*, *what stack it uses*, *how to audit it correctly*, *in what order*,
> *what to look for*, and *how to deliver fixes as diffs*. The end goal: after one full pass the project can
> run in production without fear of being breached, leaking data, or falling over under load.
>
> **Version:** 1.0 · **Target year of best practices:** 2026 · **License:** MIT
>
> ---
>
> ## ⚠️ AUTHORIZATION & SCOPE — READ FIRST (non-negotiable)
>
> This playbook is for **defensive security review of code you are authorized to audit**: your own project,
> an employer's repo, a client engagement with written scope, a CTF, or security research with permission.
>
> - **Do NOT** attack live third-party systems, run exploits against production you don't own, perform DoS,
>   mass-scan external hosts, or exfiltrate real data.
> - **Static / local first.** Default to reading code and config. Any *dynamic* test (sending requests,
>   fuzzing, load testing) runs **only** against a local dev instance or an environment the owner explicitly
>   approved.
> - **Never print real secrets.** If you find a credential, report its *location and type*, redact the value
>   (`AKIA****…****`), and recommend rotation. Do not exfiltrate it anywhere.
> - If scope is unclear, **stop and ask the human** before doing anything that leaves the repo.

---

## 0. How the agent must operate (operating contract)

You are acting as a **senior application-security engineer**. Follow these rules for the whole audit:

1. **Be evidence-based, not vibe-based.** Every finding must point to a concrete file and line range
   (`path/to/file.ext:120-138`) and explain the exploit *path*, not just "this looks unsafe."
2. **Minimize false positives.** Before reporting, ask: *Is there a real, reachable code path an attacker can
   trigger? What is the trust boundary it crosses?* If you cannot articulate the path, mark it
   `Needs-verification`, don't inflate it to High.
3. **Read-only until you understand.** Do not edit code during Phases 0–2. Build a mental model first.
4. **Prefer the project's own tooling.** Use the linters, type checkers, SCA tools, and test runners that
   already exist before introducing new ones.
5. **Every fix is a diff.** Findings that you can fix must come with a unified `diff` (or per-file
   before/after) that is minimal, idiomatic to the surrounding code, and does not break behavior. Never
   "fix" by deleting features.
6. **Severity is mandatory.** Rate each finding with the rubric in §20 and order the report by severity.
7. **Don't trust comments or docs over code.** If a README claims "all inputs are validated," verify in code.
8. **No silent scope cuts.** If you skip an area (e.g., couldn't run the DB locally), say so explicitly in
   the report's *Coverage* section. Silence reads as "checked and clean" — that is dangerous.
9. **Track everything.** Maintain a running findings list (use a todo/scratchpad). Don't lose findings
   between phases.
10. **One conclusion, not a file dump.** When you finish, deliver the report in §21 format, not raw logs.

---

## 1. The audit pipeline at a glance

Run these phases **in order**. Each phase has an entry goal, concrete actions, and an exit gate.
Do not jump to writing fixes before recon is complete — many "bugs" disappear once you understand the
framework's built-in protections.

```
Phase 0  Recon & threat model      → Know the project, stack, entry points, trust boundaries
Phase 1  Dependency / supply chain → Find vulnerable & malicious packages
Phase 2  Secrets & configuration   → Find leaked secrets and unsafe config/defaults
Phase 3  Routes & attack surface   → Map every entry point (HTTP, jobs, CLI, events)
Phase 4  AuthN & AuthZ             → Identity, sessions, access control, IDOR/BOLA
Phase 5  Input validation & inj.   → SQLi, XSS, SSRF, RCE, path traversal, deserial., SSTI
Phase 6  Business / logic flaws    → Race conditions, workflow abuse, money/quantity logic
Phase 7  Database layer            → Queries, least privilege, PII, encryption, migrations
Phase 8  Data egress / outputs     → Email, webhooks, 3rd-party calls, logging, exfil paths
Phase 9  Rate limiting & DoS       → Abuse limits, resource exhaustion, resilience under load
Phase 10 Crypto & secrets mgmt     → Hashing, encryption, randomness, key handling
Phase 11 Files & storage           → Uploads, path handling, object storage, SSRF via files
Phase 12 Client / frontend         → XSS, CSP, CSRF, token storage, dependency drift
Phase 13 Infra / CI-CD / IaC       → Containers, pipelines, IaC, cloud perms, headers/TLS
Phase 14 Observability & IR        → Logging, monitoring, audit trail, secrets in logs
Phase 15 AI / LLM / agentic  (cond)→ Prompt injection, RAG, excessive agency, cost DoS (OWASP LLM)
Phase 16 Mobile app security (cond)→ MASVS: storage, network, platform, resilience, privacy
Phase 17 Privacy & compliance      → PII data flows, GDPR/PCI/HIPAA/SOC2 mapping, retention
Finalize Report & remediation      → Findings + diffs + prioritized plan + prod-readiness gate
```

> **Conditional phases.** Run Phase 15 only if the app uses an LLM/AI model or autonomous agents/tools; run
> Phase 16 only if there is a mobile client (iOS/Android/React Native/Flutter). Skip-with-note if not
> applicable.
>
> If time/budget is limited, the highest-ROI subset is: **Phase 0 → 1 → 2 → 4 → 5 → 9** (+ **15** if the app
> is AI-powered). State clearly in the report that the rest was descoped.

---

## 2. Phase 0 — Recon & threat model

**Goal:** In 15–30 minutes of reading you should be able to describe the app to a colleague: what it does,
who uses it, what data it holds, what would hurt most if breached.

### 2.1 Detect the stack (don't assume — confirm from files)

Look for these signal files and infer the stack:

| Signal file(s)                                   | Stack / ecosystem                          |
|--------------------------------------------------|--------------------------------------------|
| `package.json`, `pnpm-lock.yaml`, `yarn.lock`    | Node.js / JS / TS                          |
| `requirements.txt`, `pyproject.toml`, `poetry.lock`, `Pipfile` | Python                        |
| `go.mod`, `go.sum`                               | Go                                         |
| `pom.xml`, `build.gradle(.kts)`                  | Java / Kotlin (Maven/Gradle)               |
| `Gemfile`, `Gemfile.lock`                        | Ruby (often Rails)                         |
| `composer.json`, `composer.lock`                 | PHP (often Laravel/Symfony)                |
| `*.csproj`, `*.sln`, `packages.lock.json`        | .NET / C#                                  |
| `Cargo.toml`, `Cargo.lock`                       | Rust                                        |
| `Dockerfile`, `docker-compose.yml`, `*.tf`, `k8s/*.yaml` | Infra / deploy                     |
| `next.config.*`, `vite.config.*`, `angular.json`, `nuxt.config.*` | Frontend framework        |

Then identify the **web/app framework** (Express/Fastify/NestJS, Django/Flask/FastAPI, Rails, Spring,
Laravel, ASP.NET, Gin/Echo, etc.) — its built-in protections change what counts as a vulnerability.

### 2.2 Map the architecture

Answer and record:

- **Entry points:** HTTP routes/controllers, GraphQL resolvers, gRPC, WebSockets, message-queue consumers,
  cron/scheduled jobs, CLI commands, webhooks, serverless handlers.
- **Trust boundaries:** Where does untrusted input enter? (public internet, authenticated users, admin,
  internal services, third-party callbacks.) Draw the line between "outside" and "inside."
- **Data stores:** SQL/NoSQL DBs, caches (Redis), object storage (S3), search (Elastic), queues.
- **External egress:** outbound HTTP, email/SMS providers, payment processors, analytics, AI/LLM APIs.
- **Sensitive assets (the "crown jewels"):** PII, credentials, payment data, health data, secrets, internal
  tokens, anything regulated (GDPR/HIPAA/PCI).
- **AuthN/AuthZ model:** sessions vs JWT vs OAuth; roles/permissions; multi-tenancy (this is where IDOR
  lives).

### 2.3 Lightweight threat model (STRIDE-lite)

For the top 3–5 entry points, ask: who would attack this, what do they want, and which of
**S**poofing / **T**ampering / **R**epudiation / **I**nfo-disclosure / **D**oS / **E**levation applies.
This focuses the rest of the audit on what actually matters for *this* app.

**Exit gate:** You can write a 5-sentence description of the system + a list of entry points + a list of
crown-jewel assets. Write these into the report's *System Overview* section now.

---

## 3. Phase 1 — Dependency & supply-chain audit

**Why first among technical phases:** known-vulnerable and malicious dependencies are the cheapest, most
common real-world breach vector, and tooling makes them fast to find.

### 3.1 Run the ecosystem's SCA scanner

| Ecosystem | Command(s) |
|-----------|------------|
| Node      | `npm audit --omit=dev` / `npm audit`; `pnpm audit`; `yarn npm audit`; or `osv-scanner .` |
| Python    | `pip-audit` (preferred); `safety check`; or `osv-scanner .` |
| Go        | `govulncheck ./...` |
| Java      | `mvn org.owasp:dependency-check-maven:check` or Gradle equivalent; `osv-scanner` |
| Ruby      | `bundle audit check --update` |
| PHP       | `composer audit` |
| .NET      | `dotnet list package --vulnerable --include-transitive` |
| Rust      | `cargo audit` |
| Any       | [`osv-scanner`](https://google.github.io/osv-scanner/) works across lockfiles; `trivy fs .` for repo+deps |

> If a scanner isn't installed and you can't install it, **read the lockfile manually** for obviously old
> major versions of security-sensitive libs (auth, crypto, serialization, template engines, image/file
> parsers) and cross-check against public advisories. Note the gap in *Coverage*.

### 3.2 Look beyond CVEs

- **Lockfile integrity:** Is there a committed lockfile? Are integrity hashes present? Missing lockfile =
  non-reproducible builds + easy dependency confusion.
- **Typosquatting / dependency confusion:** Suspicious package names, internal package names resolvable from
  public registries, recently-added unknown deps.
- **Abandoned / unmaintained** security-critical packages (last release years ago, archived repo).
- **Over-broad version ranges** (`*`, `latest`, `>=`) on security-sensitive deps.
- **Postinstall / lifecycle scripts** in dependencies that run arbitrary code.
- **License/footprint bloat:** huge transitive trees increase attack surface.

### 3.3 Supply-chain integrity (2026 "governance era")

CVE scanning is table stakes. For anything heading to production also assess **build & artifact integrity** —
this is where modern attacks (npm/PyPI account takeovers, poisoned build steps) actually land:

- **SBOM:** Is a Software Bill of Materials generated per build (CycloneDX or SPDX) and stored/attached to the
  artifact? Recommend `syft`, `cdxgen`, or the native `npm sbom` / `trivy sbom`.
- **Provenance / SLSA:** Are build provenance attestations produced (who built it, from which commit, with
  which config)? Target **SLSA Build Level 2–3**. For GitHub, recommend artifact attestations + a hardened,
  reproducible build.
- **Artifact signing:** Are releases/images signed and verified (Sigstore `cosign`, npm provenance, signed
  git tags)? Unsigned artifacts can be swapped.
- **Pinned dependencies & actions:** Third-party CI actions pinned by **commit SHA**, not floating tags;
  base images pinned by digest.
- **Registry hygiene:** Scoped/namespaced internal packages; private registry configured to prevent
  dependency-confusion fallthrough to public registries.

> Driven by U.S. EO 14028 and the EU Cyber Resilience Act, SBOM + provenance are moving from "nice to have"
> to compliance requirements. Flag their absence as at least **Low/Medium** for production systems.

**Output:** table of `package@version → advisory ID → severity → fixed-in version → upgrade risk`, plus a
short supply-chain-integrity note (SBOM? signed? pinned? SLSA level?). For clear, low-risk upgrades, propose
the version bump as a diff to the manifest + lockfile.

---

## 4. Phase 2 — Secrets & configuration

### 4.1 Hunt for secrets in the repo and history

- Grep the working tree for high-signal patterns: `API_KEY`, `SECRET`, `PASSWORD`, `TOKEN`, `PRIVATE KEY`,
  `BEGIN RSA`, `aws_access_key_id`, `Bearer `, connection strings (`postgres://user:pass@`), `.pem`, `.p12`.
- Check **committed `.env`**, config files, fixtures, test files, notebooks, and CI configs.
- Scan git history if available — secrets are often deleted from HEAD but live in history
  (`gitleaks detect`, `trufflehog`).
- Verify `.gitignore` actually excludes `.env`, key files, local config.

> **Redact.** Report *type + location*, never the live value. Recommend rotation for anything real.

### 4.2 Configuration & secure defaults

- **Debug/verbose off in prod:** `DEBUG=False` (Django), no stack traces to users, no source maps leaking
  server paths, framework debug toolbars disabled.
- **Secret management:** secrets from env/secret-manager, not hardcoded; different secrets per environment;
  signing keys not shared across services.
- **CORS:** not `Access-Control-Allow-Origin: *` combined with credentials; allowlist of origins.
- **Security headers:** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options:
  nosniff`, `X-Frame-Options`/frame-ancestors, `Referrer-Policy`, `Permissions-Policy`.
- **TLS:** HTTPS enforced/redirected, secure cipher config, HSTS, cookies `Secure`.
- **Cookies:** `HttpOnly`, `Secure`, `SameSite=Lax/Strict`, sensible expiry, scoped path/domain.
- **Error handling:** generic error messages to clients; detailed errors only to logs.
- **Default credentials / open admin panels / exposed actuator/metrics/health endpoints** with sensitive
  data.

---

## 5. Phase 3 — Routes & attack-surface mapping

**Goal:** an exhaustive inventory of every way input enters the system. You cannot secure what you haven't
enumerated. This is also where **logical route errors** live.

### 5.1 Enumerate every entry point

Build a route table. For each route/handler record:

| Method+Path / Handler | Auth required? | Roles allowed | Input sources | Touches (DB/FS/net/$) | Notes |
|-----------------------|----------------|---------------|---------------|-----------------------|-------|

Cover: REST/HTTP routes, GraphQL queries+mutations, WebSocket message types, queue/event consumers, cron
jobs, CLI subcommands, webhook receivers, serverless/edge functions, admin routes, file-download/upload
endpoints.

### 5.2 Per-route logic & access-control review

For each route look for:

- **Missing auth** on routes that mutate or read sensitive data ("forgot to add the middleware").
- **Broken object-level authorization (IDOR/BOLA):** does the handler check that the *current user* owns the
  `id` it's operating on, or does it trust the ID from the request? This is the #1 API vuln.
- **Broken function-level authorization:** can a normal user hit admin-only actions by guessing the path?
- **Inconsistent auth:** route A is protected, sibling route B (same data, different verb) is not.
- **Mass assignment / over-posting:** request body fields bind directly to model fields (e.g., `is_admin`,
  `role`, `balance`).
- **Verb tampering / method confusion:** `GET` performing state changes; `HEAD`/`OPTIONS` bypassing filters.
- **Unvalidated redirects/forwards:** `?next=`/`?redirect=` to attacker URLs.
- **Path/route ordering bugs:** a catch-all or wildcard route shadowing an auth check; middleware applied in
  wrong order.
- **Rate-limit / abuse exposure** of expensive or auth-sensitive routes (login, password reset, search,
  export) — flag for Phase 9.

---

## 6. Phase 4 — Authentication & authorization

### 6.1 Authentication

- **Password storage:** strong adaptive hash (argon2id / bcrypt / scrypt / PBKDF2 with sane cost). Never
  MD5/SHA1/plain/SHA256-unsalted.
- **Login flow:** lockout/backoff on brute force, generic "invalid credentials" (no user enumeration),
  timing-safe comparison.
- **Session management:** session ID regeneration on login (fixation), server-side invalidation on logout,
  idle + absolute timeouts.
- **JWT pitfalls:** algorithm confusion (`alg: none`, HS/RS confusion), missing signature verification,
  no expiry, secrets weak/shared, sensitive data in payload, no revocation strategy.
- **MFA / password reset:** reset tokens single-use, expiring, unguessable; no account takeover via reset;
  no token leakage via referer.
- **OAuth/OIDC:** state parameter (CSRF), PKCE for public clients, redirect-URI allowlist, token validation.

### 6.2 Authorization

- **Centralized vs scattered checks:** authz enforced consistently (ideally one layer), not copy-pasted and
  occasionally forgotten.
- **Multi-tenancy isolation:** every query scoped to tenant/org/user; no cross-tenant leakage.
- **Privilege escalation paths:** horizontal (other users' data) and vertical (gain admin).
- **Default-deny:** unknown roles/states denied, not allowed.
- **Server-side enforcement:** never trust client-sent role/permission/price/quantity.

---

## 7. Phase 5 — Input validation & injection

**Core principle:** treat all input from outside a trust boundary as hostile until validated. Check every
sink where input meets an interpreter (SQL, shell, HTML, template, file path, deserializer, LDAP, XML).

Walk each vulnerability class; for each, find the *source → sink* path:

- **SQL / NoSQL injection:** raw/concatenated queries, string-formatted queries, `$where`/operator injection
  in Mongo. → Fix with parameterized queries / ORM bindings / allowlisted column names.
- **Command injection:** `exec`, `system`, `child_process`, `os.system`, `subprocess(shell=True)`,
  backticks with user input. → Use arg arrays, no shell, validated allowlists.
- **Cross-site scripting (XSS):** unescaped output in HTML, `dangerouslySetInnerHTML`, `v-html`,
  `innerHTML`, template `| safe`/`{{{ }}}`, reflected/stored/DOM. → Context-aware escaping, sanitize HTML,
  strict CSP as defense-in-depth.
- **SSRF:** server fetches a user-supplied URL (webhooks, image fetch, PDF render, link preview, "import
  from URL"). → Allowlist hosts, block private/link-local/metadata ranges (`169.254.169.254`), resolve+pin
  DNS, no redirects to internal.
- **Path traversal / LFI:** user input in file paths (`../`), zip-slip on extraction, download endpoints. →
  Canonicalize + confine to base dir; never join user input into paths unvalidated.
- **Insecure deserialization:** `pickle`, `yaml.load` (unsafe), Java/PHP native deserialization, `eval`. →
  Safe loaders, no native deserialization of untrusted data.
- **Server-side template injection (SSTI):** user input rendered as a template (Jinja, Twig, Freemarker,
  Velocity, Handlebars). → Never feed user input to a template engine as the template.
- **XXE:** XML parsers with external entities enabled. → Disable DTD/external entities.
- **Open redirect, header/CRLF injection, host-header injection, mass-assignment** (cross-ref Phase 3).
- **GraphQL-specific:** introspection in prod, query depth/complexity limits, batching abuse, field-level
  authz.
- **Regex DoS (ReDoS):** catastrophic backtracking on user-controlled input.

For each finding, document: the **entry point**, the **tainted variable**, the **dangerous sink**, a
**proof-of-concept input** (conceptual, not an attack on live systems), and the **fix as a diff**.

---

## 8. Phase 6 — Business & logic flaws

These don't show up in scanners — they require understanding the domain. Look for:

- **Race conditions / TOCTOU:** double-spend, coupon reuse, inventory oversell, concurrent withdrawals,
  parallel requests bypassing a one-time check. → Atomic operations, DB locks, idempotency keys.
- **Money & quantity logic:** negative amounts, integer overflow, rounding/float errors on currency, price
  set client-side, discount stacking, refund > charge.
- **Workflow / state-machine abuse:** skipping steps (pay → ship without pay), replaying steps, out-of-order
  transitions, abusing "pending" states.
- **Idempotency & replay:** webhooks/payments processed twice; missing idempotency keys.
- **Quota/limit bypass:** free-tier limits enforced only in UI; resource creation without server limits.
- **Insecure direct workflow references:** acting on another user's order/invoice/ticket by ID.
- **Time-based logic:** trials, token expiry, scheduling using client clock or manipulable timestamps.

---

## 9. Phase 7 — Database layer

- **Query safety:** parameterized everywhere (cross-ref Phase 5); dynamic table/column names allowlisted;
  ORM not bypassed with raw strings carrying user input.
- **Least privilege:** the app's DB user has only needed grants (no `SUPERUSER`/`DROP` in prod); separate
  read/write users where sensible; no shared admin account.
- **Connection security:** TLS to DB; credentials from secret manager; connection pool limits set
  (cross-ref DoS).
- **PII & sensitive data:** identify columns holding PII/secrets; are they encrypted at rest where required;
  is access logged; is data minimized and retention bounded (GDPR)?
- **Encryption:** field-level encryption for the most sensitive data; passwords hashed (not encrypted);
  tokens hashed at rest.
- **Migrations:** reviewed for destructive ops, for adding data without backfill safety, for leaking data
  into logs; no secrets in migration files; reversible where possible.
- **Backups:** existence, encryption, and access controls (note if unknowable from repo).
- **Mass data exposure:** endpoints returning whole tables, missing pagination caps, `SELECT *` shipping
  sensitive columns to clients, verbose serializers leaking internal fields.
- **NoSQL specifics:** query-operator injection, missing schema validation, public-by-default buckets.

---

## 10. Phase 8 — Data egress & external outputs ("suspicious outbound moments")

Trace where data *leaves* the system — this is where silent leaks and exfil paths live.

- **Email/SMS:** template injection, recipient controlled by attacker (spam relay), sensitive data emailed
  in cleartext, reset links to wrong address, missing rate limits (cross-ref Phase 9), open mail relay,
  header injection in `To`/`Subject`.
- **Webhooks / outbound HTTP:** SSRF (cross-ref Phase 5), secrets in URLs, no signature on outgoing
  webhooks, sending more data than the receiver needs, retries causing duplicate side effects.
- **Third-party APIs (payments, analytics, AI/LLM):** PII shipped to analytics/LLM providers without
  consent; API keys with overly broad scope; prompt-injection / data leakage if user input is sent to an
  LLM; trusting third-party responses without validation.
- **Logging as egress:** secrets, tokens, full request bodies, PII, card numbers written to logs or error
  trackers (Sentry) → these logs are an exfil target. Scrub before logging.
- **Data exports / reports:** CSV injection (formula injection), over-broad exports, missing authz on export
  endpoints.
- **File downloads / signed URLs:** overly long expiry, predictable URLs, missing authz, content-type
  sniffing.

---

## 11. Phase 9 — Rate limiting, abuse & resilience under load

**Goal:** the app stays up and doesn't get abused under hostile load. The user explicitly wants this:
*"so it doesn't fall over under load and doesn't leak."*

### 11.1 Where rate limiting is mandatory

Flag any of these **without** a limit:

- Authentication: login, signup, password reset, OTP/MFA, token refresh (brute-force + cost).
- Anything sending email/SMS/push (cost + spam relay).
- Search, filtering, report generation, exports, anything that fans out into expensive DB queries.
- File uploads / image processing / PDF generation (CPU/memory).
- Public/unauthenticated endpoints generally.
- Per-tenant/per-user quotas for paid resources.
- AI/LLM-backed endpoints (token cost).

Recommend layered limits: **global, per-IP, per-user, per-endpoint**, plus a sane default. Suggest a concrete
mechanism appropriate to the stack (e.g., `express-rate-limit`+Redis store, `slowapi`/`django-ratelimit`,
`rack-attack`, Bucket4j, API-gateway/WAF limits) and recommend it run on a **shared store** (Redis), not
per-instance memory, so it works behind multiple replicas.

### 11.2 Resource-exhaustion & DoS hardening

- **Body/payload size limits** (JSON, file upload, multipart) — reject oversized early.
- **Pagination caps** — no unbounded `limit`; default + max page size.
- **Timeouts** — on outbound HTTP, DB queries, and the server itself; no unbounded waits.
- **Connection/pool limits** — DB pool, HTTP keep-alive, worker counts sized; backpressure.
- **Unbounded loops/recursion/memory** driven by input (e.g., decompression bombs, deeply nested
  JSON/XML/GraphQL, ReDoS).
- **Caching** of hot, expensive, cacheable responses; avoid cache poisoning.
- **Graceful degradation:** circuit breakers / retries-with-backoff for flaky dependencies; the app should
  shed load, not crash.
- **Idempotency + queueing** for spiky write workloads.

---

## 12. Phase 10 — Cryptography & secrets management

- **Hashing:** passwords → argon2id/bcrypt/scrypt; data integrity → SHA-256+; never MD5/SHA1 for security.
- **Encryption:** authenticated encryption (AES-GCM, ChaCha20-Poly1305); no ECB; unique nonces/IVs; no
  homegrown crypto.
- **Randomness:** cryptographically secure RNG for tokens/IDs/salts (`secrets`, `crypto.randomBytes`,
  `SecureRandom`) — never `Math.random()`/`rand()` for security.
- **Key management:** keys from a KMS/secret manager, rotated, scoped, not in code/repo; separate keys per
  purpose and environment.
- **TLS config:** modern protocols only (TLS 1.2+), strong ciphers, valid certs, cert pinning where it
  matters.
- **Token design:** opaque, high-entropy, hashed at rest, expiring, revocable.

---

## 13. Phase 11 — File uploads & storage

- **Type/content validation:** validate by content (magic bytes), not just extension or `Content-Type`;
  allowlist extensions.
- **Size limits & rate limits** (cross-ref Phase 9).
- **Storage location:** outside web root; randomized non-guessable names; never execute uploaded files;
  correct `Content-Disposition` and `Content-Type` on serve.
- **Path safety:** no user input in storage paths (path traversal/zip-slip).
- **Image/document processing:** known-CVE-laden libs (ImageMagick, ffmpeg, PDF, XML) sandboxed/updated;
  decompression-bomb limits.
- **Object storage (S3/GCS):** buckets not public; least-privilege IAM; signed URLs short-lived; no
  directory listing.
- **Malware:** consider AV scanning for user-shared files.

---

## 14. Phase 12 — Client / frontend (if applicable)

- **XSS sinks** (cross-ref Phase 5): framework escaping intact; `dangerouslySetInnerHTML`/`v-html` sanitized.
- **CSP** present and meaningful (not just `unsafe-inline` everywhere).
- **CSRF:** state-changing requests protected (tokens or SameSite cookies + checks) for cookie-auth apps.
- **Token storage:** access tokens not in `localStorage` if XSS-exposed; prefer HttpOnly cookies; refresh
  token handling.
- **Secrets in the bundle:** no API secrets/keys shipped to the client; only public keys.
- **Sensitive data in the DOM/localStorage/sessionStorage**; PII cached on device.
- **Dependency drift / known-vuln frontend libs** (cross-ref Phase 1); subresource integrity for CDN scripts.
- **Clickjacking** protection (frame-ancestors); **postMessage** origin checks; **open redirects** in SPA
  routing.

---

## 15. Phase 13 — Infra, CI/CD & IaC

- **Containers:** non-root user, minimal base image, no secrets in layers/`ENV`, pinned base tags, `.dockerignore`,
  scan image (`trivy image`), drop capabilities, read-only FS where possible.
- **Kubernetes:** no privileged pods, resource limits set, network policies, secrets as secrets (not env in
  manifests), RBAC least-privilege.
- **CI/CD:** secrets via the platform's secret store; no `pull_request_target` running untrusted code; pinned
  action versions (by SHA); least-privilege tokens; protected branches; no plaintext secrets in logs;
  artifact/provenance signing where relevant.
- **IaC (Terraform/CloudFormation):** open security groups (`0.0.0.0/0` on SSH/DB), public buckets,
  unencrypted volumes, over-broad IAM (`*:*`), missing logging — scan with `tfsec`/`checkov`/`trivy config`.
- **Network exposure:** databases/caches/admin panels not exposed to the internet; bastion/VPC boundaries.
- **Secrets at rest in infra:** state files (`terraform.tfstate`) may contain secrets — check storage.

---

## 16. Phase 14 — Observability, audit trail & incident readiness

- **Security logging:** authn events, authz failures, admin actions, and sensitive operations are logged
  with enough context to investigate (who/what/when) — **without** logging secrets/PII (cross-ref Phase 8).
- **Tamper-resistance:** logs append-only / shipped off-box; an attacker shouldn't be able to erase their
  tracks.
- **Monitoring & alerting:** anomalies (spike in 401/403, error rates, egress) trigger alerts.
- **Audit trail** for compliance-relevant actions.
- **Incident basics:** is there a way to revoke tokens, rotate secrets, and disable a compromised account
  quickly?

---

## 17. Phase 15 — AI / LLM / agentic application security  *(conditional)*

**Run this phase if** the project calls an LLM/AI model, ships a chatbot/assistant, does RAG over a vector
store, exposes "agents" that can use tools/take actions, or processes untrusted text/files with a model.
Maps to **OWASP Top 10 for LLM Applications (2025)**. This is the highest-value 2026 addition — most modern
apps now embed AI, and these flaws bypass classic controls.

### 17.1 Prompt injection & untrusted content (LLM01)
- **Direct injection:** user input overrides system instructions ("ignore previous instructions…").
- **Indirect injection:** the model ingests attacker-controlled content (a web page, email, PDF, RAG
  document, tool output) carrying hidden instructions. *This is the dominant real-world AI attack.*
- **Mitigations to verify:** strong instruction/data separation, input/output guardrails, treating model
  output as untrusted, least-privilege tools, human-in-the-loop for high-impact actions.

### 17.2 Sensitive information & system-prompt leakage (LLM02, LLM07)
- Model echoes PII, secrets, other users' data, or internal context in responses.
- **System-prompt leakage:** the hidden prompt (and any secrets/keys/business rules in it) can be extracted —
  never put secrets or authz logic in the prompt; enforce authz in code, not in instructions.
- PII/secret scrubbing on both inputs sent to third-party model providers and outputs returned to users.

### 17.3 Improper output handling (LLM05)
- Model output flows into a dangerous sink **without** treatment: rendered as HTML (→ XSS), run as SQL/shell
  (→ injection/RCE), used as a file path, or executed as code. Treat LLM output exactly like user input
  (cross-ref Phase 5).

### 17.4 Excessive agency (LLM06)
- Agents/tools with more permission than the task needs (delete, pay, email, write files, call internal APIs).
- **Verify:** minimal tool scope, allow-listed actions, per-action authorization, spending/quantity caps,
  confirmation gates for irreversible/high-value actions, sandboxing of code-execution tools.
- **MCP / tool servers & plugins:** untrusted tool definitions, over-broad scopes, tool-name shadowing,
  unauthenticated tool endpoints.

### 17.5 RAG, vector & embedding weaknesses (LLM08) and poisoning (LLM04)
- **Knowledge-base poisoning:** can an attacker insert documents into the corpus that later steer answers or
  carry indirect injections? Validate ingestion sources.
- **Multi-tenant vector isolation:** embeddings/namespaces scoped per tenant/user (a vector-store IDOR).
- **Embedding inversion / data leakage** from the vector DB; access controls on the vector store.
- **Model/data supply chain (LLM03):** provenance of models, datasets, and fine-tunes; pulling weights from
  untrusted sources; cross-ref Phase 1.

### 17.6 Unbounded consumption — cost & DoS (LLM10)
- Token/cost limits per user/session/key; max input length and output tokens; rate limits on AI endpoints
  (cross-ref Phase 9). Without these, a single abuser can run up an unbounded bill ("denial of wallet").
- Loop/recursion guards on agent steps; timeouts; circuit breakers on the model provider.

### 17.7 Misinformation & overreliance (LLM09)
- High-stakes decisions (medical, legal, financial, code execution) made on unverified model output without
  human review or grounding. Recommend grounding, citations, and confidence/guardrail checks.

> **Tooling:** `garak` (LLM vuln scanner), `promptfoo`/`deepteam` (red-teaming), provider-side guardrails.

---

## 18. Phase 16 — Mobile application security  *(conditional · OWASP MASVS)*

**Run this phase if** there is an iOS/Android/React Native/Flutter client. Maps to **OWASP MASVS** categories:

- **MASVS-STORAGE:** no sensitive data in plaintext on device (logs, `SharedPreferences`/`UserDefaults`,
  SQLite, cache, screenshots); use Keychain/Keystore.
- **MASVS-CRYPTO:** platform crypto APIs, no hardcoded keys, secure random.
- **MASVS-AUTH:** secure auth/session handling; biometric binding done right; tokens stored securely.
- **MASVS-NETWORK:** TLS enforced, certificate pinning where warranted, no cleartext traffic.
- **MASVS-PLATFORM:** safe IPC/deep-links/WebView config (no `javascript:`/file access abuse), exported
  components locked down, no injection via intents/URL schemes.
- **MASVS-CODE:** input validation, up-to-date dependencies, no debug code in release, no secrets in the
  bundle (decompile-check).
- **MASVS-RESILIENCE:** anti-tampering/root-jailbreak awareness for high-risk apps (defense-in-depth, not a
  substitute for server-side checks).
- **MASVS-PRIVACY:** minimal permissions, transparent data collection, no excessive tracking SDKs.

> **Tooling:** `MobSF` (static+dynamic), `apkleaks`, platform linters. Remember: the device is hostile — all
> security-critical checks must also exist server-side.

---

## 19. Phase 17 — Privacy & regulatory compliance

Security and privacy overlap but are not the same. For any app holding personal/regulated data, assess:

- **PII inventory & data-flow map:** what personal data is collected, where it is stored, who it is shared
  with, and where it leaves the system (cross-ref Phase 8). You cannot protect data you haven't mapped.
- **Data minimization & retention:** only necessary data collected; retention limits + deletion jobs exist;
  no indefinite log retention of PII.
- **Consent & purpose:** lawful basis/consent for collection and for sending data to third parties
  (analytics, LLM providers, ad SDKs).
- **Subject rights:** mechanisms for access, export, and **deletion** ("right to be forgotten").
- **Encryption & access control** for regulated data (cross-ref Phases 7, 10).
- **Framework mapping (note which apply):**
  - **GDPR / CCPA** — personal data of EU/CA residents.
  - **PCI DSS v4.0** — if card data is stored/processed/transmitted (ideally: don't — tokenize via a PSP).
  - **HIPAA** — protected health information.
  - **SOC 2 / ISO 27001** — organizational controls (often customer-required).
- **Cross-border transfer** and data-residency constraints, if relevant.

> Map relevant findings to the framework they implicate so the report doubles as a compliance gap list.

---

## 20. Severity rubric (use for every finding)

Rate **Impact × Likelihood**, then assign a level. When in doubt, justify in one line.

| Severity   | Meaning (rule of thumb) |
|------------|-------------------------|
| **Critical** | Remote, unauthenticated, leads to full compromise / mass data theft / RCE / auth bypass. Fix now, possibly before deploy. |
| **High**     | Real exploit path with meaningful impact (authz bypass, SQLi behind auth, stored XSS, secret leak). Fix this cycle. |
| **Medium**   | Exploitable with preconditions or limited impact (CSRF on minor action, missing rate limit on costly route, weak config). |
| **Low**      | Hardening / defense-in-depth / info leak with low impact (missing header, verbose error). |
| **Info**     | Best-practice note, no direct exploit. |

Optionally include a **CVSS 3.1/4.0 vector** for High/Critical. Map each finding to **OWASP Top 10 (2021)**
and, for APIs, **OWASP API Security Top 10 (2023)** (see §22).

---

## 21. Reporting & remediation — the deliverable

Produce a single Markdown report (use `REPORT_TEMPLATE.md` in this repo). It must contain:

1. **Executive summary** — risk posture in 5 sentences + counts by severity + the top 3 things to fix first.
2. **System overview & coverage** — stack, entry points, crown jewels, and *what was and wasn't audited*.
3. **Findings**, ordered by severity. Each finding uses this shape:

```markdown
### [SEVERITY] Short title  (Phase N · OWASP A0X · CWE-XXX)

**Location:** `path/to/file.ext:120-138`
**Category:** e.g., Broken Object-Level Authorization
**Status:** Confirmed | Needs-verification

**Description.** What the flaw is and why it's exploitable here.

**Exploit path.** Source → sink, the trust boundary crossed, and a conceptual PoC input.

**Impact.** What an attacker gains.

**Recommendation.** The fix in prose.

**Fix (diff).**
\`\`\`diff
--- a/path/to/file.ext
+++ b/path/to/file.ext
@@
- vulnerable line
+ fixed line
\`\`\`

**Verification.** How to confirm the fix (test to add, command to run).
```

4. **Quick-wins vs. larger remediations** — a prioritized table (effort × impact).
5. **Production-readiness gate** (see §23).
6. **Appendix** — tool outputs (SCA results, etc.), and the route inventory table.

### Rules for writing fixes
- **Minimal & idiomatic.** Match the surrounding code's style; change as little as possible.
- **Don't break behavior.** Preserve the feature; close the hole. If a fix needs a tradeoff, say so.
- **Prefer framework-native fixes** (the ORM's binding, the framework's CSRF token, the validation library
  already in use) over bespoke code.
- **Add a test** for each High/Critical fix where feasible (regression guard).
- **Group dependency bumps** sensibly; call out breaking-change risk.
- **Never fix by disabling security** (e.g., turning off CSRF to "make it work").

---

## 22. Reference checklists (map findings to these)

**OWASP Top 10 (2021):**
A01 Broken Access Control · A02 Cryptographic Failures · A03 Injection · A04 Insecure Design ·
A05 Security Misconfiguration · A06 Vulnerable & Outdated Components · A07 Identification & Authentication
Failures · A08 Software & Data Integrity Failures · A09 Security Logging & Monitoring Failures ·
A10 Server-Side Request Forgery (SSRF).

**OWASP API Security Top 10 (2023):**
API1 Broken Object-Level Authorization · API2 Broken Authentication · API3 Broken Object-Property-Level
Authorization · API4 Unrestricted Resource Consumption · API5 Broken Function-Level Authorization ·
API6 Unrestricted Access to Sensitive Business Flows · API7 SSRF · API8 Security Misconfiguration ·
API9 Improper Inventory Management · API10 Unsafe Consumption of APIs.

**OWASP Top 10 for LLM Applications (2025)** — *use for AI-powered apps (Phase 15):*
LLM01 Prompt Injection · LLM02 Sensitive Information Disclosure · LLM03 Supply Chain · LLM04 Data & Model
Poisoning · LLM05 Improper Output Handling · LLM06 Excessive Agency · LLM07 System Prompt Leakage ·
LLM08 Vector & Embedding Weaknesses · LLM09 Misinformation · LLM10 Unbounded Consumption.

**OWASP MASVS** (mobile, Phase 16): STORAGE · CRYPTO · AUTH · NETWORK · PLATFORM · CODE · RESILIENCE · PRIVACY.

**Also useful:** OWASP ASVS 5.0 (verification depth — released 2025), OWASP Web Security Testing Guide (WSTG,
test procedures), OWASP Proactive Controls & Cheat Sheet Series, CIS Benchmarks (infra), CWE Top 25,
NIST SSDF, SLSA (supply-chain levels), MITRE ATT&CK (adversary techniques).

---

## 23. Production-readiness gate (final go / no-go)

Before declaring the project "safe to ship," confirm every line. Mark each ✅ / ⚠️ / ❌ in the report.

- [ ] No Critical or High findings remain open (or each has an accepted, documented risk + owner).
- [ ] No secrets in code or git history; all secrets in a secret manager; rotation possible.
- [ ] All dependencies free of known-exploitable CVEs (or pinned with documented mitigation).
- [ ] Supply-chain integrity: lockfile committed, deps/actions pinned, SBOM generated, artifacts signed.
- [ ] AuthN strong (adaptive hashing, session/JWT done right); AuthZ enforced server-side on every route.
- [ ] No IDOR/BOLA: every object access is ownership-checked.
- [ ] All untrusted input validated; no injection sinks reachable (SQL/CMD/XSS/SSRF/path/deserialization).
- [ ] Rate limiting on auth, email/SMS, expensive, and public endpoints (shared store, multi-replica safe).
- [ ] Payload size limits, pagination caps, query/HTTP timeouts, connection-pool limits set.
- [ ] Security headers + HTTPS/HSTS + secure cookies in place.
- [ ] Errors don't leak stack traces/internal info; debug off in prod.
- [ ] Sensitive data encrypted at rest where required; PII minimized; logs scrubbed of secrets/PII.
- [ ] DB user least-privilege; backups exist and are protected.
- [ ] Security logging + monitoring + alerting for auth failures and anomalies.
- [ ] Infra hardened: no public DB/admin, least-privilege IAM, containers non-root, CI secrets safe.
- [ ] **(AI apps)** Prompt-injection guardrails; LLM output treated as untrusted; tools least-privilege;
      token/cost limits; no secrets/authz in the system prompt.
- [ ] **(If PII/regulated)** Data-flow mapped; retention + deletion in place; consent & framework
      (GDPR/PCI/HIPAA) obligations met.
- [ ] Tests cover the security fixes (regression guards) and CI runs SCA on every build.

**If all green:** the project can go to production with a documented residual-risk note. **If not:** list the
blocking items at the top of the report and do not give a clean bill of health.

---

## 24. Quick-start prompt (paste this to the agent along with the file)

> *"You are a senior application-security engineer. Read `AUDITFORGE.md` in this repository and follow it
> end-to-end. Start with Phase 0 (recon & threat model) and proceed in order. Stay read-only until you
> understand the system. Run the conditional phases (15 AI/LLM, 16 Mobile) only if they apply, and say so.
> Produce findings using `REPORT_TEMPLATE.md`, ordered by severity, each with a concrete location, exploit
> path, and a minimal fix as a unified diff. Do not run any dynamic tests against systems I don't own; ask me
> before doing anything that leaves the repo. End with the production-readiness gate (§23). Be thorough but
> minimize false positives — every finding must have a real, reachable exploit path."*

---

## 25. Recommended open-source tooling matrix

Use the project's existing tools first; otherwise this free stack covers every layer. Static/local-safe by
default — only run dynamic tools (ZAP/Nuclei) against environments you own.

| Layer | Tools | Notes |
|-------|-------|-------|
| **SCA / deps** | `osv-scanner`, `trivy fs`, `grype`, ecosystem-native (`npm/pip/cargo audit`, `govulncheck`) | Known-CVE detection across lockfiles |
| **SBOM** | `syft`, `cdxgen`, `trivy sbom` | CycloneDX/SPDX generation |
| **SAST** | `semgrep` (fast, CI-friendly), `CodeQL` (deep, nightly), Bandit/gosec/etc. | Source-code flaw detection |
| **Secrets** | `gitleaks` + `trufflehog` (run both), platform push-protection | Working tree **and** git history |
| **IaC / config** | `checkov`, `tfsec`, `trivy config`, `hadolint` (Dockerfile) | Terraform/K8s/CloudFormation/Docker |
| **Containers** | `trivy image`, `grype` | Image CVEs + misconfig |
| **DAST** *(owned env only)* | OWASP `ZAP`, `nuclei` | Runtime / template-based scanning |
| **LLM / AI** | `garak`, `promptfoo`, `deepteam` | Prompt-injection & jailbreak red-teaming (Phase 15) |
| **Mobile** | `MobSF`, `apkleaks` | Static + dynamic mobile analysis (Phase 16) |

> Don't drown the report in raw tool output — triage results into real, reachable findings per §0, and put
> raw dumps in the report appendix.

---

<sub>AuditForge · universal AI-agent security audit playbook · contributions welcome · MIT licensed.
This playbook guides defensive review of code you are authorized to audit. It is a checklist, not a
guarantee — treat its output as expert input to a human security decision.</sub>
