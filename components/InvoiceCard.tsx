"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/hooks/usePayment'

export interface InvoiceLineItem {
  id?: string
  description: string
  quantity: number
  line_total: number | string
}

export interface InvoiceProps {
  invoice: {
    id: string
    invoice_number: string
    total: number | string
    subtotal?: number | string
    tax_amount?: number | string
    discount_amount?: number | string
    status?: string
    balance_due?: number | string
    line_items?: InvoiceLineItem[]
    child?: { id?: string; full_name?: string }
    due_date?: string
  }
  onPay?: (invoice: any) => void
  onDownloadReceipt?: (paymentId: string) => void
}

export default function InvoiceCard({ invoice, onPay, onDownloadReceipt }: InvoiceProps) {
  const status = invoice.status || 'pending'
  const statusColor =
    status === 'paid' ? 'bg-green-100 text-green-800' :
    status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
    status === 'overdue' ? 'bg-red-100 text-red-800' :
    'bg-gray-100 text-gray-800'

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white shadow-sm">
      <div>
        <div className="text-sm font-medium">{invoice.invoice_number} • {invoice.child?.full_name}</div>
        <div className="text-xs text-slate-500">{invoice.line_items?.length || 0} items • Due {invoice.due_date || '—'}</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm text-slate-500">Balance</div>
          <div className="font-semibold">{formatCurrency(Number(invoice.balance_due || invoice.total || 0))}</div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>{status}</div>

        {status !== 'paid' ? (
          <Button size="sm" onClick={() => onPay && onPay(invoice)}>Pay Now</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onDownloadReceipt && onDownloadReceipt(invoice.id)}>Download Receipt</Button>
        )}
      </div>
    </div>
  )
}
