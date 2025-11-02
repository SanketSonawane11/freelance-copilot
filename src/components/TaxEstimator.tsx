import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, Calendar, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const TaxEstimator = () => {
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");
  const [taxRegime, setTaxRegime] = useState("new");
  const [result, setResult] = useState<any>(null);
  const [taxTips, setTaxTips] = useState<any[]>([]);
  const [importantDates, setImportantDates] = useState<any[]>([]);
  const [currentFinancialYear, setCurrentFinancialYear] = useState("");
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  const calculateTax = () => {
    const grossIncome = parseFloat(income) || 0;
    const totalExpenses = parseFloat(expenses) || 0;
    const taxableIncome = Math.max(0, grossIncome - totalExpenses);

    let tax = 0;
    let effectiveRate = 0;

    if (taxRegime === "new") {
      if (taxableIncome <= 300000) {
        tax = 0;
      } else if (taxableIncome <= 600000) {
        tax = (taxableIncome - 300000) * 0.05;
      } else if (taxableIncome <= 900000) {
        tax = 15000 + (taxableIncome - 600000) * 0.10;
      } else if (taxableIncome <= 1200000) {
        tax = 45000 + (taxableIncome - 900000) * 0.15;
      } else if (taxableIncome <= 1500000) {
        tax = 90000 + (taxableIncome - 1200000) * 0.20;
      } else {
        tax = 150000 + (taxableIncome - 1500000) * 0.30;
      }
    } else {
      if (taxableIncome <= 250000) {
        tax = 0;
      } else if (taxableIncome <= 500000) {
        tax = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        tax = 12500 + (taxableIncome - 500000) * 0.20;
      } else {
        tax = 112500 + (taxableIncome - 1000000) * 0.30;
      }
    }

    effectiveRate = taxableIncome > 0 ? (tax / taxableIncome) * 100 : 0;
    const cessAmount = tax * 0.04;
    const totalTax = tax + cessAmount;

    setResult({
      grossIncome,
      totalExpenses,
      taxableIncome,
      tax: totalTax,
      effectiveRate,
      cessAmount,
      regime: taxRegime
    });

    toast.success("Tax calculation completed!");
  };

  const fetchTaxTips = async () => {
    setIsLoadingTips(true);
    try {
      const { data, error } = await supabase.functions.invoke('tax-data', {
        body: { type: 'tips' }
      });
      
      if (error) throw error;
      
      setTaxTips(data?.data || []);
      setCurrentFinancialYear(data?.financialYear || "2025-26");
      toast.success("Tax tips updated!");
    } catch (error) {
      console.error('Error fetching tax tips:', error);
      toast.error("Failed to fetch tax tips");
    } finally {
      setIsLoadingTips(false);
    }
  };

  const fetchImportantDates = async () => {
    setIsLoadingDates(true);
    try {
      const { data, error } = await supabase.functions.invoke('tax-data', {
        body: { type: 'dates' }
      });
      
      if (error) throw error;
      
      setImportantDates(data?.data || []);
      setCurrentFinancialYear(data?.financialYear || "2025-26");
      toast.success("Important dates updated!");
    } catch (error) {
      console.error('Error fetching important dates:', error);
      toast.error("Failed to fetch important dates");
    } finally {
      setIsLoadingDates(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tax Calculator</h1>
        <p className="text-muted-foreground mt-1">Calculate your tax liability and get insights for FY {currentFinancialYear || "2025-26"}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calculator className="w-5 h-5 mr-2 text-primary" />
              Tax Calculator
            </CardTitle>
            <CardDescription>Calculate your estimated tax liability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="income" className="text-sm font-medium">Annual Gross Income (₹)</Label>
              <Input
                id="income"
                type="number"
                placeholder="e.g., 1200000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenses" className="text-sm font-medium">Business Expenses (₹)</Label>
              <Input
                id="expenses"
                type="number"
                placeholder="e.g., 200000"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-regime" className="text-sm font-medium">Tax Regime</Label>
              <Select value={taxRegime} onValueChange={setTaxRegime}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Tax Regime</SelectItem>
                  <SelectItem value="old">Old Tax Regime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={calculateTax} className="w-full h-11 text-base font-medium" size="lg">
              <Calculator className="w-5 h-5 mr-2" />
              Calculate Tax
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Tax Calculation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Gross Income</p>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-100">₹{result.grossIncome.toLocaleString()}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Total Expenses</p>
                    <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">₹{result.totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Taxable Income</p>
                    <p className="text-xl font-bold text-amber-900 dark:text-amber-100">₹{result.taxableIncome.toLocaleString()}</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-lg border border-rose-200 dark:border-rose-900">
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">Total Tax</p>
                    <p className="text-xl font-bold text-rose-900 dark:text-rose-100">₹{Math.round(result.tax).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg border">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Effective Tax Rate</p>
                  <p className="text-3xl font-bold text-foreground">{result.effectiveRate.toFixed(2)}%</p>
                  <Badge variant="secondary" className="mt-2">
                    {result.regime === "new" ? "New Tax Regime" : "Old Tax Regime"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium">Enter your income details</p>
                <p className="text-sm mt-1">Fill in the form and calculate your tax</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tax Tips and Important Dates */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Lightbulb className="w-5 h-5 mr-2 text-primary" />
                Tax Tips for FY {currentFinancialYear || "2025-26"}
              </CardTitle>
              <Button onClick={fetchTaxTips} variant="outline" size="sm" disabled={isLoadingTips}>
                {isLoadingTips ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {taxTips.length > 0 ? (
              <div className="space-y-3">
                {taxTips.map((tip, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      tip.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500' :
                      tip.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500' :
                      tip.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500' :
                      'bg-blue-50 dark:bg-blue-950/30 border-blue-500'
                    }`}
                  >
                    <h4 className="font-semibold text-sm text-foreground mb-1">{tip.title}</h4>
                    <p className="text-sm text-muted-foreground">{tip.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm">Click "Refresh" to get current tax tips</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Important Dates FY {currentFinancialYear || "2025-26"}
              </CardTitle>
              <Button onClick={fetchImportantDates} variant="outline" size="sm" disabled={isLoadingDates}>
                {isLoadingDates ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {importantDates.length > 0 ? (
              <div className="space-y-2">
                {importantDates.map((date, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                    <span className="font-medium text-sm text-foreground">{date.date}</span>
                    <span className="text-sm text-muted-foreground">{date.event}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm">Click "Refresh" to get important tax dates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
