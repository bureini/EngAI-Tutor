# English AI Tutor — Step 4B: Advanced English Evaluation

Step 4B builds on dynamic conversations and adds richer evaluation after every spoken answer.

## Evaluation

- Overall
- Fluency
- Grammar
- Vocabulary
- Sentence structure
- Pronunciation estimate
- Specific improvement points
- Natural correction
- Personalized practice tip

Pronunciation is intentionally labeled as an estimate. A normal speech-to-text transcript cannot prove exact phoneme-level pronunciation accuracy.

## Flow

Tutor asks → learner speaks → AI evaluates → feedback appears → tutor speaks → AI generates a relevant follow-up.

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

Then open the local server URL and allow microphone access.

Never put the API key in `index.html`.
