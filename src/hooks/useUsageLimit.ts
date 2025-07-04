
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getPlanLimits } from '@/utils/planLimits';

export function useUsageLimit(type: 'proposal' | 'followup') {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['usage-limit', user?.id, type],
    queryFn: async () => {
      if (!user?.id) {
        return { current: 0, limit: 0, canUse: false, remainingUsage: 0, plan: 'starter' };
      }

      // Get user's current plan from billing_info first, fallback to user_profiles
      const { data: billingInfo } = await supabase
        .from('billing_info')
        .select('current_plan, subscription_status, usage_proposals, usage_followups')
        .eq('user_id', user.id)
        .single();

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      // Determine current plan - billing_info takes precedence if subscription is active
      let currentPlan = 'starter';
      if (billingInfo?.subscription_status === 'active' && billingInfo?.current_plan) {
        currentPlan = billingInfo.current_plan;
      } else if (profile?.subscription_tier) {
        currentPlan = profile.subscription_tier;
      }

      const planLimits = getPlanLimits(currentPlan);
      const limit = type === 'proposal' ? planLimits.proposals : planLimits.followups;

      // Get current usage from billing_info first, then usage_stats as fallback
      let currentUsage = 0;
      if (billingInfo) {
        currentUsage = type === 'proposal' ? 
          (billingInfo.usage_proposals || 0) : 
          (billingInfo.usage_followups || 0);
      } else {
        // Fallback to usage_stats for current month
        const currentMonth = new Date().toISOString().substring(0, 7) + '-01';
        const { data: usageStats } = await supabase
          .from('usage_stats')
          .select('proposals_used, followups_used')
          .eq('user_id', user.id)
          .eq('month', currentMonth)
          .single();

        if (usageStats) {
          currentUsage = type === 'proposal' ? 
            (usageStats.proposals_used || 0) : 
            (usageStats.followups_used || 0);
        }
      }

      const canUse = currentUsage < limit;
      const remainingUsage = Math.max(0, limit - currentUsage);

      // Only log for debugging, not on every check
      if (Math.random() < 0.1) { // Only log 10% of the time to reduce noise
        console.log(`Usage limit check - Plan: ${currentPlan}, Type: ${type}, Current: ${currentUsage}, Limit: ${limit}, Can use: ${canUse}`);
      }

      return {
        current: currentUsage,
        limit,
        canUse,
        remainingUsage,
        plan: currentPlan
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Reduced from 5 seconds to 30 seconds
    staleTime: 20000, // Cache for 20 seconds
  });

  return {
    ...query,
    current: query.data?.current || 0,
    limit: query.data?.limit || 0,
    canUse: query.data?.canUse || false,
    remainingUsage: query.data?.remainingUsage || 0,
    plan: query.data?.plan || 'starter',
    canIncrement: query.data?.canUse || false,
    increment: async () => {
      if (!user?.id) throw new Error('No user');
      
      // Increment usage in billing_info
      const { error } = await supabase
        .from('billing_info')
        .update({
          [`usage_${type === 'proposal' ? 'proposals' : 'followups'}`]: (query.data?.current || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (error) throw new Error(`Failed to update usage: ${error.message}`);
      
      // Refetch to get updated data
      query.refetch();
    }
  };
}
