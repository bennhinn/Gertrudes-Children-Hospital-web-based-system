'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
}

interface Medication {
  id: string
  name: string
  description: string | null
  stock: number
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
}

export default function QuickPrescriptionModal({
  open,
  onClose,
  doctorId,
  preSelectedChildId
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
      .select('id, full_name, date_of_birth')
      .order('full_name')
    
    if (data) setChildren(data)
  }

  async function loadMedications() {
    const supabase = createClient()
    const { data } = await supabase
      .from('medications')
      .select('id, name, description, stock')
      .gt('stock', 0) // Only show medications with stock
      .order('name')
    
    if (data) setMedications(data)
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
    
    // Reset current item
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

      // Create prescription
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert([{
          child_id: formData.child_id,
          doctor_id: doctorId,
          urgency: formData.urgency,
          notes: formData.notes || null,
          status: 'pending',
        }])
        .select()
        .single()

      if (prescriptionError) throw prescriptionError

      // Create prescription items
      const items = prescriptionItems.map(item => ({
        prescription_id: prescription.id,
        medication_id: item.medication_id,
        medication_name: item.medication_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration || null,
        quantity: item.quantity,
        instructions: item.instructions || null,
      }))

      const { error: itemsError } = await supabase
        .from('prescription_items')
        .insert(items)

      if (itemsError) throw itemsError

      // Reset form
      setFormData({
        child_id: '',
        urgency: 'routine',
        notes: '',
      })
      setPrescriptionItems([])

      alert(`✅ Prescription created successfully with ${items.length} medication(s)!`)
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
                          {med.name} (Stock: {med.stock})
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
                {prescriptionItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-white p-3">
                    <div>
                      <p className="font-medium text-slate-800">{item.medication_name}</p>
                      <p className="text-sm text-slate-600">
                        {item.dosage} • {item.frequency} • {item.duration || 'No duration'} • Qty: {item.quantity}
                      </p>
                      {item.instructions && (
                        <p className="text-xs text-slate-500 mt-1">📝 {item.instructions}</p>
                      )}
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
                ))}
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
              {loading ? 'Creating...' : `Create Prescription (${prescriptionItems.length} items)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}