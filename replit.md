# Masculine Peak - 7-Day Transformation Protocol

## Overview
A high-performance web platform that generates scientifically-grounded 7-day bio-hacking protocols for specific aesthetic goals. Users input their "dream physique" and receive detailed, hour-by-hour executable plans with scientific citations.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom dark "Cyber-Physical" theme
- **Animations:** Framer Motion v11
- **Fonts:** Oswald (headings), Inter (body) via Google Fonts

## Project Architecture
```
src/
├── app/
│   ├── layout.tsx          # Root layout with dark theme
│   ├── page.tsx            # Landing page with search + preset cards
│   ├── globals.css         # Global styles, custom scrollbar, glow effects
│   ├── actions.ts          # Server action for protocol search/matching
│   └── protocol/
│       └── [slug]/
│           └── page.tsx    # Dynamic protocol dashboard page
├── components/
│   ├── ProtocolDashboard.tsx  # Main protocol view with all sub-components
│   ├── ProgressTracker.tsx    # SVG line chart for visual impact projection
│   ├── DayCard.tsx            # Expandable day card with schedule timeline
│   └── ScienceTooltip.tsx     # Hover/keyboard tooltip for science explanations
├── data/
│   ├── hand-veins.json        # "Ultimate Vascularity" 7-day protocol
│   └── ronaldo-neck.json      # "Ronaldo Neck" 7-day protocol
└── lib/
    └── protocols.ts           # TypeScript types, protocol registry, search logic
```

## Key Features
- Keyword-based protocol matching (server action)
- Hour-by-hour daily schedules with category badges
- SVG progress tracker chart
- Science tooltips with PMID citation placeholders
- Expandable/collapsible day cards
- Dark mode with cyan accent glow effects

## Running
- Dev server: `npm run dev` (port 5000)
- Build: `npm run build`

## User Preferences
- Dark mode "Cyber-Physical" aesthetic
- Masculine typography (Oswald/Inter)
- Data-heavy dashboard visualization
