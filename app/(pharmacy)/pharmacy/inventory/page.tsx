'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { logActivity, ActivityActions } from '@/lib/activity-logger'
import {
  CheckCircle2, Package, History, Plus, Loader2, Download, ShoppingCart,
  AlertTriangle, Truck, Pill, TrendingDown,
  FileText, CreditCard, Printer
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES – exactly as defined in your schema
// ─────────────────────────────────────────────────────────────────────────────
interface DispensingLog {
  id: string
  medication_name: string
  quantity: number
  dispensed_at: string
  patient_name: string
  remaining_stock: number
}

interface Medication {
  id: string
  name: string
  description: string | null
  stock: number
  supplier_id: string | null
}

interface Supplier {
  id: string
  profiles: { full_name: string } | null
  company_name?: string | null
}

interface SupplyOrder {
  id: string
  po_number?: string | null
  requested_at: string
  delivered_at?: string
  quantity: number
  status: string
  medication_id: string
  supplier_id: string | null
  medication: { name: string; stock: number }
}

interface SupplierInvoice {
  id: string
  invoice_number: string
  supplier_id: string
  purchase_order_id: string      // references supply_orders.id
  total_amount: number
  paid_amount: number
  balance_due: number
  status: string
  payment_status: string
  due_date: string
  supplier?: {
    id: string
    company_name?: string
    profiles?: { full_name: string }
  }
}

export default function PharmacyInventoryPage() {
  const supabase = createClient()

  // ─── EXISTING STATE (unchanged) ────────────────────────────────────────────
  const [medications, setMedications] = useState<Medication[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orders, setOrders] = useState<SupplyOrder[]>([])
  const [dispensingLogs, setDispensingLogs] = useState<DispensingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dispensingSearchTerm, setDispensingSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
  const [orderQuantity, setOrderQuantity] = useState(50)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({ name: '', stock: 0, supplier_id: '' })
  const [selectedMedicationIdForAdd, setSelectedMedicationIdForAdd] = useState('')

  // 🆕 SUPPLIER INVOICE & PAYMENT STATE
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null)
  const [showSupplierPaymentModal, setShowSupplierPaymentModal] = useState(false)
  const [supplierPaymentAmount, setSupplierPaymentAmount] = useState(0)
  const [supplierPaymentMethod, setSupplierPaymentMethod] = useState<'bank_transfer' | 'cheque' | 'cash'>('bank_transfer')
  const [supplierPaymentReference, setSupplierPaymentReference] = useState('')
  const [processingSupplierPayment, setProcessingSupplierPayment] = useState(false)

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD DATA – fetches everything: meds, suppliers, orders, logs, invoices
  // ───────────────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      // 1. Medications
      const { data: medData } = await supabase
        .from('medications')
        .select('*')
        .order('name', { ascending: true })
      setMedications(medData || [])

      // 2. Suppliers (joined with profiles)
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id, company_name, profiles(full_name)')
      setSuppliers((supplierData || []).map((s: any) => {
        const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
        return {
          id: s.id,
          company_name: s.company_name,
          profiles: profile ? { full_name: profile.full_name } : null
        }
      }))

      // 3. Supply orders (with medication details)
      const { data: orderData } = await supabase
        .from('supply_orders')
        .select(`id, po_number, requested_at, delivered_at, quantity, status, medication_id, supplier_id, medication:medications(name, stock)`)
        .order('requested_at', { ascending: false })
      setOrders((orderData || []).map((order: any) => ({
        ...order,
        medication: Array.isArray(order.medication) ? order.medication[0] : (order.medication || { name: 'Unknown', stock: 0 })
      })))

      // 4. Dispensing logs (already dispensed prescriptions)
      const { data: dispensedPrescriptions } = await supabase
        .from('prescriptions')
        .select(`
          id,
          dispensed_at,
          status,
          child:children(full_name),
          items:prescription_items(id, medication_name, quantity, created_at)
        `)
        .eq('status', 'dispensed')
        .order('dispensed_at', { ascending: false })
        .limit(100)

      const logs: DispensingLog[] = []
      for (const rx of (dispensedPrescriptions || [])) {
        const child = Array.isArray(rx.child) ? rx.child[0] : rx.child
        const items = Array.isArray(rx.items) ? rx.items : []
        for (const item of items) {
          const currentMed = (medData || []).find((m: Medication) =>
            m.name.toLowerCase() === item.medication_name?.toLowerCase()
          )
          logs.push({
            id: item.id,
            medication_name: item.medication_name || 'Unknown',
            quantity: item.quantity || 0,
            dispensed_at: rx.dispensed_at || item.created_at || new Date().toISOString(),
            patient_name: child?.full_name || 'Unknown Patient',
            remaining_stock: currentMed?.stock ?? 0
          })
        }
      }
      logs.sort((a, b) => new Date(b.dispensed_at).getTime() - new Date(a.dispensed_at).getTime())
      setDispensingLogs(logs)

      // 5. Supplier invoices (with supplier details) – ✅ CORRECT JOIN
      const { data: invoiceData } = await supabase
        .from('supplier_invoices')
        .select(`
          *,
          supplier:suppliers(id, company_name, profiles(full_name))
        `)
        .order('created_at', { ascending: false })
      setSupplierInvoices(invoiceData || [])

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  // ───────────────────────────────────────────────────────────────────────────
  // REALTIME SUBSCRIPTIONS
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadData()
    const channel = supabase.channel('pharmacy-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_orders' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_invoices' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_payments' }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  // ───────────────────────────────────────────────────────────────────────────
  // EXISTING FUNCTIONS – UNCHANGED (handleCreateOrder, submitOrder, etc.)
  // ───────────────────────────────────────────────────────────────────────────
  const generatePDF = (order: SupplyOrder) => {
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('PHARMACY SUPPLY RECEIPT', 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Order ID: ${order.id}`, 14, 30)
    doc.text(`PO Number: ${order.po_number || 'N/A'}`, 14, 36)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 42)
    autoTable(doc, {
      startY: 50,
      head: [['Item Name', 'Quantity', 'Status', 'Date Requested', 'Date Delivered']],
      body: [[
        order.medication.name,
        order.quantity.toString(),
        order.status.toUpperCase(),
        new Date(order.requested_at).toLocaleDateString(),
        order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : 'N/A'
      ]],
      theme: 'striped',
      headStyles: { fillColor: [107, 33, 168] }
    })
    doc.save(`Receipt_${order.medication.name}_${order.id.slice(0, 5)}.pdf`)
  }

  async function handleCreateOrder(medication: Medication) {
    setSelectedMedication(medication)
    setOrderQuantity(50)
    setSelectedSupplierId(medication.supplier_id || '')
    setShowOrderModal(true)
    // Log opening order modal
    logActivity({
      action: ActivityActions.SUPPLY_ORDER_CREATE || 'supply_order_create',
      description: `Opened restock order modal for ${medication.name}`,
      metadata: { medicationId: medication.id },
    }).catch(() => { })
  }

  async function submitOrder() {
    if (!selectedMedication || !selectedSupplierId) {
      alert('Please select a supplier')
      return
    }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const poNumber = `PO-${Date.now()}`
      await supabase.from('supply_orders').insert([{
        po_number: poNumber,
        medication_id: selectedMedication.id,
        supplier_id: selectedSupplierId,
        pharmacist_id: user?.id,
        quantity: orderQuantity,
        status: 'pending'
      }])
      await supabase.from('medications')
        .update({ supplier_id: selectedSupplierId })
        .eq('id', selectedMedication.id)
      setShowOrderModal(false)
      setSelectedMedication(null)
      loadData()
      alert('✅ Order placed successfully!')
      // Log order placement
      logActivity({
        action: ActivityActions.SUPPLY_ORDER_CREATE || 'supply_order_create',
        description: `Placed supply order ${selectedMedication?.name}`,
        metadata: { medicationId: selectedMedication?.id, poNumber: poNumber },
      }).catch(() => { })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkAsDelivered(order: SupplyOrder) {
    if (!confirm('Confirm delivery?')) return
    setSaving(true)
    try {
      await supabase.from('supply_orders').update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      }).eq('id', order.id)

      const newStock = (order.medication.stock || 0) + order.quantity
      await supabase.from('medications').update({ stock: newStock }).eq('id', order.medication_id)
      loadData()
      logActivity({
        action: ActivityActions.DELIVERY_RECEIVE || 'delivery_receive',
        description: `Marked order ${order.id} as delivered`,
        target_id: order.id,
        metadata: { medicationId: order.medication_id, quantity: order.quantity },
      }).catch(() => { })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddMedication() {
    if (!formData.name.trim()) return
    setSaving(true)
    try {
      const stockToAdd = Number.isNaN(formData.stock) ? 0 : formData.stock

      if (selectedMedicationIdForAdd) {
        const selectedMedication = medications.find((m) => m.id === selectedMedicationIdForAdd)
        if (!selectedMedication) {
          throw new Error('Selected medication was not found')
        }

        await supabase
          .from('medications')
          .update({
            stock: (selectedMedication.stock || 0) + stockToAdd,
            supplier_id: formData.supplier_id || selectedMedication.supplier_id || null,
          })
          .eq('id', selectedMedicationIdForAdd)
      } else {
        await supabase.from('medications').insert([{
          name: formData.name.trim(),
          stock: stockToAdd,
          supplier_id: formData.supplier_id || null,
        }])
      }

      setShowAddModal(false)
      setFormData({ name: '', stock: 0, supplier_id: '' })
      setSelectedMedicationIdForAdd('')
      loadData()
      // Log new medication added
      logActivity({
        action: ActivityActions.MEDICATION_CREATE || 'medication_create',
        description: selectedMedicationIdForAdd
          ? `Restocked medication ${formData.name}`
          : `Added new medication ${formData.name}`,
        metadata: {
          name: formData.name,
          supplier_id: formData.supplier_id || null,
          medication_id: selectedMedicationIdForAdd || null,
          quantity: stockToAdd,
        },
      }).catch(() => { })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 🆕 SUPPLIER INVOICE & PAYMENT FUNCTIONS
  // ───────────────────────────────────────────────────────────────────────────

  /** Creates a supplier invoice for a delivered order */
  async function createSupplierInvoice(order: SupplyOrder) {
    if (!order.supplier_id) {
      alert('This order has no supplier assigned.')
      return
    }
    setSaving(true)
    try {
      const invoiceNumber = `INV-SUP-${Date.now()}`
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30) // 30 days net

      // ⚠️ REPLACE WITH YOUR ACTUAL COST PRICE LOGIC
      const unitPrice = 10
      const totalAmount = order.quantity * unitPrice

      const { error } = await supabase
        .from('supplier_invoices')
        .insert([{
          invoice_number: invoiceNumber,
          our_reference: `SINV-${Date.now()}`,
          supplier_id: order.supplier_id,
          purchase_order_id: order.id,          // ✅ references supply_orders.id
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          payment_terms: 30,
          subtotal: totalAmount,
          tax_amount: 0,
          discount_amount: 0,
          total_amount: totalAmount,
          paid_amount: 0,
          balance_due: totalAmount,
          status: 'pending',
          payment_status: 'unpaid'
        }])

      if (error) throw error
      alert(`✅ Invoice ${invoiceNumber} created`)
      await loadData()
      // Log invoice creation
      logActivity({
        action: ActivityActions.INVOICE_CREATE,
        description: `Created supplier invoice ${invoiceNumber} for order ${order.id}`,
        target_id: order.id,
        metadata: { invoiceNumber },
      }).catch(() => { })
    } catch (err: any) {
      alert(`Failed to create invoice: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  /** Opens the payment modal for an unpaid/partially paid invoice */
  function openSupplierPaymentModal(invoice: SupplierInvoice) {
    setSelectedInvoice(invoice)
    setSupplierPaymentAmount(invoice.balance_due)
    setSupplierPaymentMethod('bank_transfer')
    setSupplierPaymentReference('')
    setShowSupplierPaymentModal(true)
  }

  /** Processes a payment – inserts supplier_payment, updates invoice, generates receipt */
  async function processSupplierPayment() {
    if (!selectedInvoice) return
    setProcessingSupplierPayment(true)

    try {
      // Simulate payment gateway (replace with real integration)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 1. Insert payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('supplier_payments')
        .insert([{
          payment_number: `PAY-SUP-${Date.now()}`,
          supplier_id: selectedInvoice.supplier_id,
          invoice_id: selectedInvoice.id,
          payment_date: new Date().toISOString().split('T')[0],
          amount: supplierPaymentAmount,
          payment_method: supplierPaymentMethod,
          reference_number: supplierPaymentReference || `TRX-${Date.now()}`,
          status: 'completed',
          completed_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (paymentError) throw paymentError

      // 2. Update invoice
      const newPaid = (selectedInvoice.paid_amount || 0) + supplierPaymentAmount
      const newBalance = selectedInvoice.total_amount - newPaid
      const paymentStatus = newBalance <= 0 ? 'paid' : 'partially_paid'
      const invoiceStatus = newBalance <= 0 ? 'paid' : 'partially_paid'

      await supabase
        .from('supplier_invoices')
        .update({
          paid_amount: newPaid,
          balance_due: newBalance,
          payment_status: paymentStatus,
          status: invoiceStatus
        })
        .eq('id', selectedInvoice.id)

      // 3. Generate PDF receipt
      generateSupplierPaymentReceipt(paymentData.id)

      alert('✅ Payment recorded! Receipt generated.')
      await loadData()
      setShowSupplierPaymentModal(false)
      // Log supplier payment
      logActivity({
        action: ActivityActions.PAYMENT_CREATE,
        description: `Processed supplier payment for invoice ${selectedInvoice?.invoice_number}`,
        metadata: { amount: supplierPaymentAmount, invoiceId: selectedInvoice?.id },
      }).catch(() => { })
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`)
    } finally {
      setProcessingSupplierPayment(false)
    }
  }

  /** PDF receipt for supplier payment */
  function generateSupplierPaymentReceipt(paymentId: string) {
    const doc = new jsPDF()
    const now = new Date()

    doc.setFontSize(22)
    doc.text('SUPPLIER PAYMENT RECEIPT', 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text(`Receipt #: RCP-SUP-${paymentId.slice(0, 8)}`, 14, 32)
    doc.text(`Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, 38)

    const supplierName = selectedInvoice?.supplier?.company_name ||
      selectedInvoice?.supplier?.profiles?.full_name ||
      'N/A'
    doc.text(`Supplier: ${supplierName}`, 14, 50)
    doc.text(`Invoice #: ${selectedInvoice?.invoice_number}`, 14, 56)

    autoTable(doc, {
      startY: 65,
      head: [['Description', 'Amount']],
      body: [['Payment for invoice', `$${supplierPaymentAmount.toFixed(2)}`]],
      theme: 'striped',
      headStyles: { fillColor: [107, 33, 168] },
      foot: [['Total', `$${supplierPaymentAmount.toFixed(2)}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text(`Payment Method: ${supplierPaymentMethod.toUpperCase()}`, 14, finalY)
    if (supplierPaymentReference) doc.text(`Reference: ${supplierPaymentReference}`, 14, finalY + 6)
    doc.text(`Transaction ID: ${paymentId}`, 14, finalY + 12)

    doc.save(`supplier-payment-${selectedInvoice?.invoice_number || 'receipt'}.pdf`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" />
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 pb-24 lg:pb-8 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">
            Pharmacy Inventory
          </h1>
          <p className="text-sm text-slate-500">
            Stock management, dispensing & supplier payments
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Medication
        </Button>
      </div>

      {/* Tabs – INVENTORY, DISPENSED, ORDERS (all unchanged) */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="bg-slate-100 p-1 w-max min-w-full sm:w-auto">
            <TabsTrigger value="inventory" className="text-xs sm:text-sm">
              <Package className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Inventory</span>
              <span className="sm:hidden">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="dispensed" className="text-xs sm:text-sm">
              <TrendingDown className="w-4 h-4 mr-1 sm:mr-2" /> Dispensed
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">
              <History className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Supply Orders</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─────────── INVENTORY TAB (unchanged) ─────────── */}
        <TabsContent value="inventory" className="space-y-4">
          <Input
            placeholder="Search stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medications
              .filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((med) => (
                <Card key={med.id} className="border-slate-200">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">{med.name}</h3>
                      <Badge
                        variant="secondary"
                        className={med.stock < 20 ? 'bg-red-100 text-red-700' : ''}
                      >
                        {med.stock} Units
                      </Badge>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                      onClick={() => handleCreateOrder(med)}
                      disabled={saving}
                    >
                      Request Restock
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* ─────────── DISPENSED TAB (unchanged) ─────────── */}
        <TabsContent value="dispensed" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <Input
              placeholder="Search by medication or patient..."
              value={dispensingSearchTerm}
              onChange={(e) => setDispensingSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Pill className="h-4 w-4" />
              <span>
                Total Dispensed: {dispensingLogs.reduce((acc, log) => acc + log.quantity, 0)} units
              </span>
            </div>
          </div>

          {/* Summary cards & history – your existing code, kept intact */}
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const summary = dispensingLogs.reduce((acc, log) => {
                if (!acc[log.medication_name]) {
                  acc[log.medication_name] = {
                    total_dispensed: 0,
                    remaining: log.remaining_stock,
                    count: 0,
                  }
                }
                acc[log.medication_name].total_dispensed += log.quantity
                acc[log.medication_name].count++
                return acc
              }, {} as Record<string, { total_dispensed: number; remaining: number; count: number }>)

              return Object.entries(summary)
                .sort((a, b) => b[1].total_dispensed - a[1].total_dispensed)
                .slice(0, 4)
                .map(([name, data]) => (
                  <Card key={name} className="border-slate-200 overflow-hidden">
                    <CardContent className="p-3">
                      <p className="text-xs text-slate-500 truncate" title={name}>{name}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-bold text-purple-600">
                          -{data.total_dispensed}
                        </span>
                        <span className="text-xs text-slate-400">dispensed</span>
                      </div>
                      <p className="text-xs mt-1">
                        <span className={data.remaining < 20 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>
                          {data.remaining} remaining
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                ))
            })()}
          </div>

          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-purple-600" />
                Dispensing History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {dispensingLogs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Pill className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No medications dispensed yet.</p>
                  </div>
                ) : (
                  (() => {
                    const filteredLogs = dispensingLogs.filter(
                      (log) =>
                        log.medication_name.toLowerCase().includes(dispensingSearchTerm.toLowerCase()) ||
                        log.patient_name.toLowerCase().includes(dispensingSearchTerm.toLowerCase())
                    )
                    const groupedByDate = filteredLogs.reduce((acc, log) => {
                      const dateKey = new Date(log.dispensed_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                      if (!acc[dateKey]) acc[dateKey] = []
                      acc[dateKey].push(log)
                      return acc
                    }, {} as Record<string, DispensingLog[]>)

                    return Object.entries(groupedByDate).map(([date, logs]) => (
                      <div key={date}>
                        <div className="bg-slate-100 px-3 py-2 sticky top-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-600">{date}</p>
                          <p className="text-xs text-slate-400">
                            {logs.length} item{logs.length !== 1 ? 's' : ''} dispensed
                          </p>
                        </div>
                        {logs.map((log) => (
                          <div key={log.id} className="p-3 border-b border-slate-50 last:border-0">
                            {/* your log row JSX – unchanged */}
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-slate-800 truncate">
                                  {log.medication_name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                  Patient: {log.patient_name}
                                </p>
                                <div className="flex items-center justify-between mt-2 gap-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-red-100 text-red-700 text-xs">
                                      -{log.quantity} units
                                    </Badge>
                                    <span className="text-xs text-slate-400">
                                      {new Date(log.dispensed_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <div className="text-center px-2 py-1 rounded bg-slate-100">
                                    <p className="text-[10px] text-slate-500">Stock Now</p>
                                    <p
                                      className={`text-sm font-bold ${log.remaining_stock < 20 ? 'text-red-600' : 'text-emerald-600'
                                        }`}
                                    >
                                      {log.remaining_stock}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  })()
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────── ORDERS TAB – WITH SUPPLIER INVOICING & PAYMENT ─────────── */}
        <TabsContent value="orders">
          <Card className="border-slate-200">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Order History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No recent orders.</div>
                ) : (
                  orders.map((order) => {
                    const supplierProfile = suppliers.find((s) => s.id === order.supplier_id)?.profiles
                    const invoice = supplierInvoices.find((inv) => inv.purchase_order_id === order.id)

                    return (
                      <div
                        key={order.id}
                        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="text-left">
                          <p className="font-bold">{order.medication?.name}</p>
                          <p className="text-xs text-slate-500">
                            Qty: {order.quantity} • {new Date(order.requested_at).toLocaleDateString()}
                            {order.po_number && (
                              <span className="ml-2 text-purple-600">PO: {order.po_number}</span>
                            )}
                          </p>
                          {supplierProfile?.full_name && (
                            <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                              <Truck className="h-3 w-3" />
                              Supplier: {supplierProfile.full_name}
                            </p>
                          )}
                        </div>

                        {/* Action buttons – status badge + invoice/payment + PDF */}
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {/* Order status badge */}
                          <Badge
                            className={
                              order.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }
                          >
                            {order.status.toUpperCase()}
                          </Badge>

                          {/* 🆕 SUPPLIER INVOICE & PAYMENT (only for delivered orders) */}
                          {order.status === 'delivered' && (
                            <>
                              {!invoice ? (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                                  onClick={() => createSupplierInvoice(order)}
                                  disabled={saving}
                                >
                                  <FileText className="w-4 h-4 mr-1" /> Create Invoice
                                </Button>
                              ) : (
                                <>
                                  <Badge
                                    variant="outline"
                                    className={
                                      invoice.payment_status === 'paid'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : invoice.payment_status === 'partially_paid'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-red-100 text-red-700'
                                    }
                                  >
                                    {invoice.payment_status.toUpperCase()}
                                  </Badge>
                                  {invoice.payment_status !== 'paid' && (
                                    <Button
                                      size="sm"
                                      className="bg-purple-600 hover:bg-purple-700"
                                      onClick={() => openSupplierPaymentModal(invoice)}
                                    >
                                      <CreditCard className="w-4 h-4 mr-1" /> Pay
                                    </Button>
                                  )}
                                </>
                              )}
                            </>
                          )}

                          {/* Existing "Mark Delivered" (pending only) */}
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleMarkAsDelivered(order)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Delivered
                            </Button>
                          )}

                          {/* Existing PDF button (delivered only) */}
                          {order.status === 'delivered' && (
                            <Button size="sm" variant="secondary" onClick={() => generatePDF(order)}>
                              <Download className="w-4 h-4 mr-1" /> PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─────────── EXISTING MODALS (unchanged) ─────────── */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New Stock Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Label>Select Existing Medication Name (Optional)</Label>
            <select
              value={selectedMedicationIdForAdd}
              onChange={(e) => {
                const medicationId = e.target.value
                setSelectedMedicationIdForAdd(medicationId)

                if (!medicationId) {
                  setFormData({ ...formData, name: '' })
                  return
                }

                const medication = medications.find((m) => m.id === medicationId)
                if (medication) {
                  setFormData({
                    ...formData,
                    name: medication.name,
                    supplier_id: medication.supplier_id || formData.supplier_id,
                  })
                }
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Add brand new medication --</option>
              {medications.map((medication) => (
                <option key={medication.id} value={medication.id}>
                  {medication.name} - Current stock: {medication.stock}
                </option>
              ))}
            </select>
            <Label>Medication Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!!selectedMedicationIdForAdd}
            />
            <Label>Initial Stock</Label>
            <Input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
            />
            <Label>Preferred Supplier</Label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Optional: choose supplier --</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.company_name || supplier.profiles?.full_name || 'Unknown Supplier'}
                </option>
              ))}
            </select>
            <Button onClick={handleAddMedication} className="w-full bg-purple-600" disabled={saving}>
              {selectedMedicationIdForAdd ? 'Confirm Restock' : 'Confirm Registration'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Modal */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              Request Restock
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedMedication && (
              <div className="rounded-lg bg-purple-50 p-3">
                <p className="text-sm text-purple-700">Ordering for:</p>
                <p className="font-semibold text-purple-900">{selectedMedication.name}</p>
                <p className="text-xs text-purple-600">Current Stock: {selectedMedication.stock} units</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Order</Label>
              <Input
                id="quantity"
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Select Supplier *</Label>
              <select
                id="supplier"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Choose a supplier --</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.company_name || supplier.profiles?.full_name || 'Unknown Supplier'}
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  No suppliers registered. Ask admin to add suppliers.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowOrderModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitOrder}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={saving || !selectedSupplierId}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Truck className="h-4 w-4 mr-2" />
                )}
                Place Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🆕 SUPPLIER PAYMENT MODAL */}
      <Dialog open={showSupplierPaymentModal} onOpenChange={setShowSupplierPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Pay Supplier Invoice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700">Invoice #{selectedInvoice?.invoice_number}</p>
              <p className="text-xs text-slate-600 mt-1">
                Supplier:{' '}
                {selectedInvoice?.supplier?.company_name ||
                  selectedInvoice?.supplier?.profiles?.full_name}
              </p>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-slate-600">Total:</span>
                <span className="font-semibold">${selectedInvoice?.total_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Paid:</span>
                <span className="font-semibold">${selectedInvoice?.paid_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-1">
                <span className="text-sm font-medium">Balance Due:</span>
                <span className="text-lg font-bold text-purple-700">
                  ${supplierPaymentAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={supplierPaymentMethod === 'bank_transfer' ? undefined : 'secondary'}
                  className={
                    supplierPaymentMethod === 'bank_transfer' ? 'bg-blue-600 hover:bg-blue-700' : ''
                  }
                  onClick={() => setSupplierPaymentMethod('bank_transfer')}
                >
                  Bank Transfer
                </Button>
                <Button
                  type="button"
                  variant={supplierPaymentMethod === 'cheque' ? undefined : 'secondary'}
                  className={
                    supplierPaymentMethod === 'cheque' ? 'bg-amber-600 hover:bg-amber-700' : ''
                  }
                  onClick={() => setSupplierPaymentMethod('cheque')}
                >
                  Cheque
                </Button>
                <Button
                  type="button"
                  variant={supplierPaymentMethod === 'cash' ? undefined : 'secondary'}
                  className={
                    supplierPaymentMethod === 'cash' ? 'bg-green-600 hover:bg-green-700' : ''
                  }
                  onClick={() => setSupplierPaymentMethod('cash')}
                >
                  Cash
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-ref">Reference Number (optional)</Label>
              <Input
                id="payment-ref"
                placeholder="e.g. bank transaction ID, cheque number"
                value={supplierPaymentReference}
                onChange={(e) => setSupplierPaymentReference(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowSupplierPaymentModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={processSupplierPayment}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={processingSupplierPayment}
              >
                {processingSupplierPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4 mr-2" /> Pay & Print Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}