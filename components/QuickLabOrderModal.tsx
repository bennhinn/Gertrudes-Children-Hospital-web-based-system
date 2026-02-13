'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity-logger'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface Child {
  id: string
  full_name: string
  date_of_birth: string
  caregiver_id: string
}

interface LabTest {
  id: string
  name: string
  description: string
  cost: number
}

interface QuickLabOrderModalProps {
  open: boolean
  onClose: () => void
  doctorId: string
  preSelectedChildId?: string
  consultationId?: string
}

export default function QuickLabOrderModal({
  open,
  onClose,
  doctorId,
  preSelectedChildId,
  consultationId,
}: QuickLabOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [labTests, setLabTests] = useState<LabTest[]>([])
  const [selectedTests, setSelectedTests] = useState<string[]>([])

  const [formData, setFormData] = useState({
    child_id: preSelectedChildId || '',
    priority: 'routine',
    clinical_notes: '',
    special_instructions: '',
  })

  useEffect(() => {
    if (open) {
      loadChildren()
      loadLabTests()
    }
  }, [open])

  useEffect(() => {
    if (preSelectedChildId) {
      setFormData(prev => ({ ...prev, child_id: preSelectedChildId }))
    }
  }, [preSelectedChildId])

  async function loadChildren() {
    const supabase = createClient()
    const { data } = await supabase
      .from('children')
      .select('id, full_name, date_of_birth, caregiver_id')
      .order('full_name')

    if (data) setChildren(data)
  }

  async function loadLabTests() {
    const supabase = createClient()
    const { data } = await supabase
      .from('lab_tests')
      .select('id, name, description, cost')
      .order('name')

    if (data) setLabTests(data)
  }

  function toggleTest(testId: string) {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (selectedTests.length === 0) {
      alert('Please select at least one test')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // ----- 1. Get caregiver_id for the selected child -----
      const selectedChild = children.find(c => c.id === formData.child_id)
      if (!selectedChild) throw new Error('Patient not found')
      const caregiverId = selectedChild.caregiver_id
      if (!caregiverId) throw new Error('Patient has no caregiver assigned')

      // ----- 2. Create each lab order individually and collect IDs -----
      const createdLabOrderIds: string[] = []

      for (const testId of selectedTests) {
        const test = labTests.find(t => t.id === testId)!
        const { data: order, error: orderError } = await supabase
          .from('lab_orders')
          .insert({
            child_id: formData.child_id,
            doctor_id: doctorId,
            consultation_id: consultationId,
            test_id: testId,
            test_name: test.name,
            priority: formData.priority,
            clinical_notes: formData.clinical_notes,
            special_instructions: formData.special_instructions,
            status: 'pending',
            ordered_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (orderError) throw orderError
        createdLabOrderIds.push(order.id)
      }

      // ----- 3. Calculate total cost -----
      const totalCost = selectedTests.reduce((sum, testId) => {
        const test = labTests.find(t => t.id === testId)!
        return sum + test.cost
      }, 0)

      // ----- 4. Create a single invoice for all tests -----
      const invoiceNumber = `INV-${Date.now()}`
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7) // due in 7 days

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          child_id: formData.child_id,
          caregiver_id: caregiverId,
          consultation_id: consultationId,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          subtotal: totalCost,
          tax_amount: 0,
          discount_amount: 0,
          total: totalCost,                // ✅ schema: 'total' not 'total_amount'
          paid_amount: 0,
          balance_due: totalCost,
          status: 'pending',              // pending, paid, cancelled
          created_by: doctorId,
          // lab_order_ids: createdLabOrderIds, // optional – you can add this array column later
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // ----- 5. Create invoice line items for each test -----
      const lineItems = selectedTests.map((testId, index) => {
        const test = labTests.find(t => t.id === testId)!
        const labOrderId = createdLabOrderIds[index] // matches order by iteration
        return {
          invoice_id: invoice.id,
          item_type: 'lab_test',
          item_id: labOrderId,
          description: test.name,
          quantity: 1,
          unit_price: test.cost,
          discount_percent: 0,
          tax_percent: 0,
          line_total: test.cost,
        }
      })

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItems)

      if (lineItemsError) throw lineItemsError

      // ----- 6. Log activity -----
      const patientName = selectedChild.full_name
      const testNames = selectedTests.map(testId => labTests.find(t => t.id === testId)?.name).join(', ')
      await logActivity({
        action: 'create_lab_order_with_invoice',
        target_table: 'lab_order',
        target_id: createdLabOrderIds[0], // first order ID
        description: `Ordered lab tests for ${patientName}: ${testNames}. Invoice #${invoiceNumber} created for KSh ${totalCost.toFixed(2)}`,
        metadata: {
          patient_id: formData.child_id,
          patient_name: patientName,
          caregiver_id: caregiverId,
          priority: formData.priority,
          consultation_id: consultationId,
          tests: selectedTests.map(testId => labTests.find(t => t.id === testId)?.name),
          test_count: selectedTests.length,
          invoice_id: invoice.id,
          invoice_number: invoiceNumber,
          total_cost: totalCost,
          lab_order_ids: createdLabOrderIds,
        },
      })

      // ----- 7. Reset form and close -----
      setFormData({
        child_id: '',
        priority: 'routine',
        clinical_notes: '',
        special_instructions: '',
      })
      setSelectedTests([])

      alert(`✅ ${createdLabOrderIds.length} lab order(s) created and invoice #${invoiceNumber} generated!`)
      onClose()
    } catch (error: any) {
      console.error('Error creating lab orders:', error)
      alert(error.message || 'Failed to create lab orders')
    } finally {
      setLoading(false)
    }
  }

  const totalCost = selectedTests.reduce((sum, testId) => {
    const test = labTests.find(t => t.id === testId)
    return sum + (test?.cost || 0)
  }, 0)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span>🧪</span>
            Order Lab Tests
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Selection */}
          <div>
            <Label htmlFor="child">Patient *</Label>
            <Select
              value={formData.child_id}
              onValueChange={(value) => setFormData({ ...formData, child_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <Label htmlFor="priority">Priority *</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">🟢 Routine</SelectItem>
                <SelectItem value="urgent">🟡 Urgent</SelectItem>
                <SelectItem value="stat">🔴 STAT (Immediate)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lab Tests Selection */}
          <div>
            <Label className="mb-3 block">Select Tests *</Label>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-4">
              {labTests.length === 0 ? (
                <p className="text-center text-sm text-slate-500">
                  No lab tests available. Add tests in the lab management section.
                </p>
              ) : (
                labTests.map((test) => (
                  <div
                    key={test.id}
                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleTest(test.id)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        id={test.id}
                        checked={selectedTests.includes(test.id)}
                        onCheckedChange={() => toggleTest(test.id)}
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor={test.id}
                        className="cursor-pointer font-medium text-slate-800 block"
                      >
                        {test.name}
                      </label>
                      {test.description && (
                        <p className="text-xs text-slate-500 mt-1">{test.description}</p>
                      )}
                      <p className="mt-1 text-sm font-semibold text-purple-600">
                        KSh {test.cost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected Summary */}
            {selectedTests.length > 0 && (
              <div className="mt-3 rounded-lg bg-purple-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-900">
                    {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} selected
                  </span>
                  <span className="text-lg font-bold text-purple-600">
                    Total: KSh {totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Notes */}
          <div>
            <Label htmlFor="clinical_notes">Clinical Notes</Label>
            <Textarea
              id="clinical_notes"
              value={formData.clinical_notes}
              onChange={(e) => setFormData({ ...formData, clinical_notes: e.target.value })}
              placeholder="Relevant clinical information, symptoms, or reason for testing..."
              rows={3}
            />
          </div>

          {/* Special Instructions */}
          <div>
            <Label htmlFor="special_instructions">Special Instructions</Label>
            <Textarea
              id="special_instructions"
              value={formData.special_instructions}
              onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
              placeholder="Fasting required, specific collection time, etc..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedTests.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Creating...' : `Order ${selectedTests.length} Test${selectedTests.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}