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
  Zap,
  LayoutDashboard
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
import { ThemeToggle } from "@/components/ThemeToggle";

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("dashboard-active-tab") || "overview";
  });
  
  const { user, signOut } = useAuth();
  const { data: userData, isLoading } = useUserData();

  useEffect(() => {
    localStorage.setItem("dashboard-active-tab", activeTab);
  }, [activeTab]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  const handleQuickAction = (tab: "proposals" | "followups" | "invoices" | "taxes") => {
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const subscriptionTier = userData?.billingInfo?.current_plan || userData?.profile?.subscription_tier || 'starter';
  const proposalLimit = subscriptionTier === 'pro' ? 100 : 10;
  const followupLimit = subscriptionTier === 'pro' ? 100 : 10;

  const proposalsUsed = userData?.usageStats?.proposals_used ?? 0;
  const followupsUsed = userData?.usageStats?.followups_used ?? 0;

  const stats = [
    { 
      label: "AI Proposals", 
      value: `${proposalsUsed}/${proposalLimit}`, 
      progress: (proposalsUsed / proposalLimit) * 100, 
      icon: FileText
    },
    { 
      label: "Smart Follow-ups", 
      value: `${followupsUsed}/${followupLimit}`, 
      progress: (followupsUsed / followupLimit) * 100, 
      icon: MessageSquare
    },
    { 
      label: "Invoices", 
      value: `${userData?.invoicesCount || 0}`, 
      progress: Math.min(((userData?.invoicesCount || 0) / 10) * 100, 100), 
      icon: Receipt
    },
    { 
      label: "AI Tokens", 
      value: `${userData?.usageStats?.tokens_used || 0}`, 
      progress: Math.min(((userData?.usageStats?.tokens_used || 0) / 10000) * 100, 100), 
      icon: Zap
    }
  ];

  const recentActivity = [
    ...(userData?.recentProposals?.map(p => ({
      action: "Generated proposal",
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
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  const navItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "proposals", label: "Proposals", icon: FileText },
    { id: "followups", label: "Follow-ups", icon: MessageSquare },
    { id: "invoices", label: "Invoices", icon: Receipt },
    { id: "taxes", label: "Tax Calculator", icon: Calculator }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground">Freelancer AI</span>
              <p className="text-xs text-muted-foreground hidden sm:block">Workspace</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex capitalize">
              <Sparkles className="w-3 h-3 mr-1" />
              {subscriptionTier}
            </Badge>
            <span className="text-sm text-muted-foreground hidden md:block">
              {userData?.profile?.name || user?.email?.split('@')[0]}
            </span>
            <ThemeToggle />
            <Link to="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-r min-h-[calc(100vh-4rem)] bg-card">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
          <div className="flex justify-around p-2">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Welcome back! ✨
                  </h1>
                  <p className="text-muted-foreground mt-1">Here's what's happening with your freelance work</p>
                </div>
                <QuickActionDropdown onAction={handleQuickAction} />
              </div>

              {/* Stats Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-3">{stat.value}</p>
                        <Progress value={stat.progress} className="h-2" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <CardTitle>Recent Activity</CardTitle>
                  </div>
                  <CardDescription>Your latest actions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent text-accent-foreground">
                            {activity.type === "proposal" && <FileText className="w-5 h-5" />}
                            {activity.type === "invoice" && <Receipt className="w-5 h-5" />}
                            {activity.type === "tax" && <Calculator className="w-5 h-5" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{activity.action}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="truncate">{activity.client}</span>
                              {activity.amount && <span className="font-medium text-emerald-600">{activity.amount}</span>}
                              {activity.status && <Badge variant="outline" className="text-xs">{activity.status}</Badge>}
                            </div>
                          </div>
                          
                          <span className="text-sm text-muted-foreground hidden sm:block">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No activity yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Start by creating your first proposal!</p>
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
