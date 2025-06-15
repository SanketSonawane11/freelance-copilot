
import React from "react";
import { Brain } from "lucide-react";
import { useSettingsPage } from "@/hooks/useSettingsPage";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsTabs } from "@/components/settings/SettingsTabs";

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
          <p className="text-slate-600 font-medium">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <SettingsHeader currentPlan={data?.billing?.current_plan || "starter"} />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
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
