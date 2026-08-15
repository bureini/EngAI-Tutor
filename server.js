import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app=express();
const port=process.env.PORT||3000;

app.use(express.json({limit:"128kb"}));
app.use(express.static("."));

if(!process.env.OPENAI_API_KEY) console.warn("WARNING: OPENAI_API_KEY is not configured.");
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});

const systemPrompt=`
You are a warm, patient English speaking tutor.
Your job is to hold a natural conversation with an English learner.
Adapt to the learner's level and the current topic.
Do not behave like a chatbot customer-service agent. Speak like a supportive teacher.

For every learner answer, evaluate:
- overall speaking quality
- fluency
- grammar
- vocabulary

Then give concise written feedback, an optional natural correction, and a short spoken response that acknowledges what the learner said and asks a relevant follow-up question.

Return ONLY valid JSON:
{
 "overall": number,
 "fluency": number,
 "grammar": number,
 "vocabulary": number,
 "feedback": "short written feedback",
 "correction": "natural corrected version or empty string",
 "voiceResponse": "1-3 short spoken sentences, ending with a relevant follow-up question"
}

Scores are integers from 0 to 100.
Do not over-penalize beginners.
Never criticize the learner personally.
Do not repeat the exact same question if a relevant follow-up is possible.
`;

const questionPrompt=`
Create the next natural follow-up question for an English learner.
Use the learner's latest answers and the topic.
The question should connect directly to what the learner just said.
Keep it suitable for the learner's level.
Do not ask about sensitive personal information.
Return ONLY valid JSON:
{"question":"one natural spoken question"}
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
  const {answer,question,level="Beginner",topic="Daily Life",turn=1,history=[]}=req.body||{};
  if(!answer||typeof answer!=="string")return res.status(400).json({error:"Missing spoken answer."});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured."});

  const input=`Learner level: ${level}
Topic: ${topic}
Conversation turn: ${turn}
Current tutor question: ${question||""}
Recent conversation:
${historyText(history)}

Latest learner answer:
${answer}

Analyze the latest answer and continue the conversation naturally.`;

  const response=await client.responses.create({
   model:process.env.OPENAI_MODEL||"gpt-5.5",
   instructions:systemPrompt,
   input
  });
  const result=parseJson(response.output_text);
  for(const k of ["overall","fluency","grammar","vocabulary"])result[k]=clamp(result[k]);
  result.feedback=String(result.feedback||"Good effort. Keep speaking.");
  result.correction=String(result.correction||"");
  result.voiceResponse=String(result.voiceResponse||result.feedback);
  res.json(result);
 }catch(error){
  console.error("Conversation error:",error?.message||error);
  res.status(500).json({error:"AI conversation unavailable."});
 }
});

app.post("/api/next-question",async(req,res)=>{
 try{
  const {topic="Daily Life",level="Beginner",currentQuestion="",history=[],turn=1}=req.body||{};
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured."});

  const input=`Topic: ${topic}
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
  const question=String(result.question||"Can you tell me more about that?");
  res.json({question});
 }catch(error){
  console.error("Next-question error:",error?.message||error);
  res.status(500).json({error:"Follow-up question unavailable."});
 }
});

app.listen(port,()=>console.log(`English AI Tutor Step 4A running on http://localhost:${port}`));
