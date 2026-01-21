'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  description: string
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

  const [formData, setFormData] = useState({
    child_id: preSelectedChildId || '',
    medication_name: '',
    medication_id: '',
    dosage: '',
    frequency: 'Once daily',
    duration: '7 days',
    instructions: '',
    quantity: '',
    refills: '0',
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
      .select('id, name, description')
      .order('name')

    if (data) setMedications(data)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      // Create prescription
      const { error } = await supabase.from('prescriptions').insert({
        child_id: formData.child_id,
        doctor_id: doctorId,
        medication_name: formData.medication_name,
        medication_id: formData.medication_id || null,
        dosage: formData.dosage,
        frequency: formData.frequency,
        duration: formData.duration,
        instructions: formData.instructions,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        refills: parseInt(formData.refills),
        status: 'pending',
      })

      if (error) throw error

      // Reset form
      setFormData({
        child_id: '',
        medication_name: '',
        medication_id: '',
        dosage: '',
        frequency: 'Once daily',
        duration: '7 days',
        instructions: '',
        quantity: '',
        refills: '0',
      })

      alert('Prescription created successfully!')
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span>📝</span>
            Quick Prescription
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

          {/* Medication Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="medication">Medication (from list)</Label>
              <Select
                value={formData.medication_id}
                onValueChange={(value) => {
                  const med = medications.find(m => m.id === value)
                  setFormData({
                    ...formData,
                    medication_id: value,
                    medication_name: med?.name || formData.medication_name
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select from stock" />
                </SelectTrigger>
                <SelectContent>
                  {medications.map((med) => (
                    <SelectItem key={med.id} value={med.id}>
                      {med.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="medication_name">Or enter medication name *</Label>
              <Input
                id="medication_name"
                value={formData.medication_name}
                onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                placeholder="e.g., Paracetamol"
                required
              />
            </div>
          </div>

          {/* Dosage and Frequency */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg"
                required
              />
            </div>

            <div>
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Once daily">Once daily</SelectItem>
                  <SelectItem value="Twice daily">Twice daily</SelectItem>
                  <SelectItem value="Three times daily">Three times daily</SelectItem>
                  <SelectItem value="Four times daily">Four times daily</SelectItem>
                  <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                  <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                  <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                  <SelectItem value="Every 12 hours">Every 12 hours</SelectItem>
                  <SelectItem value="As needed">As needed</SelectItem>
                  <SelectItem value="Before meals">Before meals</SelectItem>
                  <SelectItem value="After meals">After meals</SelectItem>
                  <SelectItem value="At bedtime">At bedtime</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration and Quantity */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="duration">Duration *</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3 days">3 days</SelectItem>
                  <SelectItem value="5 days">5 days</SelectItem>
                  <SelectItem value="7 days">7 days</SelectItem>
                  <SelectItem value="10 days">10 days</SelectItem>
                  <SelectItem value="14 days">14 days</SelectItem>
                  <SelectItem value="21 days">21 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                  <SelectItem value="60 days">60 days</SelectItem>
                  <SelectItem value="90 days">90 days</SelectItem>
                  <SelectItem value="Until review">Until review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g., 30"
              />
            </div>

            <div>
              <Label htmlFor="refills">Refills</Label>
              <Input
                id="refills"
                type="number"
                min="0"
                max="10"
                value={formData.refills}
                onChange={(e) => setFormData({ ...formData, refills: e.target.value })}
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Additional instructions for the patient..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? 'Creating...' : 'Create Prescription'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}