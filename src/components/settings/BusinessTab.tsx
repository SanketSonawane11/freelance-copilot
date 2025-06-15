
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2 } from "lucide-react";

interface BusinessTabProps {
  localSettings: any;
  setLocalSettings: (settings: any) => void;
  handleSettingsUpdate: (updates: any) => void;
}

export const BusinessTab: React.FC<BusinessTabProps> = ({
  localSettings,
  setLocalSettings,
  handleSettingsUpdate,
}) => {
  return (
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
              onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, business_name: e.target.value }))}
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
              onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, gst_number: e.target.value }))}
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
            onChange={(e) => setLocalSettings((prev: any) => ({ ...prev, address: e.target.value }))}
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
              onChange={(e) => setLocalSettings((prev: any) => ({ 
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
              onChange={(e) => setLocalSettings((prev: any) => ({ 
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
              onChange={(e) => setLocalSettings((prev: any) => ({ 
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
  );
};
