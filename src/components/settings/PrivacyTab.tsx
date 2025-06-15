
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Download, Trash2 } from "lucide-react";

interface PrivacyTabProps {
  exportData: () => void;
  deleteAccount: () => void;
  isExporting: boolean;
  isDeleting: boolean;
}

export const PrivacyTab: React.FC<PrivacyTabProps> = ({
  exportData,
  deleteAccount,
  isExporting,
  isDeleting,
}) => {
  return (
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
  );
};
