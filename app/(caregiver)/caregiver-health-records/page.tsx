'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { 
  FileText, 
  TestTube, 
  Pill, 
  Syringe,
  TrendingUp,
  Download,
  Share2,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Bell,
  RefreshCw,
  User,
  Stethoscope,
  Activity,
  X
} from 'lucide-react'

interface LabResult {
  id: string
  testName: string
  testCode: string
  category: string
  orderedBy: string
  orderedDate: string
  resultDate: string
  status: 'pending' | 'processing' | 'completed'
  isAbnormal: boolean
  childName: string
  childId: string
  measurements?: {
    name: string
    value: string
    unit: string
    referenceRange: string
    isAbnormal: boolean
    flag?: 'low' | 'high'
  }[]
  interpretation?: string
}

interface Prescription {
  id: string
  medicationName: string
  genericName: string
  dosage: string
  form: string
  frequency: string
  prescribedBy: string
  prescribedDate: string
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'discontinued'
  refillsRemaining: number
  daysLeft?: number
  instructions: string
  childName: string
  childId: string
  reminderEnabled: boolean
}

// Mock data
const mockLabResults: LabResult[] = [
  {
    id: '1',
    testName: 'Complete Blood Count (CBC)',
    testCode: 'CBC-001',
    category: 'Hematology',
    orderedBy: 'Dr. Sarah Johnson',
    orderedDate: '2026-01-15',
    resultDate: '2026-01-16',
    status: 'completed',
    isAbnormal: true,
    childName: 'Mary Wanjiku',
    childId: '1',
    measurements: [
      { name: 'White Blood Cells', value: '8.5', unit: 'cells/μL', referenceRange: '4.5-11.0', isAbnormal: false },
      { name: 'Hemoglobin', value: '10.2', unit: 'g/dL', referenceRange: '11.5-15.5', isAbnormal: true, flag: 'low' },
      { name: 'Platelets', value: '250', unit: 'K/μL', referenceRange: '150-400', isAbnormal: false },
    ],
    interpretation: 'Mild anemia detected. Recommend iron supplementation and follow-up in 2 weeks.',
  },
  {
    id: '2',
    testName: 'Urinalysis',
    testCode: 'UA-001',
    category: 'Chemistry',
    orderedBy: 'Dr. Michael Chen',
    orderedDate: '2026-01-10',
    resultDate: '2026-01-10',
    status: 'completed',
    isAbnormal: false,
    childName: 'Mary Wanjiku',
    childId: '1',
    measurements: [
      { name: 'pH', value: '6.0', unit: '', referenceRange: '4.5-8.0', isAbnormal: false },
      { name: 'Specific Gravity', value: '1.020', unit: '', referenceRange: '1.005-1.030', isAbnormal: false },
    ],
  },
  {
    id: '3',
    testName: 'Blood Glucose',
    testCode: 'BG-001',
    category: 'Chemistry',
    orderedBy: 'Dr. Sarah Johnson',
    orderedDate: '2026-01-20',
    resultDate: '',
    status: 'pending',
    isAbnormal: false,
    childName: 'John Kamau',
    childId: '2',
  },
]

const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    medicationName: 'Amoxicillin',
    genericName: 'Amoxicillin',
    dosage: '250mg',
    form: 'Capsule',
    frequency: 'Twice daily',
    prescribedBy: 'Dr. Sarah Johnson',
    prescribedDate: '2026-01-20',
    startDate: '2026-01-20',
    endDate: '2026-01-30',
    status: 'active',
    refillsRemaining: 1,
    daysLeft: 5,
    instructions: 'Take with food. Complete full course.',
    childName: 'Mary Wanjiku',
    childId: '1',
    reminderEnabled: true,
  },
  {
    id: '2',
    medicationName: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    dosage: '400 IU',
    form: 'Drops',
    frequency: 'Once daily',
    prescribedBy: 'Dr. Michael Chen',
    prescribedDate: '2026-01-15',
    startDate: '2026-01-15',
    status: 'active',
    refillsRemaining: 3,
    daysLeft: 25,
    instructions: 'Take in the morning.',
    childName: 'Mary Wanjiku',
    childId: '1',
    reminderEnabled: false,
  },
  {
    id: '3',
    medicationName: 'Ibuprofen',
    genericName: 'Ibuprofen',
    dosage: '100mg',
    form: 'Suspension',
    frequency: 'As needed',
    prescribedBy: 'Dr. Sarah Johnson',
    prescribedDate: '2026-01-10',
    startDate: '2026-01-10',
    endDate: '2026-01-15',
    status: 'completed',
    refillsRemaining: 0,
    instructions: 'For fever above 38°C.',
    childName: 'John Kamau',
    childId: '2',
    reminderEnabled: false,
  },
]

export default function HealthRecordsPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'lab' | 'prescriptions'>('lab')
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [selectedLabResult, setSelectedLabResult] = useState<LabResult | null>(null)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [childFilter, setChildFilter] = useState<string>('all')

  useEffect(() => {
    setTimeout(() => {
      setLabResults(mockLabResults)
      setPrescriptions(mockPrescriptions)
      setLoading(false)
    }, 500)
  }, [])

  const filteredLabResults = labResults.filter(result => {
    if (childFilter !== 'all' && result.childId !== childFilter) return false
    if (searchQuery) {
      return result.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             result.childName.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const filteredPrescriptions = prescriptions.filter(rx => {
    if (childFilter !== 'all' && rx.childId !== childFilter) return false
    if (searchQuery) {
      return rx.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             rx.childName.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const getStatusColor = (status: string, isAbnormal?: boolean) => {
    if (isAbnormal) return 'bg-red-50 text-red-700 border-red-200'
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'active':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'pending':
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Lab Result Detail View
  if (selectedLabResult) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedLabResult(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lab Results
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{selectedLabResult.testName}</h1>
            <p className="text-slate-500 mt-1">{selectedLabResult.childName}</p>
          </div>
          <Badge className={getStatusColor(selectedLabResult.status, selectedLabResult.isAbnormal)}>
            {selectedLabResult.isAbnormal ? 'Abnormal' : selectedLabResult.status}
          </Badge>
        </div>

        <Card className="border-slate-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-900">
                {new Date(selectedLabResult.resultDate || selectedLabResult.orderedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Ordered by</span>
              <span className="font-medium text-slate-900">{selectedLabResult.orderedBy}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Category</span>
              <span className="font-medium text-slate-900">{selectedLabResult.category}</span>
            </div>
          </CardContent>
        </Card>

        {selectedLabResult.status === 'completed' && selectedLabResult.measurements && (
          <Card className="border-slate-100">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base">Test Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-slate-100">
              {selectedLabResult.measurements.map((measurement, idx) => (
                <div key={idx} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900">{measurement.name}</span>
                    {measurement.isAbnormal ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-lg font-bold ${measurement.isAbnormal ? 'text-red-600' : 'text-slate-900'}`}>
                      {measurement.value}
                    </span>
                    <span className="text-sm text-slate-500">{measurement.unit}</span>
                    {measurement.flag && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        measurement.flag === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {measurement.flag.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Reference: {measurement.referenceRange}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {selectedLabResult.interpretation && (
          <Card className="border-slate-100 bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 mb-1">Doctor&apos;s Interpretation</p>
                  <p className="text-sm text-slate-600">{selectedLabResult.interpretation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-xl py-5">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button className="flex-1 rounded-xl py-5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    )
  }

  // Prescription Detail View
  if (selectedPrescription) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedPrescription(null)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Prescriptions
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{selectedPrescription.medicationName}</h1>
            <p className="text-slate-500 mt-1">{selectedPrescription.genericName}</p>
          </div>
          <Badge className={getStatusColor(selectedPrescription.status)}>
            {selectedPrescription.status}
          </Badge>
        </div>

        {/* Medication Details */}
        <Card className="border-slate-100">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Pill className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{selectedPrescription.dosage} {selectedPrescription.form}</p>
                <p className="text-slate-500">{selectedPrescription.frequency}</p>
              </div>
            </div>

            {selectedPrescription.daysLeft && selectedPrescription.status === 'active' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">{selectedPrescription.daysLeft} days remaining</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dosage Instructions */}
        <Card className="border-slate-100">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-slate-700">{selectedPrescription.instructions}</p>
          </CardContent>
        </Card>

        {/* Prescription Info */}
        <Card className="border-slate-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">For</span>
              <span className="font-medium text-slate-900">{selectedPrescription.childName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Prescribed by</span>
              <span className="font-medium text-slate-900">{selectedPrescription.prescribedBy}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Start Date</span>
              <span className="font-medium text-slate-900">
                {new Date(selectedPrescription.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {selectedPrescription.endDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">End Date</span>
                <span className="font-medium text-slate-900">
                  {new Date(selectedPrescription.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Refills Remaining</span>
              <span className="font-medium text-slate-900">{selectedPrescription.refillsRemaining}</span>
            </div>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card className="border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Medication Reminders</p>
                  <p className="text-sm text-slate-500">Get notified when it&apos;s time to take</p>
                </div>
              </div>
              <button className={`relative w-12 h-6 rounded-full transition-colors ${
                selectedPrescription.reminderEnabled ? 'bg-blue-500' : 'bg-slate-200'
              }`}>
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  selectedPrescription.reminderEnabled ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {selectedPrescription.status === 'active' && selectedPrescription.refillsRemaining > 0 && (
          <Button className="w-full rounded-xl py-5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <RefreshCw className="h-4 w-4 mr-2" />
            Request Refill
          </Button>
        )}
      </div>
    )
  }

  // Main View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Health Records</h1>
        <p className="text-slate-500 mt-1">Lab results, prescriptions & medical history</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => setActiveTab('lab')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'lab'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TestTube className="h-4 w-4" />
          Lab Results
          {labResults.filter(r => !r.status.includes('completed')).length > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
              {labResults.filter(r => r.status !== 'completed').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'prescriptions'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Pill className="h-4 w-4" />
          Prescriptions
          {prescriptions.filter(p => p.status === 'active').length > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
              {prescriptions.filter(p => p.status === 'active').length}
            </span>
          )}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'lab' ? 'lab results' : 'medications'}...`}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={childFilter}
          onChange={(e) => setChildFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
        >
          <option value="all">All Children</option>
          <option value="1">Mary Wanjiku</option>
          <option value="2">John Kamau</option>
        </select>
      </div>

      {/* Lab Results Tab */}
      {activeTab === 'lab' && (
        <div className="space-y-3">
          {filteredLabResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <TestTube className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No lab results found</p>
              <p className="text-sm text-slate-400 mt-1">Results will appear here when available</p>
            </div>
          ) : (
            filteredLabResults.map((result) => (
              <button
                key={result.id}
                onClick={() => setSelectedLabResult(result)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left"
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                  result.isAbnormal 
                    ? 'bg-red-50' 
                    : result.status === 'completed' 
                      ? 'bg-emerald-50' 
                      : 'bg-amber-50'
                }`}>
                  {result.isAbnormal ? (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  ) : result.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <Clock className="h-6 w-6 text-amber-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-900 truncate">{result.testName}</p>
                    {result.isAbnormal && (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Abnormal</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{result.childName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(result.orderedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {result.orderedBy}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-3">
          {/* Active Medications Section */}
          {filteredPrescriptions.filter(p => p.status === 'active').length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Medications</h3>
              <div className="space-y-3">
                {filteredPrescriptions.filter(p => p.status === 'active').map((rx) => (
                  <button
                    key={rx.id}
                    onClick={() => setSelectedPrescription(rx)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all text-left"
                  >
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shrink-0">
                      <Pill className="h-6 w-6 text-purple-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">{rx.medicationName}</p>
                      <p className="text-sm text-slate-500">{rx.dosage} • {rx.frequency}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{rx.childName}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {rx.daysLeft && (
                        <p className="text-sm font-medium text-amber-600">{rx.daysLeft} days left</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {rx.reminderEnabled && (
                          <Bell className="h-4 w-4 text-blue-500" />
                        )}
                        <ChevronRight className="h-5 w-5 text-slate-300" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Past Medications Section */}
          {filteredPrescriptions.filter(p => p.status !== 'active').length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Past Medications</h3>
              <div className="space-y-3">
                {filteredPrescriptions.filter(p => p.status !== 'active').map((rx) => (
                  <button
                    key={rx.id}
                    onClick={() => setSelectedPrescription(rx)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all text-left opacity-75 hover:opacity-100"
                  >
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <Pill className="h-6 w-6 text-slate-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-700">{rx.medicationName}</p>
                      <p className="text-sm text-slate-500">{rx.dosage} • {rx.frequency}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{rx.childName}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={getStatusColor(rx.status)}>
                        {rx.status}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPrescriptions.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Pill className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">No prescriptions found</p>
              <p className="text-sm text-slate-400 mt-1">Prescriptions will appear here when available</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
