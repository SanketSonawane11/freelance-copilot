
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Crown, Loader2, Calendar, AlertCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useRazorpaySubscription } from "@/hooks/useRazorpaySubscription";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import { getPlanLimits, getPlanPrice, getPlanDisplayName, isPaidPlan } from "@/utils/planLimits";

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
  const currentPeriodEnd = subscription?.current_period_end;
  const renewalDate = subscription?.renewal_date;
  
  const planLimits = getPlanLimits(currentPlan);
  const isExpired = currentPeriodEnd && new Date(currentPeriodEnd) < new Date();

  const handleUpgrade = (plan: 'basic' | 'pro') => {
    console.log('Upgrading to plan:', plan);
    createSubscription(plan);
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      cancelSubscription();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        {/* Current Subscription Status */}
        <div className={`p-4 rounded-lg border ${
          isExpired ? 'bg-red-50 border-red-200' : 
          isActive ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100' : 
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {getPlanDisplayName(currentPlan)}
                {isExpired && <AlertCircle className="w-4 h-4 text-red-500" />}
              </h3>
              <p className={`text-sm ${isExpired ? 'text-red-600' : 'text-slate-600'}`}>
                Status: {subscriptionStatus} 
                {isExpired && ' (Expired)'}
              </p>
              {renewalDate && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {isExpired ? 'Expired on' : 'Renews on'}: {formatDate(renewalDate)}
                </p>
              )}
              {subscription?.razorpay_subscription_id && (
                <p className="text-xs text-slate-400">
                  Subscription ID: {subscription.razorpay_subscription_id}
                </p>
              )}
            </div>
            <Badge variant="outline" className={`${
              currentPlan === 'pro' ? 'bg-purple-100 text-purple-700 border-purple-200' :
              currentPlan === 'basic' ? 'bg-blue-100 text-blue-700 border-blue-200' :
              'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              <Crown className="w-4 h-4 mr-1" />
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${
            proposalUsage.current >= proposalUsage.limit ? 'bg-red-50 border-red-200' : 'bg-white/30 border-white/20'
          }`}>
            <h4 className="font-medium text-slate-700">AI Proposals</h4>
            <p className={`text-2xl font-bold ${
              proposalUsage.current >= proposalUsage.limit ? 'text-red-600' : 'text-blue-600'
            }`}>
              {proposalUsage.current}
            </p>
            <p className="text-sm text-slate-500">
              / {proposalUsage.limit} this month
            </p>
            {proposalUsage.remainingUsage === 0 && (
              <p className="text-xs text-red-600 mt-1">Limit reached!</p>
            )}
          </div>
          <div className={`p-4 rounded-lg border ${
            followupUsage.current >= followupUsage.limit ? 'bg-red-50 border-red-200' : 'bg-white/30 border-white/20'
          }`}>
            <h4 className="font-medium text-slate-700">Smart Follow-ups</h4>
            <p className={`text-2xl font-bold ${
              followupUsage.current >= followupUsage.limit ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {followupUsage.current}
            </p>
            <p className="text-sm text-slate-500">
              / {followupUsage.limit} this month
            </p>
            {followupUsage.remainingUsage === 0 && (
              <p className="text-xs text-red-600 mt-1">Limit reached!</p>
            )}
          </div>
        </div>

        {/* Plan Management Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-700">Plan Management</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              className="text-xs"
            >
              Refresh Status
            </Button>
          </div>
          
          {currentPlan === 'starter' && (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
                <h5 className="font-semibold text-blue-800 mb-2">Basic Plan - {getPlanPrice('basic').display}/month</h5>
                <p className="text-blue-700 mb-3">{getPlanLimits('basic').proposals} AI proposals, {getPlanLimits('basic').followups} follow-ups monthly</p>
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
                <p className="text-purple-700 mb-3">{getPlanLimits('pro').proposals} AI proposals, {getPlanLimits('pro').followups} follow-ups monthly</p>
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
                <p className="text-purple-700 mb-3">Double your limits with {getPlanLimits('pro').proposals} proposals & {getPlanLimits('pro').followups} follow-ups</p>
                <Button 
                  onClick={() => handleUpgrade('pro')}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Upgrade to Pro
                </Button>
              </div>
              
              {isActive && !isExpired && (
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
                <p className="text-green-700">Enjoying the full power of Freelancer Copilot with {getPlanLimits('pro').proposals} monthly proposals</p>
              </div>
              
              {isActive && !isExpired && (
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

          {/* Expired subscription notice */}
          {isExpired && isPaidPlan(currentPlan) && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h5 className="font-semibold text-red-800 mb-2">Subscription Expired</h5>
              <p className="text-red-700 mb-3">Your subscription expired on {formatDate(currentPeriodEnd!)}. You've been moved to the Starter plan.</p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleUpgrade('basic')}
                  disabled={isCreating}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Reactivate Basic
                </Button>
                <Button 
                  onClick={() => handleUpgrade('pro')}
                  disabled={isCreating}
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Reactivate Pro
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
