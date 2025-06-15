
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserData } from './useUserData';

type UsageType = 'proposal' | 'followup';

export const getCurrentYearMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthlyLimit = (plan: string, type: UsageType) => {
  if (plan === 'pro') return 100;
  return 10;
};

export function useUsageLimit(type: UsageType) {
  const { data: userData } = useUserData();
  const userId = userData?.profile?.id;
  const subscriptionPlan =
    userData?.billingInfo?.current_plan ||
    userData?.profile?.subscription_tier ||
    'starter';

  const yearMonth = getCurrentYearMonth();
  const queryClient = useQueryClient();

  // Fetch usage_stats for this user+month; create if not exists
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['usage_stats', userId, yearMonth],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      let { data, error } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('year_month', yearMonth)
        .maybeSingle();

      // If not exists, create a new usage_stats row
      if (!data && !error) {
        const { data: inserted, error: insertError } = await supabase
          .from('usage_stats')
          .insert([{ user_id: userId, year_month: yearMonth }])
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
      const limit = getMonthlyLimit(subscriptionPlan, type);
      const count = type === 'proposal'
        ? (data?.proposal_count || 0)
        : (data?.followup_count || 0);
      if (count >= limit) {
        throw new Error(
          `${type === 'proposal' ? 'Proposal' : 'Follow-up'} limit reached.`
        );
      }
      const updates =
        type === 'proposal'
          ? { proposal_count: count + 1 }
          : { followup_count: count + 1 };
      const { error } = await supabase
        .from('usage_stats')
        .update(updates)
        .eq('user_id', userId)
        .eq('year_month', yearMonth);
      if (error) throw error;
      // Invalidate to refetch updated stats
      await queryClient.invalidateQueries({
        queryKey: ['usage_stats', userId, yearMonth],
      });
      await queryClient.invalidateQueries({ queryKey: ['userData', userId] });
    },
  });

  const limit = getMonthlyLimit(subscriptionPlan, type);
  const current = type === 'proposal'
    ? data?.proposal_count || 0
    : data?.followup_count || 0;

  return {
    limit,
    current,
    isLoading,
    canIncrement: current < limit,
    increment: mutation.mutateAsync,
    refetch,
    error: mutation.error,
  };
}
