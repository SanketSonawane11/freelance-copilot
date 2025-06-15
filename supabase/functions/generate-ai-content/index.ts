
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CHATGPT_API_KEY = Deno.env.get("CHATGPT_API_KEY"); // This is your provided token

const GITHUB_AI_ENDPOINT = "https://models.github.ai/inference";
const GITHUB_AI_MODEL = "openai/gpt-4.1";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function hashObject(obj: Record<string, any>): string {
  return btoa(JSON.stringify(obj)).slice(0, 32);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let params: any;
  try {
    params = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: corsHeaders });
  }
  const { type, formInputs, plan = "starter", prefer_gpt4o = false, user_id } = params;

  if (!type || !formInputs || !user_id) {
    return new Response(JSON.stringify({ error: "type, user_id, formInputs required" }), { status: 400, headers: corsHeaders });
  }
  if (!["proposal", "followup"].includes(type)) {
    return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: corsHeaders });
  }

  let system_prompt = "";
  let user_prompt = "";
  let temperature = 0.6;
  let max_tokens = plan === "pro" ? (prefer_gpt4o ? 500 : 400) : 300;
  let tone = formInputs.tone;

  if (type === "proposal") {
    system_prompt = plan === "pro"
      ? "You are an expert freelance proposal generator. Write concise, impactful, and persuasive proposals for Indian freelancers, tailored to client, project type, and user-given tone. Format output as JSON {\"proposal\": ...}."
      : "You generate short, clear, professional proposals for freelancers. Output as JSON {\"proposal\": ...}.";
    user_prompt = `Client: ${formInputs.clientInfo || ""}
Type: ${formInputs.projectType || ""}
Req: ${formInputs.projectDetails || ""}
${formInputs.budget ? `Budget: ${formInputs.budget}` : ""}
${formInputs.timeline ? `Timeline: ${formInputs.timeline}` : ""}
Tone: ${tone || "Professional"}`;
  } else {
    system_prompt = plan === "pro"
      ? "You are an expert at writing polite, assertive, and contextual follow-up messages between Indian freelancers and clients. Given input, write a follow-up, preserving professionalism and matching tone & urgency. Output as JSON {\"followup\": ...}."
      : "Generate a short, gentle client follow-up. Output as JSON {\"followup\": ...}.";
    user_prompt = `Client: ${formInputs.clientName || ""}
Project/Proposal: ${formInputs.projectTitle || ""}
Last contact: ${formInputs.lastContact || ""}
Reason: ${formInputs.followUpReason || ""}
Tone: ${tone || "Polite"}
Urgency: ${formInputs.urgency || "Medium"}`;
  }

  const input_obj = { type, plan, formInputs, system_prompt, user_prompt, tone, max_tokens };
  const input_hash = hashObject(input_obj);

  // Dedupe
  let { data: prev, error: prevErr } = await supabase
    .from("ai_usage_logs")
    .select("result_json, model_used, tokens_used")
    .eq("input_hash", input_hash)
    .eq("type", type)
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (prev) {
    return new Response(
      JSON.stringify({ ...prev.result_json, model: prev.model_used, tokens_used: prev.tokens_used, deduped: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Prepare the request to the GitHub AI endpoint
  let result_json = {};
  let tokens_used = 0;
  let model_used = GITHUB_AI_MODEL;
  let errorMsg = "";

  try {
    // Use fetch to hit the endpoint similar to the provided Azure SDK usage
    const response = await fetch(`${GITHUB_AI_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CHATGPT_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: user_prompt },
        ],
        temperature,
        top_p: 1,
        model: GITHUB_AI_MODEL,
        max_tokens,
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();

    // Response error handling (following pattern: if isUnexpected / has error field)
    if (!response.ok || (data?.error && !data?.choices)) {
      errorMsg = data?.error?.message || data?.error || "ChatGPT API error";
      throw new Error(errorMsg);
    }

    // The format should include choices[0].message.content, like OpenAI/OpenRouter
    let content = data.choices && data.choices[0]?.message?.content
      ? data.choices[0].message.content
      : (typeof data === "string" ? data : "");

    tokens_used = data.usage?.total_tokens || 0;

    // Try parsing as JSON (per prompt)
    try {
      result_json = JSON.parse(content);
    } catch {
      result_json = { proposal: content };
    }

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `AI generation failed: ${err?.message || errorMsg || "unknown error"}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Save usage log
  await supabase.from("ai_usage_logs").insert({
    user_id,
    type,
    model_used,
    input_hash,
    tokens_used,
    result_json,
  });

  return new Response(
    JSON.stringify({ ...result_json, model: model_used, tokens_used, deduped: false }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
