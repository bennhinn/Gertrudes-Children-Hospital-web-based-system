"use client"

import React, { useEffect, useState } from 'react'
import { usePayment, formatCurrency } from '@/hooks/usePayment'

export default function PaymentHistoryTable({ caregiverId }: { caregiverId: string }) {
  const { getPaymentHistory, generateReceipt } = usePayment()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState<string | undefined>()
  const [toDate, setToDate] = useState<string | undefined>()

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await getPaymentHistory({ limit: 20, from_date: fromDate, to_date: toDate })
      setPayments(res.payments || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = async (paymentId: string) => {
    try {
      await generateReceipt(paymentId)
    } catch (err) {
      console.error('Receipt download failed', err)
      alert('Failed to download receipt')
    }
  }

  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">From</label>
          <input type="date" className="border rounded px-2 py-1 text-sm" value={fromDate || ''} onChange={(e) => setFromDate(e.target.value)} />
          <label className="text-xs text-slate-500">To</label>
          <input type="date" className="border rounded px-2 py-1 text-sm" value={toDate || ''} onChange={(e) => setToDate(e.target.value)} />
          <button onClick={fetch} className="ml-2 px-3 py-1 bg-slate-100 rounded text-sm">Filter</button>
        </div>
        <div className="text-xs text-slate-500">Showing latest 20</div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="text-sm text-slate-500">No payments found</div>
      ) : (
        <div className="space-y-2">
          {payments.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="text-sm font-medium">{p.invoice?.invoice_number} • {p.child?.full_name}</div>
                <div className="text-xs text-slate-400">{new Date(p.payment_date || p.created_at).toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatCurrency(Number(p.amount || 0))}</div>
                <div className="text-xs text-slate-400">{p.method} • {p.status}</div>
                {p.status === 'completed' && (
                  <button onClick={() => handleDownload(p.id)} className="text-xs text-blue-600 mt-1">Download Receipt</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
