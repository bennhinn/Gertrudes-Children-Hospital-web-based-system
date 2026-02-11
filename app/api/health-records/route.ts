import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('👤 Current user:', user.email)

        // Get caregiver ID
        const caregiverId = user.id

        // Get caregiver's children
        const { data: children, error: childrenError } = await supabase
            .from('children')
            .select('id, full_name, date_of_birth')
            .eq('caregiver_id', caregiverId)

        if (childrenError) {
            console.error('❌ Error fetching children:', childrenError)
            return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
        }

        console.log('✅ Found children:', children?.length)

        if (!children || children.length === 0) {
            return NextResponse.json({
                children: [],
                labResults: [],
                prescriptions: []
            })
        }

        const childIds = children.map(c => c.id)

        // SIMPLE QUERY: Get lab orders first
        console.log('🔬 Fetching lab orders...')
        const { data: labOrders, error: labError } = await supabase
            .from('lab_orders')
            .select('*')
            .in('child_id', childIds)
            .order('ordered_at', { ascending: false })

        if (labError) {
            console.error('❌ Error fetching lab orders:', labError)
            return NextResponse.json({ error: 'Failed to fetch lab results' }, { status: 500 })
        }

        console.log(`✅ Found ${labOrders?.length || 0} lab orders`)

        // SIMPLE QUERY: Get prescriptions
        console.log('💊 Fetching prescriptions...')
        const { data: prescriptionsData, error: presError } = await supabase
            .from('prescriptions')
            .select('*')
            .in('child_id', childIds)
            .order('prescribed_at', { ascending: false })

        if (presError) {
            console.error('❌ Error fetching prescriptions:', presError)
            return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 })
        }

        console.log(`✅ Found ${prescriptionsData?.length || 0} prescriptions`)

        // Get all doctor IDs from lab orders and prescriptions
        const doctorIds = new Set<string>()
        
        if (labOrders) {
            labOrders.forEach(order => {
                if (order.doctor_id) doctorIds.add(order.doctor_id)
                if (order.reviewed_by) doctorIds.add(order.reviewed_by)
            })
        }
        
        if (prescriptionsData) {
            prescriptionsData.forEach(pres => {
                if (pres.doctor_id) doctorIds.add(pres.doctor_id)
            })
        }

        // Get doctor names
        console.log(`👨‍⚕️ Fetching ${doctorIds.size} doctor profiles...`)
        const doctorProfiles: Record<string, string> = {}
        
        if (doctorIds.size > 0) {
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', Array.from(doctorIds))

            if (profilesError) {
                console.error('❌ Error fetching doctor profiles:', profilesError)
            } else if (profiles) {
                profiles.forEach(profile => {
                    doctorProfiles[profile.id] = profile.full_name || 'Doctor'
                })
                console.log(`✅ Found ${profiles.length} doctor profiles`)
            }
        }

        // Create child name map
        const childMap: Record<string, string> = {}
        children.forEach(child => {
            childMap[child.id] = child.full_name || 'Child'
        })

        // Transform lab orders
        const transformedLabResults = []
        
        if (labOrders && labOrders.length > 0) {
            for (const order of labOrders) {
                try {
                    if (!childMap[order.child_id]) continue
                    
                    // Parse results from the results column
                    let measurements = undefined
                    if (order.results && typeof order.results === 'string' && order.results.trim()) {
                        try {
                            // Try to parse as JSON first
                            const parsed = JSON.parse(order.results)
                            if (Array.isArray(parsed)) {
                                measurements = parsed.map((item: any) => ({
                                    name: item.name || item.test || 'Measurement',
                                    value: String(item.value || item.result || ''),
                                    unit: item.unit || '',
                                    referenceRange: item.referenceRange || item.normalRange || '',
                                    isAbnormal: Boolean(item.isAbnormal || false),
                                    flag: item.flag || (item.isAbnormal ? 'high' : undefined)
                                }))
                            } else if (typeof parsed === 'object') {
                                // Handle single object result
                                measurements = [{
                                    name: order.test_name || order.test_type || 'Result',
                                    value: String(parsed.value || parsed.result || ''),
                                    unit: parsed.unit || '',
                                    referenceRange: parsed.referenceRange || parsed.normalRange || '',
                                    isAbnormal: Boolean(parsed.isAbnormal || false),
                                    flag: parsed.flag || (parsed.isAbnormal ? 'high' : undefined)
                                }]
                            }
                        } catch (e) {
                            // Not JSON, use as plain text
                            measurements = [{
                                name: 'Result',
                                value: order.results,
                                unit: '',
                                referenceRange: '',
                                isAbnormal: !!order.abnormal_findings
                            }]
                        }
                    }
                    
                    // Map status
                    let status: 'pending' | 'processing' | 'completed' = 'pending'
                    const orderStatus = order.status?.toLowerCase()
                    
                    if (orderStatus === 'completed') {
                        status = 'completed'
                    } else if (orderStatus === 'in_progress' || orderStatus === 'collected') {
                        status = 'processing'
                    }
                    
                    transformedLabResults.push({
                        id: order.id,
                        testName: order.test_name || order.test_type || 'Lab Test',
                        testCode: order.test_code || 'N/A',
                        category: order.test_type || 'General',
                        orderedBy: doctorProfiles[order.doctor_id] || 'Doctor',
                        orderedDate: order.ordered_at,
                        resultDate: order.completed_at || order.ordered_at,
                        status: status,
                        isAbnormal: !!order.abnormal_findings,
                        childName: childMap[order.child_id],
                        childId: order.child_id,
                        measurements: measurements,
                        interpretation: order.result_notes || order.abnormal_findings || order.clinical_notes || ''
                    })
                } catch (error) {
                    console.error('Error transforming lab order:', order.id, error)
                }
            }
        }

        // Transform prescriptions
        const transformedPrescriptions = []
        if (prescriptionsData && prescriptionsData.length > 0) {
            for (const pres of prescriptionsData) {
                try {
                    if (!childMap[pres.child_id] || (!pres.medication_name && !pres.dosage)) {
                        continue
                    }
                    
                    const prescribedDate = pres.prescribed_at ? new Date(pres.prescribed_at) : new Date()
                    const startDate = pres.start_date ? new Date(pres.start_date) : prescribedDate
                    const today = new Date()
                    
                    // Parse duration or calculate from start/end dates
                    let durationDays = undefined
                    let endDate = undefined
                    let daysLeft = undefined
                    
                    if (pres.end_date) {
                        endDate = new Date(pres.end_date)
                        const diffTime = endDate.getTime() - today.getTime()
                        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    } else if (pres.duration) {
                        // Parse duration string (e.g., "30 days", "2 weeks", "1 month")
                        const match = pres.duration.match(/(\d+)\s*(day|week|month|year)s?/i)
                        if (match) {
                            const amount = parseInt(match[1])
                            const unit = match[2].toLowerCase()
                            switch (unit) {
                                case 'day': durationDays = amount; break
                                case 'week': durationDays = amount * 7; break
                                case 'month': durationDays = amount * 30; break
                                case 'year': durationDays = amount * 365; break
                            }
                            
                            if (durationDays) {
                                const end = new Date(startDate)
                                end.setDate(end.getDate() + durationDays)
                                endDate = end
                                
                                const diffTime = end.getTime() - today.getTime()
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                daysLeft = diffDays > 0 ? diffDays : 0
                            }
                        }
                    }
                    
                    // Determine status
                    let status: 'active' | 'completed' | 'discontinued' = 'active'
                    const presStatus = pres.status?.toLowerCase()
                    
                    if (presStatus === 'cancelled' || presStatus === 'discontinued') {
                        status = 'discontinued'
                    } else if (presStatus === 'completed' || pres.dispensed_at) {
                        status = 'completed'
                    } else if (daysLeft !== undefined && daysLeft <= 0) {
                        status = 'completed'
                    }
                    
                    transformedPrescriptions.push({
                        id: pres.id,
                        medicationName: pres.medication_name || 'Medication',
                        genericName: pres.generic_name || '',
                        dosage: pres.dosage || 'As prescribed',
                        form: 'Tablet',
                        frequency: pres.frequency || 'As directed',
                        prescribedBy: doctorProfiles[pres.doctor_id] || 'Doctor',
                        prescribedDate: pres.prescribed_at,
                        startDate: startDate.toISOString(),
                        endDate: endDate?.toISOString(),
                        status: status,
                        refillsRemaining: pres.refills_remaining || 0,
                        daysLeft: daysLeft,
                        instructions: pres.instructions || 'Take as prescribed',
                        childName: childMap[pres.child_id],
                        childId: pres.child_id,
                        reminderEnabled: false
                    })
                } catch (error) {
                    console.error('Error transforming prescription:', pres.id, error)
                }
            }
        }

        console.log('📊 Final counts:', {
            children: children.length,
            labResults: transformedLabResults.length,
            prescriptions: transformedPrescriptions.length
        })

        return NextResponse.json({
            children: children.map(c => ({ 
                id: c.id, 
                full_name: c.full_name,
                date_of_birth: c.date_of_birth
            })),
            labResults: transformedLabResults,
            prescriptions: transformedPrescriptions
        })

    } catch (error) {
        console.error('❌ Unexpected error in /api/health-records:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}