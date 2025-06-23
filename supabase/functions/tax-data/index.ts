
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHATGPT_API_KEY = Deno.env.get("CHATGPT_API_KEY");
const GITHUB_AI_ENDPOINT = "https://models.github.ai/inference";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();
    
    const currentYear = new Date().getFullYear();
    const financialYear = `${currentYear}-${currentYear + 1}`;
    
    let prompt = "";
    
    if (type === "tips") {
      prompt = `Generate 4 current and relevant tax tips for Indian freelancers for financial year ${financialYear}. 
      Include specific sections like 44ADA, current rates, and practical advice. 
      Format as JSON array with objects having 'title', 'description', and 'type' (success/warning/info/error).
      Make it specific to current Indian tax laws and rates.`;
    } else if (type === "dates") {
      prompt = `Generate important tax dates for Indian freelancers for financial year ${financialYear}. 
      Include advance tax dates, ITR filing deadlines, and other relevant dates.
      Format as JSON array with objects having 'date' (in format like "15 June") and 'event' description.
      Make sure dates are current and accurate for FY ${financialYear}.`;
    }

    const response = await fetch(`${GITHUB_AI_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CHATGPT_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { 
            role: "system", 
            content: "You are a tax expert for Indian freelancers. Provide accurate, current tax information. Always respond with valid JSON format." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 800,
        model: "gpt-4.1-2025-04-14",
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error("Failed to fetch tax data");
    }

    let content = data.choices[0]?.message?.content || "[]";
    
    try {
      const parsedContent = JSON.parse(content);
      return new Response(JSON.stringify({ 
        data: parsedContent,
        financialYear: financialYear
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (parseError) {
      // If JSON parsing fails, return fallback data
      const fallbackData = type === "tips" ? [
        {
          title: "Section 44ADA Benefits",
          description: `For FY ${financialYear}, if your income is below ₹50 lakhs, you can declare 50% as profit and pay tax only on that amount.`,
          type: "success"
        },
        {
          title: "Quarterly Advance Tax",
          description: "Pay advance tax by 15th June, Sept, Dec, and March to avoid interest charges.",
          type: "warning"
        },
        {
          title: "Business Expenses",
          description: "Deduct laptop, software, internet, co-working space, and training costs.",
          type: "info"
        },
        {
          title: "Professional Tax",
          description: "Don't forget to pay professional tax in states like Maharashtra, West Bengal, etc.",
          type: "error"
        }
      ] : [
        { date: "15 June", event: "Q1 Advance Tax Due" },
        { date: "15 September", event: "Q2 Advance Tax Due" },
        { date: "15 December", event: "Q3 Advance Tax Due" },
        { date: "15 March", event: "Q4 Advance Tax Due" },
        { date: "31 July", event: "ITR Filing Due Date" }
      ];
      
      return new Response(JSON.stringify({ 
        data: fallbackData,
        financialYear: financialYear
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (error) {
    console.error("Tax data error:", error);
    
    // Return fallback data in case of error
    const currentYear = new Date().getFullYear();
    const financialYear = `${currentYear}-${currentYear + 1}`;
    
    return new Response(JSON.stringify({ 
      data: [],
      financialYear: financialYear,
      error: "Failed to fetch dynamic data"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
