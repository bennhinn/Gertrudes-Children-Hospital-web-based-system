"use client"

import React, { useState } from 'react'
import { usePayment } from '@/hooks/usePayment'
import { Button } from '@/components/ui/button'

interface LineItemInput {
  description: string
  quantity: number
  unit_price: number
  tax_percent?: number
  discount_percent?: number
}

export default function CreateInvoiceForm({ onCreated }: { onCreated?: (invoice: any) => void }) {
  const { createInvoice } = usePayment()
  const [childId, setChildId] = useState('')
  const [caregiverId, setCaregiverId] = useState('')
  const [items, setItems] = useState<LineItemInput[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [loading, setLoading] = useState(false)

  const handleAddItem = () => setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])

  const handleCreate = async () => {
    if (!childId || !caregiverId) return alert('Child and caregiver required')
    setLoading(true)
    try {
      const payload = {
        child_id: childId,
        caregiver_id: caregiverId,
        items: items.map(i => ({
          item_type: 'other',
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          tax_percent: i.tax_percent || 16,
          discount_percent: i.discount_percent || 0,
        })),
      }

      const res = await createInvoice(payload)
      onCreated && onCreated(res.invoice || res)
      alert('Invoice created')
    } catch (err) {
      console.error(err)
      alert('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 bg-white space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Child ID" value={childId} onChange={(e) => setChildId(e.target.value)} className="border px-2 py-1 rounded" />
        <input placeholder="Caregiver ID" value={caregiverId} onChange={(e) => setCaregiverId(e.target.value)} className="border px-2 py-1 rounded" />
      </div>

      <div>
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-2 mb-2">
            <input placeholder="Description" value={it.description} onChange={(e) => setItems(prev => { const copy = [...prev]; copy[idx].description = e.target.value; return copy })} className="border px-2 py-1 rounded col-span-2" />
            <input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => setItems(prev => { const copy = [...prev]; copy[idx].quantity = Number(e.target.value); return copy })} className="border px-2 py-1 rounded" />
            <input type="number" placeholder="Unit" value={it.unit_price} onChange={(e) => setItems(prev => { const copy = [...prev]; copy[idx].unit_price = Number(e.target.value); return copy })} className="border px-2 py-1 rounded" />
          </div>
        ))}
        <button type="button" onClick={handleAddItem} className="text-sm text-blue-600">+ Add item</button>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleCreate} disabled={loading}>Create Invoice</Button>
        <Button variant="ghost" onClick={() => { setChildId(''); setCaregiverId(''); setItems([{ description: '', quantity: 1, unit_price: 0 }]) }}>Reset</Button>
      </div>
    </div>
  )
}
