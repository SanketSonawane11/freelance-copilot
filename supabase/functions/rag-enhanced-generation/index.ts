import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

// Model fallback hierarchy - ordered by rate limits (most generous first)
const MODELS = [
  { name: 'gemini-1.5-flash', maxTokens: 1500 },
  { name: 'gemini-1.0-pro', maxTokens: 1200 },
] as const;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiWithFallback(prompt: string, plan: string, retryCount = 0): Promise<{ content: string; model: string; tokenCount: number }> {
  
  for (const modelConfig of MODELS) {
    try {
      console.log(`RAG: Attempting generation with model: ${modelConfig.name}`);
      
      const maxTokens = plan === "pro" ? modelConfig.maxTokens : Math.min(modelConfig.maxTokens, 1000);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.name}:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: modelConfig.name === 'gemini-1.0-pro' ? 0.7 : undefined,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`RAG: Model ${modelConfig.name} failed with status ${response.status}:`, errorText);
        
        // If it's a 429 error, try exponential backoff on the first model only
        if (response.status === 429 && modelConfig === MODELS[0] && retryCount < 2) {
          const backoffTime = Math.pow(2, retryCount) * 6000; // 6s, 12s
          console.log(`RAG: Rate limited, retrying in ${backoffTime}ms...`);
          await sleep(backoffTime);
          return callGeminiWithFallback(prompt, plan, retryCount + 1);
        }
        
        // Continue to next model if current one fails
        continue;
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        console.log(`RAG: Model ${modelConfig.name} returned invalid response format`);
        continue;
      }

      const content = data.candidates[0].content.parts[0].text.trim();
      const tokenCount = data.usageMetadata?.totalTokenCount || 0;
      
      return {
        content,
        model: modelConfig.name,
        tokenCount
      };
      
    } catch (error: any) {
      console.log(`RAG: Model ${modelConfig.name} failed with error:`, error.message);
      continue;
    }
  }
  
  // If all models fail, throw error
  throw new Error('All Gemini models are currently unavailable. Please try again in a few minutes.');
}

interface RagRequest {
  type: 'proposal' | 'followup' | 'invoice';
  formInputs: any;
  client_id?: string;
  project_id?: string;
  plan: string;
  user_id: string;
  prefer_gpt4o?: boolean;
}

interface VectorChunk {
  chunk_text: string;
  type: string;
  created_at: string;
}

interface ProjectSummary {
  summary_text: string;
}

// Text chunking utility
function chunkText(text: string, maxChunkSize: number = 300): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + (currentChunk.endsWith('.') ? '' : '.'));
  }

  return chunks.filter(chunk => chunk.length > 20); // Filter out very short chunks
}

// Generate embeddings using Gemini
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'models/text-embedding-004',
      content: {
        parts: [{
          text: text
        }]
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

// Search for similar content
async function searchSimilarContent(
  supabase: any,
  queryEmbedding: number[],
  userId: string,
  projectId?: string,
  limit: number = 5
): Promise<VectorChunk[]> {
  let query = supabase
    .from('vector_chunks_metadata')
    .select('chunk_text, type, created_at')
    .eq('user_id', userId);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  // Use RPC for vector similarity search
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
    user_id_param: userId,
    project_id_param: projectId
  });

  if (error && error.code !== 'PGRST116') { // PGRST116 = function doesn't exist
    console.error('Vector search error:', error);
  }

  // Fallback to simple search if RPC doesn't exist
  if (!data || error?.code === 'PGRST116') {
    const { data: fallbackData, error: fallbackError } = await query.limit(limit);
    if (fallbackError) {
      console.error('Fallback search error:', fallbackError);
      return [];
    }
    return fallbackData || [];
  }

  return data || [];
}

// Get project summary
async function getProjectSummary(
  supabase: any,
  userId: string,
  projectId?: string
): Promise<string | null> {
  if (!projectId) return null;

  const { data, error } = await supabase
    .from('project_summaries')
    .select('summary_text')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching project summary:', error);
    return null;
  }

  return data?.summary_text || null;
}

// Store generated content as chunks
async function storeContentChunks(
  supabase: any,
  userId: string,
  clientId: string,
  projectId: string,
  content: string,
  type: string,
  sourceId?: string
) {
  try {
    const chunks = chunkText(content);
    
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      
      const { error } = await supabase
        .from('vector_chunks_metadata')
        .insert({
          user_id: userId,
          client_id: clientId,
          project_id: projectId,
          chunk_text: chunk,
          embedding: embedding,
          type: type,
          source_id: sourceId
        });

      if (error) {
        console.error('Error storing chunk:', error);
      }
    }
  } catch (error) {
    console.error('Error in storeContentChunks:', error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const requestData: RagRequest = await req.json();
    const { type, formInputs, client_id, project_id, plan, user_id, prefer_gpt4o } = requestData;

    console.log(`RAG generation request: type=${type}, user=${user_id}, project=${project_id}`);

    // Step 1: Get project summary
    const projectSummary = await getProjectSummary(supabase, user_id, project_id);

    // Step 2: Generate query embedding for similarity search
    let searchQuery = '';
    if (type === 'proposal') {
      searchQuery = `${formInputs.projectDesc} ${formInputs.clientName} proposal`;
    } else if (type === 'followup') {
      searchQuery = `${formInputs.projectTitle} ${formInputs.clientName} ${formInputs.followUpReason}`;
    } else if (type === 'invoice') {
      searchQuery = `${formInputs.clientName} invoice billing`;
    }

    let relevantChunks: VectorChunk[] = [];
    if (searchQuery && geminiApiKey) {
      try {
        const queryEmbedding = await generateEmbedding(searchQuery);
        relevantChunks = await searchSimilarContent(supabase, queryEmbedding, user_id, project_id);
      } catch (error) {
        console.error('Error in similarity search:', error);
      }
    }

    // Step 3: Build enhanced prompt with context (Gemini format - single prompt)
    let combinedPrompt = '';

    const contextSection = [];
    if (projectSummary) {
      contextSection.push(`PROJECT CONTEXT: ${projectSummary}`);
    }
    if (relevantChunks.length > 0) {
      const pastContent = relevantChunks
        .map((chunk, i) => `${i + 1}. [${chunk.type}] ${chunk.chunk_text}`)
        .join('\n');
      contextSection.push(`PAST INTERACTIONS:\n${pastContent}`);
    }

    const contextText = contextSection.length > 0 
      ? `\n\nCONTEXT:\n${contextSection.join('\n\n')}\n\nPlease use this context to maintain continuity and reference past work when relevant.`
      : '';

    if (type === 'proposal') {
      const systemContext = `You are an expert freelancer writing compelling project proposals. Write professional, persuasive proposals that highlight value and build client confidence.${contextText}`;
      combinedPrompt = `${systemContext}

Write a professional project proposal for:
- Client: ${formInputs.clientName}
- Project: ${formInputs.projectDesc}
- Tone: ${formInputs.tone}
- Timeline: ${formInputs.timeline}
- Budget: ${formInputs.budget}`;
    } else if (type === 'followup') {
      const systemContext = `You are an expert at writing client follow-up messages. Create effective, professional follow-ups that maintain relationships and move projects forward.${contextText}`;
      combinedPrompt = `${systemContext}

Write a follow-up message for:
- Client: ${formInputs.clientName}
- Project: ${formInputs.projectTitle}
- Last Contact: ${formInputs.lastContact}
- Reason: ${formInputs.followUpReason}
- Tone: ${formInputs.tone}
- Urgency: ${formInputs.urgency}`;
    }

    // Step 4: Generate content with Gemini (with fallback)
    const result = await callGeminiWithFallback(combinedPrompt, plan);
    const generatedContent = result.content;
    const tokensUsed = result.tokenCount;
    const modelUsed = result.model;

    // Step 5: Store the generated content as chunks (in background)
    if (client_id && project_id) {
      // Don't await this to avoid blocking the response
      storeContentChunks(supabase, user_id, client_id, project_id, generatedContent, type);
    }

    console.log(`RAG generation completed: tokens=${tokensUsed}, model=${modelUsed}`);

    return new Response(
      JSON.stringify({
        content: generatedContent,
        tokens_used: tokensUsed,
        model: modelUsed,
        context_used: relevantChunks.length > 0 || !!projectSummary,
        relevant_chunks_count: relevantChunks.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("RAG generation error:", error);
    return new Response(
      JSON.stringify({ 
        error: "AI generation is temporarily unavailable. Please try again in a few minutes.",
        details: error.message?.includes('unavailable') ? "Rate limits exceeded" : error.message
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 503 
      }
    );
  }
});