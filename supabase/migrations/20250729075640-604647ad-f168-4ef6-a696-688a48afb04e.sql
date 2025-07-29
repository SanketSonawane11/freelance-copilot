-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create projects table to organize work by client
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project summaries table for quick context
CREATE TABLE public.project_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id)
);

-- Create vector chunks metadata table for semantic search
CREATE TABLE public.vector_chunks_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  type TEXT NOT NULL CHECK (type IN ('proposal', 'followup', 'note', 'invoice')),
  source_id UUID, -- Reference to original proposal/followup/etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vector_chunks_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Users can view own projects"
ON public.projects
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
ON public.projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
ON public.projects
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
ON public.projects
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for project_summaries
CREATE POLICY "Users can view own project summaries"
ON public.project_summaries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project summaries"
ON public.project_summaries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project summaries"
ON public.project_summaries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project summaries"
ON public.project_summaries
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for vector_chunks_metadata
CREATE POLICY "Users can view own vector chunks"
ON public.vector_chunks_metadata
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vector chunks"
ON public.vector_chunks_metadata
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vector chunks"
ON public.vector_chunks_metadata
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vector chunks"
ON public.vector_chunks_metadata
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_projects_user_client ON public.projects(user_id, client_id);
CREATE INDEX idx_project_summaries_project ON public.project_summaries(project_id);
CREATE INDEX idx_vector_chunks_user_project ON public.vector_chunks_metadata(user_id, project_id);
CREATE INDEX idx_vector_chunks_type ON public.vector_chunks_metadata(type);

-- Create vector similarity search index
CREATE INDEX ON public.vector_chunks_metadata USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add updated_at trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for project_summaries
CREATE TRIGGER update_project_summaries_updated_at
  BEFORE UPDATE ON public.project_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update delete_user_account function to include new tables
CREATE OR REPLACE FUNCTION public.delete_user_account(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Check if user is deleting their own account
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Delete all user data in proper order
  DELETE FROM public.vector_chunks_metadata WHERE user_id = user_uuid;
  DELETE FROM public.project_summaries WHERE user_id = user_uuid;
  DELETE FROM public.projects WHERE user_id = user_uuid;
  DELETE FROM public.followups WHERE proposal_id IN (SELECT id FROM public.proposals WHERE user_id = user_uuid);
  DELETE FROM public.proposals WHERE user_id = user_uuid;
  DELETE FROM public.invoices WHERE user_id = user_uuid;
  DELETE FROM public.tax_estimations WHERE user_id = user_uuid;
  DELETE FROM public.usage_stats WHERE user_id = user_uuid;
  DELETE FROM public.user_settings WHERE user_id = user_uuid;
  DELETE FROM public.billing_info WHERE user_id = user_uuid;
  DELETE FROM public.user_profiles WHERE id = user_uuid;
  DELETE FROM public.ai_usage_logs WHERE user_id = user_uuid;
  
  RETURN TRUE;
END;
$function$;