# Benu

Mobile-first restaurant dietary preferences screen with a built-in menu assistant chatbot. Built with Next.js (App Router), TypeScript, Tailwind, and the Anthropic SDK.

## Stack

- **Next.js 15** (App Router, Server Components + Route Handlers)
- **React 19**
- **TypeScript** (strict)
- **Tailwind CSS**
- **Anthropic Claude** for the chatbot (Opus 4.7) with prompt caching

## Project structure

```
app/
  layout.tsx                    # Root layout
  page.tsx                      # / → redirects to /dietary-preferences
  globals.css                   # Tailwind + base styles
  dietary-preferences/page.tsx  # Thin shell for the preferences screen
  api/chat/route.ts             # POST /api/chat — Claude-backed assistant
components/
  DietaryPreferences.tsx        # Main client component (preferences UI)
  MenuAssistant.tsx             # Chatbot UI
lib/
  menu.ts                       # MenuItem type + MENU dataset + helpers
  preferences.ts                # Preference → tag mapping + helpers
  chatbot.ts                    # Local fallback chatbot (no API key needed)
```

The API route gracefully falls back to the local rule-based chatbot if `ANTHROPIC_API_KEY` is missing or the API call fails, so the UI keeps working in any environment.

## Local development

```bash
npm install
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY in .env.local (optional — local fallback works without it)
npm run dev
```

Visit <http://localhost:3000>.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New… → Project → Import** your repo. Vercel auto-detects Next.js.
3. Add environment variables under **Settings → Environment Variables** (see below).
4. Deploy.

## Environment variables

| Name | Required | Description | Where to get it |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes (for live chatbot) | Server-side key for the Claude-backed `/api/chat` route. If missing, the route falls back to a local rule-based chatbot. | <https://console.anthropic.com/settings/keys> |
| `OPENAI_API_KEY` | No | Reserved for an optional OpenAI fallback or comparison path. Not wired in code yet. | <https://platform.openai.com/api-keys> |
| `UNSPLASH_ACCESS_KEY` | No | Unsplash API access key for fetching real dish photos via the official API. The current menu uses `source.unsplash.com` placeholder URLs that don't require a key. | <https://unsplash.com/oauth/applications> |
| `UNSPLASH_SECRET_KEY` | No | Unsplash secret. Only needed for OAuth user actions, not for read-only image search. | Same as above |
| `NEXT_PUBLIC_BRAND_NAME` | No | Brand name shown in the disclaimer copy. Defaults to `our restaurant`. | — |

You're ready to add API keys once the project is deployed (or whenever you want the live chatbot locally). Add them in Vercel → Project → Settings → Environment Variables, then redeploy.
