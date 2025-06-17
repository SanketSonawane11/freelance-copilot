
import { supabase } from "@/integrations/supabase/client";

/**
 * Sets or updates the user's initial subscription plan (current_plan) in billing_info table.
 */
export async function createInitialSubscription(user_id: string, plan: "starter" | "basic" | "pro") {
  if (!user_id) return { error: { message: "No user id" } };

  console.log(`Setting initial subscription for user ${user_id} to plan: ${plan}`);

  try {
    // Try to upsert into billing_info (set current_plan on signup)
    const { error } = await supabase
      .from("billing_info")
      .upsert(
        [
          {
            user_id,
            current_plan: plan,
            subscription_status: plan === 'starter' ? 'active' : 'inactive',
            updated_at: new Date().toISOString()
          },
        ],
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error setting initial subscription:", error);
      return { error };
    } else {
      console.log(`Successfully set initial subscription for user ${user_id} to ${plan}`);
      return { error: null };
    }
  } catch (err) {
    console.error("Exception setting initial subscription:", err);
    return { error: { message: "Failed to set initial subscription" } };
  }
}
