# English AI Tutor — Step 4A: Dynamic Conversations

This version keeps the speaking-only UI and changes the lesson flow from fixed questions to adaptive AI conversation.

## Flow

Tutor asks a question → learner speaks → AI analyzes the answer → tutor speaks a personalized response → AI generates a relevant follow-up question → learner continues.

The recent conversation is sent to the backend so follow-up questions can be connected to what the learner actually said.

## Setup

```bash
npm install
```

Create `.env`:

```text
OPENAI_API_KEY=your_real_key_here
OPENAI_MODEL=gpt-5.5
```

Then:

```bash
npm start
```

Open the server URL and allow microphone access.

The API key is server-side only. Do not put it in `index.html`.

Speech recognition and browser text-to-speech depend on browser support and permissions.
