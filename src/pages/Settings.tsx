
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  User, 
  Building2, 
  Receipt, 
  CreditCard, 
  Bell, 
  Shield, 
  Upload, 
  Download, 
  Trash2,
  Crown,
  Brain,
  ArrowLeft
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";

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
    ...data?.settings,
    bank_details: parseBankDetails(data?.settings?.bank_details)
  });
  
  const [localProfile, setLocalProfile] = useState({
    id: '',
    name: '',
    profile_picture: null as string | null,
    login_method: 'email',
    ...data?.profile
  });

  React.useEffect(() => {
    if (data?.settings) {
      setLocalSettings(prev => ({ 
        ...prev, 
        ...data.settings,
        bank_details: parseBankDetails(data.settings.bank_details)
      }));
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
        toast.error('File size must be less than 2MB');
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

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Account Information</span>
                </CardTitle>
                <CardDescription>Manage your personal details and profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={localProfile.profile_picture || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-400 text-white text-lg">
                        {localProfile.name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload className="w-4 h-4" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={localProfile.name || ''}
                          onChange={(e) => setLocalProfile(prev => ({ ...prev, name: e.target.value }))}
                          onBlur={() => handleProfileUpdate({ name: localProfile.name })}
                          className="bg-white/50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={user?.email || ''}
                          disabled
                          className="bg-gray-100/50"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Login Method</Label>
                      <div className="mt-2">
                        <Badge variant="outline">{localProfile.login_method || 'Email'}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Settings */}
          <TabsContent value="business" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Business & Invoice Defaults</span>
                </CardTitle>
                <CardDescription>Configure your business information for invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input
                      id="business-name"
                      value={localSettings.business_name || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, business_name: e.target.value }))}
                      onBlur={() => handleSettingsUpdate({ business_name: localSettings.business_name })}
                      className="bg-white/50"
                      placeholder="Your Business Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gst-number">GST Number</Label>
                    <Input
                      id="gst-number"
                      value={localSettings.gst_number || ''}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, gst_number: e.target.value }))}
                      onBlur={() => handleSettingsUpdate({ gst_number: localSettings.gst_number })}
                      className="bg-white/50"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    value={localSettings.address || ''}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, address: e.target.value }))}
                    onBlur={() => handleSettingsUpdate({ address: localSettings.address })}
                    className="bg-white/50"
                    placeholder="Your complete business address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="upi">UPI ID</Label>
                    <Input
                      id="upi"
                      value={localSettings.bank_details?.upi || ''}
                      onChange={(e) => setLocalSettings(prev => ({ 
                        ...prev, 
                        bank_details: { ...prev.bank_details, upi: e.target.value }
                      }))}
                      onBlur={() => handleSettingsUpdate({ bank_details: localSettings.bank_details })}
                      className="bg-white/50"
                      placeholder="yourname@upi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account">Account Number</Label>
                    <Input
                      id="account"
                      value={localSettings.bank_details?.account || ''}
                      onChange={(e) => setLocalSettings(prev => ({ 
                        ...prev, 
                        bank_details: { ...prev.bank_details, account: e.target.value }
                      }))}
                      onBlur={() => handleSettingsUpdate({ bank_details: localSettings.bank_details })}
                      className="bg-white/50"
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    <Input
                      id="ifsc"
                      value={localSettings.bank_details?.ifsc || ''}
                      onChange={(e) => setLocalSettings(prev => ({ 
                        ...prev, 
                        bank_details: { ...prev.bank_details, ifsc: e.target.value }
                      }))}
                      onBlur={() => handleSettingsUpdate({ bank_details: localSettings.bank_details })}
                      className="bg-white/50"
                      placeholder="IFSC code"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Default Currency</Label>
                    <Select 
                      value={localSettings.default_currency} 
                      onValueChange={(value) => handleSettingsUpdate({ default_currency: value })}
                    >
                      <SelectTrigger className="bg-white/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tax Regime</Label>
                    <RadioGroup 
                      value={localSettings.tax_regime} 
                      onValueChange={(value) => handleSettingsUpdate({ tax_regime: value })}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="44ADA" id="44ada" />
                        <Label htmlFor="44ada">44ADA (Presumptive Taxation)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Regular" id="regular" />
                        <Label htmlFor="regular">Regular Taxation</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="NotSure" id="notsure" />
                        <Label htmlFor="notsure">Not Sure</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing & Subscription */}
          <TabsContent value="billing" className="space-y-6">
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
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>Control what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="proposal-tips">Proposal Strategy Tips</Label>
                      <p className="text-sm text-slate-600">Get weekly emails with proposal writing tips</p>
                    </div>
                    <Switch
                      id="proposal-tips"
                      checked={localSettings.proposal_tips_optin}
                      onCheckedChange={(checked) => handleSettingsUpdate({ proposal_tips_optin: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="tax-reminders">Tax Filing Reminders</Label>
                      <p className="text-sm text-slate-600">Quarterly and yearly tax deadline alerts</p>
                    </div>
                    <Switch
                      id="tax-reminders"
                      checked={localSettings.tax_reminder_optin}
                      onCheckedChange={(checked) => handleSettingsUpdate({ tax_reminder_optin: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="invoice-alerts">Invoice Notifications</Label>
                      <p className="text-sm text-slate-600">Get notified when clients view or download invoices</p>
                    </div>
                    <Switch
                      id="invoice-alerts"
                      checked={localSettings.invoice_alerts_optin}
                      onCheckedChange={(checked) => handleSettingsUpdate({ invoice_alerts_optin: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="quarterly-reminder">Quarterly Tax Reminders</Label>
                      <p className="text-sm text-slate-600">Specialized reminders for quarterly filings</p>
                    </div>
                    <Switch
                      id="quarterly-reminder"
                      checked={localSettings.quarterly_reminder}
                      onCheckedChange={(checked) => handleSettingsUpdate({ quarterly_reminder: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Data */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-lg shadow-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Data & Privacy</span>
                </CardTitle>
                <CardDescription>Manage your data and account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <div>
                      <h4 className="font-medium">Export My Data</h4>
                      <p className="text-sm text-slate-600">Download all your data in JSON format</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => exportData()}
                      disabled={isExporting}
                      className="bg-white/50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-yellow-50/50 rounded-lg border border-yellow-100">
                    <div>
                      <h4 className="font-medium">Privacy Policy & Terms</h4>
                      <p className="text-sm text-slate-600">Review our privacy policy and terms of service</p>
                    </div>
                    <Button variant="outline" className="bg-white/50">
                      View Terms
                    </Button>
                  </div>

                  <div className="p-4 bg-red-50/50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2">Danger Zone</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isDeleting ? 'Deleting...' : 'Delete Account'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your account and all associated data including proposals, invoices, and settings. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAccount()}>
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
