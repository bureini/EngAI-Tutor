import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "128kb" }));
app.use(express.static("."));

/*
 * OpenRouter configuration
 *
 * IMPORTANT:
 * Keep the real API key in Render Environment Variables.
 * Do NOT put it in index.html or GitHub.
 */
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";

if (!OPENROUTER_API_KEY) {
  console.warn("WARNING: OPENROUTER_API_KEY is not configured.");
}

const client = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer":
      process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    "X-OpenRouter-Title":
      process.env.OPENROUTER_SITE_NAME || "English AI Tutor",
  },
});

/* =========================================================
   PROMPTS
   ========================================================= */

const systemPrompt = `
You are a warm, patient English speaking tutor.

Your job is to hold a natural conversation with an English learner.

Adapt to:
- the learner's level
- the current topic
- the learner's previous answers

Do not behave like a chatbot customer-service agent.
Speak like a supportive English teacher.

For every learner answer, evaluate:

- overall speaking quality
- fluency
- grammar
- vocabulary
- sentence structure
- pronunciation as an ESTIMATE only

Then provide:
- concise written feedback
- an optional natural correction
- useful mistakes/improvement points
- one practical practice tip
- a short spoken response
- a relevant follow-up question

Important:
A browser speech-to-text transcript cannot prove exact phoneme-level pronunciation.
Therefore pronunciation must be presented only as an estimate.

Return ONLY valid JSON.

{
  "overall": number,
  "fluency": number,
  "grammar": number,
  "vocabulary": number,
  "sentenceStructure": number,
  "pronunciation": number,
  "feedback": "short written feedback",
  "correction": "natural corrected version or empty string",
  "mistakes": ["short improvement point"],
  "advice": "one practical practice tip",
  "voiceResponse": "1-3 short spoken sentences ending with a relevant follow-up question"
}

Scores must be integers from 0 to 100.

Do not over-penalize beginners.
Never criticize the learner personally.
Keep feedback encouraging and useful.
Do not repeat the exact same question when a relevant follow-up is possible.
`;

const questionPrompt = `
You are an English speaking tutor.

Create the next natural follow-up question for an English learner.

Use:
- the learner's latest answers
- the current topic
- the learner's level
- the conversation history

The question must connect naturally to what the learner just said.

Keep it appropriate for the learner's level.

Do not ask for sensitive personal information.

Return ONLY valid JSON:

{
  "question": "one natural spoken question"
}
`;

/* =========================================================
   HELPERS
   ========================================================= */

function parseJson(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const match = cleaned.match(/\{[\s\S]*\}/);

  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  throw new Error("Model did not return valid JSON.");
}

function clamp(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(number)));
}

function historyText(history) {
  if (!Array.isArray(history)) {
    return "";
  }

  return history
    .slice(-8)
    .map((item) => {
      const role = item?.role || "unknown";
      const text = item?.text || "";
      return `${role}: ${text}`;
    })
    .join("\n");
}

function getModel() {
  return process.env.OPENROUTER_MODEL || "openrouter/free";
}

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    provider: "openrouter",
    configured: Boolean(OPENROUTER_API_KEY),
    model: getModel(),
  });
});

/* =========================================================
   AI CONVERSATION
   ========================================================= */

app.post("/api/conversation", async (req, res) => {
  try {
    const {
      answer,
      question,
      level = "Beginner",
      topic = "Daily Life",
      turn = 1,
      history = [],
    } = req.body || {};

    if (!answer || typeof answer !== "string") {
      return res.status(400).json({
        error: "Missing spoken answer.",
      });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({
        error: "OPENROUTER_API_KEY is not configured.",
      });
    }

    const input = `
Learner level:
${level}

Topic:
${topic}

Conversation turn:
${turn}

Current tutor question:
${question || ""}

Recent conversation:
${historyText(history)}

Latest learner answer:
${answer}

Analyze the learner's latest spoken answer.

Then continue the English conversation naturally.
`;

    const response = await client.chat.completions.create({
      model: getModel(),

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: input,
        },
      ],

      temperature: 0.3,
      max_tokens: 900,
    });

    const output =
      response?.choices?.[0]?.message?.content || "";

    const result = parseJson(output);

    result.overall = clamp(result.overall);
    result.fluency = clamp(result.fluency);
    result.grammar = clamp(result.grammar);
    result.vocabulary = clamp(result.vocabulary);
    result.sentenceStructure = clamp(result.sentenceStructure);
    result.pronunciation = clamp(result.pronunciation);

    result.feedback = String(
      result.feedback || "Good effort. Keep speaking."
    );

    result.correction = String(
      result.correction || ""
    );

    result.mistakes = Array.isArray(result.mistakes)
      ? result.mistakes.map(String)
      : [];

    result.advice = String(
      result.advice || "Keep practicing short English sentences aloud."
    );

    result.voiceResponse = String(
      result.voiceResponse ||
        result.feedback ||
        "Good effort. Keep speaking."
    );

    res.json(result);
  } catch (error) {
    console.error(
      "OpenRouter conversation error:",
      error?.message || error
    );

    res.status(500).json({
      error: "AI conversation unavailable.",
    });
  }
});

/* =========================================================
   NEXT QUESTION
   ========================================================= */

app.post("/api/next-question", async (req, res) => {
  try {
    const {
      topic = "Daily Life",
      level = "Beginner",
      currentQuestion = "",
      history = [],
      turn = 1,
    } = req.body || {};

    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({
        error: "OPENROUTER_API_KEY is not configured.",
      });
    }

    const input = `
Topic:
${topic}

Learner level:
${level}

Conversation turn:
${turn}

Previous tutor question:
${currentQuestion}

Recent conversation:
${historyText(history)}

Generate ONE natural follow-up question based on what the learner just said.
`;

    const response = await client.chat.completions.create({
      model: getModel(),

      messages: [
        {
          role: "system",
          content: questionPrompt,
        },
        {
          role: "user",
          content: input,
        },
      ],

      temperature: 0.5,
      max_tokens: 150,
    });

    const output =
      response?.choices?.[0]?.message?.content || "";

    const result = parseJson(output);

    const question = String(
      result.question ||
        "Can you tell me more about that?"
    );

    res.json({
      question,
    });
  } catch (error) {
    console.error(
      "OpenRouter next-question error:",
      error?.message || error
    );

    res.status(500).json({
      error: "Follow-up question unavailable.",
    });
  }
});

/* =========================================================
   PRONUNCIATION ANALYSIS
   ========================================================= */

app.post("/api/pronunciation", async (req, res) => {
  try {
    const {
      target,
      spoken,
      confidence = null,
      level = "Beginner",
    } = req.body || {};

    if (!target || !spoken) {
      return res.status(400).json({
        error: "Missing pronunciation text.",
      });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({
        error: "OPENROUTER_API_KEY is not configured.",
      });
    }

    const prompt = `
You are an English pronunciation practice coach.

Learner level:
${level}

Target sentence:
${target}

Speech recognition transcript:
${spoken}

Browser speech recognition confidence:
${confidence == null ? "unavailable" : confidence}

Evaluate the learner cautiously.

The transcript can help estimate:
- word matching
- clarity
- whether the learner probably followed the target sentence

But a transcript cannot prove exact phoneme pronunciation.

Return ONLY valid JSON:

{
  "score": number,
  "clarity": number,
  "feedbackTitle": "short encouraging title",
  "feedback": "short explanation",
  "focus": "one practical pronunciation focus"
}

Scores must be integers from 0 to 100.
Do not claim exact phoneme-level accuracy.
`;

    const response = await client.chat.completions.create({
      model: getModel(),

      messages: [
        {
          role: "system",
          content:
            "You are a careful and encouraging English pronunciation coach.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0.2,
      max_tokens: 400,
    });

    const output =
      response?.choices?.[0]?.message?.content || "";

    const result = parseJson(output);

    result.score = clamp(result.score);
    result.clarity = clamp(result.clarity);

    result.feedbackTitle = String(
      result.feedbackTitle || "Good practice"
    );

    result.feedback = String(
      result.feedback ||
        "Keep repeating the sentence slowly and clearly."
    );

    result.focus = String(
      result.focus ||
        "Focus on clear word endings and natural rhythm."
    );

    res.json(result);
  } catch (error) {
    console.error(
      "OpenRouter pronunciation error:",
      error?.message || error
    );

    res.status(500).json({
      error: "Pronunciation analysis unavailable.",
    });
  }
});

/* =========================================================
   START SERVER
   ========================================================= */

app.listen(port, () => {
  console.log(
    `English AI Tutor running on http://localhost:${port}`
  );

  console.log(
    `AI provider: OpenRouter`
  );

  console.log(
    `AI model: ${getModel()}`
  );

  console.log(
    `OpenRouter API key configured: ${Boolean(
      OPENROUTER_API_KEY
    )}`
  );
});