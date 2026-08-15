# English AI Tutor — Step 3: Voice Tutor

Step 3 keeps the approved speaking-only UI and adds spoken AI tutor responses.

## Flow

1. Learner taps the microphone.
2. Browser speech recognition transcribes the learner.
3. Server sends the transcript to the AI model.
4. AI returns scores, feedback, a correction, and a conversational voice response.
5. Browser speaks the tutor response aloud.
6. Learner can replay the feedback or continue to the next speaking question.

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

Open the local server URL and allow microphone access.

The API key stays on the server. It is never placed in the HTML.

Speech recognition and browser text-to-speech depend on browser support and permissions.
