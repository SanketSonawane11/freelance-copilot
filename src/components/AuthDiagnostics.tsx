import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

const AuthDiagnostics = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<{
    reachable: boolean | null;
    message: string;
    origin: string;
  }>({
    reachable: null,
    message: "",
    origin: window.location.origin,
  });

  const runDiagnostics = async () => {
    setIsChecking(true);
    const origin = window.location.origin;
    
    try {
      const response = await fetch(
        "https://ckphagoaqnpqkaoghcyz.supabase.co/auth/v1/settings",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatus({
          reachable: true,
          message: `Auth is reachable! Email provider: ${data.external?.email ? "enabled" : "disabled"}`,
          origin,
        });
      } else {
        setStatus({
          reachable: false,
          message: `Auth responded with status ${response.status}. Check your Supabase configuration.`,
          origin,
        });
      }
    } catch (error: any) {
      setStatus({
        reachable: false,
        message: error.name === "TypeError" || error.message.includes("Failed to fetch")
          ? "Cannot reach Supabase Auth from this origin. CORS configuration needed."
          : `Error: ${error.message}`,
        origin,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copyOrigin = () => {
    navigator.clipboard.writeText(status.origin);
    toast.success("Origin copied to clipboard!");
  };

  return (
    <Card className="max-w-md mx-auto mt-6 border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Auth Diagnostics
        </CardTitle>
        <CardDescription className="text-xs">
          Test connectivity to Supabase Auth
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={runDiagnostics}
          disabled={isChecking}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Run Checks"
          )}
        </Button>

        {status.reachable !== null && (
          <div
            className={`p-3 rounded-lg text-sm ${
              status.reachable
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-2">
              {status.reachable ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <p className="font-medium">{status.message}</p>
                {!status.reachable && (
                  <>
                    <div className="mt-2 p-2 bg-white/50 rounded border border-current/20">
                      <p className="text-xs font-mono break-all">{status.origin}</p>
                      <Button
                        onClick={copyOrigin}
                        variant="ghost"
                        size="sm"
                        className="h-6 mt-1 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Origin
                      </Button>
                    </div>
                    <p className="text-xs mt-2">
                      Add this origin to:
                      <br />
                      1. <strong>Authentication → URL Configuration → Additional Redirect URLs</strong>
                      <br />
                      2. <strong>Authentication → URL Configuration → Allowed CORS Origins</strong>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDiagnostics;
