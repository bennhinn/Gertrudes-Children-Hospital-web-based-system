import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get caregiver ID
        const { data: caregiver, error: caregiverError } = await supabase
            .from('caregivers')
            .select('id')
            .eq('id', user.id)
            .single()

        if (caregiverError || !caregiver) {
            console.error('❌ Error fetching caregiver:', caregiverError)
            return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 })
        }

        // Get caregiver's children
        const { data: children, error: childrenError } = await supabase
            .from('children')
            .select('id, full_name, date_of_birth')
            .eq('caregiver_id', caregiver.id)

        if (childrenError) {
            console.error('❌ Error fetching children:', childrenError)
            return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
        }

        console.log('✅ Found children:', children?.length, children)

        if (!children || children.length === 0) {
            return NextResponse.json({
                children: [],
                labResults: [],
                prescriptions: []
            })
        }

        const childIds = children.map(c => c.id)

        // Fetch lab orders - FIX: Specify which doctor relationship to use
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
                child:children(id, full_name),
                doctor:doctors!lab_orders_doctor_id_fkey(id, profiles(full_name))
            `)
            .in('child_id', childIds)
            .order('completed_at', { ascending: false, nullsFirst: false })

        if (labError) {
            console.error('❌ Error fetching lab results:', labError)
        } else {
            console.log('✅ Found lab results:', labResults?.length, labResults)
        }

        // Fetch prescriptions - FIX: Specify which doctor relationship
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
                child:children(id, full_name),
                doctor:doctors!prescriptions_doctor_id_fkey(id, profiles(full_name))
            `)
            .in('child_id', childIds)
            .order('prescribed_at', { ascending: false, nullsFirst: false })

        if (presError) {
            console.error('❌ Error fetching prescriptions:', presError)
        } else {
            console.log('✅ Found prescriptions:', prescriptions?.length)
        }

        // Transform lab results
        const transformedLabResults = (labResults || []).map(order => {
            const child = order.child as any
            const doctor = order.doctor as any
            const doctorProfile = doctor?.profiles as any

            return {
                id: order.id,
                testName: order.test_name || order.test_type || 'Lab Test',
                testCode: order.test_code || 'N/A',
                category: 'Lab Test',
                orderedBy: doctorProfile?.full_name || 'Doctor',
                orderedDate: order.ordered_at,
                resultDate: order.completed_at || order.ordered_at,
                status: order.status === 'completed' ? 'completed' :
                        order.status === 'in_progress' ? 'processing' : 'pending',
                isAbnormal: !!order.abnormal_findings,
                childName: child?.full_name || 'Unknown Child',
                childId: order.child_id,
                measurements: order.results ? [{
                    name: 'Result',
                    value: order.results,
                    unit: '',
                    referenceRange: '',
                    isAbnormal: !!order.abnormal_findings
                }] : undefined,
                interpretation: order.result_notes || order.clinical_notes || order.abnormal_findings || ''
            }
        })

        // Transform prescriptions - Handle nulls better
        const transformedPrescriptions = (prescriptions || []).map(pres => {
            const child = pres.child as any
            const doctor = pres.doctor as any
            const doctorProfile = doctor?.profiles as any

            // Skip if critical fields are null
            if (!pres.medication_name && !pres.dosage) {
                return null
            }

            const prescribedDate = pres.prescribed_at ? new Date(pres.prescribed_at) : new Date()
            const today = new Date()
            
            const durationMatch = pres.duration?.match(/\d+/)
            const durationDays = durationMatch ? parseInt(durationMatch[0]) : undefined
            
            const daysLeft = durationDays ? 
                durationDays - Math.floor((today.getTime() - prescribedDate.getTime()) / (1000 * 60 * 60 * 24)) : 
                undefined

            let status: 'active' | 'completed' | 'discontinued' = 'active'
            if (pres.status === 'cancelled') {
                status = 'discontinued'
            } else if (daysLeft !== undefined && daysLeft <= 0) {
                status = 'completed'
            }

            const endDate = durationDays ? 
                new Date(prescribedDate.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString() : 
                undefined

            return {
                id: pres.id,
                medicationName: pres.medication_name || 'Medication',
                genericName: pres.medication_name || '',
                dosage: pres.dosage || 'As prescribed',
                form: 'Not specified',
                frequency: pres.frequency || 'As directed',
                prescribedBy: doctorProfile?.full_name || 'Doctor',
                prescribedDate: pres.prescribed_at,
                startDate: pres.prescribed_at,
                endDate,
                status,
                refillsRemaining: pres.refills || 0,
                daysLeft: daysLeft && daysLeft > 0 ? daysLeft : undefined,
                instructions: pres.instructions || 'Take as prescribed',
                childName: child?.full_name || 'Unknown Child',
                childId: pres.child_id,
                reminderEnabled: false
            }
        }).filter(Boolean) // Remove null entries

        console.log('📊 Transformed data:', {
            children: children.length,
            labResults: transformedLabResults.length,
            prescriptions: transformedPrescriptions.length
        })

        return NextResponse.json({
            children, // Include children in response
            labResults: transformedLabResults,
            prescriptions: transformedPrescriptions
        })

    } catch (error) {
        console.error('❌ Error in /api/health-records:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}