
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserData } from './useUserData';
import { useSubscription } from './useSubscription';
import { getPlanLimits } from '@/utils/planLimits';

type UsageType = 'proposal' | 'followup';

// Format for existing schema: YYYY-MM-01 (DATE for `month`)
export const getCurrentMonthDate = () => {
  const now = new Date();
  // e.g., '2025-06-01' as DATE string
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

export function useUsageLimit(type: UsageType) {
  const { data: userData } = useUserData();
  const { data: subscription } = useSubscription();
  const userId = userData?.profile?.id;
  const subscriptionPlan = subscription?.current_plan || 'starter';
  const subscriptionStatus = subscription?.subscription_status || 'inactive';
  const currentPeriodEnd = subscription?.current_period_end;

  const month = getCurrentMonthDate();
  const queryClient = useQueryClient();

  // Check if subscription is valid and not expired
  const isSubscriptionValid = () => {
    if (subscriptionPlan === 'starter') return true; // Starter plan always valid with basic limits
    if (subscriptionStatus !== 'active') return false;
    if (currentPeriodEnd && new Date(currentPeriodEnd) < new Date()) {
      console.log('Subscription expired:', currentPeriodEnd);
      return false;
    }
    return true;
  };

  // Get dynamic limits based on plan - enforce correct plan limits
  const planLimits = getPlanLimits(subscriptionPlan);
  const limit = type === 'proposal' ? planLimits.proposals : planLimits.followups;

  console.log(`Usage limit check - Plan: ${subscriptionPlan}, Type: ${type}, Limit: ${limit}, Valid: ${isSubscriptionValid()}`);

  // Fetch usage_stats for this user+month; create if not exists
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['usage_stats', userId, month],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      
      // First check if subscription is expired and reset if needed
      if (!isSubscriptionValid() && subscriptionPlan !== 'starter') {
        console.log('Subscription expired, resetting to starter plan');
        // This will be handled by a background process or webhook
      }
      
      // SELECT with correct keys (month is DATE)
      let { data, error } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('month', month)
        .maybeSingle();

      // If not exists, create a new usage_stats row
      if (!data && !error) {
        const { data: inserted, error: insertError } = await supabase
          .from('usage_stats')
          .insert([{ user_id: userId, month, proposals_used: 0, followups_used: 0 }])
          .select()
          .maybeSingle();
        if (inserted) return inserted;
        if (insertError) throw insertError;
      }
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds cache to reduce API calls
  });

  // Increment proposal/followup count if allowed
  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user');
      
      // Check subscription validity for paid features
      if (subscriptionPlan !== 'starter' && !isSubscriptionValid()) {
        throw new Error('Your subscription has expired or is inactive. Please renew to continue using premium features.');
      }

      // Map to schema's fields
      const count = type === 'proposal'
        ? (data?.proposals_used || 0)
        : (data?.followups_used || 0);
      
      console.log(`Current usage for ${type}: ${count}/${limit}`);
      
      if (count >= limit) {
        const planName = subscriptionPlan === 'starter' ? 'Starter plan' : `${subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} plan`;
        throw new Error(
          `Monthly ${type === 'proposal' ? 'proposal' : 'follow-up'} limit (${limit}) reached for your ${planName}. ${subscriptionPlan === 'starter' ? 'Please upgrade to continue.' : 'Your limit will reset on your next billing cycle.'}`
        );
      }
      
      // Update correct key
      const updates =
        type === 'proposal'
          ? { proposals_used: count + 1 }
          : { followups_used: count + 1 };
          
      console.log(`Incrementing ${type} usage:`, updates);
      
      const { error } = await supabase
        .from('usage_stats')
        .update(updates)
        .eq('user_id', userId)
        .eq('month', month);
        
      if (error) {
        console.error('Usage update error:', error);
        throw error;
      }
      
      // Also update billing_info for immediate consistency
      const billingUpdates = type === 'proposal' 
        ? { usage_proposals: count + 1 }
        : { usage_followups: count + 1 };
        
      await supabase
        .from('billing_info')
        .update(billingUpdates)
        .eq('user_id', userId);
      
      // Invalidate to refetch updated stats
      await queryClient.invalidateQueries({
        queryKey: ['usage_stats', userId, month],
      });
      await queryClient.invalidateQueries({ queryKey: ['userData', userId] });
      await queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    },
  });

  // Use correct fields
  const current = type === 'proposal'
    ? data?.proposals_used || 0
    : data?.followups_used || 0;

  const canIncrement = current < limit && (subscriptionPlan === 'starter' || isSubscriptionValid());

  return {
    limit,
    current,
    isLoading,
    canIncrement,
    increment: mutation.mutateAsync,
    refetch,
    error: mutation.error,
    subscriptionValid: isSubscriptionValid(),
    subscriptionPlan,
    subscriptionStatus,
    remainingUsage: Math.max(0, limit - current)
  };
}
