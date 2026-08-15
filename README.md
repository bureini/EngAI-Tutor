# English AI Tutor — Step 4D: Structured Lessons

Step 4D turns the speaking tutor into a structured English learning course.

## Included lessons

1. Introducing Yourself — Beginner
2. Daily Conversation — Beginner
3. Family & Friends — Beginner
4. Work & School — Elementary
5. Shopping — Elementary
6. Travel — Elementary
7. Food & Restaurants — Elementary
8. Health & Wellbeing — Intermediate
9. Job Interview — Advanced
10. Real-life Conversation — Advanced

Each lesson provides a focused topic, recommended level, starter questions, dynamic AI follow-ups, progress tracking, and a completion action.

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

Open the server URL and allow microphone access.

## Notes

Lesson completion and learning progress are stored locally in the browser for this prototype. The AI API key stays on the server.
