import "dotenv/config";
import express from "express";
import OpenAI from "openai";

const app=express();
const port=process.env.PORT||3000;

app.use(express.json({limit:"64kb"}));
app.use(express.static("."));

if(!process.env.OPENAI_API_KEY){
  console.warn("WARNING: OPENAI_API_KEY is not configured.");
}

const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});

const tutorInstructions=`
You are an expert, encouraging English speaking tutor.
Analyze a learner's spoken English answer.
Return ONLY valid JSON:
{
  "overall": number,
  "fluency": number,
  "grammar": number,
  "vocabulary": number,
  "feedback": "short encouraging feedback",
  "correction": "a corrected and more natural version, or empty string if no correction is needed"
}
Scores must be integers from 0 to 100.
Adapt feedback to the learner's level.
Do not over-penalize short beginner answers.
Focus on grammar, vocabulary, fluency, clarity, and natural English.
Never criticize the learner personally.
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
Practice topic: ${topic}
Question: ${question||""}
Learner spoken answer: ${answer}

Evaluate this answer as an English speaking tutor.`;

    const response=await client.responses.create({
      model:process.env.OPENAI_MODEL||"gpt-5.5",
      instructions:tutorInstructions,
      input:prompt
    });

    const result=parseJson(response.output_text);
    for(const key of ["overall","fluency","grammar","vocabulary"]){
      result[key]=Math.max(0,Math.min(100,Math.round(Number(result[key])||0)));
    }
    result.feedback=String(result.feedback||"Good effort. Keep practicing.");
    result.correction=String(result.correction||"");
    res.json(result);
  }catch(error){
    console.error("AI analysis error:",error?.message||error);
    res.status(500).json({error:"AI analysis unavailable."});
  }
});

app.listen(port,()=>console.log(`English AI Tutor running on http://localhost:${port}`));
