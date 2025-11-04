import React from "react";
import { Brain, ArrowLeft } from "lucide-react";
import { useSettingsPage } from "@/hooks/useSettingsPage";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

const Settings = () => {
  const {
    user,
    data,
    localSettings,
    setLocalSettings,
    localProfile,
    setLocalProfile,
    handleSettingsUpdate,
    handleProfileUpdate,
    handleAvatarUpload,
    exportData,
    deleteAccount,
    isLoading,
    isUploading,
    isExporting,
    isDeleting
  } = useSettingsPage();
  const { data: subscription, isLoading: subLoading } = useSubscription();

  if (isLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const plan = subscription?.current_plan || "starter";
  const status = subscription?.subscription_status || "inactive";
  const expires = subscription?.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : "N/A";

  return (
    <div className="min-h-screen bg-background">
      <SettingsHeader currentPlan={plan} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Subscription Status</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Badge
                variant="secondary"
                className={`text-sm font-medium px-4 py-2 ${
                  plan === "pro"
                    ? "bg-primary/10 text-primary"
                    : plan === "basic"
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted"
                }`}
              >
                {plan === "pro" ? "Pro Plan" : plan === "basic" ? "Basic Plan" : "Starter Plan"}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  status === "active"
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground"
                }`}
              >
                {status === "active" ? "✓ Active" : "Inactive"}
              </Badge>
              {subscription?.current_period_end && (
                <span className="text-sm text-muted-foreground">
                  Renews: {expires}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <SettingsTabs
          user={user}
          data={data}
          localSettings={localSettings}
          setLocalSettings={setLocalSettings}
          localProfile={localProfile}
          setLocalProfile={setLocalProfile}
          handleSettingsUpdate={handleSettingsUpdate}
          handleProfileUpdate={handleProfileUpdate}
          handleAvatarUpload={handleAvatarUpload}
          exportData={exportData}
          deleteAccount={deleteAccount}
          isUploading={isUploading}
          isExporting={isExporting}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
};

export default Settings;
