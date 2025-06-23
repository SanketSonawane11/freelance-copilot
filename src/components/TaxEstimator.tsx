
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
      // New Tax Regime (FY 2023-24 rates)
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
      // Old Tax Regime
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

    // Add 4% Health and Education Cess
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Estimator</h1>
        <p className="text-gray-600">Calculate your tax liability and get insights for FY {currentFinancialYear || "2025-26"}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Tax Calculator
            </CardTitle>
            <CardDescription>
              Calculate your estimated tax liability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="income">Annual Gross Income (₹)</Label>
              <Input
                id="income"
                type="number"
                placeholder="e.g., 1200000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="expenses">Business Expenses (₹)</Label>
              <Input
                id="expenses"
                type="number"
                placeholder="e.g., 200000"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="tax-regime">Tax Regime</Label>
              <Select value={taxRegime} onValueChange={setTaxRegime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Tax Regime</SelectItem>
                  <SelectItem value="old">Old Tax Regime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={calculateTax} className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Tax
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Tax Calculation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-600">Gross Income</p>
                    <p className="text-xl font-bold text-blue-800">₹{result.grossIncome.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-600">Total Expenses</p>
                    <p className="text-xl font-bold text-green-800">₹{result.totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-600">Taxable Income</p>
                    <p className="text-xl font-bold text-yellow-800">₹{result.taxableIncome.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-600">Total Tax</p>
                    <p className="text-xl font-bold text-red-800">₹{Math.round(result.tax).toLocaleString()}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Effective Tax Rate</p>
                  <p className="text-2xl font-bold text-gray-800">{result.effectiveRate.toFixed(2)}%</p>
                  <Badge variant="outline" className="mt-2">
                    {result.regime === "new" ? "New Tax Regime" : "Old Tax Regime"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter your income details and calculate tax</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tax Tips and Important Dates */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Tax Tips for FY {currentFinancialYear || "2025-26"}
              </div>
              <Button onClick={fetchTaxTips} variant="outline" size="sm" disabled={isLoadingTips}>
                {isLoadingTips ? "Loading..." : "Refresh"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {taxTips.length > 0 ? (
              <div className="space-y-3">
                {taxTips.map((tip, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    tip.type === 'success' ? 'bg-green-50 border-green-400' :
                    tip.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    tip.type === 'error' ? 'bg-red-50 border-red-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <h4 className="font-semibold text-gray-800">{tip.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Click "Refresh" to get current tax tips</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Important Dates FY {currentFinancialYear || "2025-26"}
              </div>
              <Button onClick={fetchImportantDates} variant="outline" size="sm" disabled={isLoadingDates}>
                {isLoadingDates ? "Loading..." : "Refresh"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {importantDates.length > 0 ? (
              <div className="space-y-3">
                {importantDates.map((date, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-800">{date.date}</span>
                    <span className="text-sm text-gray-600">{date.event}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Click "Refresh" to get important tax dates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
