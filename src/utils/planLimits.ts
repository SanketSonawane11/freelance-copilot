
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
    invoices: 50,
    clients: 20,
  },
  basic: {
    proposals: 50,
    followups: 50,
    invoices: 200,
    clients: 100,
  },
  pro: {
    proposals: 100,
    followups: 100,
    invoices: 1000,
    clients: 500,
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

// Helper function to get plan display name
export function getPlanDisplayName(plan: string): string {
  const names = {
    starter: 'Starter Plan',
    basic: 'Basic Plan', 
    pro: 'Pro Plan'
  };
  return names[plan as keyof typeof names] || 'Unknown Plan';
}

// Helper function to check if plan is paid
export function isPaidPlan(plan: string): boolean {
  return plan === 'basic' || plan === 'pro';
}
