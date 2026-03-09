'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity-logger'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Child {
  id: string
  full_name: string
  date_of_birth: string
  caregiver_id: string   // ← needed for invoice
}

interface Medication {
  id: string
  name: string
  description: string | null
  stock: number
  selling_price?: number | null
}

interface PrescriptionItem {
  medication_id: string
  medication_name: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
  instructions: string
}

interface QuickPrescriptionModalProps {
  open: boolean
  onClose: () => void
  doctorId: string
  preSelectedChildId?: string
  consultationId?: string
}

export default function QuickPrescriptionModal({
  open,
  onClose,
  doctorId,
  preSelectedChildId,
  consultationId,
}: QuickPrescriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])

  const [formData, setFormData] = useState({
    child_id: preSelectedChildId || '',
    urgency: 'routine',
    notes: '',
  })

  const [currentItem, setCurrentItem] = useState({
    medication_id: '',
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: 1,
    instructions: '',
  })

  useEffect(() => {
    if (open) {
      loadChildren()
      loadMedications()
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

  async function loadMedications() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('medications')
      .select('id, name, description, stock, selling_price')
      .order('name')

    if (!error && data) {
      setMedications(
        data.map((med: any) => ({
          ...med,
          selling_price: med.selling_price ?? 0,
        }))
      )
      return
    }

    // Fallback for environments where selling_price doesn't exist.
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('medications')
      .select('id, name, description, stock')
      .order('name')

    if (fallbackError) {
      console.error('Error loading medications from inventory:', fallbackError)
      setMedications([])
      return
    }

    setMedications(
      (fallbackData || []).map((med: any) => ({
        ...med,
        selling_price: 0,
      }))
    )
  }

  function handleMedicationSelect(medicationId: string) {
    const medication = medications.find(m => m.id === medicationId)
    if (medication) {
      setCurrentItem({
        ...currentItem,
        medication_id: medicationId,
        medication_name: medication.name,
      })
    }
  }

  function addPrescriptionItem() {
    if (!currentItem.medication_id || !currentItem.dosage || !currentItem.frequency) {
      alert('Please fill in medication, dosage, and frequency')
      return
    }

    setPrescriptionItems([...prescriptionItems, { ...currentItem }])
    setCurrentItem({
      medication_id: '',
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      instructions: '',
    })
  }

  function removePrescriptionItem(index: number) {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!formData.child_id) {
      alert('Please select a patient')
      return
    }

    if (prescriptionItems.length === 0) {
      alert('Please add at least one medication')
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

      // ----- 2. Create prescription header -----
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          child_id: formData.child_id,
          doctor_id: doctorId,
          consultation_id: consultationId,
          urgency: formData.urgency,
          notes: formData.notes || null,
          status: 'pending',
        })
        .select()
        .single()

      if (prescriptionError) throw prescriptionError

      // ----- 3. Insert prescription items and collect their IDs -----
      const insertedItemIds: string[] = []
      let totalCost = 0

      for (const item of prescriptionItems) {
        const medication = medications.find(m => m.id === item.medication_id)
        const unitPrice = medication?.selling_price || 0
        const lineTotal = unitPrice * item.quantity
        totalCost += lineTotal

        const { data: insertedItem, error: itemError } = await supabase
          .from('prescription_items')
          .insert({
            prescription_id: prescription.id,
            medication_id: item.medication_id,
            medication_name: item.medication_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration || null,
            quantity: item.quantity,
            instructions: item.instructions || null,
          })
          .select('id')
          .single()

        if (itemError) throw itemError
        insertedItemIds.push(insertedItem.id)
      }

      // ----- 4. Create invoice for the prescription -----
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
          total: totalCost,
          paid_amount: 0,
          balance_due: totalCost,
          status: 'pending',
          created_by: doctorId,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      // ----- 5. Create invoice line items for each prescription item -----
      const lineItems = prescriptionItems.map((item, index) => {
        const medication = medications.find(m => m.id === item.medication_id)
        const unitPrice = medication?.selling_price || 0
        const lineTotal = unitPrice * item.quantity
        const prescriptionItemId = insertedItemIds[index]
        return {
          invoice_id: invoice.id,
          item_type: 'prescription',
          item_id: prescriptionItemId,
          description: `${item.medication_name} ${item.dosage} (${item.quantity} x ${item.frequency})`,
          quantity: item.quantity,
          unit_price: unitPrice,
          discount_percent: 0,
          tax_percent: 0,
          line_total: lineTotal,
        }
      })

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItems)

      if (lineItemsError) throw lineItemsError

      // ----- 6. Log activity with invoice details -----
      const patientName = selectedChild.full_name
      const medicationNames = prescriptionItems.map(item => item.medication_name).join(', ')
      await logActivity({
        action: 'create_prescription_with_invoice',
        target_table: 'prescription',
        target_id: prescription.id,
        description: `Created prescription for ${patientName}: ${medicationNames}. Invoice #${invoiceNumber} created for KSh ${totalCost.toFixed(2)}`,
        metadata: {
          patient_id: formData.child_id,
          patient_name: patientName,
          caregiver_id: caregiverId,
          urgency: formData.urgency,
          consultation_id: consultationId,
          medications: prescriptionItems.map(item => ({
            name: item.medication_name,
            dosage: item.dosage,
            quantity: item.quantity,
          })),
          item_count: prescriptionItems.length,
          invoice_id: invoice.id,
          invoice_number: invoiceNumber,
          total_cost: totalCost,
        },
      })

      // ----- 7. Reset form and close -----
      setFormData({
        child_id: '',
        urgency: 'routine',
        notes: '',
      })
      setPrescriptionItems([])

      alert(`✅ Prescription created with ${prescriptionItems.length} medication(s) and invoice #${invoiceNumber} generated!`)
      onClose()
    } catch (error: any) {
      console.error('Error creating prescription:', error)
      alert(error.message || 'Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span>💊</span>
            Quick Prescription
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient Selection */}
          <div>
            <Label htmlFor="child">Patient *</Label>
            <Select
              value={formData.child_id}
              onValueChange={(value) => setFormData({ ...formData, child_id: value })}
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

          {/* Urgency */}
          <div>
            <Label htmlFor="urgency">Urgency *</Label>
            <Select
              value={formData.urgency}
              onValueChange={(value) => setFormData({ ...formData, urgency: value })}
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

          {/* Add Medication */}
          <div className="rounded-xl border-2 border-dashed border-slate-300 p-4">
            <h3 className="mb-3 font-semibold text-slate-800">Add Medication</h3>
            <div className="space-y-3">
              <div>
                <Label>Medication *</Label>
                <Select
                  value={currentItem.medication_id}
                  onValueChange={handleMedicationSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.length === 0 ? (
                      <div className="p-2 text-center text-sm text-slate-500">
                        No medications in stock
                      </div>
                    ) : (
                      medications.map((med) => (
                        <SelectItem key={med.id} value={med.id}>
                          {med.name} (KSh {Number(med.selling_price || 0).toFixed(2)}) - Stock: {med.stock}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Dosage *</Label>
                  <Input
                    value={currentItem.dosage}
                    onChange={(e) => setCurrentItem({ ...currentItem, dosage: e.target.value })}
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div>
                  <Label>Frequency *</Label>
                  <Input
                    value={currentItem.frequency}
                    onChange={(e) => setCurrentItem({ ...currentItem, frequency: e.target.value })}
                    placeholder="e.g., 3 times daily"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={currentItem.duration}
                    onChange={(e) => setCurrentItem({ ...currentItem, duration: e.target.value })}
                    placeholder="e.g., 7 days"
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div>
                <Label>Special Instructions</Label>
                <Textarea
                  value={currentItem.instructions}
                  onChange={(e) => setCurrentItem({ ...currentItem, instructions: e.target.value })}
                  placeholder="e.g., Take with food, avoid alcohol..."
                  rows={2}
                />
              </div>

              <Button
                onClick={addPrescriptionItem}
                className="w-full bg-blue-600 hover:bg-blue-700"
                type="button"
              >
                ➕ Add to Prescription
              </Button>
            </div>
          </div>

          {/* Prescription Items List */}
          {prescriptionItems.length > 0 && (
            <div className="rounded-xl bg-green-50 p-4">
              <h3 className="mb-3 font-semibold text-green-800">
                Prescription Items ({prescriptionItems.length})
              </h3>
              <div className="space-y-2">
                {prescriptionItems.map((item, index) => {
                  const medication = medications.find(m => m.id === item.medication_id)
                  const unitPrice = medication?.selling_price || 0
                  const lineTotal = unitPrice * item.quantity
                  return (
                    <div key={index} className="flex items-center justify-between rounded-lg bg-white p-3">
                      <div>
                        <p className="font-medium text-slate-800">{item.medication_name}</p>
                        <p className="text-sm text-slate-600">
                          {item.dosage} • {item.frequency} • {item.duration || 'No duration'} • Qty: {item.quantity}
                        </p>
                        {item.instructions && (
                          <p className="text-xs text-slate-500 mt-1">📝 {item.instructions}</p>
                        )}
                        <p className="text-xs font-semibold text-purple-600 mt-1">
                          KSh {unitPrice.toFixed(2)} each • Total: KSh {lineTotal.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => removePrescriptionItem(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information or special considerations..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || prescriptionItems.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Creating...' : `Create Prescription & Invoice`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}