import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// ---------- Types ----------
interface LineItem {
  description: string
  amount: number
}

interface Child {
  full_name: string
}

interface Caregiver {
  full_name: string
  email?: string // optional
}

interface Invoice {
  invoice_number: string
  created_at: string
  due_date: string | null
  total: number
  line_items: LineItem[]
  child: Child | null
  caregiver: Caregiver | null
}

interface InvoicePDFProps {
  invoice: Invoice
}

// ---------- Helper ----------
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #ccc',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold' },
  meta: { fontSize: 10, color: '#666' },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  total: {
    marginTop: 20,
    borderTop: '1 solid #333',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    fontSize: 14,
  },
  address: { marginBottom: 20, fontSize: 10, color: '#444' },
})

// ---------- PDF Document ----------
export default function InvoicePDF({ invoice }: InvoicePDFProps) {
  const issueDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const dueDate = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Invoice #{invoice.invoice_number}</Text>
          <View>
            <Text style={styles.meta}>Issued: {issueDate}</Text>
            <Text style={styles.meta}>Due: {dueDate}</Text>
          </View>
        </View>

        {/* From / To */}
        <View style={styles.address}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>From:</Text>
          <Text>Gertrude's Children's Hospital</Text>
          <Text style={{ marginTop: 8, fontWeight: 'bold' }}>To:</Text>
          <Text>{invoice.child?.full_name || 'Patient'}</Text>
          <Text>c/o {invoice.caregiver?.full_name || 'Caregiver'}</Text>
          {/* Email removed – no longer displayed */}
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Description</Text>
          {invoice.line_items.map((item: LineItem, index: number) => (
            <View key={index} style={styles.row}>
              <Text>{item.description}</Text>
              <Text>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.total}>
          <Text>Total Due</Text>
          <Text>{formatCurrency(invoice.total)}</Text>
        </View>
      </Page>
    </Document>
  )
}