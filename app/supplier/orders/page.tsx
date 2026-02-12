'use client'

import { useEffect, useState } from 'react'
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle,
  FileText,
  Download,
  CreditCard
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Order {
  id: string
  po_number?: string
  requested_at: string
  delivered_at?: string
  quantity: number
  status: string
  medications: { name: string }
}

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  paid_amount: number
  balance_due: number
  status: string
  payment_status: string
  due_date: string
  created_at: string
  supply_order: {
    po_number: string
    requested_at: string
    delivered_at: string
    medication: { name: string }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SupplierPortalPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices'>('orders')

  // ───────────────────────────────────────────────────────────────────────────
  // FETCH ORDERS (unchanged)
  // ───────────────────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const res = await fetch('/api/supplier/orders')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setOrders(json.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingOrders(false)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 🆕 FETCH INVOICES
  // ───────────────────────────────────────────────────────────────────────────
  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true)
      const res = await fetch('/api/supplier/invoices')
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setInvoices(json.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingInvoices(false)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // ORDER STATUS UPDATE (unchanged)
  // ───────────────────────────────────────────────────────────────────────────
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/supplier/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update order')
      fetchOrders() // refresh
    } catch (err: any) {
      alert(err.message)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 🆕 DOWNLOAD INVOICE PDF
  // ───────────────────────────────────────────────────────────────────────────
  const downloadInvoicePDF = (invoice: Invoice) => {
    const doc = new jsPDF()
    const now = new Date()

    doc.setFontSize(22)
    doc.text('SUPPLIER INVOICE', 14, 22)
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text(`Invoice #: ${invoice.invoice_number}`, 14, 32)
    doc.text(`Date: ${now.toLocaleDateString()}`, 14, 38)
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 14, 44)

    doc.text(`PO Number: ${invoice.supply_order?.po_number || 'N/A'}`, 14, 54)
    doc.text(`Medication: ${invoice.supply_order?.medication?.name || 'N/A'}`, 14, 60)
    doc.text(`Delivered: ${new Date(invoice.supply_order?.delivered_at).toLocaleDateString()}`, 14, 66)

    autoTable(doc, {
      startY: 80,
      head: [['Description', 'Amount']],
      body: [
        ['Medication supply', `$${invoice.total_amount.toFixed(2)}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [107, 33, 168] },
      foot: [['Total', `$${invoice.total_amount.toFixed(2)}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text(`Payment Status: ${invoice.payment_status.toUpperCase()}`, 14, finalY)
    if (invoice.paid_amount > 0) {
      doc.text(`Paid Amount: $${invoice.paid_amount.toFixed(2)}`, 14, finalY + 6)
      doc.text(`Balance Due: $${invoice.balance_due.toFixed(2)}`, 14, finalY + 12)
    }

    doc.save(`invoice-${invoice.invoice_number}.pdf`)
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOAD DATA ON MOUNT
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders()
    fetchInvoices()
  }, [])

  // ───────────────────────────────────────────────────────────────────────────
  // STYLES (unchanged)
  // ───────────────────────────────────────────────────────────────────────────
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'approved': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getInvoiceStatusStyles = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-50 text-green-700 border-green-200'
      case 'partially_paid': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'unpaid': return 'bg-red-50 text-red-700 border-red-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  if (loadingOrders && activeTab === 'orders') {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Supplier Portal
          </h1>
          <p className="text-sm text-slate-500">
            Manage orders and invoices
          </p>
        </div>
        <button
          onClick={() => {
            fetchOrders()
            fetchInvoices()
          }}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium self-start sm:self-auto"
        >
          Refresh All
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === 'orders'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Package className="w-4 h-4 inline mr-1.5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === 'invoices'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Invoices
          </button>
        </div>
      </div>

      {/* ─────────── ORDERS TAB (unchanged) ─────────── */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 sm:p-12 text-center">
              <Package className="mx-auto text-slate-300 mb-4 h-10 w-10 sm:h-12 sm:w-12" />
              <h3 className="text-base sm:text-lg font-medium text-slate-800">No orders yet</h3>
              <p className="text-sm text-slate-500 mt-1">
                Incoming pharmacy requests will appear here.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-lg border shrink-0 ${getStatusStyles(
                      order.status
                    )}`}
                  >
                    {order.status === 'pending' && <Clock className="h-5 w-5" />}
                    {order.status === 'approved' && <Package className="h-5 w-5" />}
                    {order.status === 'delivered' && <CheckCircle className="h-5 w-5" />}
                    {order.status === 'cancelled' && <XCircle className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                        {order.medications?.name || 'Loading...'}
                      </h3>
                      <span
                        className={`shrink-0 text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-medium uppercase ${getStatusStyles(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mt-1">
                      Qty: <span className="font-bold text-slate-800">{order.quantity} units</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      #{order.id.slice(0, 8)} • {new Date(order.requested_at).toLocaleDateString()}
                      {order.po_number && (
                        <span className="ml-2 text-purple-600">PO: {order.po_number}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(order.id, 'approved')}
                        className="flex-1 sm:flex-none px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs sm:text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs sm:text-sm font-medium"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {order.status === 'approved' && (
                    <button
                      onClick={() => updateStatus(order.id, 'delivered')}
                      className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5"
                    >
                      <Truck className="h-4 w-4" /> Mark Shipped
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs sm:text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        Delivered {new Date(order.delivered_at!).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─────────── 🆕 INVOICES TAB ─────────── */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {loadingInvoices ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 sm:p-12 text-center">
              <FileText className="mx-auto text-slate-300 mb-4 h-10 w-10 sm:h-12 sm:w-12" />
              <h3 className="text-base sm:text-lg font-medium text-slate-800">No invoices yet</h3>
              <p className="text-sm text-slate-500 mt-1">
                Invoices will appear here after the pharmacy creates them for delivered orders.
              </p>
            </div>
          ) : (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-lg border shrink-0 ${getInvoiceStatusStyles(
                      invoice.payment_status
                    )}`}
                  >
                    {invoice.payment_status === 'paid' && <CheckCircle className="h-5 w-5" />}
                    {invoice.payment_status === 'partially_paid' && (
                      <CreditCard className="h-5 w-5" />
                    )}
                    {invoice.payment_status === 'unpaid' && <Clock className="h-5 w-5" />}
                    {invoice.payment_status === 'overdue' && <AlertCircle className="h-5 w-5" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                          Invoice #{invoice.invoice_number}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {invoice.supply_order?.medication?.name || 'Unknown medication'}
                          {' • '}
                          PO: {invoice.supply_order?.po_number || 'N/A'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-medium uppercase ${getInvoiceStatusStyles(
                          invoice.payment_status
                        )}`}
                      >
                        {invoice.payment_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                      <div>
                        <p className="text-slate-500">Total</p>
                        <p className="font-bold text-slate-800">
                          ${invoice.total_amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Paid</p>
                        <p className="font-bold text-green-600">
                          ${invoice.paid_amount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Balance</p>
                        <p className="font-bold text-slate-800">
                          ${invoice.balance_due.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Due Date</p>
                        <p
                          className={`font-bold ${
                            new Date(invoice.due_date) < new Date() &&
                            invoice.payment_status !== 'paid'
                              ? 'text-red-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => downloadInvoicePDF(invoice)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-xs font-medium transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}