
import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";

// Helper function to safely parse bank details
const parseBankDetails = (bankDetails: any) => {
  if (!bankDetails) return { upi: "", account: "", ifsc: "" };
  if (typeof bankDetails === "string") {
    try {
      return JSON.parse(bankDetails);
    } catch {
      return { upi: "", account: "", ifsc: "" };
    }
  }
  if (typeof bankDetails === "object") return bankDetails;
  return { upi: "", account: "", ifsc: "" };
};

// Normalization helper for settings from Supabase
function normalizeSettings(raw: any) {
  // fallback to default if any field is null or missing
  return {
    user_id: raw?.user_id || "",
    business_name: raw?.business_name || "",
    gst_number: raw?.gst_number || "",
    address: raw?.address || "",
    bank_details: parseBankDetails(raw?.bank_details),
    default_currency: raw?.default_currency || "INR",
    tax_regime:
      raw?.tax_regime === "44ADA" ||
      raw?.tax_regime === "Regular" ||
      raw?.tax_regime === "NotSure"
        ? raw.tax_regime
        : "NotSure",
    quarterly_reminder:
      typeof raw?.quarterly_reminder === "boolean"
        ? raw.quarterly_reminder
        : false,
    proposal_tips_optin:
      typeof raw?.proposal_tips_optin === "boolean"
        ? raw.proposal_tips_optin
        : true,
    tax_reminder_optin:
      typeof raw?.tax_reminder_optin === "boolean"
        ? raw.tax_reminder_optin
        : true,
    invoice_alerts_optin:
      typeof raw?.invoice_alerts_optin === "boolean"
        ? raw.invoice_alerts_optin
        : true,
  };
}

export function useSettingsPage() {
  const { user } = useAuth();
  const {
    data,
    updateSettings,
    updateProfile,
    uploadAvatar,
    exportData,
    deleteAccount,
    isLoading,
    isUpdating,
    isUploading,
    isExporting,
    isDeleting
  } = useSettings();

  const [localSettings, setLocalSettings] = useState({
    user_id: "",
    business_name: "",
    gst_number: "",
    address: "",
    bank_details: { upi: "", account: "", ifsc: "" },
    default_currency: "INR",
    tax_regime: "NotSure" as "NotSure" | "44ADA" | "Regular",
    quarterly_reminder: false,
    proposal_tips_optin: true,
    tax_reminder_optin: true,
    invoice_alerts_optin: true,
  });

  const [localProfile, setLocalProfile] = useState({
    id: "",
    name: "",
    profile_picture: null as string | null,
    login_method: "email"
  });

  useEffect(() => {
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

  return {
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
    isUpdating,
    isUploading,
    isExporting,
    isDeleting
  };
}
