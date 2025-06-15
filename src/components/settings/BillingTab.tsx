
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Crown } from "lucide-react";

interface BillingTabProps {
  data: any;
}

export const BillingTab: React.FC<BillingTabProps> = ({ data }) => {
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
            <h3 className="font-semibold text-lg capitalize">{data?.billing?.current_plan} Plan</h3>
            <p className="text-slate-600">
              {data?.billing?.current_plan === 'pro' ? 'Advanced AI features enabled' : 'Basic AI features'}
            </p>
          </div>
          <Badge variant="outline" className="bg-white/50">
            <Crown className="w-4 h-4 mr-1" />
            {data?.billing?.current_plan === 'pro' ? 'Pro' : 'Starter'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/30 rounded-lg border border-white/20">
            <h4 className="font-medium text-slate-700">AI Proposals Used</h4>
            <p className="text-2xl font-bold text-blue-600">{data?.billing?.usage_proposals || 0}</p>
            <p className="text-sm text-slate-500">
              / {data?.billing?.current_plan === 'pro' ? '100' : '10'} this month
            </p>
          </div>
          <div className="p-4 bg-white/30 rounded-lg border border-white/20">
            <h4 className="font-medium text-slate-700">Smart Follow-ups</h4>
            <p className="text-2xl font-bold text-emerald-600">{data?.billing?.usage_followups || 0}</p>
            <p className="text-sm text-slate-500">
              / {data?.billing?.current_plan === 'pro' ? '100' : '10'} this month
            </p>
          </div>
        </div>

        {data?.billing?.current_plan === 'starter' && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
            <h4 className="font-semibold text-purple-800 mb-2">Upgrade to Pro</h4>
            <p className="text-purple-700 mb-4">Get unlimited proposals, advanced AI features, and priority support.</p>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              Upgrade Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
