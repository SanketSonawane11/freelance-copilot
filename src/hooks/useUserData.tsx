
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userData', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

      // Get or create usage stats for current month
      const { data: usageStats } = await supabase
        .rpc('get_or_create_usage_stats', { user_uuid: user.id });

      // Get proposals count for current month
      const { count: proposalsCount } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      // Get followups count for current month
      const { count: followupsCount } = await supabase
        .from('followups')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      // Get invoices count for current month
      const { count: invoicesCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      // Get recent activity - real data
      const { data: recentProposals } = await supabase
        .from('proposals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      const { data: recentInvoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2);

      const { data: recentTaxEstimations } = await supabase
        .from('tax_estimations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        usageStats,
        proposalsCount: proposalsCount || 0,
        followupsCount: followupsCount || 0,
        invoicesCount: invoicesCount || 0,
        recentProposals: recentProposals || [],
        recentInvoices: recentInvoices || [],
        recentTaxEstimations: recentTaxEstimations || [],
        profile
      };
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
