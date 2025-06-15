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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { PDFInvoiceDownload } from "./PDFInvoice";

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

  // Payment Status at creation
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>("unpaid");

  // PDF download state
  const [showDownload, setShowDownload] = useState(false);
  const [cachedPdfData, setCachedPdfData] = useState<any>(null);

  // For error/success messages
  const [dateError, setDateError] = useState<string | null>(null);
  const [futureWarn, setFutureWarn] = useState<string | null>(null);

  // For recent invoices update
  const queryClient = useQueryClient();

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

  // Mutation for marking invoice as paid/unpaid
  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status, payment_status }: { id: string; status?: string; payment_status?: string }) => {
      const { error } = await supabase
        .from('invoices')
        .update({ status, payment_status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentInvoices', user?.id] });
      toast.success("Invoice status updated");
    },
    onError: () => toast.error("Failed to update status"),
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
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    setItems(updatedItems);
  };

  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.amount, 0);
  const calculateGST = () => isGSTEnabled ? calculateSubtotal() * 0.18 : 0;
  const calculateTotal = () => calculateSubtotal() + calculateGST();

  //--- Status calculation logic as per spec ----
  const computeStatus = ({
    issueDate,
    dueDate,
    paymentStatus,
  }: { issueDate: string; dueDate: string; paymentStatus: string; }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const issue = issueDate ? new Date(issueDate) : null;
    const due = dueDate ? new Date(dueDate) : null;
    if (issue) issue.setHours(0, 0, 0, 0);
    if (due) due.setHours(0, 0, 0, 0);

    if (paymentStatus === "paid") {
      return "PAID";
    }
    if (issue && issue > today) {
      return "SCHEDULED";
    }
    if (due && due < today) {
      return "OVERDUE";
    }
    return "PENDING";
  };

  // Validate dates whenever inputs change
  const validateDates = () => {
    setDateError(null);
    setFutureWarn(null);
    if (issueDate && dueDate) {
      if (new Date(dueDate) < new Date(issueDate)) {
        setDateError("Due date cannot be before issue date.");
      }
    }
    if (issueDate && new Date(issueDate) > new Date()) {
      setFutureWarn("Issue date is in the future. Invoice will be marked as 'Scheduled'.");
    }
  };

  // Re-validate dates on changes
  React.useEffect(() => {
    validateDates();
  }, [issueDate, dueDate]);

  // UX: get badge color and friendly text for status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID": return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold text-xs">Paid</span>;
      case "PENDING": return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold text-xs">Pending</span>;
      case "OVERDUE": return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold text-xs">Overdue</span>;
      case "SCHEDULED": return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold text-xs">Scheduled</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-semibold text-xs">{status}</span>;
    }
  };
  // Time calculations UX
  const getDueText = (dueDate: string, status: string) => {
    if (!dueDate) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (status === "PENDING") {
      if (diffDays === 0) return "Due today";
      if (diffDays === 1) return "Due tomorrow";
      if (diffDays > 1) return `Due in ${diffDays} days`;
    }
    if (status === "OVERDUE") {
      if (diffDays === -1) return "Overdue by 1 day";
      if (diffDays < -1) return `Overdue by ${-diffDays} days`;
    }
    return "";
  };

  // Helper to shape invoice data for PDFInvoiceDownload
  const getInvoicePdfData = () => {
    const freelancerName = user?.user_metadata?.name || user?.email?.split('@')[0] || "Freelancer";
    const freelancerEmail = user?.email || "";
    return {
      invoiceNumber,
      clientName,
      clientEmail,
      issueDate: issueDate || "",
      dueDate: dueDate || "",
      items,
      subtotal: calculateSubtotal(),
      gstEnabled: isGSTEnabled,
      gstAmount: isGSTEnabled ? calculateGST() : undefined,
      total: calculateTotal(),
      freelancerName,
      freelancerEmail,
      freelancerAddress: "",
      gstNumber: gstNumber || undefined,
      notes: notes || "",
    };
  };

  const handleGenerateInvoice = async () => {
    if (!clientName || items.some(item => !item.description)) {
      toast.error("Please fill in client details and item descriptions");
      return;
    }
    if (dateError) {
      toast.error(dateError);
      return;
    }
    if (!user?.id) {
      toast.error("Please log in to generate invoices");
      return;
    }
    const status = computeStatus({ issueDate, dueDate, paymentStatus });

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
          status: status,
          payment_status: paymentStatus,
        });
      if (error) throw error;

      toast.success("Invoice generated successfully! 📄");
      setCachedPdfData(getInvoicePdfData());
      setShowDownload(true);
      // Optionally reset form here after download
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error("Failed to generate invoice");
    }
  };

  // Mark invoice as paid/unpaid from UI
  const handleMarkPaid = (invoice: any, newPaid: boolean) => {
    const payment_status = newPaid ? "paid" : "unpaid";
    const status = newPaid
      ? "PAID"
      : computeStatus({ issueDate: invoice.issued_on, dueDate: invoice.due_date || "", paymentStatus: "unpaid" });
    updateInvoiceStatus.mutate({ id: invoice.id, payment_status, status });
  };

  // Show warning if user tries to create impossible dates
  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
    // Trigger validation in useEffect
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
                    onChange={handleDueDateChange}
                  />
                </div>
              </div>
              {dateError && (
                <div className="text-red-600 text-xs font-medium pt-1">{dateError}</div>
              )}
              {futureWarn && (
                <div className="text-yellow-700 text-xs font-medium pt-1">{futureWarn}</div>
              )}
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
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="paid-status"
                  checked={paymentStatus === "paid"}
                  onCheckedChange={(v) => setPaymentStatus(v ? "paid" : "unpaid")}
                />
                <Label htmlFor="paid-status">
                  Mark as <span className={paymentStatus === "paid" ? "text-green-600 font-bold" : "text-yellow-600 font-bold"}>{paymentStatus === "paid" ? "Paid" : "Unpaid"}</span> on creation
                </Label>
              </div>
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
                {getStatusBadge(computeStatus({ issueDate, dueDate, paymentStatus }))}
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

              {/* Next actions */}
              <div className="space-y-2">
                <Button 
                  onClick={handleGenerateInvoice}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  disabled={!!dateError}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate PDF
                </Button>
                {showDownload && cachedPdfData && (
                  <div className="mt-2 flex">
                    <PDFInvoiceDownload
                      data={cachedPdfData}
                      fileName={`${cachedPdfData.invoiceNumber}.pdf`}
                    />
                  </div>
                )}
                <Button 
                  onClick={() => toast.info("Email sending coming soon!")}
                  variant="outline" 
                  className="w-full"
                  disabled
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to Client
                </Button>
              </div>

              {/* Status + Due info */}
              <div className="pt-2">
                <div className="text-sm text-gray-600">
                  {getDueText(dueDate, computeStatus({ issueDate, dueDate, paymentStatus }))}
                </div>
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
                  {recentInvoices.map((invoice: any) => {
                    const status = computeStatus({
                      issueDate: invoice.issued_on,
                      dueDate: invoice.due_date || "",
                      paymentStatus: invoice.payment_status,
                    });
                    return (
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
                          <div className="flex items-center gap-2">
                            {getStatusBadge(status)}
                            <Switch
                              id={`paid-switch-${invoice.id}`}
                              checked={invoice.payment_status === "paid"}
                              onCheckedChange={(v) => handleMarkPaid(invoice, v)}
                              aria-label="Mark as Paid"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            {getDueText(invoice.due_date || "", status)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
