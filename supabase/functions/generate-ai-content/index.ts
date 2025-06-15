
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function hashObject(obj: Record<string, any>): string {
  // Simple deterministic hash for deduping (not crypto-secure)
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

  // Require type and user_id
  if (!type || !formInputs || !user_id) {
    return new Response(JSON.stringify({ error: "type, user_id, formInputs required" }), { status: 400, headers: corsHeaders });
  }
  if (!["proposal", "followup"].includes(type)) {
    return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: corsHeaders });
  }

  // Compose prompt as structured string
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

  // Check for deduplication in ai_usage_logs
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

  // Model selection logic
  let model = "gpt-4o-mini";
  if (plan === "pro" && prefer_gpt4o) model = "gpt-4o";

  let openaiRes, openaiTokens = 0, model_used = model, result_json = {};
  let openai_body = {
    model,
    messages: [
      { role: "system", content: system_prompt },
      { role: "user", content: user_prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens,
    temperature,
  };

  try {
    const openaiFetch = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(openai_body)
    });
    const openaiResult = await openaiFetch.json();
    // Handle OpenAI errors
    if (openaiResult.error) {
      throw new Error(openaiResult.error.message || "OpenAI API error");
    }
    openaiTokens = openaiResult.usage?.total_tokens || 0;
    result_json = JSON.parse(openaiResult.choices[0].message.content);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `AI generation failed: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Save to ai_usage_logs
  await supabase.from("ai_usage_logs").insert({
    user_id,
    type,
    model_used,
    input_hash,
    tokens_used: openaiTokens,
    result_json,
  });

  return new Response(
    JSON.stringify({ ...result_json, model, tokens_used: openaiTokens, deduped: false }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
