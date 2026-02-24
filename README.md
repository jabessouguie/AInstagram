# InstaInsights

Instagram analytics dashboard — 100% local, GDPR-compliant, AI-powered.

Upload your Instagram data export and get actionable insights: engagement metrics, audience quality, best posting times, collab opportunities, and AI-drafted DM replies.

---

## Prerequisites

- **Node.js 20+**
- **npm 10+**
- A **Gemini API key** (free tier works) — [get one here](https://aistudio.google.com/app/apikey)
- Your **Instagram data export** (Settings → Account Center → Your information and permissions → Download your information → Select JSON or HTML format)

---

## Installation

```bash
# Clone the repo
git clone https://github.com/jabessouguie/insta-insights.git
cd insta-insights/webapp

# Install dependencies
npm install
```

---

## Configuration

Create a `.env.local` file in `webapp/`:

```env
GEMINI_API_KEY=your_api_key_here
```

---

## Data Setup

Place your Instagram export folder inside the `data/` directory at the root of the repo:

```
insta-insights/
├── data/
│   └── instagram-username-2024-01-01/   ← your export here
│       ├── connections/
│       │   └── followers_and_following/
│       ├── your_instagram_activity/
│       │   ├── comments/
│       │   ├── likes/
│       │   └── messages/
│       └── ...
└── webapp/
```

The app auto-detects any folder starting with `instagram-` inside `data/`.

Alternatively, set a custom path:
```env
INSTAGRAM_DATA_PATH=/absolute/path/to/your/data
```

---

## Running

```bash
cd webapp
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/creator/dashboard`.

---

## Features

### Dashboard (`/creator/dashboard`)
- Follower count, engagement rate (per-post), avg likes/comments
- Monthly follower growth chart
- Content type performance (Reels vs Photos vs Carousels)
- Best posting days and hours
- Top 10 posts by engagement
- Audience reach and impressions breakdown
- AI-generated insights via Gemini

### Interaction Analysis (`/creator/interactions`)
- Followers who **never interacted** with your posts (never liked or commented)
- Accounts you follow that **don't follow back** → suggested DM outreach
- Accounts you DM'd **more than 1 month ago** with no follow-back → unfollow candidates
- AI-generated DM suggestions via Gemini

### Media Kit (`/creator/mediakit`)
- Auto-generated HTML media kit from your stats
- Live preview with customisable theme colours
- One-click download as HTML file

### Collab Finder (`/creator/collabs`)
- AI-powered search for collaboration opportunities
- Filter by location, niche, and interests
- Auto-drafted outreach emails in French or English via Gemini

### AI Response Composer (`/creator/responses`)
- Lists unanswered DMs from your export (conversations where the last message isn't yours)
- One-click Gemini draft reply — short, natural, in French
- Editable textarea + copy-to-clipboard
- No DMs are sent automatically — you review and send manually

### PWA (installable)
The app is installable as a Progressive Web App:
- Cache-first for static assets, network-first for API routes
- Works offline for previously visited pages
- Add to home screen on mobile

---

## Testing

```bash
cd webapp
npm test
```

7 test suites, 92 tests covering:
- Instagram metrics computation (engagement rate, follower growth)
- Interaction analysis classification logic
- Media kit HTML generation
- Collab finder response parsing
- AI response composer DM filtering
- PWA manifest + service worker + icon validation
- API data shape validation

---

## Architecture

```
webapp/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── data/              # Parses Instagram export → JSON
│   │   │   ├── insights/          # Gemini AI insights
│   │   │   ├── interactions/      # Interaction analysis + DM suggestions
│   │   │   ├── collabs/           # Collab search + email drafting
│   │   │   └── responses/         # Unanswered DMs + AI reply composer
│   │   └── creator/
│   │       ├── dashboard/         # Main analytics dashboard
│   │       ├── interactions/      # Interaction management UI
│   │       ├── mediakit/          # Media kit generator UI
│   │       ├── collabs/           # Collab finder UI
│   │       └── responses/         # DM response composer UI
│   ├── lib/
│   │   ├── instagram-parser.ts    # HTML export parsing + metric computation
│   │   ├── interaction-analyser.ts # Follower/DM analysis
│   │   ├── mediakit-generator.ts  # HTML media kit generation
│   │   ├── dm-response-composer.ts # Unanswered DM detection
│   │   └── gemini.ts              # Gemini AI client
│   ├── components/
│   │   ├── layout/Header.tsx      # Navigation
│   │   ├── dashboard/             # Charts and metric cards
│   │   └── creator/               # Feature-specific components
│   └── __tests__/                 # Jest test suites
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   └── icon.svg                   # App icon
└── next.config.mjs
```

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui · Recharts · SWR · Gemini 3.1 Pro · Jest

---

## Privacy

All data processing happens locally on your machine. Your Instagram export never leaves your device. The only external API call is to Gemini (when you explicitly trigger an AI feature), and only the relevant metrics or message text are sent — never raw personal data.
