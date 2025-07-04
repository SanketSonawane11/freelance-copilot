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

      console.log('Creating order for plan:', plan);
      
      const { data, error } = await supabase.functions.invoke('razorpay-subscription/create-subscription', {
        body: { user_id: user.id, plan }
      });

      if (error) {
        console.error('Order creation error:', error);
        throw error;
      }
      
      console.log('Order created:', data);
      return data;
    },
    onSuccess: (data, plan) => {
      console.log('Order success, opening Razorpay checkout for plan:', plan);
      
      if (data.order_id && data.key_id) {
        // Load Razorpay script if not already loaded
        if (!window.Razorpay) {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => openRazorpayCheckout(data, plan);
          document.body.appendChild(script);
        } else {
          openRazorpayCheckout(data, plan);
        }
      } else {
        toast.error('Failed to create order');
      }
    },
    onError: (error) => {
      console.error('Order creation error:', error);
      toast.error(error?.message || 'Failed to create order');
    },
  });

  const openRazorpayCheckout = (orderData: any, plan: string) => {
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Freelancer Copilot',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Subscription`,
      order_id: orderData.order_id,
      prefill: {
        name: orderData.customer.name,
        email: orderData.customer.email
      },
      theme: {
        color: '#3b82f6'
      },
      handler: async (response: any) => {
        console.log('Payment successful:', response);
        
        try {
          // Verify payment on server
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke('razorpay-subscription/verify-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: user?.id,
              plan: plan
            }
          });

          if (verifyError) {
            console.error('Payment verification failed:', verifyError);
            toast.error('Payment verification failed');
            return;
          }

          // Refresh all relevant data
          queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['settings', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['userData', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['usage_stats'] });
          queryClient.invalidateQueries({ queryKey: ['usage-limit'] });
          
          toast.success(`${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated successfully!`);
          
        } catch (error) {
          console.error('Payment verification error:', error);
          toast.error('Payment verification failed');
        }
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
          toast.info('Payment cancelled');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

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
