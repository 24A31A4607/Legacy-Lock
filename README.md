# LegacyLock — Your Digital Legacy, Protected

> **Tagline:** Your Digital Legacy, Protected.  
> An autonomous, secure full-stack web application for organizing digital assets, documents, estate directives, trusted beneficiaries, and controlled inheritance workflows.

---

## 1. Product Overview

LegacyLock solves the modern problem of digital asset succession. When individuals pass away or face medical incapacitation, their families and designated trustees often struggle to locate critical accounts, deeds, crypto recovery keys, or final wishes.

LegacyLock provides:
- **Encrypted Digital Vault:** Categorize and store documents, photos & memories, account records, and private notes with strict ownership validation and private file downloads.
- **Trusted Beneficiaries:** Designate successors, assign specific vault records, and configure intended future access scopes.
- **Legacy Directives:** Pen personal messages, account closure protocols, and distribution preferences locked until succession.
- **Autonomous Safety Cadence:** Periodic "Confirm I'm OK" check-in pulses. Missing a check-in initiates an extended grace period rather than premature disclosure.
- **Controlled 7-Stage Succession Protocol:** Multi-party review lifecycle (`No request` → `Request submitted` → `Awaiting review` → `Approved` / `Rejected` → `Access granted` → `Access revoked`). Beneficiaries cannot approve their own claims; only authorized reviewers can certify declarations.
- **Audit Logging:** Tamper-evident record of all system events, logins, and reviewer determinations with CSV export.

---

## 2. Architecture & Persistence Modes

LegacyLock features a dual-mode persistence architecture with a clean repository interface (`ILegacyRepository`):

### Mode A: Local Persistent Engine (Default / Active)
- **Zero External Dependencies Required:** Operates immediately out-of-the-box.
- **Persistence:** High-reliability file-backed JSON database (`data/legacylock.db.json`) with atomic write buffers.
- **File Storage:** Dedicated private server directory (`data/uploads/`) with strict authorization checks and path-traversal prevention.
- **Authentication:** Salted & hashed passwords using `bcryptjs` and HMAC-signed session tokens.

### Mode B: Supabase Cloud Integration
- **PostgreSQL Database:** Complete schema with primary/foreign keys and indexes.
- **Row Level Security (RLS):** Granular policies isolating user vaults and authorizing review officers.
- **Private Storage Buckets:** Private S3-compatible buckets with server-signed tokens.
- **Migration Script:** Fully prepared in `supabase/migrations/20261011_initial_schema.sql`.

---

## 3. Quick Start & Execution

### Running the Application
The application is pre-configured with a unified dev server running Express on port 3000 with Vite middleware:

```bash
# Start the full-stack server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests
```bash
npm run test
```

### Production Build
```bash
npm run build
```

---

## 4. Fictional Demo Accounts

The application automatically seeds a rich demonstration environment on first launch. You can sign in using one-click buttons on the authentication screen or manually with:

| Persona | Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Eleanor Vance** | Vault Owner | `eleanor@example.com` | `LegacyPass123!` | Complete estate map, 5 deposited assets, 2 beneficiaries, 3 legacy instructions, active 30-day cadence. |
| **Arthur Sterling** | Review Officer | `reviewer@example.com` | `ReviewerPass123!` | Access to the succession review queue to adjudicate claims and log verification findings. |
| **Marcus Vance** | Beneficiary & Son | `marcus@example.com` | `MarcusPass123!` | Designated executor with pending succession claim demonstration. |

*You can also register a brand new account at any time to verify complete multi-tenant user isolation.*

---

## 5. How to Connect Real Supabase Backend

If you wish to switch from Local Persistent mode to real Supabase Cloud:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open your Supabase **SQL Editor** and paste the contents of `supabase/migrations/20261011_initial_schema.sql`, then execute it.
3. Update your `.env` file:
   ```env
   LEGACYLOCK_STORAGE_MODE="supabase"
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```
4. Restart the server with `npm run dev`. The repository adapter will automatically transition to Supabase PostgreSQL and private storage.

---

## 6. Security & Legal Transparency Disclaimers

- **Prototype Boundaries:** LegacyLock is an interactive software demonstrator. It does not interface with municipal or national death registries, and is not a substitute for an attorney-drafted Last Will and Testament.
- **Safety Cadence Guardrail:** Missing a check-in **never** automatically counts as proof of death or releases private assets.
- **Anti-Self-Approval:** The backend strictly rejects attempts by beneficiaries to adjudicate their own claims.
