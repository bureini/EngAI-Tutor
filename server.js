import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app=express();
const port=process.env.PORT||3000;

app.use(express.json({limit:"128kb"}));
app.use(express.static("."));

if(!process.env.OPENAI_API_KEY) console.warn("WARNING: OPENAI_API_KEY is not configured.");
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});

const evaluationPrompt=`
You are an expert English speaking tutor and language coach.
Evaluate the learner's latest spoken English answer while preserving a natural conversation.

Return ONLY valid JSON:
{
  "overall": number,
  "fluency": number,
  "grammar": number,
  "vocabulary": number,
  "sentenceStructure": number,
  "pronunciation": number,
  "feedback": "short encouraging feedback",
  "correction": "natural corrected version or empty string",
  "mistakes": ["specific issue 1", "specific issue 2"],
  "advice": "one practical practice tip",
  "voiceResponse": "1-3 natural spoken sentences that acknowledge the answer and ask a relevant follow-up question"
}

All scores must be integers from 0 to 100.
Adapt the scoring and language to the learner's level.
Do not over-penalize beginners or short answers.
Only list meaningful mistakes. If there are no important mistakes, return an empty mistakes array.
Do not invent pronunciation errors that cannot be supported by the available speech/transcription evidence.
For pronunciation, use a cautious estimated score based on speech-recognition confidence or clarity signals supplied by the application. It must not be presented as a clinical or phonetic measurement.
Do not criticize the learner personally.
Keep voiceResponse conversational and concise.
`;

const questionPrompt=`
Create the next natural follow-up question for an English learner.
Use the learner's latest answer, topic, level, and conversation history.
The question should connect directly to what the learner said.
Return ONLY valid JSON: {"question":"one natural spoken question"}
`;

function parseJson(text){
 const cleaned=String(text||"").trim().replace(/^```json\\s*/i,"").replace(/```$/,"").trim();
 try{return JSON.parse(cleaned)}catch{}
 const match=cleaned.match(/\\{[\\s\\S]*\\}/);
 if(match)return JSON.parse(match[0]);
 throw new Error("Model did not return valid JSON");
}
function clamp(n){return Math.max(0,Math.min(100,Math.round(Number(n)||0)))}
function historyText(history){
 return Array.isArray(history)?history.slice(-8).map(x=>`${x.role}: ${x.text}`).join("\n"):"";
}

app.post("/api/conversation",async(req,res)=>{
 try{
  const {answer,question,lesson="",level="Beginner",topic="Daily Life",turn=1,history=[],speechConfidence=null}=req.body||{};
  if(!answer||typeof answer!=="string")return res.status(400).json({error:"Missing spoken answer."});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured."});

  const confidenceLine=speechConfidence==null?"Speech confidence: unavailable":`Speech recognition confidence: ${Number(speechConfidence).toFixed(2)}`;
  const input=`Learner level: ${level}
Lesson: ${lesson}
Topic: ${topic}
Conversation turn: ${turn}
Current tutor question: ${question||""}
${confidenceLine}

Recent conversation:
${historyText(history)}

Latest learner answer:
${answer}

Evaluate the learner carefully and then continue the conversation.`;

  const response=await client.responses.create({
   model:process.env.OPENAI_MODEL||"gpt-5.5",
   instructions:evaluationPrompt,
   input
  });
  const result=parseJson(response.output_text);

  for(const k of ["overall","fluency","grammar","vocabulary","sentenceStructure","pronunciation"])
    result[k]=clamp(result[k]);

  // If browser confidence is available, blend a small amount into pronunciation rather than
  // pretending the transcript alone proves pronunciation accuracy.
  if(Number.isFinite(Number(speechConfidence))){
    const c=Math.max(0,Math.min(1,Number(speechConfidence)));
    const confidenceScore=Math.round(c*100);
    result.pronunciation=clamp(Math.round(result.pronunciation*0.75+confidenceScore*0.25));
  }

  result.feedback=String(result.feedback||"Good effort. Keep speaking.");
  result.correction=String(result.correction||"");
  result.advice=String(result.advice||"Keep practicing complete sentences.");
  result.voiceResponse=String(result.voiceResponse||result.feedback);
  result.mistakes=Array.isArray(result.mistakes)?result.mistakes.map(String).slice(0,4):[];
  res.json(result);
 }catch(error){
  console.error("Evaluation error:",error?.message||error);
  res.status(500).json({error:"AI evaluation unavailable."});
 }
});


app.post("/api/pronunciation",async(req,res)=>{
 try{
  const {target,spoken,confidence=null,level="Beginner"}=req.body||{};
  if(!target||!spoken)return res.status(400).json({error:"Missing pronunciation text."});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured."});
  const input=`Learner level: ${level}
Target sentence: ${target}
Speech recognition transcript: ${spoken}
Browser confidence: ${confidence==null?"unavailable":confidence}

Return ONLY JSON:
{"score":number,"clarity":number,"feedbackTitle":"short title","feedback":"short encouraging explanation","focus":"one practical pronunciation focus"}
Scores 0-100. Be cautious: transcript evidence cannot prove exact phoneme pronunciation.`;
  const response=await client.responses.create({model:process.env.OPENAI_MODEL||"gpt-5.5",instructions:"You are a careful English pronunciation coach. Never claim precise phonetic evidence that is unavailable.",input});
  const result=parseJson(response.output_text);
  result.score=Math.max(0,Math.min(100,Math.round(Number(result.score)||0)));
  result.clarity=Math.max(0,Math.min(100,Math.round(Number(result.clarity)||0)));
  result.feedbackTitle=String(result.feedbackTitle||"Good practice");
  result.feedback=String(result.feedback||"Keep repeating the sentence slowly and clearly.");
  result.focus=String(result.focus||"Focus on clear word endings and natural rhythm.");
  res.json(result);
 }catch(error){console.error("Pronunciation error:",error?.message||error);res.status(500).json({error:"Pronunciation analysis unavailable."})}
});

app.post("/api/next-question",async(req,res)=>{
 try{
  const {topic="Daily Life",lesson="",level="Beginner",currentQuestion="",history=[],turn=1}=req.body||{};
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured."});

  const input=`Lesson: ${lesson}
Topic: ${topic}
Learner level: ${level}
Conversation turn: ${turn}
Previous tutor question: ${currentQuestion}
Recent conversation:
${historyText(history)}

Generate one relevant follow-up question based on what the learner just said.`;

  const response=await client.responses.create({
   model:process.env.OPENAI_MODEL||"gpt-5.5",
   instructions:questionPrompt,
   input
  });
  const result=parseJson(response.output_text);
  res.json({question:String(result.question||"Can you tell me more about that?")});
 }catch(error){
  console.error("Next-question error:",error?.message||error);
  res.status(500).json({error:"Follow-up question unavailable."});
 }
});

app.listen(port,()=>console.log(`English AI Tutor Step 4B running on http://localhost:${port}`));
