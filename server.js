import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app=express();
const port=process.env.PORT||3000;

app.use(express.json({limit:"64kb"}));
app.use(express.static("."));

if(!process.env.OPENAI_API_KEY) console.warn("WARNING: OPENAI_API_KEY is not configured.");
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});

const tutorInstructions=`
You are an expert, warm and encouraging English speaking tutor.
The learner is practicing spoken English. Analyze their answer and then create a short spoken tutor response that keeps the learner talking.

Return ONLY valid JSON:
{
  "overall": number,
  "fluency": number,
  "grammar": number,
  "vocabulary": number,
  "feedback": "short written feedback for the screen",
  "correction": "a corrected/natural version of the learner's answer, or empty string",
  "voiceResponse": "a natural 1-3 sentence response that the tutor can speak aloud and that encourages the learner to continue"
}

Scores must be integers from 0 to 100.
Adapt language to the learner's level.
Do not over-penalize short beginner answers.
Do not criticize the learner personally.
Keep voiceResponse conversational, encouraging and concise.
If a correction is useful, explain it simply.
The voiceResponse should normally include a short encouragement and one follow-up question.
`;

function parseJson(text){
 const cleaned=String(text||"").trim().replace(/^```json\\s*/i,"").replace(/```$/,"").trim();
 try{return JSON.parse(cleaned)}catch{}
 const match=cleaned.match(/\\{[\\s\\S]*\\}/);
 if(match)return JSON.parse(match[0]);
 throw new Error("Model did not return valid JSON");
}

app.post("/api/analyze",async(req,res)=>{
 try{
  const {answer,question,level="Beginner",topic="Daily Life"}=req.body||{};
  if(!answer||typeof answer!=="string")return res.status(400).json({error:"Missing spoken answer."});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:"OPENAI_API_KEY is not configured."});

  const prompt=`Learner level: ${level}
Topic: ${topic}
Question asked: ${question||""}
Learner spoken answer: ${answer}

Analyze the learner and respond as their speaking tutor.`;

  const response=await client.responses.create({
   model:process.env.OPENAI_MODEL||"gpt-5.5",
   instructions:tutorInstructions,
   input:prompt
  });

  const result=parseJson(response.output_text);
  for(const key of ["overall","fluency","grammar","vocabulary"])
   result[key]=Math.max(0,Math.min(100,Math.round(Number(result[key])||0)));

  result.feedback=String(result.feedback||"Good effort. Keep practicing.");
  result.correction=String(result.correction||"");
  result.voiceResponse=String(result.voiceResponse||result.feedback);
  res.json(result);
 }catch(error){
  console.error("AI analysis error:",error?.message||error);
  res.status(500).json({error:"AI analysis unavailable."});
 }
});

app.listen(port,()=>console.log(`English AI Tutor Step 3 running on http://localhost:${port}`));
