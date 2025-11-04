import React from "react";
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
import { pdf as pdfInstance } from "@react-pdf/renderer";
import { uploadInvoicePdf } from "@/utils/uploadInvoicePdf";
import { Badge } from "@/components/ui/badge";

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
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>("unpaid");
  const [showDownload, setShowDownload] = useState(false);
  const [cachedPdfData, setCachedPdfData] = useState<any>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [futureWarn, setFutureWarn] = useState<string | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const queryClient = useQueryClient();

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

  const computeStatus = ({ issueDate, dueDate, paymentStatus }: { issueDate: string; dueDate: string; paymentStatus: string; }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const issue = issueDate ? new Date(issueDate) : null;
    const due = dueDate ? new Date(dueDate) : null;
    if (issue) issue.setHours(0, 0, 0, 0);
    if (due) due.setHours(0, 0, 0, 0);

    if (paymentStatus === "paid") return "PAID";
    if (issue && issue > today) return "SCHEDULED";
    if (due && due < today) return "OVERDUE";
    return "PENDING";
  };

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

  React.useEffect(() => {
    validateDates();
  }, [issueDate, dueDate]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PAID: "bg-primary/10 text-primary border-primary/20",
      PENDING: "bg-muted text-muted-foreground border-border",
      OVERDUE: "bg-destructive/10 text-destructive border-destructive/30",
      SCHEDULED: "bg-accent text-accent-foreground border-accent",
    };
    const className = variants[status] || "bg-muted text-muted-foreground";
    return <Badge variant="outline" className={`${className} text-xs font-medium px-2 py-1`}>{status}</Badge>;
  };

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

  async function generateInvoicePdfBlob(data: any): Promise<Blob> {
    const { InvoicePDF } = await import("./PDFInvoice");
    const pdfDoc = pdfInstance(<InvoicePDF data={data} />);
    const blob = await pdfDoc.toBlob();
    return blob;
  }

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
    const pdfData = getInvoicePdfData();

    setIsUploadingPdf(true);
    try {
      const pdfBlob = await generateInvoicePdfBlob(pdfData);
      const pdfUrl = await uploadInvoicePdf(invoiceNumber, pdfBlob);

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
          pdf_url: pdfUrl,
        });
      if (error) throw error;

      toast.success("Invoice generated and saved! 📄");
      setCachedPdfData(pdfData);
      setShowDownload(true);
    } catch (error) {
      console.error('Error generating or uploading invoice:', error);
      toast.error("Failed to generate/save invoice");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleMarkPaid = (invoice: any, newPaid: boolean) => {
    const payment_status = newPaid ? "paid" : "unpaid";
    const status = newPaid ? "PAID" : computeStatus({ issueDate: invoice.issued_on, dueDate: invoice.due_date || "", paymentStatus: "unpaid" });
    updateInvoiceStatus.mutate({ id: invoice.id, payment_status, status });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Invoice Generator</h1>
        <p className="text-muted-foreground mt-1">Create professional invoices with GST compliance</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name" className="text-sm font-medium">Client Name/Company *</Label>
                  <Input
                    id="client-name"
                    placeholder="Enter client name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="client@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-address" className="text-sm font-medium">Billing Address</Label>
                <Textarea
                  id="client-address"
                  placeholder="Enter complete billing address"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number" className="text-sm font-medium">Invoice Number</Label>
                  <Input
                    id="invoice-number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue-date" className="text-sm font-medium">Issue Date</Label>
                  <Input
                    id="issue-date"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date" className="text-sm font-medium">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={handleDueDateChange}
                    className="h-11"
                  />
                </div>
              </div>
              {dateError && (
                <div className="text-rose-600 text-xs font-medium">{dateError}</div>
              )}
              {futureWarn && (
                <div className="text-amber-600 text-xs font-medium">{futureWarn}</div>
              )}
              <div className="flex items-center space-x-3 pt-2">
                <Switch
                  id="gst-enabled"
                  checked={isGSTEnabled}
                  onCheckedChange={setIsGSTEnabled}
                />
                <Label htmlFor="gst-enabled" className="text-sm font-medium cursor-pointer">Enable GST (18%)</Label>
              </div>
              {isGSTEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="gst-number" className="text-sm font-medium">GST Number</Label>
                  <Input
                    id="gst-number"
                    placeholder="Enter your GST number"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}
              <div className="flex items-center space-x-3 pt-2">
                <Switch
                  id="paid-status"
                  checked={paymentStatus === "paid"}
                  onCheckedChange={(v) => setPaymentStatus(v ? "paid" : "unpaid")}
                />
                <Label htmlFor="paid-status" className="text-sm font-medium cursor-pointer">
                  Mark as <span className={paymentStatus === "paid" ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>{paymentStatus === "paid" ? "Paid" : "Unpaid"}</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 sm:col-span-5">
                    <Label className="text-sm font-medium">Description</Label>
                    <Input
                      placeholder="Service description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-sm font-medium">Qty</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="h-10"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-sm font-medium">Rate</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                      className="h-10"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <Label className="text-sm font-medium">Amount</Label>
                    <Input
                      value={`₹${item.amount.toFixed(2)}`}
                      readOnly
                      className="h-10 bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="h-10"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button onClick={addItem} variant="outline" className="w-full h-10 font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Payment terms, thank you note, or any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Invoice Preview & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Receipt className="w-5 h-5 mr-2 text-primary" />
                  Invoice Summary
                </CardTitle>
                {getStatusBadge(computeStatus({ issueDate, dueDate, paymentStatus }))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                {isGSTEnabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (18%):</span>
                    <span className="font-medium">₹{calculateGST().toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button 
                  onClick={handleGenerateInvoice}
                  className="w-full h-11 text-base font-medium"
                  disabled={!!dateError || isUploadingPdf}
                  size="lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {isUploadingPdf ? "Generating..." : "Generate PDF"}
                </Button>
                {showDownload && cachedPdfData && (
                  <div className="flex">
                    <PDFInvoiceDownload
                      data={cachedPdfData}
                      fileName={`${cachedPdfData.invoiceNumber}.pdf`}
                    />
                  </div>
                )}
              </div>

              {dueDate && (
                <div className="text-sm text-muted-foreground text-center pt-2">
                  {getDueText(dueDate, computeStatus({ issueDate, dueDate, paymentStatus }))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                      <div key={invoice.id} className="p-3 bg-muted/50 rounded-lg border space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{invoice.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">{invoice.client_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {invoice.issued_on ? format(new Date(invoice.issued_on), 'MMM dd, yyyy') : 'No date'}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-semibold text-sm">₹{Number(invoice.total_amount).toLocaleString()}</p>
                            {getStatusBadge(status)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`paid-switch-${invoice.id}`}
                              checked={invoice.payment_status === "paid"}
                              onCheckedChange={(v) => handleMarkPaid(invoice, v)}
                            />
                            <Label htmlFor={`paid-switch-${invoice.id}`} className="text-xs cursor-pointer">
                              {invoice.payment_status === "paid" ? "Paid" : "Mark as Paid"}
                            </Label>
                          </div>
                          {invoice.pdf_url && (
                            <a
                              href={invoice.pdf_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        {invoice.due_date && (
                          <p className="text-xs text-muted-foreground">
                            {getDueText(invoice.due_date, status)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium mb-2">No invoices yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating your first invoice
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
