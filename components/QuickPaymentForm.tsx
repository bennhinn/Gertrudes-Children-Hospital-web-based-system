"use client"

import React, { useState } from 'react'
import { usePayment, formatCurrency } from '@/hooks/usePayment'
import { Button } from '@/components/ui/button'

export interface QuickPaymentFormProps {
  invoice?: {
    id: string
    invoice_number: string
    total: number
    balance_due?: number
  }
  onSuccess?: () => void
}

export default function QuickPaymentForm({ invoice, onSuccess }: QuickPaymentFormProps) {
  const { processPayment } = usePayment()
  const [amount, setAmount] = useState<number>(invoice ? Number(invoice.balance_due ?? invoice.total) : 0)
  const [loading, setLoading] = useState(false)

  const handleCashPayment = async () => {
    if (!invoice) return
    setLoading(true)
    try {
      await processPayment({
        amount,
        currency: 'KES',
        paymentMethod: 'cash',
        invoiceId: invoice.id,
        caregiverId: 'receptionist',
        paymentDetails: null,
      })
      onSuccess && onSuccess()
      alert('Payment processed')
    } catch (err) {
      console.error(err)
      alert('Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="mb-3">
        <div className="text-sm font-medium">Quick Payment</div>
        <div className="text-xs text-slate-500">Process cash payments for walk-in patients</div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <div>
          <label className="text-xs text-slate-500">Amount</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full border rounded px-2 py-1" />
        </div>

        <div className="flex gap-2 mt-2">
          <Button onClick={handleCashPayment} disabled={loading} className="flex-1">Process Cash Payment</Button>
          <Button variant="ghost" onClick={() => alert('Print receipt (use receipt generator)')} className="flex-1">Print</Button>
        </div>
      </div>
    </div>
  )
}
