// app/api/health-records/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logActivityServer } from '@/lib/activity-logger'

// -----------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------
interface TransformedPrescription {
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
  // 🧾 INVOICE INTEGRATION
  invoice?: {
    id: string
    invoice_number: string
    total: number
    paid_amount: number
    balance_due: number
    status: 'pending' | 'paid' | 'cancelled'
    due_date: string
  } | null
}

interface TransformedLabResult {
  id: string
  testName: string
  description: string
  status: string
  orderedAt: string
  completedAt?: string
  results?: any
  childId: string
  childName: string
  orderedBy: string
  // 🧾 INVOICE INTEGRATION
  invoice?: {
    id: string
    invoice_number: string
    total: number
    paid_amount: number
    balance_due: number
    status: 'pending' | 'paid' | 'cancelled'
    due_date: string
  } | null
}

// Type for the raw invoice data returned from Supabase (may be array or object)
type RawInvoice = {
  id: string
  invoice_number: string
  total: number
  paid_amount: number
  balance_due: number
  status: 'pending' | 'paid' | 'cancelled'
  due_date: string
}

function safeArray<T>(data: T | T[] | null | undefined): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return [data]
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caregiverId = user.id

    // -----------------------------------------------------------------
    // 1. FETCH CHILDREN
    // -----------------------------------------------------------------
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, full_name, date_of_birth, gender, blood_type, allergies')
      .eq('caregiver_id', caregiverId)

    if (childrenError) {
      console.error('Children fetch error:', childrenError)
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
    }

    if (!children || children.length === 0) {
      return NextResponse.json({ children: [], labResults: [], prescriptions: [] })
    }

    const childIds = children.map(c => c.id)
    const childMap: Record<string, string> = {}
    children.forEach(c => { childMap[c.id] = c.full_name || 'Unknown Child' })

    // -----------------------------------------------------------------
    // 2. FETCH PRESCRIPTIONS WITH NESTED PRESCRIPTION_ITEMS
    // -----------------------------------------------------------------
    const { data: prescriptions, error: presError } = await supabase
      .from('prescriptions')
      .select(`
        id,
        prescribed_at,
        status,
        child_id,
        refills,
        reminders_enabled,
        reminder_times,
        notes,
        medication_id,
        medication_name,
        dosage,
        frequency,
        duration,
        quantity,
        instructions,
        doctor:doctor_id (
          id,
          specialty,
          profile:profiles ( full_name )
        ),
        prescription_items (
          id,
          medication_name,
          generic_name,
          dosage,
          frequency,
          duration,
          quantity,
          instructions,
          medication:medication_id ( id, name, form, strength, category, stock )
        )
      `)
      .in('child_id', childIds)
      .order('prescribed_at', { ascending: false })

    if (presError) {
      console.error('[Health Records] Prescription fetch error:', presError)
    }

    console.log('[Health Records] Prescriptions fetched:', prescriptions?.length || 0)

    // -----------------------------------------------------------------
    // 🧾 INVOICE INTEGRATION – FETCH INVOICE STATUS FOR PRESCRIPTION ITEMS
    // -----------------------------------------------------------------
    const prescriptionItemIds: string[] = []
    for (const pres of safeArray(prescriptions)) {
      const items = safeArray(pres.prescription_items)
      items.forEach(item => {
        if (item.id) prescriptionItemIds.push(item.id)
      })
    }

    let prescriptionInvoiceMap: Record<string, RawInvoice> = {}
    if (prescriptionItemIds.length > 0) {
      const { data: invoiceLinks, error: invoiceLinkError } = await supabase
        .from('invoice_line_items')
        .select(`
          item_id,
          invoice:invoices!inner (
            id,
            invoice_number,
            total,
            paid_amount,
            balance_due,
            status,
            due_date
          )
        `)
        .in('item_id', prescriptionItemIds)
        .eq('item_type', 'prescription')

      if (invoiceLinkError) {
        console.error('[Health Records] Failed to fetch prescription invoice links:', invoiceLinkError)
      } else {
        // Build map – handle invoice possibly being an array or single object
        prescriptionInvoiceMap = (invoiceLinks || []).reduce<Record<string, RawInvoice>>((acc, link) => {
          // Supabase may return invoice as array; extract first element if needed
          const invoiceData = Array.isArray(link.invoice) ? link.invoice[0] : link.invoice
          if (invoiceData) {
            acc[link.item_id] = invoiceData
          }
          return acc
        }, {})
      }
    }

    // -----------------------------------------------------------------
    // 3. TRANSFORM PRESCRIPTIONS (with invoice data)
    // -----------------------------------------------------------------
    const transformedPrescriptions: TransformedPrescription[] = []

    for (const pres of safeArray(prescriptions)) {
      const doctorArray = safeArray(pres.doctor)
      const doctorData = doctorArray[0]
      const doctorProfileArray = safeArray(doctorData?.profile)
      const doctorName = doctorProfileArray[0]?.full_name || 'Unknown Doctor'
      const childName = childMap[pres.child_id] || 'Unknown Child'

      // Items are now directly available from the nested relation
      const items = safeArray(pres.prescription_items)
      const useSyntheticFallback = items.length === 0

      // If no items exist, create a synthetic item from prescription-level fields
      const prescriptionData = items.length > 0
        ? items
        : [{
          id: `synthetic-${pres.id}`,
          medication_name: pres.medication_name,
          generic_name: null,
          dosage: pres.dosage,
          frequency: pres.frequency,
          duration: pres.duration,
          quantity: pres.quantity,
          instructions: pres.instructions,
          medication: pres.medication_id
            ? [{
              id: pres.medication_id,
              name: pres.medication_name,
              form: null,
              strength: pres.dosage,
              category: null,
              stock: null
            }]
            : null
        }]

      for (const item of prescriptionData) {
        let endDate: Date | undefined
        let daysLeft: number | undefined

        const itemDuration = item.duration || pres.duration

        if (itemDuration) {
          const match = itemDuration.match(/(\d+)\s*(day|week|month|year)s?/i)
          if (match) {
            const amount = parseInt(match[1])
            const unit = match[2].toLowerCase()
            const start = new Date(pres.prescribed_at)

            switch (unit) {
              case 'day': start.setDate(start.getDate() + amount); break
              case 'week': start.setDate(start.getDate() + (amount * 7)); break
              case 'month': start.setMonth(start.getMonth() + amount); break
              case 'year': start.setFullYear(start.getFullYear() + amount); break
            }

            endDate = start
            const today = new Date()
            const diffTime = endDate.getTime() - today.getTime()
            daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
          }
        }

        let status: 'active' | 'completed' | 'discontinued' = 'active'
        const presStatus = pres.status?.toLowerCase()

        if (presStatus === 'cancelled' || presStatus === 'discontinued') {
          status = 'discontinued'
        } else if (presStatus === 'completed' || presStatus === 'collected') {
          status = 'completed'
        } else if (daysLeft !== undefined && daysLeft <= 0) {
          status = 'completed'
        }

        const medicationArray = safeArray(item.medication)
        const medicationData = medicationArray[0]
        const form = medicationData?.form || 'tablet'
        const strength = medicationData?.strength || item.dosage || 'As prescribed'

        // 🧾 INVOICE INTEGRATION – get invoice for this prescription item (if any)
        const rawInvoice = prescriptionInvoiceMap[item.id]
        const invoiceData = rawInvoice ? {
          id: rawInvoice.id,
          invoice_number: rawInvoice.invoice_number,
          total: rawInvoice.total,
          paid_amount: rawInvoice.paid_amount,
          balance_due: rawInvoice.balance_due,
          status: rawInvoice.status,
          due_date: rawInvoice.due_date,
        } : null

        transformedPrescriptions.push({
          id: useSyntheticFallback
            ? `synthetic-${pres.id}`
            : `${pres.id}-${item.id}`,
          medicationName: item.medication_name || pres.medication_name || 'Unknown Medication',
          genericName: item.generic_name || '',
          dosage: strength,
          form: form,
          frequency: item.frequency || pres.frequency || 'As directed',
          prescribedBy: doctorName,
          prescribedDate: pres.prescribed_at,
          startDate: pres.prescribed_at,
          endDate: endDate?.toISOString(),
          status,
          refillsRemaining: pres.refills || 0,
          daysLeft: daysLeft && daysLeft > 0 ? daysLeft : undefined,
          instructions: item.instructions || pres.notes || 'Take as prescribed',
          childName,
          childId: pres.child_id,
          reminderEnabled: pres.reminders_enabled || false,
          invoice: invoiceData,
        })
      }
    }

    console.log('[Health Records] Transformed prescriptions:', transformedPrescriptions.length)

    // -----------------------------------------------------------------
    // 4. FETCH LAB ORDERS (LEFT JOIN for doctor profile + test)
    // -----------------------------------------------------------------
    const { data: labOrders, error: labError } = await supabase
      .from('lab_orders')
      .select(`
        id,
        test_name,
        test_code,
        status,
        priority,
        ordered_at,
        completed_at,
        results,
        structured_results,
        abnormal_findings,
        result_notes,
        child_id,
        doctor:doctor_id (
          id,
          profile:profiles ( full_name )
        ),
        test:lab_tests!test_id ( name, description, cost )
      `)
      .in('child_id', childIds)
      .order('ordered_at', { ascending: false })

    if (labError) {
      console.error('[Health Records] Lab orders fetch error:', labError)
    }

    console.log('[Health Records] Found lab orders:', labOrders?.length || 0)

    // -----------------------------------------------------------------
    // 🧾 INVOICE INTEGRATION – FETCH INVOICE STATUS FOR LAB ORDERS
    // -----------------------------------------------------------------
    const labOrderIds = safeArray(labOrders).map(o => o.id)
    let labInvoiceMap: Record<string, RawInvoice> = {}
    if (labOrderIds.length > 0) {
      const { data: invoiceLinks, error: invoiceLinkError } = await supabase
        .from('invoice_line_items')
        .select(`
          item_id,
          invoice:invoices!inner (
            id,
            invoice_number,
            total,
            paid_amount,
            balance_due,
            status,
            due_date
          )
        `)
        .in('item_id', labOrderIds)
        .eq('item_type', 'lab_test')

      if (invoiceLinkError) {
        console.error('[Health Records] Failed to fetch lab invoice links:', invoiceLinkError)
      } else {
        labInvoiceMap = (invoiceLinks || []).reduce<Record<string, RawInvoice>>((acc, link) => {
          const invoiceData = Array.isArray(link.invoice) ? link.invoice[0] : link.invoice
          if (invoiceData) {
            acc[link.item_id] = invoiceData
          }
          return acc
        }, {})
      }
    }

    // -----------------------------------------------------------------
    // 5. TRANSFORM LAB RESULTS (with invoice data)
    // -----------------------------------------------------------------
    const transformedLabResults: TransformedLabResult[] = safeArray(labOrders).map(order => {
      const doctorArray = safeArray(order.doctor)
      const doctorProfileArray = safeArray(doctorArray[0]?.profile)
      const testArray = safeArray(order.test)
      const testData = testArray[0]

      // 🧾 INVOICE INTEGRATION – get invoice for this lab order
      const rawInvoice = labInvoiceMap[order.id]
      const invoiceData = rawInvoice ? {
        id: rawInvoice.id,
        invoice_number: rawInvoice.invoice_number,
        total: rawInvoice.total,
        paid_amount: rawInvoice.paid_amount,
        balance_due: rawInvoice.balance_due,
        status: rawInvoice.status,
        due_date: rawInvoice.due_date,
      } : null

      return {
        id: order.id,
        testName: order.test_name || testData?.name || 'Unknown Test',
        description: testData?.description || '',
        status: order.status,
        orderedAt: order.ordered_at,
        completedAt: order.completed_at,
        results: order.structured_results || order.results,
        childId: order.child_id,
        childName: childMap[order.child_id] || 'Unknown Child',
        orderedBy: doctorProfileArray[0]?.full_name || 'Unknown Doctor',
        invoice: invoiceData,
      }
    })

    // -----------------------------------------------------------------
    // 6. FORMAT CHILDREN RESPONSE
    // -----------------------------------------------------------------
    const childrenResponse = children.map(child => ({
      id: child.id,
      fullName: child.full_name,
      dateOfBirth: child.date_of_birth,
      gender: child.gender,
      bloodType: child.blood_type,
      allergies: child.allergies || []
    }))

    const response = {
      children: childrenResponse,
      labResults: transformedLabResults,
      prescriptions: transformedPrescriptions
    }

    console.log('[Health Records] Response summary:', {
      children: childrenResponse.length,
      labResults: transformedLabResults.length,
      prescriptions: transformedPrescriptions.length
    })

    // Log health records access
    await logActivityServer(supabase, {
      user_id: user.id,
      action: 'health_records_view',
      action_type: 'view',
      action_category: 'patient',
      target_table: 'health_records',
      description: `Caregiver viewed health records for ${childrenResponse.length} children`,
      metadata: { children_count: childrenResponse.length, lab_results_count: transformedLabResults.length, prescriptions_count: transformedPrescriptions.length },
    })

    return NextResponse.json(response)

  } catch (error) {
    console.error('[Health Records] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}