
import { supabase } from "@/integrations/supabase/client";

export async function createInitialSubscription(user_id: string, plan: "basic" | "pro") {
  if (!user_id) return { error: "No user id" };
  // Set period: 30 days from now by default (simulate subscription period)
  const now = new Date();
  const start = now.toISOString();
  const end = new Date(now.setDate(now.getDate() + 30)).toISOString();

  const { error } = await supabase.from("user_subscriptions").insert([
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
