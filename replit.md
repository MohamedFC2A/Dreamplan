# Masculine Peak - 7-Day Transformation Protocol

## Overview
A bilingual (Arabic/English) web platform that generates scientifically-grounded 7-day bio-hacking protocols for specific aesthetic goals. Users input their "dream physique" and receive detailed task-based executable plans with scientific citations. Default language is Arabic with full RTL support.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with dark black + gold accent theme
- **Animations:** Framer Motion v11
- **Fonts:** Oswald (headings EN), Cairo (headings/body AR), Inter (body EN) via Google Fonts
- **AI:** DeepSeek API (via OpenAI SDK) for dynamic protocol generation

## Project Architecture
```
src/
├── app/
│   ├── layout.tsx              # Root layout with dark theme, LanguageProvider
│   ├── page.tsx                # Landing page with AI form + featured protocols
│   ├── globals.css             # Global styles, custom scrollbar
│   ├── api/
│   │   └── generate/
│   │       └── route.ts        # DeepSeek AI protocol generation endpoint
│   └── protocol/
│       └── [slug]/
│           └── page.tsx        # Dynamic protocol dashboard page
├── components/
│   ├── ProtocolDashboard.tsx    # Main protocol view with all sub-components
│   ├── ProgressTracker.tsx     # SVG line chart for visual impact projection
│   ├── DayCard.tsx             # Expandable day card with task checkboxes
│   ├── Popover.tsx             # Click-to-open popover for science explanations
│   ├── ExercisePopover.tsx     # Exercise guide popover with steps
│   ├── AiProtocolLoader.tsx    # Loads AI-generated protocol from sessionStorage
│   ├── LanguageToggle.tsx      # Arabic/English language switcher
│   └── DirectionSetter.tsx     # Sets HTML dir/lang attributes reactively
├── data/
│   ├── hand-veins.json         # "Ultimate Vascularity" 7-day protocol (bilingual)
│   └── ronaldo-neck.json       # "Ronaldo Neck" 7-day protocol (bilingual)
└── lib/
    ├── protocols.ts            # TypeScript types, protocol registry, search logic
    ├── LanguageContext.tsx      # React context for language state (ar/en)
    └── i18n.ts                 # Translation strings for Arabic and English
```

## Key Features
- DeepSeek AI-powered dynamic protocol generation
- Full Arabic/English bilingual support with RTL layout
- Task-based points system with checkboxes and progress bars (8-10 tasks/day)
- SVG progress tracker chart (gold theme)
- Science explanation popovers with PMID citations
- Exercise guide popovers with step-by-step instructions
- Expandable/collapsible day cards

## Design
- **Theme:** Dark black (#000000) with gold (#D4AF37) accent
- **No glow/neon effects** - clean, premium, bold aesthetic
- **Typography:** Oswald + Cairo for headings, Inter + Cairo for body
- **Default language:** Arabic (RTL)

## Running
- Dev server: `npm run dev` (port 5000)
- Build: `npm run build`

## User Preferences
- Dark black + gold accent aesthetic (NO glow, NO neon, NO cyan)
- Masculine bold typography
- Arabic as default language with proper RTL
- Task-based dashboard with progress tracking
- Data-heavy visualization
