'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Child {
  id: string
  full_name: string
  date_of_birth: string
  gender: string
  blood_type: string | null
  allergies: string | null
  medical_notes: string | null
  created_at: string
}

export default function PatientsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [caregiverId, setCaregiverId] = useState<string | null>(null)

  useEffect(() => {
    loadChildren()
  }, [])

  async function loadChildren() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    setCaregiverId(user.id)

    const { data: childrenData } = await supabase
      .from('children')
      .select('*')
      .eq('caregiver_id', user.id)
      .order('created_at', { ascending: false })

    setChildren(childrenData || [])
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const fullName = formData.get('full_name') as string
    const dateOfBirth = formData.get('date_of_birth') as string
    const gender = formData.get('gender') as string
    const bloodType = formData.get('blood_type') as string
    const allergiesInput = formData.get('allergies') as string
    const medicalNotes = formData.get('medical_notes') as string

    try {
      const supabase = createClient()

      // Convert allergies text to array if it's not empty
      // Split by commas and trim whitespace
      const allergiesValue = allergiesInput?.trim() 
        ? allergiesInput.split(',').map(a => a.trim()).filter(a => a)
        : null

      const insertData: any = {
        caregiver_id: caregiverId,
        full_name: fullName,
        date_of_birth: dateOfBirth,
        gender: gender,
        blood_type: bloodType || null,
        medical_notes: medicalNotes || null,
      }

      // Only add allergies if we have values
      if (allergiesValue && allergiesValue.length > 0) {
        insertData.allergies = allergiesValue
      }

      const { error: insertError } = await supabase
        .from('children')
        .insert(insertData)

      if (insertError) throw insertError

      setShowAddForm(false)
      await loadChildren()

      // Reset form
      e.currentTarget.reset()
    } catch (err: any) {
      console.error('Insert error:', err)
      setError(err.message || 'Failed to add child')
    } finally {
      setLoading(false)
    }
  }

  function calculateAge(dateOfBirth: string) {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  // Format allergies for display (convert array to string if needed)
  function formatAllergies(allergies: any): string | null {
    if (!allergies) return null
    if (Array.isArray(allergies)) return allergies.join(', ')
    return allergies
  }

  return (
    <main className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Children</h1>
          <p className="mt-0.5 sm:mt-1 text-sm sm:text-base text-slate-600">Manage your children's information</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              + Add Child
            </Button>
          )}
          <Button
            onClick={() => router.push('/dashboard')}
            className="flex-1 sm:flex-none bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm sm:text-base"
          >
            Dashboard
          </Button>
        </div>
      </div>

      {/* Add Child Form */}
      {showAddForm && (
        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-purple-50">
          <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-lg sm:text-xl">Add New Child</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 sm:pt-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                <div>
                  <label htmlFor="full_name" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                    Full Name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    placeholder="Enter child's full name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                    Date of Birth *
                  </label>
                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="blood_type" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                    Blood Type (Optional)
                  </label>
                  <select
                    id="blood_type"
                    name="blood_type"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="allergies" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                  Allergies (Optional)
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  rows={2}
                  placeholder="Separate multiple allergies with commas (e.g., Peanuts, Penicillin, Eggs)"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">Tip: Separate multiple allergies with commas</p>
              </div>

              <div>
                <label htmlFor="medical_notes" className="mb-1 sm:mb-1.5 block text-sm font-medium text-slate-700">
                  Medical Notes (Optional)
                </label>
                <textarea
                  id="medical_notes"
                  name="medical_notes"
                  rows={3}
                  placeholder="Any medical conditions, medications, or important health information..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Adding...' : 'Add Child'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setError(null)
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Children List */}
      {children.length === 0 ? (
        <Card className="border-none shadow-lg">
          <CardContent className="py-12 sm:py-16 text-center">
            <div className="mx-auto mb-3 sm:mb-4 inline-flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100 text-3xl sm:text-4xl">
              👶
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">No Children Added Yet</h2>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-600">Add your first child to start booking appointments</p>
            {!showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="mt-3 sm:mt-4 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Add Your First Child
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Card
              key={child.id}
              className="border-none shadow-md sm:shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-white to-slate-50"
            >
              <CardContent className="p-4 sm:p-6">
                {/* Header with Icon */}
                <div className="mb-3 sm:mb-4 flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-xl sm:text-2xl">
                    {child.gender === 'male' ? '👦' : child.gender === 'female' ? '👧' : '👶'}
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                    {calculateAge(child.date_of_birth)} {calculateAge(child.date_of_birth) === 1 ? 'year' : 'years'}
                  </Badge>
                </div>

                {/* Child Info */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">{child.full_name}</h3>

                  <div className="space-y-1 text-xs sm:text-sm text-slate-600">
                    <p>
                      <span className="font-medium">Birthday:</span> {formatDate(child.date_of_birth)}
                    </p>
                    <p>
                      <span className="font-medium">Gender:</span> {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
                    </p>
                    {child.blood_type && (
                      <p>
                        <span className="font-medium">Blood Type:</span> {child.blood_type}
                      </p>
                    )}
                  </div>

                  {/* Additional Info */}
                  {(child.allergies || child.medical_notes) && (
                    <div className="mt-3 sm:mt-4 space-y-2">
                      {child.allergies && (
                        <div className="rounded-lg bg-red-50 p-2.5 sm:p-3 border border-red-100">
                          <p className="text-[10px] sm:text-xs font-medium text-red-700 mb-0.5 sm:mb-1">Allergies:</p>
                          <p className="text-[10px] sm:text-xs text-red-600 line-clamp-2">{formatAllergies(child.allergies)}</p>
                        </div>
                      )}
                      {child.medical_notes && (
                        <div className="rounded-lg bg-blue-50 p-2.5 sm:p-3 border border-blue-100">
                          <p className="text-[10px] sm:text-xs font-medium text-blue-700 mb-0.5 sm:mb-1">Medical Notes:</p>
                          <p className="text-[10px] sm:text-xs text-blue-600 line-clamp-2">{child.medical_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                  <Button
                    size="sm"
                    onClick={() => router.push('/caregiver-appointments')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    Book Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}