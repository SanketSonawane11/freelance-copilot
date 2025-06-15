
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, Crown } from "lucide-react";
import { Link } from "react-router-dom";

export function SettingsHeader({ currentPlan }: { currentPlan: string }) {
  return (
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
          {currentPlan}
        </Badge>
      </div>
    </header>
  );
}
