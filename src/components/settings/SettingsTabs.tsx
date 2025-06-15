
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building2, CreditCard, Bell, Shield } from "lucide-react";
import { AccountTab } from "@/components/settings/AccountTab";
import { BusinessTab } from "@/components/settings/BusinessTab";
import { BillingTab } from "@/components/settings/BillingTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { PrivacyTab } from "@/components/settings/PrivacyTab";

interface SettingsTabsProps {
  user: any;
  data: any;
  localSettings: any;
  setLocalSettings: any;
  localProfile: any;
  setLocalProfile: any;
  handleSettingsUpdate: any;
  handleProfileUpdate: any;
  handleAvatarUpload: any;
  exportData: any;
  deleteAccount: any;
  isUploading: boolean;
  isExporting: boolean;
  isDeleting: boolean;
}

export function SettingsTabs({
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
  isUploading,
  isExporting,
  isDeleting
}: SettingsTabsProps) {
  return (
    <Tabs defaultValue="account" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 backdrop-blur-xl bg-white/40 border border-white/20">
        <TabsTrigger value="account" className="data-[state=active]:bg-white/80">
          <User className="w-4 h-4 mr-2" />
          Account
        </TabsTrigger>
        <TabsTrigger value="business" className="data-[state=active]:bg-white/80">
          <Building2 className="w-4 h-4 mr-2" />
          Business
        </TabsTrigger>
        <TabsTrigger value="billing" className="data-[state=active]:bg-white/80">
          <CreditCard className="w-4 h-4 mr-2" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="notifications" className="data-[state=active]:bg-white/80">
          <Bell className="w-4 h-4 mr-2" />
          Alerts
        </TabsTrigger>
        <TabsTrigger value="privacy" className="data-[state=active]:bg-white/80">
          <Shield className="w-4 h-4 mr-2" />
          Privacy
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="space-y-6">
        <AccountTab
          user={user}
          localProfile={localProfile}
          setLocalProfile={setLocalProfile}
          handleProfileUpdate={handleProfileUpdate}
          handleAvatarUpload={handleAvatarUpload}
          isUploading={isUploading}
        />
      </TabsContent>

      <TabsContent value="business" className="space-y-6">
        <BusinessTab
          localSettings={localSettings}
          setLocalSettings={setLocalSettings}
          handleSettingsUpdate={handleSettingsUpdate}
        />
      </TabsContent>

      <TabsContent value="billing" className="space-y-6">
        <BillingTab data={data} />
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <NotificationsTab
          localSettings={localSettings}
          handleSettingsUpdate={handleSettingsUpdate}
        />
      </TabsContent>

      <TabsContent value="privacy" className="space-y-6">
        <PrivacyTab
          exportData={exportData}
          deleteAccount={deleteAccount}
          isExporting={isExporting}
          isDeleting={isDeleting}
        />
      </TabsContent>
    </Tabs>
  );
}
