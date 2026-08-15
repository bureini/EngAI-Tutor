# English AI Tutor — Step 4C: Learning Progress

Step 4C adds local learner progress tracking to the speaking tutor.

## What is tracked

After each completed speaking answer, the app stores locally:

- session count
- answer count
- overall score
- fluency
- grammar
- vocabulary
- sentence structure
- pronunciation estimate
- topic, level and question
- date/time

The app displays a compact progress dashboard with average scores and a personalized progress tip.

## Privacy

Progress is stored in the browser's `localStorage` on the device. It is not sent to the AI server as a separate profile database.

The **Clear** button removes the saved progress from that browser/device.

## Setup

```bash
npm install
```

Create `.env`:

```text
OPENAI_API_KEY=your_real_key_here
OPENAI_MODEL=gpt-5.5
```

Run:

```bash
npm start
```

Then open the server URL and allow microphone access.

## Next stage

A future version can replace localStorage with a real account/database system for cross-device progress and richer analytics.
