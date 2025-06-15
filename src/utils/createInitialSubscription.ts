
import { supabase } from "@/integrations/supabase/client";

/**
 * Sets or updates the user's initial subscription plan (current_plan) in billing_info table.
 */
export async function createInitialSubscription(user_id: string, plan: "basic" | "pro") {
  if (!user_id) return { error: { message: "No user id" } };

  // Try to upsert into billing_info (set current_plan on signup)
  const { error } = await supabase
    .from("billing_info")
    .upsert(
      [
        {
          user_id,
          current_plan: plan,
        },
      ],
      { onConflict: "user_id" }
    );

  return { error };
}
