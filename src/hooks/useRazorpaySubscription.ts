
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

      console.log('Creating Razorpay subscription for plan:', plan);
      
      const { data, error } = await supabase.functions.invoke('razorpay-subscription/create-subscription', {
        body: { user_id: user.id, plan }
      });

      if (error) {
        console.error('Razorpay subscription creation error:', error);
        throw error;
      }
      
      console.log('Razorpay subscription created:', data);
      return data;
    },
    onSuccess: (data, plan) => {
      console.log('Razorpay subscription success, opening checkout for plan:', plan);
      
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => openRazorpayCheckout(data, plan);
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          toast.error('Failed to load payment gateway');
        };
        document.head.appendChild(script);
      } else {
        openRazorpayCheckout(data, plan);
      }
    },
    onError: (error) => {
      console.error('Subscription creation error:', error);
      toast.error(error?.message || 'Failed to create subscription');
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
      toast.success('Subscription cancelled successfully');
    },
    onError: (error) => {
      toast.error('Failed to cancel subscription');
      console.error('Subscription cancellation error:', error);
    },
  });

  const openRazorpayCheckout = (subscriptionData: any, plan: string) => {
    console.log('Opening Razorpay checkout with data:', subscriptionData);
    
    const options = {
      key: subscriptionData.key_id,
      subscription_id: subscriptionData.subscription_id,
      name: 'Freelancer Copilot',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
      handler: function (response: any) {
        console.log('Payment successful:', response);
        toast.success('Payment successful! Your subscription is now active.');
        
        // Refresh all relevant data
        queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['settings', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['userData', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['usage_stats'] });
        
        // Navigate to dashboard
        window.location.href = '/';
      },
      prefill: {
        email: user?.email,
      },
      theme: {
        color: '#8B5CF6'
      },
      modal: {
        ondismiss: function() {
          console.log('Payment modal closed by user');
          toast.info('Payment cancelled. You can retry from Settings > Billing.');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error opening Razorpay checkout:', error);
      toast.error('Failed to open payment gateway');
    }
  };

  return {
    createSubscription: createSubscriptionMutation.mutate,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    isCreating: createSubscriptionMutation.isPending,
    isCancelling: cancelSubscriptionMutation.isPending,
    error: createSubscriptionMutation.error,
  };
}
