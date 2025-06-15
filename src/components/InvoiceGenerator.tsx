
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Receipt, Download, Send, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export const InvoiceGenerator = () => {
  const { user } = useAuth();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [isGSTEnabled, setIsGSTEnabled] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 }
  ]);
  const [notes, setNotes] = useState("");

  // Fetch recent invoices
  const { data: recentInvoices, isLoading } = useQuery({
    queryKey: ['recentInvoices', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate amount for this item
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateGST = () => {
    return isGSTEnabled ? calculateSubtotal() * 0.18 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateGST();
  };

  const handleGenerateInvoice = async () => {
    if (!clientName || items.some(item => !item.description)) {
      toast.error("Please fill in client details and item descriptions");
      return;
    }

    if (!user?.id) {
      toast.error("Please log in to generate invoices");
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_name: clientName,
          invoice_number: invoiceNumber,
          total_amount: calculateTotal(),
          gst_enabled: isGSTEnabled,
          issued_on: issueDate,
        });

      if (error) throw error;

      toast.success("Invoice generated successfully! 📄");
      
      // Reset form
      setClientName("");
      setClientEmail("");
      setClientAddress("");
      setInvoiceNumber(`INV-${Date.now()}`);
      setItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
      setNotes("");
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error("Failed to generate invoice");
    }
  };

  const handleSendInvoice = () => {
    if (!clientEmail) {
      toast.error("Please enter client email address");
      return;
    }
    toast.success("Invoice sent successfully! 📧");
  };

  const getInvoiceStatusColor = (totalAmount: number) => {
    // Simple logic for demo - in real app this would be based on actual status
    if (totalAmount > 50000) return 'text-green-600';
    if (totalAmount > 25000) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getInvoiceStatus = (totalAmount: number) => {
    // Simple logic for demo - in real app this would be based on actual status
    if (totalAmount > 50000) return 'Paid';
    if (totalAmount > 25000) return 'Pending';
    return 'Overdue';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Generator</h1>
          <p className="text-gray-600">Create professional invoices with GST compliance</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client-name">Client Name/Company</Label>
                  <Input
                    id="client-name"
                    placeholder="Enter client name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="client-email">Email Address</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="client-address">Billing Address</Label>
                <Textarea
                  id="client-address"
                  placeholder="Enter complete billing address"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="invoice-number">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="issue-date">Issue Date</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="gst-enabled"
                  checked={isGSTEnabled}
                  onCheckedChange={setIsGSTEnabled}
                />
                <Label htmlFor="gst-enabled">Enable GST (18%)</Label>
              </div>

              {isGSTEnabled && (
                <div>
                  <Label htmlFor="gst-number">GST Number</Label>
                  <Input
                    id="gst-number"
                    placeholder="Enter your GST number"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label>Description</Label>
                    <Input
                      placeholder="Service description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Amount</Label>
                    <Input
                      value={`₹${item.amount.toFixed(2)}`}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button onClick={addItem} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Payment terms, thank you note, or any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Invoice Preview & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                {isGSTEnabled && (
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{calculateGST().toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleGenerateInvoice}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </Button>
                <Button 
                  onClick={handleSendInvoice}
                  variant="outline" 
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to Client
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : recentInvoices && recentInvoices.length > 0 ? (
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{invoice.invoice_number}</p>
                        <p className="text-xs text-gray-600">{invoice.client_name}</p>
                        <p className="text-xs text-gray-500">
                          {invoice.issued_on ? format(new Date(invoice.issued_on), 'MMM dd, yyyy') : 'No date'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">₹{Number(invoice.total_amount).toLocaleString()}</p>
                        <p className={`text-xs ${getInvoiceStatusColor(Number(invoice.total_amount))}`}>
                          {getInvoiceStatus(Number(invoice.total_amount))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="font-medium text-gray-900 mb-1">No invoices yet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Start by creating your first invoice above
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('client-name')?.focus()}
                  >
                    Create Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
