import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useRazorpaySubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createSubscriptionMutation = useMutation({
    mutationFn: async (plan: 'basic' | 'pro') => {
      if (!user?.id) throw new Error('No user');

      console.log('Creating payment link for plan:', plan);
      
      const { data, error } = await supabase.functions.invoke('razorpay-subscription/create-subscription', {
        body: { user_id: user.id, plan }
      });

      if (error) {
        console.error('Payment link creation error:', error);
        throw error;
      }
      
      console.log('Payment link created:', data);
      return data;
    },
    onSuccess: (data, plan) => {
      console.log('Payment link success, opening checkout for plan:', plan);
      
      if (data.short_url) {
        // Open payment link in new tab
        console.log('Opening payment URL:', data.short_url);
        window.open(data.short_url, '_blank');
        toast.success('Payment link opened! Complete payment to activate your plan.');
        
        // Set up polling to check subscription status
        const checkStatus = async () => {
          try {
            const { data: subscription } = await supabase
              .from('billing_info')
              .select('subscription_status, current_plan')
              .eq('user_id', user?.id)
              .single();
              
            if (subscription?.subscription_status === 'active') {
              // Refresh all relevant data
              queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
              queryClient.invalidateQueries({ queryKey: ['settings', user?.id] });
              queryClient.invalidateQueries({ queryKey: ['userData', user?.id] });
              queryClient.invalidateQueries({ queryKey: ['usage_stats'] });
              queryClient.invalidateQueries({ queryKey: ['usage-limit'] });
              
              toast.success(`${subscription.current_plan.charAt(0).toUpperCase() + subscription.current_plan.slice(1)} plan activated successfully!`);
              return true;
            }
            return false;
          } catch (error) {
            console.error('Status check error:', error);
            return false;
          }
        };
        
        // Poll every 10 seconds for 3 minutes (more reasonable)
        let attempts = 0;
        const maxAttempts = 18; // 3 minutes
        const pollInterval = setInterval(async () => {
          attempts++;
          const activated = await checkStatus();
          
          if (activated || attempts >= maxAttempts) {
            clearInterval(pollInterval);
            if (!activated && attempts >= maxAttempts) {
              toast.info('Payment status check timed out. Please refresh the page if your payment was successful.');
            }
          }
        }, 10000);
        
      } else {
        toast.error('Failed to create payment link');
      }
    },
    onError: (error) => {
      console.error('Payment link creation error:', error);
      toast.error(error?.message || 'Failed to create payment link');
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.functions.invoke('razorpay-subscription/cancel-subscription', {
        body: { user_id: user.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['settings', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.id] });
      toast.success('Subscription cancelled successfully. You will retain access until the end of your current billing period.');
    },
    onError: (error) => {
      toast.error('Failed to cancel subscription');
      console.error('Subscription cancellation error:', error);
    },
  });

  return {
    createSubscription: createSubscriptionMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    isCreating: createSubscriptionMutation.isPending,
    isCancelling: cancelSubscriptionMutation.isPending,
    error: createSubscriptionMutation.error,
  };
}
