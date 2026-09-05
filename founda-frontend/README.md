# Founda — Freelancer × Startup Matching Frontend

A Vite + React + Tailwind app implementing the AI match engine, application
pipeline, verification, and profile pages you provided, wired up to a shared
context and seed dataset so it runs standalone.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (defaults to http://localhost:5173).

To build for production:

```bash
npm run build
npm run preview
```

## What's included

- `src/context/FreelancerContext.jsx` — app state: current role (Freelancer /
  Startup), the selected profile, freelancers/startups lists, and
  applications. This is what your pages' `useFreelancer()` calls read from.
- `src/data/freelancerData.js` — seed `FREELANCERS`, `STARTUPS`, `DOMAINS`,
  and `VERIFICATION_ITEMS` used by the Match Engine, Verification and Profile
  pages.
- `src/utils/matchEngine.js` — `initials`, `matchScore` (freelancer → startup)
  and `candidateScore` (startup → freelancer) scoring functions, each
  returning `{ total, shared, missing, skill, domain, experience,
  engagementFit, trust }`.
- `src/components/freelancer/` — `Badge`, `VerifiedBadge`, `StatCard`,
  `MiniBar`, `Header` (role switch), `Sidebar` (nav).
- `src/pages/freelancer/` — `FreelancerLayout`, `Dashboard`, `MatchEngine`,
  `Pipeline`, `Verification`, `Profile` — your original page components,
  unchanged in logic.
- Tailwind is configured with the `founda-purple / founda-blue / founda-teal /
  founda-ink / founda-navy / founda-line` color tokens and the `.card`,
  `.btn-primary`, `.btn-secondary`, `.input`, `.label` utility classes your
  markup relies on.

## Notes

- Switching the role toggle in the header (Freelancer / Startup) swaps which
  side of the marketplace you're viewing and resets the selected profile to
  the first item on that side.
- Applications are seeded with a few demo entries so the Pipeline board isn't
  empty on first load; new ones are created from the Match Engine's "Apply"
  button.
- Trust scores and verification status are demo data — the "Approve Demo"
  button in Verification simulates what an admin review would do.
