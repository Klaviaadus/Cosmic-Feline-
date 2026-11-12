# Find Your People

Find real, in-person events and communities near you - the kind of recurring meetups where you actually get to know people, instead of another dating app.

**Live site: https://folnu.com**

## Cities

Tallinn, Tbilisi, Riga, London and Berlin. Pick one in the header; the choice is remembered in the browser.

Cities are defined in `src/cities.ts`. Adding one means adding an entry with its Meetup location, Eventbrite region and Telegram directory slug.

## What it does

- **Topic buttons** - board games, language exchange, hiking, book club, art, music, or "Surprise me". Each pulls live listings for the selected city from Meetup and Eventbrite, plus public Telegram communities when a single topic is chosen.
- **Local guide chat** - a Claude-powered guide that stays on the subject of meeting people locally: what kinds of groups exist, how to approach a new one, what to say. It does not invent events; concrete listings always come from the topic buttons.
- **Share** - any message in the conversation can be shared with a link back to the site.
- **Daily limit** - 20 chat messages per day per browser.

## How it works

- **Frontend:** React 18, TypeScript, Vite, Tailwind.
- **Backend:** Vercel edge functions in `api/`.
- **Events:** scraped from the public search pages of Meetup and Eventbrite (the JSON-LD embedded in the HTML), so no API keys are needed. Telegram communities come from the public telegram-groups.com directory.
- **Chat:** the Anthropic API (`claude-haiku-4-5`).
- **Storage:** Upstash Redis for token usage and source health. Optional - without it the app still works, those two features just record nothing.

| Endpoint | Purpose |
| --- | --- |
| `POST /api/chat` | Guide chat |
| `GET /api/events?city=<id>&keyword=<topic>` | Event and community listings |
| `GET /api/usage?key=<DASHBOARD_SECRET>` | Token usage summary |
| `GET /api/health?key=<DASHBOARD_SECRET>` | Latest per-city health of each event source |
| `GET /api/cron/health-check` | Daily Vercel cron (08:00 UTC) that checks each source still returns results |

## Run locally

Requires Node 20.

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

The Vite dev server serves `/api/chat`, `/api/events` and `/api/usage` itself, so there is no need for `vercel dev`.

```bash
npm test        # vitest
npm run lint    # eslint
npm run build   # production build into dist/
```

## Environment variables

| Variable | Needed for |
| --- | --- |
| `ANTHROPIC_API_KEY` | Guide chat |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Usage and health tracking (`KV_REST_API_URL` / `KV_REST_API_TOKEN` also work) |
| `DASHBOARD_SECRET` | Access to `/api/usage` and `/api/health` |
| `CRON_SECRET` | Authorising the daily health-check cron |

## Deployment

Hosted on Vercel (project `cosmic-feline`) with folnu.com as the custom domain. Pushing to `main` does not deploy; production deploys are run from a linked checkout:

```bash
npx vercel --prod
```

## License

MIT
