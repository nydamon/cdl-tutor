# CDL Tutor

AI-powered CDL written exam prep for all 50 US states.

## Quick Start

```bash
cd /root/.openclaw/workspace/products/cdl-tutor
npm install
npm start  # runs on port 8080
```

Visit: http://localhost:8080

## Deploy

```bash
# Frontend → Cloudflare Pages
CLOUDFLARE_API_KEY="..." CLOUDFLARE_EMAIL="..." \
  wrangler pages deploy public --project-name cdl-tutor

# Backend → Railway
railway up --service 70e1db8d-286c-413c-8383-19c3d36725d7
```

## Architecture

```
Browser → Cloudflare Pages (static HTML/CSS/JS)
              ↓ API calls
         Railway Node.js API
              ↓
         OpenAI (voice sessions)
         Stripe (billing)
         Clerk (auth)
```

## Features

| Feature | Status |
|---------|--------|
| State selection (50 states) | ✅ |
| AI voice practice sessions | ✅ |
| Stripe billing ($9.99/mo, $79.99/yr) | ✅ |
| PWA (installable on iOS/Android) | ✅ |
| Privacy Policy + Terms | ✅ |
| NJ state data | ✅ |
| All 50 states data | ⏳ In Progress |
| Clerk auth wired | ⏳ |
| Stripe webhooks | ⏳ |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Health check |
| /api/states | GET | List all states |
| /api/state/:code | GET | Get state questions |
| /api/billing/create-checkout | POST | Create Stripe session |

## URLs

- **Live site:** https://cdl-tutor.pages.dev
- **Custom domain:** https://cdl-tutor.com
- **GitHub:** https://github.com/nydamon/cdl-tutor
