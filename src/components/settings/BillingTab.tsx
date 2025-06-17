
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Crown, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useRazorpaySubscription } from "@/hooks/useRazorpaySubscription";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import { getPlanLimits, getPlanPrice } from "@/utils/planLimits";

interface BillingTabProps {
  data: any;
}

export const BillingTab: React.FC<BillingTabProps> = ({ data }) => {
  const { data: subscription, refetch } = useSubscription();
  const { createSubscription, cancelSubscription, isCreating, isCancelling } = useRazorpaySubscription();
  const proposalUsage = useUsageLimit('proposal');
  const followupUsage = useUsageLimit('followup');

  const currentPlan = subscription?.current_plan || 'starter';
  const subscriptionStatus = subscription?.subscription_status || 'inactive';
  const isActive = subscriptionStatus === 'active';
  
  const planLimits = getPlanLimits(currentPlan);

  const handleUpgrade = (plan: 'basic' | 'pro') => {
    console.log('Upgrading to plan:', plan);
    createSubscription(plan);
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      cancelSubscription();
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Subscription & Usage</span>
        </CardTitle>
        <CardDescription>Manage your plan and view usage statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div>
            <h3 className="font-semibold text-lg capitalize">{currentPlan} Plan</h3>
            <p className="text-slate-600">
              {currentPlan === 'pro' ? 'Advanced AI features enabled' : currentPlan === 'basic' ? 'Essential AI features' : 'Basic AI features'}
            </p>
            <p className="text-sm text-slate-500">
              Status: {subscriptionStatus} {subscription?.current_period_end && (
                `• Expires: ${new Date(subscription.current_period_end).toLocaleDateString()}`
              )}
            </p>
          </div>
          <Badge variant="outline" className="bg-white/50">
            <Crown className="w-4 h-4 mr-1" />
            {currentPlan === 'pro' ? 'Pro' : currentPlan === 'basic' ? 'Basic' : 'Starter'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/30 rounded-lg border border-white/20">
            <h4 className="font-medium text-slate-700">AI Proposals Used</h4>
            <p className="text-2xl font-bold text-blue-600">{proposalUsage.current}</p>
            <p className="text-sm text-slate-500">
              / {planLimits.proposals} this month
            </p>
          </div>
          <div className="p-4 bg-white/30 rounded-lg border border-white/20">
            <h4 className="font-medium text-slate-700">Smart Follow-ups</h4>
            <p className="text-2xl font-bold text-emerald-600">{followupUsage.current}</p>
            <p className="text-sm text-slate-500">
              / {planLimits.followups} this month
            </p>
          </div>
        </div>

        {/* Plan Management Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-700">Plan Management</h4>
          
          {currentPlan === 'starter' && (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
                <h5 className="font-semibold text-blue-800 mb-2">Basic Plan - {getPlanPrice('basic').display}/month</h5>
                <p className="text-blue-700 mb-3">{planLimits.proposals} AI proposals, {planLimits.followups} follow-ups, priority support</p>
                <Button 
                  onClick={() => handleUpgrade('basic')}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Upgrade to Basic
                </Button>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <h5 className="font-semibold text-purple-800 mb-2">Pro Plan - {getPlanPrice('pro').display}/month</h5>
                <p className="text-purple-700 mb-3">{getPlanLimits('pro').proposals} AI proposals, {getPlanLimits('pro').followups} follow-ups, advanced AI features, priority support</p>
                <Button 
                  onClick={() => handleUpgrade('pro')}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          )}

          {currentPlan === 'basic' && (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <h5 className="font-semibold text-purple-800 mb-2">Upgrade to Pro - {getPlanPrice('pro').display}/month</h5>
                <p className="text-purple-700 mb-3">Double your limits + advanced AI features</p>
                <Button 
                  onClick={() => handleUpgrade('pro')}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Upgrade to Pro
                </Button>
              </div>
              
              {isActive && (
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isCancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Cancel Subscription
                </Button>
              )}
            </div>
          )}

          {currentPlan === 'pro' && (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
                <h5 className="font-semibold text-green-800 mb-2">You're on Pro! 🎉</h5>
                <p className="text-green-700">Enjoying the full power of Freelancer Copilot</p>
              </div>
              
              {isActive && (
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isCancelling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Cancel Subscription
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
