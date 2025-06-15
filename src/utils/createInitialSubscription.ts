
// PATCHED: Make Supabase ts happy even if user_subscriptions is not in the types file yet.
import { supabase } from "@/integrations/supabase/client";

export async function createInitialSubscription(user_id: string, plan: "basic" | "pro") {
  if (!user_id) return { error: "No user id" };
  // Set period: 30 days from now by default (simulate subscription period)
  const now = new Date();
  const start = now.toISOString();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Use 'as any' to bypass types for not yet present 'user_subscriptions'
  const { error } = await (supabase.from as any)("user_subscriptions").insert([
    {
      user_id,
      plan,
      subscription_status: "active",
      current_period_start: start,
      current_period_end: end,
    }
  ]);
  return { error };
}
