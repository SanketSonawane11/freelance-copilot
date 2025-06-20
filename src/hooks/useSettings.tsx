import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface UserSettings {
  user_id: string;
  business_name?: string;
  gst_number?: string;
  address?: string;
  bank_details: {
    upi: string;
    account: string;
    ifsc: string;
  };
  default_currency: string;
  tax_regime: '44ADA' | 'Regular' | 'NotSure';
  quarterly_reminder: boolean;
  proposal_tips_optin: boolean;
  tax_reminder_optin: boolean;
  invoice_alerts_optin: boolean;
}

export interface BillingInfo {
  user_id: string;
  current_plan: 'starter' | 'basic' | 'pro';
  usage_proposals: number;
  usage_followups: number;
  renewal_date?: string;
  razorpay_customer_id?: string;
}

export const useSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      const { data: billing, error: billingError } = await supabase
        .from('billing_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (billingError && billingError.code !== 'PGRST116') {
        throw billingError;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Determine the correct plan - billing_info takes precedence for active subscriptions
      let currentPlan = 'starter';
      
      if (billing?.subscription_status === 'active' && billing?.current_plan) {
        currentPlan = billing.current_plan;
      } else if (profile?.subscription_tier) {
        currentPlan = profile.subscription_tier;
      }
      
      console.log('Plan determination:', {
        billingPlan: billing?.current_plan,
        billingStatus: billing?.subscription_status,
        profileTier: profile?.subscription_tier,
        finalPlan: currentPlan
      });

      // If there's a mismatch between billing and profile, sync them
      if (billing?.current_plan !== profile?.subscription_tier) {
        console.log('Plan mismatch detected, syncing tables');
        
        // Update profile to match billing if billing is active
        if (billing?.subscription_status === 'active') {
          await supabase
            .from('user_profiles')
            .update({ subscription_tier: billing.current_plan })
            .eq('id', user.id);
        }
        // Update billing to match profile if billing is inactive
        else if (profile?.subscription_tier && profile.subscription_tier !== 'starter') {
          await supabase
            .from('billing_info')
            .update({ current_plan: profile.subscription_tier })
            .eq('user_id', user.id);
        }
      }

      return {
        settings: settings || {
          user_id: user.id,
          business_name: '',
          gst_number: '',
          address: '',
          bank_details: { upi: '', account: '', ifsc: '' },
          default_currency: 'INR',
          tax_regime: 'NotSure' as const,
          quarterly_reminder: false,
          proposal_tips_optin: true,
          tax_reminder_optin: true,
          invoice_alerts_optin: true,
        },
        billing: billing || {
          user_id: user.id,
          current_plan: currentPlan as 'starter' | 'basic' | 'pro',
          usage_proposals: 0,
          usage_followups: 0,
        },
        profile: profile || {
          id: user.id,
          name: '',
          profile_picture: null,
          login_method: 'email',
          subscription_tier: currentPlan,
        }
      };
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Refetch every 5 seconds to catch payment updates
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user?.id) throw new Error('No user');

      const { error } = await supabase
        .from('user_settings')
        .upsert({ ...updates, user_id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', user?.id] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update settings');
      console.error('Settings update error:', error);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { name?: string; profile_picture?: string }) => {
      if (!user?.id) throw new Error('No user');

      const { error } = await supabase
        .from('user_profiles')
        .upsert({ ...updates, id: user.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', user?.id] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('No user');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await updateProfileMutation.mutateAsync({ profile_picture: data.publicUrl });

      return data.publicUrl;
    },
    onSuccess: () => {
      toast.success('Avatar updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload avatar');
      console.error('Avatar upload error:', error);
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.rpc('export_user_data', {
        user_uuid: user.id
      });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freelancer-copilot-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return data;
    },
    onSuccess: () => {
      toast.success('Data exported successfully');
    },
    onError: (error) => {
      toast.error('Failed to export data');
      console.error('Data export error:', error);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.rpc('delete_user_account', {
        user_uuid: user.id
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      // Sign out user after successful deletion
      supabase.auth.signOut();
    },
    onError: (error) => {
      toast.error('Failed to delete account');
      console.error('Account deletion error:', error);
    },
  });

  return {
    ...settingsQuery,
    updateSettings: updateSettingsMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    uploadAvatar: uploadAvatarMutation.mutate,
    exportData: exportDataMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    isUpdating: updateSettingsMutation.isPending || updateProfileMutation.isPending,
    isUploading: uploadAvatarMutation.isPending,
    isExporting: exportDataMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
  };
};
