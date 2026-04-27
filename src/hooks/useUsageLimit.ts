import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getPlanLimits } from '@/utils/planLimits';
import { calculateSubscriptionStatus } from '@/utils/subscriptionUtils';

export function useUsageLimit(type: 'proposal' | 'followup' | 'invoice') {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['usage-limit', user?.id, type],
    queryFn: async () => {
      if (!user?.id) {
        return { current: 0, limit: 0, canUse: false, remainingUsage: 0, plan: 'starter' };
      }

      // Get billing info and profile for plan calculation
      const { data: billingInfo } = await supabase
        .from('billing_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .maybeSingle();

      const { effectivePlan, isExpired } = calculateSubscriptionStatus(billingInfo, profile);
      const planLimits = getPlanLimits(effectivePlan);
      
      let limit = 0;
      if (type === 'proposal') limit = planLimits.proposals;
      else if (type === 'followup') limit = planLimits.followups;
      else if (type === 'invoice') limit = planLimits.invoices;

      // Always get current usage
      let currentUsage = 0;
      const currentMonth = new Date().toISOString().substring(0, 7) + '-01';
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      if (type === 'invoice') {
        const { count } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthStart);
        currentUsage = count || 0;
      } else {
        const { data: usageStats } = await supabase
          .from('usage_stats')
          .select('proposals_used, followups_used')
          .eq('user_id', user.id)
          .eq('month', currentMonth)
          .maybeSingle();

        if (usageStats) {
          currentUsage = type === 'proposal' ? 
            (usageStats.proposals_used || 0) : 
            (usageStats.followups_used || 0);
        }
      }

      const canUse = currentUsage < limit;
      const remainingUsage = Math.max(0, limit - currentUsage);

      return {
        current: currentUsage ?? 0,
        limit: limit ?? 0,
        canUse,
        canIncrement: canUse,
        remainingUsage,
        plan: effectivePlan
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, 
    staleTime: 20000,
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
      if (type === 'invoice') {
        // Invoices are counted directly, just refetch
        query.refetch();
        return;
      }
      
      const currentMonth = new Date().toISOString().substring(0, 7) + '-01';
      
      // Update usage_stats - source of truth for the month
      const { error: usageError } = await supabase
        .from('usage_stats')
        .upsert({
          user_id: user.id,
          month: currentMonth,
          [`${type === 'proposal' ? 'proposals_used' : 'followups_used'}`]: (query.data?.current || 0) + 1
        }, { onConflict: 'user_id,month' });
        
      if (usageError) throw new Error(`Failed to update usage stats: ${usageError.message}`);

      query.refetch();
    }
  };
}
