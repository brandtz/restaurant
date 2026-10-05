# BrandtWorks Restaurant Platform

Development foundation for a new restaurant ordering platform from
BrandtWorks Enterprises.

## Running the foundation

Requirements: Node.js 22.12+ (22.x), pnpm 9.15.9. No provider account or
database credentials are required for this informational application.

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. The page is a development status screen, not
a storefront or authenticated console. `/api/health` is an uncached
application-liveness endpoint: HTTP 200 does not mean database/provider
readiness. It exposes no credentials, project IDs or connection strings.
`/design-preview` displays two fictional restaurant themes and reusable
accessibility primitives, not a live store or ordering actions. Production
environments return 404 for this preview route.

### Lani Moku storefront prototype (D-020)

A replacement-site preview now lives at `/lani-moku-grill`; `/` redirects
there only when the non-production demo is enabled. It includes original
teal/coral styling, tropical illustrations and separate Springfield/Eugene
location pages. Order buttons lead into the pickup prototype below.
The existing Wix implementation, proprietary artwork, stock assets and
merchant logo were not copied. Merchant-approved assets can replace the
name fallback and photo placeholders later.

A clickable, fixture-backed pickup storefront for the first pilot target
lives at `/order/lani-moku-grill` (location picker → menu → item options →
cart). It uses labeled, unverified sample data from public listings, places
no orders and takes no payment. It is hidden (404) unless
`DEMO_STOREFRONT_ENABLED=1` is set, and never served in production.

```powershell
Copy-Item .env.example .env.local   # sets DEMO_STOREFRONT_ENABLED=1
pnpm dev
# open http://localhost:3000/order/lani-moku-grill
pnpm test:e2e:storefront            # isolated build on 127.0.0.1:3221
```

To QA on a phone on the same network, run `pnpm dev --hostname 0.0.0.0`
and open `http://<this-PC-IP>:3000/order/lani-moku-grill`. Screens read
through `StorefrontDataSource` (`src/storefront/data-source.ts`); the
backend replaces the fixture source with published database data later.

### Menu photos (CP-033 prototype)

`/demo-admin/lani-moku-grill/menu` is a **demo editor, not authenticated
admin access**. Choose a location/item, select a local JPEG/PNG/WebP,
describe it for screen readers, and preview, replace or remove it. Photos
appear in the homepage favorites, ordering menu, item detail and cart.
Every item supports an optional image and a missing/broken-image fallback.

These changes exist only in the currently loaded browser app. No file is
uploaded, saved on the server or published; reload and other tabs/visitors
do not retain them. Client-side prototype checks allow 5 MB per image,
320–4096 pixels per side and up to 30 MB total previews. These are demo
limits, not a merchant-approved production upload policy.

Real photo management requires the O-012/O-014/O-018 follow-up: verified
editor permissions, tenant-owned storage, trusted byte/type/dimension
validation, metadata stripping/re-encoding, safe image delivery, asset
references in menu drafts, audited publication and replacement cleanup.
Neon should hold image metadata/references, not uploaded image binaries.
No storage provider or new dependency is selected by this prototype.

```powershell
pnpm check
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:e2e:design
```

Browser smoke tests start and stop their own production server on
`127.0.0.1:3217` and refuse to reuse an existing server. Run `pnpm build`
before `pnpm test:e2e`. Reserve that port before concurrent validation.
`pnpm test:e2e:design` builds and runs the design preview from the isolated
`.next-design-preview` directory on `127.0.0.1:3219`, so it can run alongside
the normal developer server without sharing `.next` state. The test owns and
stops only that isolated server. `/design-preview` is hidden unless
`DESIGN_PREVIEW_ENABLED=1` is explicitly supplied to a non-production
environment; production configuration always rejects the preview flag.
Formatting targets application files only; ignored guidance/agent records
and generated outputs are excluded. Unit tests run under Vitest's Node
environment; the test-only `server-only` alias is not used in production.

ESLint 9 is pinned for the current Next.js React-plugin peer range (which
does not yet include ESLint 10). The package manager reports its upstream
deprecation; upgrading that major waits for compatible peers rather than
bypassing dependency checks. TypeScript 5.9 is the conservative typed build
baseline; exact versions are locked for reproducibility.

Copy `.env.example` to `.env.local` only when configuration is needed;
never commit real values. `APP_ENV` is `local`, `test`, `preview` or
`production` and must match `VERCEL_ENV` when hosted. Optional database
configuration requires `DATABASE_URL`, `DATABASE_ENV` and
`DATABASE_PROJECT_ID` together; remote PostgreSQL URLs require TLS.
Those labels are configuration checks, not proof of the target's identity,
role privileges, connection health or isolation. A later database packet
must verify the actual approved target and least-privilege role.

Invalid configuration fails startup with field-name-only structured logs;
the health handler also returns safe HTTP 503 if configuration becomes
invalid. There is no real auth/database/storage/payment implementation or
tenant/order migration in this bootstrap.

CI definition: `.github/workflows/ci.yml` runs the local checks, build and
Chromium smoke without provider secrets. **It is currently ignored**, as
requested, and is not an active GitHub workflow until the owner deliberately
changes that policy and publishes it. No commit, push or deployment is
performed by the bootstrap. Hosted DB/migration checks, provider wiring and
remote CI remain Phase 0 acceptance gates rather than invented passes.

## Product thesis

Build a multi-tenant, restaurant-owned ordering platform for small
independent restaurants. Customers order from the restaurant's own
branded web experience. The restaurant pays BrandtWorks a predictable
subscription rather than a percentage of food sales.

The platform must support:

-   Direct pickup ordering first.
-   White-label delivery through interchangeable delivery providers.
-   POS integrations through provider adapters.
-   Card payments without BrandtWorks becoming the merchant of record
    for restaurant food sales.
-   Restaurant-specific menus, hours, taxes, modifiers, order settings,
    and branding.
-   A lightweight restaurant operations interface.
-   A repeatable onboarding process that does not require custom code
    for every restaurant.

**Explicitly out of scope for the initial product:** charitable
donations/round-ups, marketplace discovery, loyalty programs, native
mobile apps, table service, reservations, payroll, inventory management,
and building a full POS.

## Initial launch strategy

The first real merchant should be treated as a pilot, not as a
special-case fork. Lani Moku is a likely first target, with other
Springfield-area restaurants such as Tacos Pirekua and Ocean Garden as
potential follow-ons.

The first production milestone is intentionally narrower than the
long-term vision:

1.  Merchant onboarding.
2.  Branded restaurant storefront.
3.  Menu and modifiers.
4.  Cart and checkout.
5.  Merchant-first payment-provider architecture.
6.  Pickup orders.
7.  Restaurant order acceptance and status.
8.  Notifications.
9.  Delivery-provider abstraction with sandbox implementations.
10. POS abstraction, with manual/tablet fulfillment available as the
    universal fallback.

Do not block the first merchant launch on DoorDash Drive production
approval.

## Preferred technical direction

-   **Frontend / full-stack framework:** Next.js + TypeScript.
-   **Hosting:** Vercel.
-   **Database:** Neon PostgreSQL, using a dedicated Restaurant project
    isolated from Bulwark and non-production targets for development/tests.
-   **Auth / asset storage:** Separate provider decisions; do not assume
    Supabase services or select a new dependency without an accepted packet.
-   **Payments:** Prefer the restaurant's existing payment ecosystem.
    Square and Clover are likely initial candidates; choose from actual
    merchant evidence and supported API/account flows. Stripe is an
    alternative, not a required first provider.
-   **Delivery:** adapter layer, initially DoorDash Drive and Uber
    Direct where access permits.
-   **POS:** adapter layer; do not hard-wire the domain model to Clover,
    Square, Toast, or another provider.
-   **Testing:** Vitest for unit/integration tests and Playwright for
    end-to-end flows.
-   **Validation:** Zod at application boundaries.
-   **Package manager:** pnpm.

The repository should remain a modular monolith until real scaling
pressure justifies services. Provider integrations are modules/adapters,
not independent microservices on day one.

## Read these documents before coding

1.  `AGENTS.md`
2.  `docs/01-product-requirements.md`
3.  `docs/02-architecture.md`
4.  `docs/03-domain-data-model.md`
5.  `docs/04-integrations.md`
6.  `docs/05-security-payments.md`
7.  `docs/06-testing-release.md`
8.  `docs/07-implementation-roadmap.md`
9.  `docs/08-decisions-open-questions.md`
10. [Parallel-agent workflow and allocations](docs/09-agent-orchestration.md)
11. [Dependency-ranked epics and stories](docs/11-epics-and-stories.md)
12. [Received design review and adoption boundaries](docs/12-design-output-review.md)
13. [Durable claims, checkpoints and reviews](docs/13-agent-state-protocol.md)
14. [Neon/Vercel MCP setup and access boundaries](docs/14-platform-mcp-access.md)
15. [Tenant proposal reconciliation and authorization kernel](docs/15-tenant-contract-reconciliation.md)

[The Claude Design brief](docs/10-design-system-brief.md) defines the
separate design-artifact assignment. Backend slices remain the priority.

## Working with multiple agents

Copilot is the chief orchestrator; Codex and Claude Code work only on
explicitly allocated, single-writer packets. Read the workflow before
starting or resuming work. It includes ready kickoff prompts, checkpoint
rules, usage-reset planning, and serial integration gates.

Copilot is also the default hands-on owner of the foundation, Claude
Design artifact integration, frontend components/screens, route composition,
the BWE setup portal, and UI tests. Codex's default lane is database/domain
work; Claude Code's is server application/adapters. The workflow defines gated Copilot packets
so frontend development can run against accepted contracts in parallel
without overwriting backend work.

The ranked backlog adds PM/BSA story decomposition and validation gates.
Pilot scope includes restaurant logos/name on customer and owner surfaces,
plus BWE merchant/theme/logo setup, manual menu preparation, safe payment/
supported POS configuration, and readiness. Optional importers and real
POS adapters do not block pickup/manual launch.

Operational choices such as acceptance, notifications and customer
cancellation are configured per location during setup. Orders retain their
location policy/version; platform safety and settled BWE financial/account
rules are not configurable exceptions.

[Live agent state](docs/agent-state/README.md) supplies actual claim files,
separate worker progress journals and Copilot-owned review/kick-back queues.
Workers report session/progress and wait for activation before output
edits. These ignored local records need explicit backup and canonical-path
access across worktrees; they are not automatic file locks.

The current ignore policy keeps `docs/`, `AGENTS.md`, `CLAUDE.md`, and
`.github/` local. Git clones/worktrees will not receive those instructions
automatically. Synchronize and verify guidance as described in the
workflow before assigning implementation in another worktree. Do not
force-add these files without owner approval.

`CLAUDE.md` and `.github/copilot-instructions.md` contain tool-specific
instructions that intentionally align with `AGENTS.md`.

## Core engineering principle

The restaurant ordering domain owns the truth. Stripe, DoorDash, Uber,
Clover, and future providers are external systems connected through
adapters. Provider-specific IDs and payloads may be stored, but they
must not become the platform's core domain model.

When forced to choose between cleverness and a boring, testable
implementation, choose boring and testable.
