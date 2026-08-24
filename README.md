# Founda — React + Vite + Tailwind CSS MVP

## Stack
- React
- Vite
- Tailwind CSS
- Pure React state for the MVP
- No chart library; dashboard charts are built with CSS/SVG-style UI so there are no unnecessary dependencies.

## Main changes
- Removed the Dashboard "Your Applications" block.
- Removed the Dashboard "How Founda Works" block.
- Dashboard now contains useful KPI cards, match-performance bars, pipeline distribution, top matches and profile/verification health.
- Dashboard content is role-aware: Freelancer vs Startup.
- Match Engine remains the central place for matching and Apply.
- Pipeline remains the central application tracking workflow.
- Removed the entire Skill Assessment flow.
- Added a prominent Verified badge for verified professional profiles.
- Verification now covers email, mobile, identity, education, portfolio and professional reference.
- Header status is profile-dependent instead of hard-coded to "Open to Work".
- Match Engine still uses the selected profile and engagement preference to calculate match percentage.
- Color palette follows the uploaded Founda logo: deep navy + violet/purple + electric blue + teal/cyan.
- Clean componentized React code with Tailwind utility classes.

## Run
```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Notes
This is the frontend MVP. Replace the in-memory arrays/state with your Node/Supabase backend when connecting the production data layer.
