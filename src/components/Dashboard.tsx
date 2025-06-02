
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  MessageSquare, 
  Receipt, 
  Calculator, 
  TrendingUp, 
  Zap,
  Settings,
  LogOut
} from "lucide-react";
import { ProposalWriter } from "@/components/ProposalWriter";
import { FollowUpGenerator } from "@/components/FollowUpGenerator";
import { InvoiceGenerator } from "@/components/InvoiceGenerator";
import { TaxEstimator } from "@/components/TaxEstimator";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "sonner";

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, signOut } = useAuth();
  const { data: userData, isLoading } = useUserData();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const proposalLimit = userData?.profile?.subscription_tier === 'pro' ? 100 : 10;
  const followupLimit = userData?.profile?.subscription_tier === 'pro' ? 100 : 10;
  
  const stats = [
    { 
      label: "Proposals This Month", 
      value: `${userData?.proposalsCount || 0}/${proposalLimit}`, 
      progress: ((userData?.proposalsCount || 0) / proposalLimit) * 100, 
      color: "bg-blue-500" 
    },
    { 
      label: "Follow-ups Sent", 
      value: `${userData?.followupsCount || 0}/${followupLimit}`, 
      progress: ((userData?.followupsCount || 0) / followupLimit) * 100, 
      color: "bg-green-500" 
    },
    { 
      label: "Invoices Generated", 
      value: `${userData?.invoicesCount || 0}`, 
      progress: 100, 
      color: "bg-purple-500" 
    },
    { 
      label: "Total Tokens Used", 
      value: `${userData?.usageStats?.tokens_used || 0}`, 
      progress: 100, 
      color: "bg-orange-500" 
    }
  ];

  // Combine recent activity from different sources
  const recentActivity = [
    ...(userData?.recentProposals?.map(p => ({
      action: "Generated proposal",
      client: p.client_name || "Unnamed Client",
      time: new Date(p.created_at).toLocaleDateString(),
      type: "proposal"
    })) || []),
    ...(userData?.recentInvoices?.map(i => ({
      action: "Created invoice",
      client: i.client_name,
      time: new Date(i.created_at).toLocaleDateString(),
      type: "invoice"
    })) || []),
    ...(userData?.recentTaxEstimations?.map(t => ({
      action: "Tax calculation",
      client: `₹${t.monthly_income} monthly`,
      time: new Date(t.created_at).toLocaleDateString(),
      type: "tax"
    })) || [])
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Freelancer Copilot</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-green-600 border-green-200 capitalize">
              {userData?.profile?.subscription_tier || 'starter'} Plan
            </Badge>
            <span className="text-sm text-gray-600">
              Welcome, {userData?.profile?.name || user?.email}
            </span>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen p-6">
          <nav className="space-y-2">
            <Button 
              variant={activeTab === "overview" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("overview")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button 
              variant={activeTab === "proposals" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("proposals")}
            >
              <FileText className="w-4 h-4 mr-2" />
              AI Proposals
            </Button>
            <Button 
              variant={activeTab === "followups" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("followups")}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Follow-ups
            </Button>
            <Button 
              variant={activeTab === "invoices" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("invoices")}
            >
              <Receipt className="w-4 h-4 mr-2" />
              Invoicing
            </Button>
            <Button 
              variant={activeTab === "taxes" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("taxes")}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Tax Estimator
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Welcome back! 👋</h1>
                <Button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                  Quick Action
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                        <div className={`w-2 h-2 rounded-full ${stat.color}`}></div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</p>
                      <Progress value={stat.progress} className="h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest actions across all tools</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            {activity.type === "proposal" && <FileText className="w-4 h-4 text-blue-600" />}
                            {activity.type === "followup" && <MessageSquare className="w-4 h-4 text-green-600" />}
                            {activity.type === "invoice" && <Receipt className="w-4 h-4 text-purple-600" />}
                            {activity.type === "tax" && <Calculator className="w-4 h-4 text-orange-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.action}</p>
                            <p className="text-sm text-gray-600">{activity.client}</p>
                          </div>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No recent activity. Start by creating your first proposal!</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "proposals" && <ProposalWriter />}
          {activeTab === "followups" && <FollowUpGenerator />}
          {activeTab === "invoices" && <InvoiceGenerator />}
          {activeTab === "taxes" && <TaxEstimator />}
        </main>
      </div>
    </div>
  );
};
