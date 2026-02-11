interface LabResult {
  id: string
  testName: string
  testCode: string
  category: string
  orderedBy: string
  orderedDate: string
  resultDate: string
  status: 'pending' | 'collected' | 'in_progress' | 'completed' | 'cancelled'
  isAbnormal: boolean
  childName: string
  childId: string
  results?: string // Raw results text
  measurements?: LabMeasurement[]
  interpretation?: string
}

interface LabMeasurement {
  name: string
  value: string
  unit: string
  referenceRange: string
  isAbnormal: boolean
  flag?: 'low' | 'high' | 'critical'
}

interface Prescription {
  id: string
  medicationName: string
  genericName: string
  dosage: string
  form: string
  frequency: string
  duration?: string // e.g., "30 days"
  prescribedBy: string
  prescribedDate: string
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'discontinued' | 'cancelled'
  refillsRemaining: number
  daysLeft?: number
  instructions: string
  childName: string
  childId: string
  reminderEnabled: boolean
}