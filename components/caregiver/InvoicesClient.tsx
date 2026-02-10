"use client"

import React, { useMemo, useState } from 'react'
import PaymentModal from '@/components/PaymentModal'
import InvoiceCard, { InvoiceProps } from '@/components/InvoiceCard'
import PaymentHistoryTable from '@/components/PaymentHistoryTable'
import { usePayment } from '@/hooks/usePayment'
import { formatCurrency } from '@/hooks/usePayment'
import { Receipt, Calendar, Clock, AlertCircle, CheckCircle, TrendingUp, DollarSign, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  // Mobile-optimized upcoming bills
  const upcomingBills = invoices
    .filter(i => {
      if (!i.due_date) return false;
      const dueDate = new Date(i.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate >= today;
    })
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Mobile-optimized stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Invoices & Payments</h2>
              <p className="text-xs text-slate-500">Manage your billing</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(outstandingBalance)}</div>
            <div className="text-xs text-slate-500">Outstanding</div>
          </div>
        </div>

        {/* Upcoming bills - mobile optimized */}
        {upcomingBills.length > 0 && (
          <div className="rounded-xl bg-gradient-to-br from-white to-blue-50/50 p-3 ring-1 ring-slate-200/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-800">Upcoming Bills</span>
              </div>
              <span className="text-xs font-medium text-blue-600">{upcomingBills.length} due</span>
            </div>
            
            <div className="space-y-2">
              {upcomingBills.map((inv) => (
                <div key={inv.id} className="flex items-start justify-between p-2 rounded-lg bg-white/80">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                      <span className="text-xs font-medium text-slate-900 truncate">
                        {inv.invoice_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="truncate">{inv.child?.full_name}</span>
                      <span>•</span>
                      <span>{inv.due_date}</span>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-bold text-slate-900">
                      {formatCurrency(Number(inv.balance_due || inv.total || 0))}
                    </div>
                    <button
                      onClick={() => handlePayClick(inv)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 mt-0.5"
                    >
                      Pay now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Invoices - Mobile Optimized */}
      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Invoices</h3>
            <span className="text-xs text-slate-500">{invoices.length} total</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">You can pay unpaid invoices directly</p>
        </div>

        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-white to-slate-50 border border-slate-200 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm ring-1 ring-slate-100">
                <Receipt className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-900">No invoices found</h3>
              <p className="mt-2 text-sm text-slate-600">
                Your invoices will appear here
              </p>
            </div>
          ) : invoices.map(inv => (
            <InvoiceCard 
              key={inv.id} 
              invoice={inv} 
              onPay={() => handlePayClick(inv)} 
              onDownloadReceipt={() => handleDownloadReceipt(inv.id)} 
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4">
          <h4 className="text-lg font-bold text-slate-900">Payment History</h4>
          <p className="text-sm text-slate-600 mt-1">Track all your transactions</p>
        </div>
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