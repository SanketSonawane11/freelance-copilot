
export interface PlanLimits {
  proposals: number;
  followups: number;
  invoices: number;
  clients: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: {
    proposals: 10,
    followups: 10,
    invoices: 3,
    clients: 2,
  },
  basic: {
    proposals: 50,
    followups: 50,
    invoices: 30,
    clients: 10,
  },
  pro: {
    proposals: 100,
    followups: 100,
    invoices: 50,
    clients: 30,
  },
};

export const PLAN_PRICES = {
  starter: { amount: 0, currency: 'INR', display: 'Free' },
  basic: { amount: 149, currency: 'INR', display: '₹149' },
  pro: { amount: 349, currency: 'INR', display: '₹349' },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
}

export function getPlanPrice(plan: string) {
  return PLAN_PRICES[plan as keyof typeof PLAN_PRICES] || PLAN_PRICES.starter;
}

export function canUserAccessFeature(
  currentPlan: string,
  currentUsage: number,
  featureType: keyof PlanLimits
): boolean {
  const limits = getPlanLimits(currentPlan);
  return currentUsage < limits[featureType];
}
