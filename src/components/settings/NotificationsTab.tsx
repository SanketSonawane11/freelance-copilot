
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";

interface NotificationsTabProps {
  localSettings: any;
  handleSettingsUpdate: (updates: any) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  localSettings,
  handleSettingsUpdate,
}) => {
  return (
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
  );
};
