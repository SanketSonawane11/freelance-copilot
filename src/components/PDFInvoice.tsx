import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  col1: { width: '50%' },
  col2: { width: '20%' },
  col3: { width: '15%' },
  col4: { width: '15%' },
  total: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  gstEnabled: boolean;
  gstAmount?: number;
  total: number;
  freelancerName: string;
  freelancerEmail: string;
  freelancerAddress?: string;
  gstNumber?: string;
}

// Single, clean export for InvoicePDF
export const InvoicePDF = ({ data }: { data: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>INVOICE</Text>
        <View style={styles.invoiceInfo}>
          <View>
            <Text style={styles.text}>Invoice #: {data.invoiceNumber}</Text>
            <Text style={styles.text}>Issue Date: {data.issueDate}</Text>
            <Text style={styles.text}>Due Date: {data.dueDate}</Text>
          </View>
          <View>
            <Text style={[styles.text, { fontWeight: 'bold' }]}>From:</Text>
            <Text style={styles.text}>{data.freelancerName}</Text>
            <Text style={styles.text}>{data.freelancerEmail}</Text>
            {data.freelancerAddress && <Text style={styles.text}>{data.freelancerAddress}</Text>}
            {data.gstNumber && <Text style={styles.text}>GST: {data.gstNumber}</Text>}
          </View>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.section}>
        <Text style={[styles.text, { fontWeight: 'bold' }]}>Bill To:</Text>
        <Text style={styles.text}>{data.clientName}</Text>
        {data.clientEmail && <Text style={styles.text}>{data.clientEmail}</Text>}
      </View>

      {/* Items Table */}
      <View style={styles.tableHeader}>
        <Text style={[styles.text, styles.col1]}>Description</Text>
        <Text style={[styles.text, styles.col2]}>Quantity</Text>
        <Text style={[styles.text, styles.col3]}>Rate</Text>
        <Text style={[styles.text, styles.col4]}>Amount</Text>
      </View>

      {data.items.map((item, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={[styles.text, styles.col1]}>{item.description}</Text>
          <Text style={[styles.text, styles.col2]}>{item.quantity}</Text>
          <Text style={[styles.text, styles.col3]}>₹{item.rate.toFixed(2)}</Text>
          <Text style={[styles.text, styles.col4]}>₹{item.amount.toFixed(2)}</Text>
        </View>
      ))}

      {/* Totals */}
      <View style={styles.total}>
        <Text style={styles.text}>Subtotal: ₹{data.subtotal.toFixed(2)}</Text>
        {data.gstEnabled && data.gstAmount && (
          <Text style={styles.text}>GST (18%): ₹{data.gstAmount.toFixed(2)}</Text>
        )}
        <Text style={styles.totalText}>Total: ₹{data.total.toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);

// Keep PDFInvoiceDownload as is
export const PDFInvoiceDownload = ({ data, fileName }: { data: InvoiceData; fileName: string }) => (
  <PDFDownloadLink
    document={<InvoicePDF data={data} />}
    fileName={fileName}
  >
    {({ blob, url, loading, error }) => (
      <Button disabled={loading} className="w-full">
        <Download className="w-4 h-4 mr-2" />
        {loading ? 'Generating PDF...' : 'Download PDF'}
      </Button>
    )}
  </PDFDownloadLink>
);
