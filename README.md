# English AI Tutor — Step 2

A speaking-first English tutor. The browser handles microphone speech recognition and the Node.js backend sends the transcript to an AI model for feedback.

## Files

- `index.html` — speaking-only UI
- `server.js` — secure AI analysis endpoint
- `package.json` — Node.js dependencies and start command
- `.env.example` — environment-variable template
- `.gitignore` — prevents `.env` and dependencies from being committed

## Local setup

```bash
npm install
```

Create `.env` from `.env.example` and add your server-side API key:

```text
OPENAI_API_KEY=your_real_key_here
OPENAI_MODEL=gpt-5.5
```

Then:

```bash
npm start
```

Open the address shown by the server and allow microphone access.

## Important

Do not put the API key into `index.html`. The browser calls `/api/analyze`; only the server talks to the AI API.

The speech-recognition feature depends on browser support and microphone permission.
