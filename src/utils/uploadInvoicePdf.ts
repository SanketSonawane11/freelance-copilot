
import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a PDF Blob to Supabase Storage and return the public URL.
 * @returns {Promise<string>} The public URL of the uploaded PDF.
 */
export async function uploadInvoicePdf(invoiceNumber: string, pdfBlob: Blob): Promise<string> {
  const filePath = `${invoiceNumber}_${Date.now()}.pdf`;
  const { data, error } = await supabase.storage
    .from("invoices")
    .upload(filePath, pdfBlob, { contentType: "application/pdf", upsert: true });

  if (error) throw error;

  // Get the public URL for download
  const { data: publicUrlData } = supabase.storage.from("invoices").getPublicUrl(filePath);
  if (!publicUrlData?.publicUrl) throw new Error("Failed to get public URL for invoice PDF.");

  return publicUrlData.publicUrl;
}
