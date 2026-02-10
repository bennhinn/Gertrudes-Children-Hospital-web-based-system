"use client"

import React, { useEffect, useState } from 'react'
import PaymentModal from '@/components/PaymentModal'
import { formatCurrency } from '@/hooks/usePayment'
import { Button } from '@/components/ui/button'

export interface InvoiceLineItem {
  id?: string
  description: string
  quantity: number
  line_total: number | string
}

export interface InvoiceShape {
  id: string
  invoice_number: string
  total: number | string
  subtotal?: number | string
  tax_amount?: number | string
  discount_amount?: number | string
  status?: string
  balance_due?: number | string
  line_items?: InvoiceLineItem[]
}

export default function AppointmentPaymentLauncher({
  invoice,
  autoOpen = false,
  onPaid,
}: {
  invoice?: InvoiceShape | null
  autoOpen?: boolean
  onPaid?: () => void
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (autoOpen && invoice && Number(invoice.balance_due || invoice.total || 0) > 0) {
      setOpen(true)
    }
  }, [autoOpen, invoice])

  if (!invoice) return null

  const unpaid = Number(invoice.balance_due || invoice.total || 0) > 0 && (invoice.status !== 'paid')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{invoice.invoice_number}</div>
          <div className="text-xs text-slate-500">Amount: {formatCurrency(Number(invoice.total || 0))}</div>
          <div className="text-xs text-slate-500">Balance: {formatCurrency(Number(invoice.balance_due || invoice.total || 0))}</div>
        </div>

        <div>
          {unpaid ? (
            <Button onClick={() => setOpen(true)} size="sm">Pay at appointment</Button>
          ) : (
            <div className="text-sm text-green-600 font-semibold">Paid</div>
          )}
        </div>
      </div>

      {open && (
        <PaymentModal
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoice_number}
          totalAmount={Number(invoice.balance_due || invoice.total || 0)}
          items={(invoice.line_items || []).map(i => ({ description: i.description, quantity: i.quantity, amount: Number(i.line_total) }))}
          subtotal={Number(invoice.subtotal || 0)}
          tax={Number(invoice.tax_amount || 0)}
          discount={Number(invoice.discount_amount || 0)}
          onSuccess={() => {
            setOpen(false)
            onPaid && onPaid()
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}
