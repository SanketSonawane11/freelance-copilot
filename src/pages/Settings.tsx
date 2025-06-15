import React from "react";
import { Brain } from "lucide-react";
import { useSettingsPage } from "@/hooks/useSettingsPage";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { useSubscription } from "@/hooks/useSubscription";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-20 blur-xl animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Brain className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-slate-600 font-medium">Loading your settings...</p>
        </div>
      </div>
    );
  }

  // Subscription may be null or from any table; type guard
  const plan =
    subscription && (subscription.plan === "pro" || subscription.plan === "basic")
      ? subscription.plan
      : "starter";
  const status =
    subscription && typeof subscription.subscription_status === "string"
      ? subscription.subscription_status
      : "none";
  const expires =
    subscription && typeof subscription.current_period_end === "string"
      ? new Date(subscription.current_period_end).toLocaleDateString()
      : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <SettingsHeader currentPlan={plan} />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h3 className="font-bold text-xl mb-2">Your Subscription</h3>
          <div className="flex items-center gap-6">
            <span className={`px-3 py-1 rounded-full text-white font-semibold ${plan === "pro"
              ? "bg-gradient-to-r from-purple-500 to-pink-500"
              : "bg-gradient-to-r from-blue-500 to-green-500"
            }`}>
              {plan === "pro" ? "Pro Plan" : "Basic Plan"}
            </span>
            <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
              Status: {status}
            </span>
            <span className="text-sm text-gray-600">
              Expires: {expires}
            </span>
            <button
              className="ml-4 text-blue-600 hover:text-blue-800 font-medium underline"
              // TODO: Implement upgrade/downgrade flow, call backend in Stage 2
              onClick={() => window.alert("Change plan coming soon!")}
            >
              {plan === "pro" ? "Downgrade to Basic" : "Upgrade to Pro"}
            </button>
          </div>
        </div>

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
