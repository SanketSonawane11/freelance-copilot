
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let params: any;
  try {
    params = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid payload" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
  const { type, formInputs, plan = "starter", prefer_gpt4o = false, user_id } = params;

  if (!type || !formInputs || !user_id) {
    return new Response(JSON.stringify({ error: "type, user_id, formInputs required" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
  if (!["proposal", "followup"].includes(type)) {
    return new Response(JSON.stringify({ error: "Invalid type" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  let system_prompt = "";
  let user_prompt = "";
  let temperature = 0.6;
  let max_tokens = plan === "pro" ? (prefer_gpt4o ? 500 : 400) : 300;
  let tone = formInputs.tone;

  if (type === "proposal") {
    system_prompt = plan === "pro"
      ? "You are an expert freelance proposal generator. Write concise, impactful, and persuasive proposals for Indian freelancers, tailored to client, project type, and user-given tone. Write clean, professional text without JSON formatting or special characters. Format the proposal as readable text with proper paragraphs and structure."
      : "You generate short, clear, professional proposals for freelancers. Write clean, readable text without JSON formatting. Use proper paragraphs and professional structure.";
    user_prompt = `Client: ${formInputs.clientInfo || ""}
Type: ${formInputs.projectType || ""}
Requirements: ${formInputs.projectDetails || ""}
${formInputs.budget ? `Budget: ${formInputs.budget}` : ""}
${formInputs.timeline ? `Timeline: ${formInputs.timeline}` : ""}
Tone: ${tone || "Professional"}

Write a professional proposal that addresses these requirements. Use clear paragraphs and professional language. Do not use JSON format.`;
  } else {
    system_prompt = plan === "pro"
      ? "You are an expert at writing polite, assertive, and contextual follow-up messages between Indian freelancers and clients. Write clean, readable text without JSON formatting. Use proper email/message structure."
      : "Generate a short, gentle client follow-up. Write clean, readable text without JSON formatting.";
    user_prompt = `Client: ${formInputs.clientName || ""}
Project/Proposal: ${formInputs.projectTitle || ""}
Last contact: ${formInputs.lastContact || ""}
Reason: ${formInputs.followUpReason || ""}
Tone: ${tone || "Polite"}
Urgency: ${formInputs.urgency || "Medium"}

Write a professional follow-up message. Use clear, readable text without JSON formatting.`;
  }

  // Generate new content without caching
  let result_content = "";
  let tokens_used = 0;
  let model_used = "gpt-4o-mini";
  let errorMsg = "";

  try {
    console.log("Calling OpenAI API with model:", model_used);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model_used,
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_prompt },
        ],
        temperature,
        max_tokens,
      }),
    });

    console.log("OpenAI API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", errorText);
      errorMsg = `OpenAI API error: ${response.status} - ${errorText}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log("OpenAI API response:", JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0]?.message?.content) {
      errorMsg = "Invalid response from OpenAI API";
      throw new Error(errorMsg);
    }

    // Extract content from response
    let content = data.choices[0].message.content;
    tokens_used = data.usage?.total_tokens || 0;
    result_content = content.trim();

    console.log("Generated content length:", result_content.length);

  } catch (err: any) {
    console.error("AI generation error:", err);
    return new Response(
      JSON.stringify({ error: `AI generation failed: ${err?.message || errorMsg || "unknown error"}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Save usage log (without deduplication)
  try {
    await supabase.from("ai_usage_logs").insert({
      user_id,
      type,
      model_used,
      tokens_used,
      result_json: { content: result_content },
    });
  } catch (logError) {
    console.error("Failed to save usage log:", logError);
  }

  return new Response(
    JSON.stringify({ 
      content: result_content,
      model: model_used, 
      tokens_used, 
      deduped: false 
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
