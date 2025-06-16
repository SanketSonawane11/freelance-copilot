
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserData } from './useUserData';
import { useSubscription } from './useSubscription';

type UsageType = 'proposal' | 'followup';

// Format for existing schema: YYYY-MM-01 (DATE for `month`)
export const getCurrentMonthDate = () => {
  const now = new Date();
  // e.g., '2025-06-01' as DATE string
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

export const getMonthlyLimit = (plan: string, type: UsageType) => {
  if (plan === 'pro') return 100;
  if (plan === 'basic') return 50;
  return 10; // starter
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

  // Check if subscription is valid
  const isSubscriptionValid = () => {
    if (subscriptionPlan === 'starter') return true; // Starter plan always valid with basic limits
    if (subscriptionStatus !== 'active') return false;
    if (currentPeriodEnd && new Date(currentPeriodEnd) < new Date()) return false;
    return true;
  };

  // Fetch usage_stats for this user+month; create if not exists
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['usage_stats', userId, month],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
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
          .insert([{ user_id: userId, month }])
          .select()
          .maybeSingle();
        if (inserted) return inserted;
        if (insertError) throw insertError;
      }
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Increment proposal/followup count if allowed
  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user');
      
      // Check subscription validity for paid features
      if (subscriptionPlan !== 'starter' && !isSubscriptionValid()) {
        throw new Error('Your subscription has expired or is inactive. Please renew to continue using premium features.');
      }

      const limit = getMonthlyLimit(subscriptionPlan, type);
      // Map to schema's fields
      const count = type === 'proposal'
        ? (data?.proposals_used || 0)
        : (data?.followups_used || 0);
      
      if (count >= limit) {
        const planName = subscriptionPlan === 'starter' ? 'current plan' : `${subscriptionPlan} plan`;
        throw new Error(
          `${type === 'proposal' ? 'Proposal' : 'Follow-up'} limit reached for your ${planName}. Please upgrade to continue.`
        );
      }
      
      // Update correct key
      const updates =
        type === 'proposal'
          ? { proposals_used: count + 1 }
          : { followups_used: count + 1 };
      const { error } = await supabase
        .from('usage_stats')
        .update(updates)
        .eq('user_id', userId)
        .eq('month', month);
      if (error) throw error;
      // Invalidate to refetch updated stats
      await queryClient.invalidateQueries({
        queryKey: ['usage_stats', userId, month],
      });
      await queryClient.invalidateQueries({ queryKey: ['userData', userId] });
    },
  });

  const limit = getMonthlyLimit(subscriptionPlan, type);
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
    subscriptionStatus
  };
}
