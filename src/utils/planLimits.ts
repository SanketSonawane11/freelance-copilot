
export interface PlanLimits {
  proposals: number;
  displayProposals: string;
  followups: number;
  displayFollowups: string;
  invoices: number;
  displayInvoices: string;
  clients: number;
  displayClients: string;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: {
    proposals: 10,
    displayProposals: "10",
    followups: 10,
    displayFollowups: "10",
    invoices: 3,
    displayInvoices: "3",
    clients: 2,
    displayClients: "2",
  },
  basic: {
    proposals: 100,
    displayProposals: "100",
    followups: 100,
    displayFollowups: "100",
    invoices: 30,
    displayInvoices: "30",
    clients: 10,
    displayClients: "10",
  },
  pro: {
    proposals: 1/0,
    displayProposals: "Unlimited",
    followups: 1/0,
    displayFollowups: "Unlimited",
    invoices: 60,
    displayInvoices: "60",
    clients: 1/0,
    displayClients: "Unlimited",
  },
};

export const PLAN_PRICES = {
  starter: { amount: 0, currency: 'INR', display: 'Free' },
  basic: { amount: 149, currency: 'INR', display: '₹149' },
  pro: { amount: 299, currency: 'INR', display: '₹299' },
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
  return currentUsage < (limits[featureType] as number);
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
