# English AI Tutor — OpenRouter Integration

This version routes the tutor's server-side AI requests through OpenRouter.

## Environment

```text
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=openrouter/free
OPENROUTER_SITE_URL=https://your-domain.example
OPENROUTER_SITE_NAME=English AI Tutor
```

**Never put the real key in `index.html`, a mobile app, GitHub, or other client-side code.**

## How it works

```text
Browser / Mobile App
        ↓
     server.js
        ↓
 OpenRouter API
        ↓
     AI model
```

The server uses the OpenAI JavaScript SDK pointed at OpenRouter's OpenAI-compatible base URL.

## Local test

```bash
npm install
cp .env.example .env
# Edit .env and add your real OpenRouter key
npm start
```

Then test:
- AI conversation
- English evaluation
- Dynamic follow-up questions
- Pronunciation analysis

## Render

In the Render service Environment settings, add:

```text
OPENROUTER_API_KEY=your_real_key
OPENROUTER_MODEL=openrouter/free
```

Do not commit `.env` or the real key to GitHub.

## Model switching

Change only `OPENROUTER_MODEL` to another OpenRouter model slug when desired. OpenRouter exposes its current model catalog through `/api/v1/models`.

The free router is useful for initial testing, but model availability and free-model limits can change. For production, choose a specific model after testing quality, latency, and cost.
