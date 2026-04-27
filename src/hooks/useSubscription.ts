import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { calculateSubscriptionStatus } from "@/utils/subscriptionUtils";

/**
 * Gets the user's subscription info from billing_info.
 */
export function useSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: billingInfo } = await supabase
        .from("billing_info")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();

      const statusInfo = calculateSubscriptionStatus(billingInfo, profile);

      return {
        ...billingInfo,
        ...statusInfo
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
