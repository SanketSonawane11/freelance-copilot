import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, FileText, AlertCircle, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TaxTip {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

interface TaxDate {
  date: string;
  event: string;
}

export const TaxEstimator = () => {
  const [annualIncome, setAnnualIncome] = useState("");
  const [taxRegime, setTaxRegime] = useState("new");
  const [age, setAge] = useState("below60");
  const [investments, setInvestments] = useState("");
  const [hra, setHra] = useState("");
  const [calculatedTax, setCalculatedTax] = useState<any>(null);
  const [taxTips, setTaxTips] = useState<TaxTip[]>([]);
  const [importantDates, setImportantDates] = useState<TaxDate[]>([]);
  const [financialYear, setFinancialYear] = useState("");
  const [isLoadingTips, setIsLoadingTips] = useState(true);
  const [isLoadingDates, setIsLoadingDates] = useState(true);

  // Fetch dynamic tax tips
  useEffect(() => {
    const fetchTaxTips = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('tax-data', {
          body: { type: 'tips' }
        });
        
        if (error) throw error;
        
        setTaxTips(data.data || []);
        setFinancialYear(data.financialYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
      } catch (error) {
        console.error('Error fetching tax tips:', error);
        // Fallback tips
        setTaxTips([
          {
            title: "Section 44ADA Benefits",
            description: "If your income is below ₹50 lakhs, you can declare 50% as profit and pay tax only on that amount.",
            type: "success"
          },
          {
            title: "Quarterly Advance Tax",
            description: "Pay advance tax by 15th June, Sept, Dec, and March to avoid interest charges.",
            type: "warning"
          },
          {
            title: "Business Expenses",
            description: "Deduct laptop, software, internet, co-working space, and training costs.",
            type: "info"
          },
          {
            title: "Professional Tax",
            description: "Don't forget to pay professional tax in states like Maharashtra, West Bengal, etc.",
            type: "error"
          }
        ]);
        setFinancialYear(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
      } finally {
        setIsLoadingTips(false);
      }
    };

    fetchTaxTips();
  }, []);

  // Fetch important dates
  useEffect(() => {
    const fetchImportantDates = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('tax-data', {
          body: { type: 'dates' }
        });
        
        if (error) throw error;
        
        setImportantDates(data.data || []);
      } catch (error) {
        console.error('Error fetching tax dates:', error);
        // Fallback dates
        setImportantDates([
          { date: "15 June", event: "Q1 Advance Tax Due" },
          { date: "15 September", event: "Q2 Advance Tax Due" },
          { date: "15 December", event: "Q3 Advance Tax Due" },
          { date: "15 March", event: "Q4 Advance Tax Due" },
          { date: "31 July", event: "ITR Filing Due Date" }
        ]);
      } finally {
        setIsLoadingDates(false);
      }
    };

    fetchImportantDates();
  }, []);

  const getIconForTipType = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const calculateTax = () => {
    const income = parseFloat(annualIncome) || 0;
    
    if (income <= 0) {
      toast.error("Please enter a valid annual income");
      return;
    }

    // Simplified tax calculation for Indian freelancers
    let taxableIncome = income;
    let tax = 0;
    let cess = 0;

    if (taxRegime === "old") {
      // Old regime with standard deduction and investments
      const standardDeduction = Math.min(50000, income);
      const section80C = Math.min(150000, parseFloat(investments) || 0);
      const hraDeduction = parseFloat(hra) || 0;
      
      taxableIncome = income - standardDeduction - section80C - hraDeduction;
    }

    // Tax slabs for new regime (FY 2023-24)
    if (taxableIncome <= 300000) {
      tax = 0;
    } else if (taxableIncome <= 600000) {
      tax = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 900000) {
      tax = 15000 + (taxableIncome - 600000) * 0.10;
    } else if (taxableIncome <= 1200000) {
      tax = 45000 + (taxableableIncome - 900000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      tax = 90000 + (taxableIncome - 1200000) * 0.20;
    } else {
      tax = 150000 + (taxableIncome - 1500000) * 0.30;
    }

    // Health and Education Cess (4%)
    cess = tax * 0.04;
    const totalTax = tax + cess;

    // Quarterly payments
    const quarterlyTax = totalTax / 4;

    setCalculatedTax({
      grossIncome: income,
      taxableIncome,
      incomeTax: tax,
      cess,
      totalTax,
      quarterlyTax,
      takeHome: income - totalTax,
      effectiveRate: (totalTax / income) * 100
    });

    toast.success("Tax calculation completed! 📊");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Estimator</h1>
          <p className="text-gray-600">Calculate your income tax and get filing tips for Indian freelancers</p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          FY {financialYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
        </Badge>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">Tax Calculator</TabsTrigger>
          <TabsTrigger value="tips">Tax Tips</TabsTrigger>
          <TabsTrigger value="dates">Important Dates</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Income Details
                </CardTitle>
                <CardDescription>
                  Enter your annual freelance income and deductions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="annual-income">Annual Gross Income</Label>
                  <Input
                    id="annual-income"
                    type="number"
                    placeholder="Enter your total annual income"
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(e.target.value)}
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

                <div>
                  <Label htmlFor="age">Age Category</Label>
                  <Select value={age} onValueChange={setAge}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below60">Below 60 years</SelectItem>
                      <SelectItem value="60to80">60-80 years</SelectItem>
                      <SelectItem value="above80">Above 80 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {taxRegime === "old" && (
                  <>
                    <div>
                      <Label htmlFor="investments">80C Investments (₹)</Label>
                      <Input
                        id="investments"
                        type="number"
                        placeholder="PF, PPF, ELSS, etc. (Max ₹1.5L)"
                        value={investments}
                        onChange={(e) => setInvestments(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hra">HRA Exemption (₹)</Label>
                      <Input
                        id="hra"
                        type="number"
                        placeholder="If applicable"
                        value={hra}
                        onChange={(e) => setHra(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Button 
                  onClick={calculateTax}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Tax
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Calculation Results</CardTitle>
                <CardDescription>
                  Your estimated tax liability for the financial year
                </CardDescription>
              </CardHeader>
              <CardContent>
                {calculatedTax ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Gross Income</p>
                        <p className="text-2xl font-bold text-blue-700">
                          ₹{calculatedTax.grossIncome.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Take Home</p>
                        <p className="text-2xl font-bold text-green-700">
                          ₹{calculatedTax.takeHome.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Taxable Income:</span>
                        <span className="font-medium">₹{calculatedTax.taxableIncome.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Income Tax:</span>
                        <span className="font-medium">₹{calculatedTax.incomeTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Health & Education Cess:</span>
                        <span className="font-medium">₹{calculatedTax.cess.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total Tax:</span>
                        <span>₹{calculatedTax.totalTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Effective Rate:</span>
                        <span>{calculatedTax.effectiveRate.toFixed(2)}%</span>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-700 font-medium mb-1">Quarterly Advance Tax</p>
                      <p className="text-lg font-bold text-yellow-800">
                        ₹{calculatedTax.quarterlyTax.toLocaleString()}
                      </p>
                      <p className="text-xs text-yellow-600">
                        Pay by 15th of June, Sept, Dec, and March
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Your tax calculation will appear here</p>
                    <p className="text-sm">Fill in your income details and click "Calculate Tax"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          {isLoadingTips ? (
            <div className="text-center py-8">
              <p>Loading tax tips...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {taxTips.map((tip, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      {getIconForTipType(tip.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                        <p className="text-sm text-gray-600">{tip.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Important Tax Dates for FY {financialYear}</CardTitle>
              <CardDescription>
                Mark these dates in your calendar to avoid penalties
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDates ? (
                <div className="text-center py-8">
                  <p>Loading important dates...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {importantDates.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{item.event}</p>
                        <p className="text-sm text-gray-600">Mark your calendar</p>
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        {item.date}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
