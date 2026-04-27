import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    flexDirection: 'column',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#5D5CDE',
    paddingBottom: 20,
  },
  headerLeft: {
    width: '50%',
  },
  headerRight: {
    width: '45%',
    textAlign: 'right',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5D5CDE',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  invoiceDetails: {
    fontSize: 10,
    color: '#374151',
    marginBottom: 2,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 2,
  },
  addressBlock: {
    width: '45%',
  },
  addressText: {
    marginBottom: 2,
    color: '#4B5563',
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#5D5CDE',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 8,
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 9,
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '17.5%', textAlign: 'right' },
  col4: { width: '17.5%', textAlign: 'right' },
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  notesArea: {
    width: '60%',
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  totalsArea: {
    width: '35%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    color: '#4B5563',
  },
  totalValue: {
    fontWeight: 'bold',
    color: '#111827',
  },
  finalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#5D5CDE',
  },
  finalTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D5CDE',
  },
  finalTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5D5CDE',
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
  notes?: string;
}

// Single, clean export for InvoicePDF
export const InvoicePDF = ({ data }: { data: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.invoiceDetails}>Invoice #: {data.invoiceNumber}</Text>
          <Text style={styles.invoiceDetails}>Date: {data.issueDate}</Text>
          <Text style={styles.invoiceDetails}>Due Date: {data.dueDate}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.sectionTitle, { textAlign: 'right' }]}>Provider</Text>
          <Text style={styles.addressText}>{data.freelancerName}</Text>
          <Text style={styles.addressText}>{data.freelancerEmail}</Text>
          {data.freelancerAddress && <Text style={styles.addressText}>{data.freelancerAddress}</Text>}
          {data.gstNumber && <Text style={[styles.addressText, { fontWeight: 'bold' }]}>GST IN: {data.gstNumber}</Text>}
        </View>
      </View>

      {/* Addresses Section */}
      <View style={styles.section}>
        <View style={styles.addressBlock}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={[styles.addressText, { fontWeight: 'bold', color: '#111827' }]}>{data.clientName}</Text>
          {data.clientEmail && <Text style={styles.addressText}>{data.clientEmail}</Text>}
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
          <Text style={[styles.tableHeaderText, styles.col3]}>Rate (Rs.)</Text>
          <Text style={[styles.tableHeaderText, styles.col4]}>Total (Rs.)</Text>
        </View>

        {data.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.addressText, styles.col1]}>{item.description}</Text>
            <Text style={[styles.addressText, styles.col2]}>{item.quantity}</Text>
            <Text style={[styles.addressText, styles.col3]}>{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            <Text style={[styles.addressText, styles.col4, { fontWeight: 'bold' }]}>{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
      </View>

      {/* Footer Area with Notes and Totals */}
      <View style={styles.footerSection}>
        <View style={styles.notesArea}>
          {data.notes && (
            <>
              <Text style={styles.notesTitle}>Additional Notes</Text>
              <Text style={styles.notesText}>{data.notes}</Text>
            </>
          )}
        </View>
        
        <View style={styles.totalsArea}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>Rs. {data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          {data.gstEnabled && data.gstAmount && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST (18%)</Text>
              <Text style={styles.totalValue}>Rs. {data.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            </View>
          )}
          <View style={styles.finalTotal}>
            <Text style={styles.finalTotalLabel}>Total Amount</Text>
            <Text style={styles.finalTotalValue}>Rs. {data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
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
