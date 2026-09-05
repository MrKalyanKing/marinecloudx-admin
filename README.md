# @marinecloudex/admin

SMIVORA / MarineCloudeX **admin** — CMS + CRM. Next.js (App Router), Tailwind.
Separate application, separate host from the public site. API-driven: every read
and write goes through the NestJS backend. **No database access, ever.**

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:3002
```

Self-contained: own `package.json`, lockfile, tsconfig, lint and Next config.
The shared wire contract is a committed copy at `src/contracts/` — regenerate it
from the repo root with `npm run sync:contracts`.

The admin / CMS / CRM UI moves here from the legacy `src/app/admin/**` and
`src/features/{cms,crm}` in Phase 11 of `docs/monorepo-migration-plan.md`.
Login is rebuilt on backend-issued auth in Phase 9.
