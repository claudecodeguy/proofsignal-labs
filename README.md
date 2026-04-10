# ProofSignal Labs — Phase 1 Frontend

Admin-operated dental clinic lead generation system for dental-focused MSPs and MSSPs.

## Stack

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS** with custom design system
- **Google Fonts:** DM Serif Display (display) · Figtree (body) · JetBrains Mono (data)
- **No external UI libraries** — pure Tailwind components

## Local Setup

```bash
cd proofsignal-labs
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site.
Open [http://localhost:3000/admin](http://localhost:3000/admin) for the admin dashboard.

## Route Structure

### Public Site
| Route | Page |
|---|---|
| `/` | Homepage |
| `/methodology` | How It Works |
| `/sample-lead` | Sample Lead Packet |
| `/dental-it-leads` | Dental IT Leads landing page |
| `/contact` | Contact / Request Sample form |

### Admin (protected)
| Route | Page |
|---|---|
| `/admin/login` | Admin login |
| `/admin` | Dashboard overview |
| `/admin/companies` | Raw company candidates |
| `/admin/companies/[id]` | Company detail |
| `/admin/leads` | Approved / borderline / rejected leads |
| `/admin/leads/[id]` | Lead detail with evidence |
| `/admin/buyers` | Buyer CRM |
| `/admin/buyers/[id]` | Buyer detail + outreach history |
| `/admin/outreach` | Outreach drafts and logs |
| `/admin/exclusivity` | Exclusivity locks |
| `/admin/reports` | Run summaries and usage reports |
| `/admin/settings` | API keys, thresholds, vertical config |

## Architecture Notes

- Route groups: `app/admin/(dashboard)/` applies the sidebar layout to all dashboard pages; `app/admin/login/` is outside the group and renders without the sidebar.
- All placeholder data is in `lib/mock-data.ts` — replace with DB queries (Prisma/Drizzle) in Phase 1B.
- Vertical pack key: `dental_msp_us` — stored in settings, used by discovery and scoring pipelines.
- Model routing: Haiku 4.5 for extraction, Sonnet 4.6 for borderline adjudication and packet summaries.

## Environment Variables

See `.env.example` for all required keys.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Auth session secret |
| `FIRECRAWL_API_KEY` | Web scraping |
| `ANTHROPIC_API_KEY` | Haiku extraction + Sonnet adjudication |
| `HUNTER_API_KEY` | Email finding and verification |
| `SMTP_*` | Outbound email sender |
