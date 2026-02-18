# AGENTS.md - CDL Tutor Agent Instructions

## Project Location
`/root/.openclaw/workspace/products/cdl-tutor`

## Stack
- **Frontend:** Vanilla HTML/CSS/JS (no framework — keep it simple)
- **Backend:** Node.js + Express (`server.js`)
- **Hosting:** Cloudflare Pages (frontend static) + Railway (backend API)
- **Auth:** Clerk (keys in Vercel/Railway env vars)
- **Payments:** Stripe (keys in env vars)
- **AI:** OpenAI API (GPT-4o for voice sessions)
- **DNS:** Cloudflare (zone: c648f45a3e1e6f762509de9ababa6383)

## Live URLs
- **Frontend (Cloudflare Pages):** https://cdl-tutor.pages.dev
- **Custom Domain:** https://cdl-tutor.com (DNS: CNAME → cdl-tutor.pages.dev)
- **Backend API (Railway):** https://zestful-nature-production-3c43.up.railway.app

## Deploy Commands

### Frontend (Cloudflare Pages)
```bash
cd /root/.openclaw/workspace/products/cdl-tutor
CLOUDFLARE_API_KEY="cc9309fbb9919415aaf6b9a1aabc47d1fb4c4" CLOUDFLARE_EMAIL="nydamon@gmail.com" \
  wrangler pages deploy public --project-name cdl-tutor
```

### Backend (Railway)
```bash
cd /root/.openclaw/workspace/products/cdl-tutor
railway link --project cdl-tutor
railway up --service 70e1db8d-286c-413c-8383-19c3d36725d7
```

## File Structure
```
products/cdl-tutor/
├── public/              ← Static frontend (deployed to Cloudflare Pages)
│   ├── index.html       ← Main app
│   ├── style.css        ← All styles
│   ├── app.js           ← Frontend logic
│   ├── call.html        ← Voice session UI
│   ├── privacy-policy.html
│   └── terms-of-service.html
├── data/
│   ├── states.json      ← List of all 50 states
│   └── states/          ← State-specific question data
│       └── NJ.json      ← New Jersey (complete)
├── agents/
│   └── research-XX.md  ← Research tasks for each state
├── server.js            ← Express API server
├── index.js             ← Vercel serverless entry
└── vercel.json          ← Vercel config (legacy, using CF Pages now)
```

## Key Tasks

### Add State Data
1. Research using `agents/research-XX.md` template
2. Create `data/states/XX.json` (use NJ.json as reference)
3. Deploy frontend

### Add New Feature to Frontend
1. Edit `public/index.html`, `style.css`, `app.js`
2. Run deploy command above

### Add New API Endpoint
1. Edit `server.js`
2. Deploy to Railway

## Common Issues
- **Railway CLI loses project state** — Always use explicit `--service` flag
- **Cloudflare needs env vars set** — Use `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`
- **Vercel has deployment protection** — Don't use Vercel; use Cloudflare Pages
- **Custom domain 522 error** — Pages project needs custom domain added via CF dashboard

## Environment Variables (Railway/Vercel)
- `OPENAI_API_KEY` — GPT-4o for voice sessions
- `STRIPE_SECRET_KEY` — Payments
- `CLERK_SECRET_KEY` — Auth
- `CLERK_PUBLISHABLE_KEY` — Frontend auth

## MVP Launch Checklist
- [x] State selection UI
- [x] Pricing page ($9.99/mo, $79.99/yr)
- [x] Privacy Policy + Terms of Service
- [x] PWA manifest
- [x] Stripe checkout endpoint
- [x] NJ data (complete)
- [ ] All 50 states data
- [ ] Clerk auth fully wired
- [ ] Stripe webhooks for subscription management
- [ ] Email confirmation flow
