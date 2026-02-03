import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get caregiver's children
        const { data: children, error: childrenError } = await supabase
            .from('children')
            .select('id, full_name, date_of_birth')
            .eq('caregiver_id', user.id)

        if (childrenError) {
            console.error('Error fetching children:', childrenError)
            return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
        }

        if (!children || children.length === 0) {
            return NextResponse.json({
                labResults: [],
                prescriptions: []
            })
        }

        const childIds = children.map(c => c.id)

        // Fetch lab orders (which contain the results)
        const { data: labResults, error: labError } = await supabase
            .from('lab_orders')
            .select(`
                id,
                test_type,
                test_code,
                test_name,
                status,
                ordered_at,
                completed_at,
                priority,
                special_instructions,
                clinical_notes,
                results,
                abnormal_findings,
                result_notes,
                child_id,
                children (
                    id,
                    full_name
                )
            `)
            .in('child_id', childIds)
            .order('completed_at', { ascending: false, nullsFirst: false })

        if (labError) {
            console.error('Error fetching lab results:', labError)
        }

        // Fetch prescriptions with related data
        const { data: prescriptions, error: presError } = await supabase
            .from('prescriptions')
            .select(`
                id,
                medication_name,
                dosage,
                frequency,
                duration,
                quantity,
                instructions,
                status,
                prescribed_at,
                dispensed_at,
                refills,
                child_id,
                doctor_id,
                consultation_id,
                children (
                    id,
                    full_name
                )
            `)
            .in('child_id', childIds)
            .order('prescribed_at', { ascending: false, nullsFirst: false })

        if (presError) {
            console.error('Error fetching prescriptions:', presError)
        }

        // Debug: Log raw data
        console.log('Children found:', children?.length, children?.map(c => ({ id: c.id, name: c.full_name })))
        console.log('Lab results found:', labResults?.length)
        console.log('Prescriptions found:', prescriptions?.length)
        if (prescriptions?.length) {
            console.log('Sample prescription:', JSON.stringify(prescriptions[0], null, 2))
        }

        // Transform lab results (from lab_orders)
        const transformedLabResults = (labResults || []).map(order => {
            // Children is a single object for many-to-one relationship
            const childData = order.children as any
            const childName = childData?.full_name || 'Unknown Child'

            return {
                id: order.id,
                testName: order.test_name || order.test_type || 'Unknown Test',
                testCode: order.test_code || '',
                category: 'Lab Test',
                orderedBy: 'Doctor',
                orderedDate: order.ordered_at,
                resultDate: order.completed_at,
                status: order.status === 'completed' ? 'completed' :
                    order.status === 'in_progress' ? 'processing' : 'pending',
                isAbnormal: order.abnormal_findings ? true : false,
                childName,
                childId: order.child_id,
                measurements: order.results ? [{
                    name: 'Result',
                    value: order.results,
                    unit: '',
                    referenceRange: '',
                    isAbnormal: order.abnormal_findings ? true : false
                }] : [],
                interpretation: order.result_notes || order.clinical_notes || ''
            }
        })

        // Transform prescriptions
        const transformedPrescriptions = (prescriptions || []).map(pres => {
            // Children is a single object for many-to-one relationship
            const childData = pres.children as any
            const childName = childData?.full_name || 'Unknown Child'

            // Calculate status and days left
            const prescribedDate = pres.prescribed_at ? new Date(pres.prescribed_at) : new Date()
            const today = new Date()
            const daysLeft = pres.duration ? parseInt(pres.duration) - Math.floor((today.getTime() - prescribedDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined

            let status: 'active' | 'completed' | 'discontinued' = 'active'
            if (pres.status === 'dispensed' || pres.status === 'collected') {
                status = 'active'
            } else if (pres.status === 'cancelled') {
                status = 'discontinued'
            } else if (daysLeft !== undefined && daysLeft <= 0) {
                status = 'completed'
            }

            return {
                id: pres.id,
                medicationName: pres.medication_name || 'Unknown Medication',
                genericName: pres.medication_name || 'Unknown Medication',
                dosage: pres.dosage || '',
                form: 'Not specified',
                frequency: pres.frequency || '',
                prescribedBy: 'Doctor',
                prescribedDate: pres.prescribed_at,
                startDate: pres.prescribed_at,
                endDate: pres.duration ? new Date(prescribedDate.getTime() + parseInt(pres.duration) * 24 * 60 * 60 * 1000).toISOString() : undefined,
                status,
                refillsRemaining: pres.refills || 0,
                daysLeft,
                instructions: pres.instructions || '',
                childName,
                childId: pres.child_id,
                reminderEnabled: false
            }
        })

        return NextResponse.json({
            labResults: transformedLabResults,
            prescriptions: transformedPrescriptions
        })

    } catch (error) {
        console.error('Error in /api/health-records:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
