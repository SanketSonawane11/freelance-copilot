import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Building2, 
  CreditCard, 
  Bell, 
  Shield, 
  Crown,
  Brain,
  ArrowLeft
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { AccountTab } from "@/components/settings/AccountTab";
import { BusinessTab } from "@/components/settings/BusinessTab";
import { BillingTab } from "@/components/settings/BillingTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { PrivacyTab } from "@/components/settings/PrivacyTab";

const Settings = () => {
  const { user } = useAuth();
  const { data, updateSettings, updateProfile, uploadAvatar, exportData, deleteAccount, isLoading, isUpdating, isUploading, isExporting, isDeleting } = useSettings();
  
  // Helper function to safely parse bank details
  const parseBankDetails = (bankDetails: any) => {
    if (!bankDetails) return { upi: '', account: '', ifsc: '' };
    if (typeof bankDetails === 'string') {
      try {
        return JSON.parse(bankDetails);
      } catch {
        return { upi: '', account: '', ifsc: '' };
      }
    }
    if (typeof bankDetails === 'object') return bankDetails;
    return { upi: '', account: '', ifsc: '' };
  };
  
  // --- Normalization helper for settings from Supabase ---
  function normalizeSettings(raw: any) {
    // fallback to default if any field is null or missing
    return {
      user_id: raw?.user_id || '',
      business_name: raw?.business_name || '',
      gst_number: raw?.gst_number || '',
      address: raw?.address || '',
      bank_details: parseBankDetails(raw?.bank_details),
      default_currency: raw?.default_currency || 'INR',
      // Cast tax_regime defensively to allowed union
      tax_regime: (raw?.tax_regime === "44ADA" || raw?.tax_regime === "Regular" || raw?.tax_regime === "NotSure")
        ? raw.tax_regime
        : "NotSure",
      quarterly_reminder: typeof raw?.quarterly_reminder === "boolean" ? raw.quarterly_reminder : false,
      proposal_tips_optin: typeof raw?.proposal_tips_optin === "boolean" ? raw.proposal_tips_optin : true,
      tax_reminder_optin: typeof raw?.tax_reminder_optin === "boolean" ? raw.tax_reminder_optin : true,
      invoice_alerts_optin: typeof raw?.invoice_alerts_optin === "boolean" ? raw.invoice_alerts_optin : true,
    };
  }
  
  // Initialize with proper default values to avoid TypeScript errors
  const [localSettings, setLocalSettings] = useState({
    user_id: '',
    business_name: '',
    gst_number: '',
    address: '',
    bank_details: { upi: '', account: '', ifsc: '' },
    default_currency: 'INR',
    tax_regime: 'NotSure' as 'NotSure' | '44ADA' | 'Regular',
    quarterly_reminder: false,
    proposal_tips_optin: true,
    tax_reminder_optin: true,
    invoice_alerts_optin: true,
  });
  
  const [localProfile, setLocalProfile] = useState({
    id: '',
    name: '',
    profile_picture: null as string | null,
    login_method: 'email',
  });

  React.useEffect(() => {
    if (data?.settings) {
      setLocalSettings(normalizeSettings(data.settings));
    }
    if (data?.profile) {
      setLocalProfile(prev => ({ ...prev, ...data.profile }));
    }
  }, [data]);

  const handleSettingsUpdate = (updates: any) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };

  const handleProfileUpdate = (updates: any) => {
    const newProfile = { ...localProfile, ...updates };
    setLocalProfile(newProfile);
    updateProfile(updates);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return;
      }
      uploadAvatar(file);
    }
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
          <p className="text-slate-600 font-medium">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-purple-500/5">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="hover:bg-white/50 transition-all duration-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-20 blur-lg"></div>
                <div className="relative w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-xs text-slate-500 -mt-1">Neural Configuration</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50 backdrop-blur-sm capitalize">
            <Crown className="w-3 h-3 mr-1" />
            {data?.billing?.current_plan || 'starter'}
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
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
      </div>
    </div>
  );
};

export default Settings;
