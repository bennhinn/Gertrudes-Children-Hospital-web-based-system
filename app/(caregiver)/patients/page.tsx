'use client'

import { useState, useEffect, useMemo } from 'react'
import { logActivity, ActivityActions } from '@/lib/activity-logger'
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

  function getGenderDetails(gender: string) {
    switch (gender) {
      case 'male':
        return { color: '#3B82F6', bg: '#EFF6FF', icon: '♂' }
      case 'female':
        return { color: '#EC4899', bg: '#FDF2F8', icon: '♀' }
      default:
        return { color: 'var(--clay-purple)', bg: 'var(--clay-purple-s)', icon: '⚧' }
    }
  }

  return (
    <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Header */}
      <section className="clay-hero" style={{ background: 'linear-gradient(135deg, var(--clay-indigo), #4F46E5)', padding: '32px 28px', color: 'white', position: 'relative' }}>
        <div className="deco-blob" style={{ width: 180, height: 180, top: -40, right: -40, background: 'rgba(255,255,255,.08)' }} aria-hidden="true" />
        <div className="deco-blob" style={{ width: 120, height: 120, bottom: -30, left: -30, background: 'rgba(255,255,255,.06)', animationDelay: '2s' }} aria-hidden="true" />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span className="clay-badge" style={{ background: 'rgba(255,255,255,.15)', color: '#C7D2FE', marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(6px)' }}>
              <Users style={{ width: 12, height: 12 }} />
              Children Profiles
            </span>
            <h1 className="clay-display" style={{ fontSize: 32, fontWeight: 700, color: 'white', margin: 0 }}>
              My Children
            </h1>
            <p style={{ marginTop: 6, fontSize: 15, color: '#C7D2FE' }}>
              Manage your children&apos;s health profiles
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {!showAddForm && (
              <button
                className="clay-cta"
                onClick={() => { logActivity({ action: 'opened_add_child_form', action_category: 'patient', description: 'Opened add child form' }).catch(() => { }); setShowAddForm(true) }}
                style={{ padding: '10px 20px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', color: 'var(--clay-indigo)', boxShadow: '0 5px 0 rgba(0,0,0,.1), 0 8px 20px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.9)' }}
              >
                <UserPlus style={{ width: 16, height: 16 }} />
                Add New Child
              </button>
            )}
            <button
              className="clay-btn-sec"
              onClick={() => router.push('/dashboard')}
              style={{ padding: '10px 20px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', color: 'white', border: '1.5px solid rgba(255,255,255,.25)', backdropFilter: 'blur(8px)' }}
            >
              <LayoutDashboard style={{ width: 16, height: 16 }} />
              Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      {children.length > 0 && !showAddForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="clay-stat" style={{ background: 'white', padding: 20, display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            <div className="stat-blob" style={{ width: 80, height: 80, top: -20, right: -20, background: 'var(--clay-indigo-s)' }} />
            <div className="clay-ico" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--clay-indigo), #4F46E5)' }}>
              <Baby style={{ width: 22, height: 22, color: 'white' }} />
            </div>
            <div>
              <span className="clay-label" style={{ color: 'var(--clay-text-muted)' }}>Total Children</span>
              <p className="clay-display" style={{ fontSize: 28, fontWeight: 700, color: 'var(--clay-indigo)', margin: 0, lineHeight: 1 }}>{children.length}</p>
            </div>
          </div>
          <div className="clay-stat" style={{ background: 'white', padding: 20, display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            <div className="stat-blob" style={{ width: 80, height: 80, top: -20, right: -20, background: 'var(--clay-emerald-s)' }} />
            <div className="clay-ico" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--clay-emerald), #059669)' }}>
              <Calendar style={{ width: 22, height: 22, color: 'white' }} />
            </div>
            <div>
              <span className="clay-label" style={{ color: 'var(--clay-text-muted)' }}>Book Appointment</span>
              <button
                className="clay-btn-sec"
                onClick={() => router.push('/caregiver-appointments')}
                style={{ padding: '4px 12px', fontSize: 13, color: 'var(--clay-emerald)', border: 'none', background: 'var(--clay-emerald-s)', fontWeight: 800 }}
              >
                Schedule now →
              </button>
            </div>
          </div>
          <div
            className="clay-stat"
            style={{ background: 'white', padding: 20, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', position: 'relative' }}
            onClick={() => router.push('/caregiver-health-records')}
          >
            <div className="stat-blob" style={{ width: 80, height: 80, top: -20, right: -20, background: 'var(--clay-purple-s)' }} />
            <div className="clay-ico" style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--clay-purple), #7C3AED)' }}>
              <FileCheck style={{ width: 22, height: 22, color: 'white' }} />
            </div>
            <div>
              <span className="clay-label" style={{ color: 'var(--clay-text-muted)' }}>Health Records</span>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--clay-purple)', margin: 0 }}>
                View All →
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Child Form */}
      {showAddForm && (
        <div className="clay-card-static" style={{ background: 'white' }}>
          <div style={{ borderBottom: '1.5px solid var(--clay-indigo-s)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="clay-btn-sec"
              onClick={() => {
                setShowAddForm(false)
                setError(null)
              }}
              style={{ width: 36, height: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft style={{ width: 18, height: 18 }} />
            </button>
            <div>
              <h2 className="clay-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--clay-text-dark)', margin: 0 }}>
                Add New Child
              </h2>
              <p style={{ fontSize: 13, color: 'var(--clay-text-muted)', marginTop: 2 }}>
                Complete all required fields (*)
              </p>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            {error && (
              <div className="clay-inset" style={{ marginBottom: 20, padding: 16, background: 'var(--clay-rose-s)', border: '1.5px solid var(--clay-rose-l)', color: '#BE123C', fontSize: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                <div>
                  <label htmlFor="full_name" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                    Full Name *
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    placeholder="Enter child's full name"
                    className="clay-field"
                    style={{ width: '100%', padding: '12px 16px', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label htmlFor="date_of_birth" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                    Date of Birth *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className="clay-field"
                      style={{ width: '100%', padding: '12px 16px', fontSize: 14 }}
                    />
                    <Calendar style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--clay-text-muted)', pointerEvents: 'none' }} />
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                    Gender *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    className="clay-field"
                    style={{ width: '100%', padding: '12px 16px', fontSize: 14, appearance: 'none' }}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="blood_type" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                    Blood Type (Optional)
                  </label>
                  <select
                    id="blood_type"
                    name="blood_type"
                    className="clay-field"
                    style={{ width: '100%', padding: '12px 16px', fontSize: 14, appearance: 'none' }}
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
                <label htmlFor="allergies" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                  Allergies (Optional)
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  rows={2}
                  placeholder="Separate multiple allergies with commas (e.g., Peanuts, Penicillin, Eggs)"
                  className="clay-field"
                  style={{ width: '100%', padding: '12px 16px', fontSize: 14, resize: 'vertical' }}
                />
                <p style={{ marginTop: 6, fontSize: 12, color: 'var(--clay-text-muted)' }}>Tip: Separate multiple allergies with commas</p>
              </div>

              <div>
                <label htmlFor="medical_notes" className="clay-label" style={{ color: 'var(--clay-text-mid)' }}>
                  Medical Notes (Optional)
                </label>
                <textarea
                  id="medical_notes"
                  name="medical_notes"
                  rows={3}
                  placeholder="Any medical conditions, medications, or important health information..."
                  className="clay-field"
                  style={{ width: '100%', padding: '12px 16px', fontSize: 14, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1.5px solid var(--clay-indigo-s)' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="clay-cta"
                  style={{ flex: 1, padding: '12px 20px', fontSize: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {loading ? (
                    <>
                      <div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                      Adding Child...
                    </>
                  ) : (
                    <>
                      <UserPlus style={{ width: 16, height: 16 }} />
                      Add Child
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setError(null)
                  }}
                  className="clay-btn-sec"
                  style={{ flex: 1, padding: '12px 20px', fontSize: 15 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      {children.length > 0 && !showAddForm && (
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--clay-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, gender, blood type, allergies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="clay-search"
            style={{ width: '100%', padding: '14px 44px 14px 42px', fontSize: 15 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'var(--clay-indigo-s)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--clay-indigo)' }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
          {searchQuery && (
            <p style={{ marginTop: 8, paddingLeft: 4, fontSize: 13, color: 'var(--clay-text-muted)' }}>
              Found {filteredChildren.length} of {children.length} children matching &quot;{searchQuery}&quot;
            </p>
          )}
        </div>
      )}

      {/* Children List */}
      {children.length === 0 && !showAddForm ? (
        <div className="clay-card-static" style={{ background: 'white', padding: '56px 24px', textAlign: 'center' }}>
          <div className="clay-empty-ico">
            <Baby style={{ width: 36, height: 36, color: 'var(--clay-indigo)' }} />
          </div>
          <h2 className="clay-display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--clay-text-dark)', margin: '0 0 8px' }}>No Children Added Yet</h2>
          <p style={{ maxWidth: 360, margin: '0 auto', fontSize: 15, color: 'var(--clay-text-muted)' }}>Add your first child to start booking appointments and managing health records</p>
          <button
            className="clay-cta"
            onClick={() => setShowAddForm(true)}
            style={{ marginTop: 24, padding: '12px 24px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <UserPlus style={{ width: 16, height: 16 }} />
            Add Your First Child
          </button>
        </div>
      ) : filteredChildren.length === 0 && !showAddForm ? (
        <div className="clay-card-static" style={{ background: 'white', padding: '56px 24px', textAlign: 'center' }}>
          <div className="clay-empty-ico">
            <Search style={{ width: 32, height: 32, color: 'var(--clay-text-muted)' }} />
          </div>
          <h2 className="clay-display" style={{ fontSize: 24, fontWeight: 700, color: 'var(--clay-text-dark)', margin: '0 0 8px' }}>No Matching Children</h2>
          <p style={{ maxWidth: 320, margin: '0 auto', fontSize: 15, color: 'var(--clay-text-muted)' }}>Try adjusting your search term</p>
          <button
            className="clay-btn-sec"
            onClick={() => setSearchQuery('')}
            style={{ marginTop: 24, padding: '10px 24px', fontSize: 14 }}
          >
            Clear Search
          </button>
        </div>
      ) : !showAddForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filteredChildren.map((child) => {
            const genderDetails = getGenderDetails(child.gender)
            return (
              <div
                key={child.id}
                className="clay-card-static"
                style={{ background: 'white' }}
              >
                <div style={{ padding: '20px 20px 0' }}>
                  {/* Header with Avatar */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                    <div
                      className="clay-avatar"
                      style={{ width: 48, height: 48, background: genderDetails.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <span style={{ fontSize: 20, fontWeight: 700, color: genderDetails.color }}>
                        {genderDetails.icon}
                      </span>
                    </div>
                    <span className="clay-badge" style={{ background: 'var(--clay-indigo-s)', color: 'var(--clay-indigo)', flexShrink: 0 }}>
                      {calculateAge(child.date_of_birth)} {calculateAge(child.date_of_birth) === 1 ? 'yr' : 'yrs'} old
                    </span>
                  </div>

                  {/* Child Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h3 className="clay-display" style={{ fontSize: 17, fontWeight: 700, color: 'var(--clay-text-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.full_name}</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: 'var(--clay-text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar style={{ width: 13, height: 13, flexShrink: 0, color: 'var(--clay-text-muted)' }} />
                        <span>{formatDate(child.date_of_birth)}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                        <span className="clay-badge" style={{ background: genderDetails.bg, color: genderDetails.color }}>
                          {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
                        </span>
                        {child.blood_type && (
                          <span className="clay-badge" style={{ background: 'var(--clay-rose-s)', color: 'var(--clay-rose)' }}>
                            {child.blood_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(child.allergies || child.medical_notes) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                        {child.allergies && (
                          <div className="clay-inset" style={{ padding: 12, background: 'var(--clay-rose-s)', border: '1px solid var(--clay-rose-l)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0, color: 'var(--clay-rose)' }} />
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#BE123C', textTransform: 'uppercase', letterSpacing: 0.5 }}>Allergies</span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--clay-rose)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{formatAllergies(child.allergies)}</p>
                          </div>
                        )}
                        {child.medical_notes && (
                          <div className="clay-inset" style={{ padding: 12, background: 'var(--clay-indigo-s)', border: '1px solid var(--clay-indigo-l)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <FileText style={{ width: 13, height: 13, flexShrink: 0, color: 'var(--clay-indigo)' }} />
                              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--clay-indigo)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Medical Notes</span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--clay-text-mid)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{child.medical_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px 20px 20px', marginTop: 14, borderTop: '1.5px solid var(--clay-indigo-s)' }}>
                  <button
                    className="clay-cta"
                    onClick={() => router.push('/caregiver-appointments')}
                    style={{ padding: '9px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                  >
                    <Calendar style={{ width: 14, height: 14, flexShrink: 0 }} />
                    <span>Book</span>
                  </button>
                  <button
                    className="clay-btn-sec"
                    onClick={() => router.push(`/caregiver-health-records?childId=${child.id}`)}
                    style={{ padding: '9px 14px', fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                  >
                    <FileCheck style={{ width: 14, height: 14, flexShrink: 0 }} />
                    <span>Records</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}