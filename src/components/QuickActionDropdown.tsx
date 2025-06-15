
import * as React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, MessageSquare, Receipt, Calculator } from "lucide-react";

interface QuickActionDropdownProps {
  onAction: (tab: "proposals" | "followups" | "invoices" | "taxes") => void;
}

export const QuickActionDropdown: React.FC<QuickActionDropdownProps> = ({ onAction }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-purple-500/25 transition-all duration-300">
          <Sparkles className="w-4 h-4 mr-2" />
          Quick Action
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="min-w-[180px]">
        <DropdownMenuItem onClick={() => onAction("proposals")}>
          <FileText className="w-4 h-4 mr-2" />
          New Proposal
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("followups")}>
          <MessageSquare className="w-4 h-4 mr-2" />
          New Follow-up
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("invoices")}>
          <Receipt className="w-4 h-4 mr-2" />
          New Invoice
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("taxes")}>
          <Calculator className="w-4 h-4 mr-2" />
          New Tax Estimation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
