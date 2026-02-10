"use client"

import React, { useMemo, useState } from 'react'
import PaymentModal from '@/components/PaymentModal'
import InvoiceCard, { InvoiceProps } from '@/components/InvoiceCard'
import PaymentHistoryTable from '@/components/PaymentHistoryTable'
import { usePayment } from '@/hooks/usePayment'
import { formatCurrency } from '@/hooks/usePayment'

type Invoice = InvoiceProps['invoice']

export default function InvoicesClient({ initialInvoices, caregiverId }: { initialInvoices: Invoice[]; caregiverId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices || [])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const { generateReceipt } = usePayment()

  const outstandingBalance = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (Number(inv.balance_due ?? inv.total ?? 0)), 0)
  }, [invoices])

  const handlePayClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false)
    setSelectedInvoice(null)
    // simple refresh
    window.location.reload()
  }

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      await generateReceipt(paymentId)
    } catch (err) {
      console.error('Receipt download failed', err)
      alert('Failed to download receipt')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 p-4 shadow">
          <p className="text-xs text-slate-500">Outstanding Balance</p>
          <p className="text-2xl font-bold mt-2">{formatCurrency(outstandingBalance)}</p>
          <p className="text-xs text-slate-400 mt-1">Total unpaid invoices across children</p>
        </div>

        <div className="rounded-xl bg-white p-4 shadow col-span-2">
          <p className="text-sm font-semibold mb-2">Upcoming Bills</p>
          <div className="text-sm text-slate-600">
            {invoices.filter(i => new Date(i.due_date || 0) > new Date()).slice(0,3).length === 0 ? (
              <p className="text-xs text-slate-500">No upcoming bills</p>
            ) : (
              invoices.filter(i => new Date(i.due_date || 0) > new Date()).slice(0,3).map(inv => (
                <div key={inv.id} className="flex justify-between items-center py-1">
                  <div>
                    <div className="text-sm font-medium">{inv.invoice_number} • {inv.child?.full_name}</div>
                    <div className="text-xs text-slate-500">Due {inv.due_date}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatCurrency(Number(inv.balance_due || inv.total || 0))}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Invoices</h3>
          <div className="text-sm text-slate-500">You can pay unpaid invoices directly</div>
        </div>

        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="p-6 rounded-lg bg-slate-50 text-center">
              <p className="text-sm text-slate-600">No invoices found</p>
            </div>
          ) : invoices.map(inv => (
            <InvoiceCard key={inv.id} invoice={inv} onPay={() => handlePayClick(inv)} onDownloadReceipt={() => handleDownloadReceipt(inv.id)} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-3">Payment History</h4>
        <PaymentHistoryTable caregiverId={caregiverId} />
      </div>

      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.invoice_number}
          totalAmount={Number(selectedInvoice.balance_due || selectedInvoice.total || 0)}
          items={(selectedInvoice.line_items || []).map(item => ({ description: item.description, quantity: item.quantity, amount: Number(item.line_total) }))}
          subtotal={Number(selectedInvoice.subtotal || 0)}
          tax={Number(selectedInvoice.tax_amount || 0)}
          discount={Number(selectedInvoice.discount_amount || 0)}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  )
}
