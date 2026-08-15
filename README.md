# English AI Tutor — Step 4E: Pronunciation & Speaking Analysis

Adds a dedicated pronunciation practice mode: hear a target sentence, repeat it, compare the transcript with the target, and receive a cautious AI clarity/pronunciation estimate plus one practice tip.

Pronunciation is explicitly an estimate; browser speech-to-text cannot reliably provide exact phoneme-level or clinical pronunciation measurement.

## Setup
```bash
npm install
```
Create `.env` with:
```text
OPENAI_API_KEY=your_real_key_here
OPENAI_MODEL=gpt-5.5
```
Then run:
```bash
npm start
```
Never put the API key in `index.html`.
