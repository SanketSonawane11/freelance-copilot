
import { getPlanLimits } from "./planLimits";

export interface SubscriptionInfo {
  effectivePlan: string;
  isExpired: boolean;
  status: string;
  currentPlan: string;
  periodEnd: string | null;
}

export function calculateSubscriptionStatus(billingInfo: any, profile: any): SubscriptionInfo {
  const currentPlan = billingInfo?.current_plan || profile?.subscription_tier || 'starter';
  const status = billingInfo?.subscription_status || 'inactive';
  const periodEnd = billingInfo?.current_period_end || null;
  
  const isExpired = periodEnd && new Date(periodEnd) < new Date();
  
  let effectivePlan = 'starter';
  // Allow both active and cancelled (but not yet expired) status to keep features
  const isWithinPeriod = !isExpired && (status === 'active' || status === 'cancelled');
  
  if (isWithinPeriod && currentPlan) {
    effectivePlan = currentPlan;
  } else if (profile?.subscription_tier && !isExpired) {
    effectivePlan = profile.subscription_tier;
  }

  return {
    effectivePlan,
    isExpired: !!isExpired,
    status,
    currentPlan,
    periodEnd
  };
}
