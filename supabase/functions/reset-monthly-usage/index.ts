
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    
    console.log(`Running monthly usage reset for ${currentMonth}`);

    // Get all active subscriptions that need reset
    const { data: activeSubscriptions, error: fetchError } = await supabase
      .from('billing_info')
      .select('user_id, current_plan, subscription_status, current_period_end')
      .eq('subscription_status', 'active');

    if (fetchError) {
      console.error('Error fetching active subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${activeSubscriptions?.length || 0} active subscriptions`);

    let resetCount = 0;

    for (const subscription of activeSubscriptions || []) {
      try {
        const periodEnd = new Date(subscription.current_period_end);
        const today = new Date();
        
        // Check if subscription period ended and needs reset
        if (periodEnd <= today) {
          console.log(`Resetting usage for user ${subscription.user_id}, plan: ${subscription.current_plan}`);
          
          // Reset usage in billing_info
          const { error: billingUpdateError } = await supabase
            .from('billing_info')
            .update({
              usage_proposals: 0,
              usage_followups: 0,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', subscription.user_id);

          if (billingUpdateError) {
            console.error(`Error updating billing for user ${subscription.user_id}:`, billingUpdateError);
            continue;
          }

          // Reset usage in usage_stats for current month
          const { error: usageUpdateError } = await supabase
            .from('usage_stats')
            .upsert({
              user_id: subscription.user_id,
              month: currentMonth,
              proposals_used: 0,
              followups_used: 0,
              tokens_used: 0
            }, { onConflict: 'user_id,month' });

          if (usageUpdateError) {
            console.error(`Error updating usage stats for user ${subscription.user_id}:`, usageUpdateError);
            continue;
          }

          resetCount++;
        }
      } catch (error) {
        console.error(`Error processing user ${subscription.user_id}:`, error);
        continue;
      }
    }

    // Also handle expired subscriptions - downgrade to starter
    const { data: expiredSubscriptions, error: expiredError } = await supabase
      .from('billing_info')
      .select('user_id, current_plan, current_period_end')
      .eq('subscription_status', 'active')
      .lt('current_period_end', today.toISOString());

    if (!expiredError && expiredSubscriptions?.length) {
      console.log(`Found ${expiredSubscriptions.length} expired subscriptions to downgrade`);
      
      for (const expired of expiredSubscriptions) {
        try {
          // Downgrade to starter
          const { error: downgradeError } = await supabase
            .from('billing_info')
            .update({
              current_plan: 'starter',
              subscription_status: 'inactive',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', expired.user_id);

          if (!downgradeError) {
            // Update user profile
            await supabase
              .from('user_profiles')
              .update({ subscription_tier: 'starter' })
              .eq('id', expired.user_id);
            
            console.log(`Downgraded expired subscription for user ${expired.user_id}`);
          }
        } catch (error) {
          console.error(`Error downgrading user ${expired.user_id}:`, error);
        }
      }
    }

    console.log(`Monthly usage reset completed. Reset ${resetCount} subscriptions.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        resetCount,
        expiredCount: expiredSubscriptions?.length || 0,
        currentMonth 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Monthly reset error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
