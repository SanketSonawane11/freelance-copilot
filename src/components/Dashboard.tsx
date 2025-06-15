import { useState, useEffect } from "react";
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
  Sparkles,
  Settings,
  LogOut,
  Brain,
  Zap
} from "lucide-react";
import { ProposalWriter } from "@/components/ProposalWriter";
import { FollowUpGenerator } from "@/components/FollowUpGenerator";
import { InvoiceGenerator } from "@/components/InvoiceGenerator";
import { TaxEstimator } from "@/components/TaxEstimator";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { QuickActionDropdown } from "@/components/QuickActionDropdown";

export const Dashboard = () => {
  // Initialize state from localStorage or default to "overview"
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("dashboard-active-tab") || "overview";
  });
  
  const { user, signOut } = useAuth();
  const { data: userData, isLoading } = useUserData();

  // Update localStorage whenever activeTab changes
  useEffect(() => {
    localStorage.setItem("dashboard-active-tab", activeTab);
  }, [activeTab]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  // Handler for quick actions: switches active tab
  const handleQuickAction = (tab: "proposals" | "followups" | "invoices" | "taxes") => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-20 blur-xl animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Initializing your AI workspace...</p>
          <p className="text-slate-400 text-sm mt-2">Connecting to neural networks</p>
        </div>
      </div>
    );
  }

  // Use billing info for subscription tier and limits
  const subscriptionTier = userData?.billingInfo?.current_plan || userData?.profile?.subscription_tier || 'starter';
  const proposalLimit = subscriptionTier === 'pro' ? 100 : 10;
  const followupLimit = subscriptionTier === 'pro' ? 100 : 10;
  
  const stats = [
    { 
      label: "AI Proposals", 
      value: `${userData?.proposalsCount || 0}/${proposalLimit}`, 
      progress: ((userData?.proposalsCount || 0) / proposalLimit) * 100, 
      color: "from-blue-400 to-cyan-400",
      icon: FileText
    },
    { 
      label: "Smart Follow-ups", 
      value: `${userData?.followupsCount || 0}/${followupLimit}`, 
      progress: ((userData?.followupsCount || 0) / followupLimit) * 100, 
      color: "from-emerald-400 to-teal-400",
      icon: MessageSquare
    },
    { 
      label: "Invoices Generated", 
      value: `${userData?.invoicesCount || 0}`, 
      progress: Math.min(((userData?.invoicesCount || 0) / 10) * 100, 100), 
      color: "from-purple-400 to-pink-400",
      icon: Receipt
    },
    { 
      label: "Neural Tokens", 
      value: `${userData?.usageStats?.tokens_used || 0}`, 
      progress: Math.min(((userData?.usageStats?.tokens_used || 0) / 10000) * 100, 100), 
      color: "from-orange-400 to-rose-400",
      icon: Zap
    }
  ];

  // Dynamic recent activity from real data - fix the type issues
  const recentActivity = [
    ...(userData?.recentProposals?.map(p => ({
      action: "Generated AI proposal",
      client: p.client_name || "Unnamed Client",
      time: new Date(p.created_at).toLocaleDateString(),
      type: "proposal",
      status: p.status,
      amount: undefined as string | undefined
    })) || []),
    ...(userData?.recentInvoices?.map(i => ({
      action: "Created invoice",
      client: i.client_name,
      time: new Date(i.created_at).toLocaleDateString(),
      type: "invoice",
      amount: `₹${i.total_amount}`,
      status: undefined as string | undefined
    })) || []),
    ...(userData?.recentTaxEstimations?.map(t => ({
      action: "Tax calculation",
      client: `₹${t.monthly_income} monthly`,
      time: new Date(t.created_at).toLocaleDateString(),
      type: "tax",
      amount: undefined as string | undefined,
      status: undefined as string | undefined
    })) || [])
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header with glass effect */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-purple-500/5">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-20 blur-lg"></div>
              <div className="relative w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                Freelancer AI
              </span>
              <p className="text-xs text-slate-500 -mt-1">Neural Copilot</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50 backdrop-blur-sm capitalize">
              <Sparkles className="w-3 h-3 mr-1" />
              {subscriptionTier}
            </Badge>
            <span className="text-sm text-slate-600 font-medium">
              {userData?.profile?.name || user?.email?.split('@')[0]}
            </span>
            <Link to="/settings">
              <Button variant="ghost" size="sm" className="hover:bg-white/50 transition-all duration-300">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-red-50/50 transition-all duration-300">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar with glass effect */}
        <aside className="w-64 backdrop-blur-xl bg-white/40 border-r border-white/20 min-h-screen p-6">
          <nav className="space-y-2">
            <Button 
              variant={activeTab === "overview" ? "default" : "ghost"} 
              className={`w-full justify-start transition-all duration-300 ${
                activeTab === "overview" 
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25" 
                  : "hover:bg-white/50 text-slate-700"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              <TrendingUp className="w-4 h-4 mr-3" />
              Neural Dashboard
            </Button>
            <Button 
              variant={activeTab === "proposals" ? "default" : "ghost"} 
              className={`w-full justify-start transition-all duration-300 ${
                activeTab === "proposals" 
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25" 
                  : "hover:bg-white/50 text-slate-700"
              }`}
              onClick={() => setActiveTab("proposals")}
            >
              <FileText className="w-4 h-4 mr-3" />
              AI Proposals
            </Button>
            <Button 
              variant={activeTab === "followups" ? "default" : "ghost"} 
              className={`w-full justify-start transition-all duration-300 ${
                activeTab === "followups" 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25" 
                  : "hover:bg-white/50 text-slate-700"
              }`}
              onClick={() => setActiveTab("followups")}
            >
              <MessageSquare className="w-4 h-4 mr-3" />
              Smart Follow-ups
            </Button>
            <Button 
              variant={activeTab === "invoices" ? "default" : "ghost"} 
              className={`w-full justify-start transition-all duration-300 ${
                activeTab === "invoices" 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25" 
                  : "hover:bg-white/50 text-slate-700"
              }`}
              onClick={() => setActiveTab("invoices")}
            >
              <Receipt className="w-4 h-4 mr-3" />
              Smart Invoicing
            </Button>
            <Button 
              variant={activeTab === "taxes" ? "default" : "ghost"} 
              className={`w-full justify-start transition-all duration-300 ${
                activeTab === "taxes" 
                  ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/25" 
                  : "hover:bg-white/50 text-slate-700"
              }`}
              onClick={() => setActiveTab("taxes")}
            >
              <Calculator className="w-4 h-4 mr-3" />
              Tax AI
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                    Welcome back! ✨
                  </h1>
                  <p className="text-slate-600 mt-1">Your AI-powered freelance command center</p>
                </div>
                <QuickActionDropdown onAction={handleQuickAction} />
              </div>

              {/* Stats Grid with glass effect */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <Card key={index} className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-slate-600">{stat.label}</h3>
                          <div className="relative">
                            <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-lg opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-300`}></div>
                            <div className={`relative w-8 h-8 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                              <IconComponent className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 mb-3">{stat.value}</p>
                        <Progress value={stat.progress} className="h-2 bg-slate-200/50" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recent Activity with real data */}
              <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                    <CardTitle className="text-slate-800">Neural Activity Stream</CardTitle>
                  </div>
                  <CardDescription className="text-slate-600">Real-time insights from your AI assistant</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/20 hover:bg-white/40 transition-all duration-300 group">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            activity.type === "proposal" ? "bg-gradient-to-r from-blue-400 to-cyan-400" :
                            activity.type === "invoice" ? "bg-gradient-to-r from-purple-400 to-pink-400" :
                            "bg-gradient-to-r from-orange-400 to-rose-400"
                          } shadow-lg`}>
                            {activity.type === "proposal" && <FileText className="w-5 h-5 text-white" />}
                            {activity.type === "invoice" && <Receipt className="w-5 h-5 text-white" />}
                            {activity.type === "tax" && <Calculator className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors duration-300">
                              {activity.action}
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <span>{activity.client}</span>
                              {activity.amount && <span className="text-emerald-600 font-medium">{activity.amount}</span>}
                              {activity.status && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 font-medium">{activity.time}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-50">
                        <Brain className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 text-lg font-medium mb-2">No neural activity detected</p>
                      <p className="text-slate-400">Start by creating your first AI-powered proposal!</p>
                    </div>
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
