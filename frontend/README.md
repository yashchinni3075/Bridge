# Bridge — Startup Module (Frontend)

React + Vite + Tailwind. Runs entirely on dummy data + localStorage —
no backend needed to develop or demo it today.

## How to run it

```bash
cd bridge-startup
npm install
npm run dev
```

Opens at **http://localhost:5173** → lands on `/register` first.

## The actual flow (matches what we discussed)

1. **`/register`** — minimal signup: name, email, phone, password, OTP
   (simulated — any 4 digits work). This is the ONLY thing collected
   at registration.
2. On success → redirected to **`/profile`** with status `draft`.
3. **`/profile`** — the real detail-gathering step, in 3 sections:
   - **Startup Details** — name, sector, stage, description, ask, city,
     skills-have / skills-needed tags, and a repeatable **Links** editor
     (dropdown: Website, LinkedIn, Twitter/X, Instagram, Crunchbase,
     AngelList, GitHub)
   - **Verification Documents** — business registration proof upload
     (incorporation certificate / Udyam / GST), and **domain verification**
     (enter your domain, click "Verify domain" → simulated WHOIS lookup
     showing registrar, registration date, status)
   - **Pitch Deck** — upload as `.ppt` / `.pptx` specifically (not PDF)
4. Submit button stays disabled until every required field AND all three
   verification pieces (registration proof, verified domain, pitch deck)
   are present. Only then does status become `pending_review`.
5. **Admin cannot verify a startup before this point** — that gating
   is enforced in the UI (dashboard banner explicitly says so) and is
   meant to be enforced again server-side once the backend exists.

## Important note on domain verification (WHOIS)

Browsers cannot call WHOIS/RDAP servers directly — there's no CORS
support on those endpoints. `src/components/DomainVerify.jsx` currently
**simulates** the lookup so the UI/UX works today. In production, add
a small backend endpoint that calls a real WHOIS/RDAP API (e.g. RDAP,
or a service like whoisjson.com) and returns clean JSON — swap the
`simulateWhoisLookup()` function for a real `fetch()` to that endpoint.
This is called out again inline in the component's code comments.

## Pages

| Page | Route | What it does |
|---|---|---|
| Register | `/register` | Minimal signup + OTP |
| Dashboard | `/` | Stats, profile-completion banner, top match previews |
| Discover Investors | `/investors` | Filterable ranked list → click through to full profile |
| Investor Profile | `/investors/:id` | Full LinkedIn-style profile — bio, focus, past investments, links, **Request intro** + **Schedule pitch meet** (opens calendar scheduler) |
| Find Teammates | `/teammates` | Skill-gap panel + filterable ranked list → click through to full profile |
| Teammate Profile | `/teammates/:id` | Full LinkedIn-style profile — bio, skills, past work, rating, links, **Invite** + **Schedule skill test** |
| Calendar | `/calendar` | Month view + upcoming list of all scheduled pitch meets and skill tests |
| Milestones | `/milestones` | Timeline, verified/unverified badges, add-milestone form |
| Pitch Score | `/pitch` | Live rule-based scorer (placeholder for the real LLM API call) |
| Complete Profile | `/profile` | The full 3-section profile + verification form described above |

## Design system

- **Colors** (`tailwind.config.js`): `ink` (deep navy-charcoal — sidebar/text),
  `paper`/`paper-raised` (warm off-white), `coral` (primary accent/CTA/scores),
  `emerald` (verified/success), `amber` (pending), `rose` (errors/gaps)
- **Fonts:** `font-display` (Sora — headings), `font-sans` (Inter — body),
  `font-mono` (JetBrains Mono — scores/dates/numbers)
- **Shared components:** `src/components/ui.jsx` — `VerifyBadge`, `Tag`,
  `Button`, `Card`, `SectionHead`, `Avatar`, `Modal`. Import these directly
  in Yash's and Rutuja's modules so the whole app looks consistent when merged.

## State management

`src/context/AppStateContext.jsx` — a simple React Context backed by
`localStorage`, holding: `auth` (registered user), `profile` (all profile +
verification fields, with a `status` of `not_started` → `draft` →
`pending_review` → `verified`), and `events` (calendar entries). This is
a real, working state layer — not mocked — it just isn't connected to a
server yet. Swapping to the real backend later means replacing the
`localStorage` read/writes in this one file with API calls; no page
component needs to change.

## Connecting to the real backend later

Data shapes here already match the earlier `founda-app` backend prototype's
API responses. When ready: replace `investorMatches` / `teammateMatches`
imports with `fetch()` calls, and replace `AppStateContext`'s localStorage
persistence with real API calls (register → `POST /api/auth/register`,
profile submit → `POST /api/founders/:id/submit`, etc).
