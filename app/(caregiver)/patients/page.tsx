'use client'

import { useState, useEffect, useMemo } from 'react'
import { logActivity, ActivityActions } from '@/lib/activity-logger'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Search, X, Baby, Plus, LayoutDashboard, Calendar, AlertTriangle, FileText, Heart, Stethoscope, UserPlus, ChevronLeft, Users, FileCheck } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')

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

      // Log patient/child creation
      logActivity({
        action: ActivityActions.PATIENT_CREATE,
        action_category: 'patient',
        target_table: 'children',
        description: `Added child ${fullName}`
      }).catch(() => { })

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

  // Filter children based on search query
  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return children

    const query = searchQuery.toLowerCase()
    return children.filter((child) => {
      const name = child.full_name?.toLowerCase() || ''
      const gender = child.gender?.toLowerCase() || ''
      const bloodType = child.blood_type?.toLowerCase() || ''
      const allergies = formatAllergies(child.allergies)?.toLowerCase() || ''
      const notes = child.medical_notes?.toLowerCase() || ''

      return (
        name.includes(query) ||
        gender.includes(query) ||
        bloodType.includes(query) ||
        allergies.includes(query) ||
        notes.includes(query)
      )
    })
  }, [children, searchQuery])

  // Get gender-specific icon and color
  function getGenderDetails(gender: string) {
    switch (gender) {
      case 'male':
        return { color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200/60', icon: '♂' }
      case 'female':
        return { color: 'text-pink-600', bg: 'bg-pink-50', ring: 'ring-pink-200/60', icon: '♀' }
      default:
        return { color: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-200/60', icon: '⚧' }
    }
  }

  return (
    <main className="space-y-5 sm:space-y-6 lg:space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-700 p-5 text-white shadow-lg shadow-blue-600/20 sm:rounded-3xl sm:p-8 lg:p-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 motion-safe:animate-pulse sm:h-56 sm:w-56" aria-hidden="true" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/5 motion-safe:animate-pulse [animation-delay:1s] sm:h-40 sm:w-40" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm">
              <Users className="h-3 w-3" />
              Children Profiles
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
              My Children
            </h1>
            <p className="mt-1 text-sm text-blue-100 sm:text-base">
              Manage your children&apos;s health profiles
            </p>
          </div>
          <div className="flex gap-3">
            {!showAddForm && (
              <Button
                onClick={() => { logActivity({ action: 'opened_add_child_form', action_category: 'patient', description: 'Opened add child form' }).catch(() => { }); setShowAddForm(true) }}
                className="flex-1 sm:flex-none bg-white text-blue-600 hover:bg-white/95 shadow-lg shadow-blue-900/20 active:scale-95 transition-transform text-sm sm:text-base font-semibold"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                Add New Child
              </Button>
            )}
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="flex-1 sm:flex-none bg-white/15 text-white backdrop-blur-md hover:bg-white/25 border border-white/20 active:scale-95 transition-transform text-sm sm:text-base"
            >
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      {children.length > 0 && !showAddForm && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <Card className="group border-0 shadow-sm ring-1 ring-blue-100 bg-linear-to-br from-white via-white to-blue-50/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
            <CardContent className="p-4 flex items-center gap-3 sm:gap-4">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <Baby className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-900 sm:text-sm">Total Children</p>
                <p className="text-2xl font-bold text-blue-600 tracking-tight">{children.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="group border-0 shadow-sm ring-1 ring-emerald-100 bg-linear-to-br from-white via-white to-emerald-50/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
            <CardContent className="p-4 flex items-center gap-3 sm:gap-4">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-900 sm:text-sm">Book Appointment</p>
                <Button
                  variant="ghost"
                  className="p-0 h-auto text-base font-bold text-emerald-600 hover:text-emerald-700 active:scale-95 transition-transform"
                  onClick={() => router.push('/caregiver-appointments')}
                >
                  Schedule now →
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card
            className="group border-0 shadow-sm ring-1 ring-purple-100 bg-linear-to-br from-white via-white to-purple-50/80 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            onClick={() => router.push('/caregiver-health-records')}
          >
            <CardContent className="p-4 flex items-center gap-3 sm:gap-4">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-linear-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <FileCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-900 sm:text-sm">Health Records</p>
                <p className="text-base font-bold text-purple-600">
                  View All →
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Child Form */}
      {showAddForm && (
        <Card className="border-0 shadow-lg ring-1 ring-slate-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  setError(null)
                }}
                className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-800">
                  Add New Child
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Complete all required fields (*)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    placeholder="Enter child's full name"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="mb-2 block text-sm font-medium text-slate-700">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="mb-2 block text-sm font-medium text-slate-700">
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors appearance-none"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="blood_type" className="mb-2 block text-sm font-medium text-slate-700">
                    Blood Type (Optional)
                  </label>
                  <select
                    id="blood_type"
                    name="blood_type"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors appearance-none"
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
                <label htmlFor="allergies" className="mb-2 block text-sm font-medium text-slate-700">
                  Allergies (Optional)
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  rows={2}
                  placeholder="Separate multiple allergies with commas (e.g., Peanuts, Penicillin, Eggs)"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
                />
                <p className="mt-2 text-xs text-slate-500">Tip: Separate multiple allergies with commas</p>
              </div>

              <div>
                <label htmlFor="medical_notes" className="mb-2 block text-sm font-medium text-slate-700">
                  Medical Notes (Optional)
                </label>
                <textarea
                  id="medical_notes"
                  name="medical_notes"
                  rows={3}
                  placeholder="Any medical conditions, medications, or important health information..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-95 transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Adding Child...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      Add Child
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setError(null)
                  }}
                  variant="secondary"
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {children.length > 0 && !showAddForm && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 sm:h-5 sm:w-5" />
          <input
            type="text"
            placeholder="Search by name, gender, blood type, allergies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-white pl-11 pr-11 py-3 text-sm shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow sm:rounded-2xl sm:py-3.5 sm:pl-12 sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-90 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {searchQuery && (
            <p className="mt-2 pl-1 text-sm text-slate-500">
              Found {filteredChildren.length} of {children.length} children matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      )}

      {/* Children List */}
      {children.length === 0 && !showAddForm ? (
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white">
          <CardContent className="py-14 sm:py-20 text-center">
            <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 sm:h-24 sm:w-24 sm:rounded-3xl">
              <Baby className="h-10 w-10 text-white sm:h-12 sm:w-12" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">No Children Added Yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 sm:text-base">Add your first child to start booking appointments and managing health records</p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : filteredChildren.length === 0 && !showAddForm ? (
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white">
          <CardContent className="py-14 sm:py-20 text-center">
            <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 sm:h-20 sm:w-20 sm:rounded-3xl">
              <Search className="h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">No Matching Children</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 sm:text-base">Try adjusting your search term</p>
            <Button
              onClick={() => setSearchQuery('')}
              className="mt-6 bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all ring-1 ring-slate-200"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : !showAddForm && (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {filteredChildren.map((child) => {
            const genderDetails = getGenderDetails(child.gender)
            return (
              <Card
                key={child.id}
                className="group/card overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/80 bg-white transition-all duration-200 hover:ring-blue-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  {/* Header with Icon */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${genderDetails.bg} ${genderDetails.ring} transition-transform duration-200 group-hover/card:scale-105 sm:h-12 sm:w-12`}>
                      <span className={`text-base font-bold sm:text-lg ${genderDetails.color}`}>
                        {genderDetails.icon}
                      </span>
                    </div>
                    <Badge className="shrink-0 rounded-full border-0 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 ring-1 ring-blue-200/60 sm:px-2.5 sm:py-1 sm:text-xs">
                      {calculateAge(child.date_of_birth)} {calculateAge(child.date_of_birth) === 1 ? 'yr' : 'yrs'} old
                    </Badge>
                  </div>

                  {/* Child Info */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-800 truncate sm:text-base">{child.full_name}</h3>

                    <div className="space-y-1 text-xs text-slate-500 sm:space-y-1.5 sm:text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">{formatDate(child.date_of_birth)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${genderDetails.bg} ${genderDetails.color} sm:text-xs`}>
                          {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
                        </span>
                        {child.blood_type && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600 ring-1 ring-red-100 sm:text-xs">
                            {child.blood_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(child.allergies || child.medical_notes) && (
                      <div className="mt-3 space-y-2 sm:mt-4">
                        {child.allergies && (
                          <div className="rounded-lg bg-red-50 p-2.5 ring-1 ring-red-100 sm:rounded-xl sm:p-3">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <AlertTriangle className="h-3 w-3 shrink-0 text-red-600" />
                              <p className="text-[11px] font-semibold text-red-700 sm:text-xs">Allergies</p>
                            </div>
                            <p className="text-[11px] text-red-600 line-clamp-1 sm:text-xs sm:line-clamp-2">{formatAllergies(child.allergies)}</p>
                          </div>
                        )}
                        {child.medical_notes && (
                          <div className="rounded-lg bg-blue-50 p-2.5 ring-1 ring-blue-100 sm:rounded-xl sm:p-3">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <FileText className="h-3 w-3 shrink-0 text-blue-600" />
                              <p className="text-[11px] font-semibold text-blue-700 sm:text-xs">Medical Notes</p>
                            </div>
                            <p className="text-[11px] text-blue-600 line-clamp-1 sm:text-xs sm:line-clamp-2">{child.medical_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-100 sm:mt-4 sm:pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        onClick={() => router.push('/caregiver-appointments')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 active:scale-95 transition-all text-xs sm:text-sm"
                      >
                        <Calendar className="h-3.5 w-3.5 shrink-0 mr-1" />
                        <span className="truncate">Book</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 active:scale-95 transition-all text-xs sm:text-sm"
                        onClick={() => router.push(`/caregiver-health-records?childId=${child.id}`)}
                      >
                        <FileCheck className="h-3.5 w-3.5 shrink-0 mr-1" />
                        <span className="truncate">Records</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}