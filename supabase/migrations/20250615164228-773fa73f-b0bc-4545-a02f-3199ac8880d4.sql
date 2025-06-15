
create table if not exists ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  type text check (type in ('proposal', 'followup')) not null,
  model_used text not null,
  input_hash text not null,
  tokens_used int,
  result_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for deduplication lookup
create index if not exists idx_ai_usage_logs_inputhash on ai_usage_logs(input_hash);

-- Index for user AI usage analytics
create index if not exists idx_ai_usage_logs_user_id on ai_usage_logs(user_id);
