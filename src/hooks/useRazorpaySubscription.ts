
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function useRazorpaySubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createSubscriptionMutation = useMutation({
    mutationFn: async (plan: 'basic' | 'pro') => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.functions.invoke('razorpay-subscription/create-subscription', {
        body: { user_id: user.id, plan }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, plan) => {
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => openRazorpayCheckout(data, plan);
        document.head.appendChild(script);
      } else {
        openRazorpayCheckout(data, plan);
      }
    },
    onError: (error) => {
      toast.error('Failed to create subscription');
      console.error('Subscription creation error:', error);
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
      toast.success('Subscription cancelled successfully');
    },
    onError: (error) => {
      toast.error('Failed to cancel subscription');
      console.error('Subscription cancellation error:', error);
    },
  });

  const openRazorpayCheckout = (subscriptionData: any, plan: string) => {
    const options = {
      key: subscriptionData.key_id,
      subscription_id: subscriptionData.subscription_id,
      name: 'Freelancer Copilot',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
      handler: function (response: any) {
        console.log('Payment successful:', response);
        toast.success('Payment successful! Your subscription is now active.');
        
        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['settings', user?.id] });
      },
      prefill: {
        email: user?.email,
      },
      theme: {
        color: '#8B5CF6'
      },
      modal: {
        ondismiss: function() {
          console.log('Payment modal closed');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return {
    createSubscription: createSubscriptionMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    isCreating: createSubscriptionMutation.isPending,
    isCancelling: cancelSubscriptionMutation.isPending,
  };
}
