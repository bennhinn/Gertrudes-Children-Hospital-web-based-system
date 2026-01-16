import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get('q')

        if (!query || query.length < 2) {
            return NextResponse.json({ patients: [] })
        }

        // Search by child name, caregiver name, or phone
        const { data: children, error: childrenError } = await supabase
            .from('children')
            .select(`
        id,
        full_name,
        dob,
        gender,
        medical_notes,
        caregiver:caregivers(
          id,
          profiles(full_name, phone)
        )
      `)
            .ilike('full_name', `%${query}%`)
            .limit(10)

        if (childrenError) {
            console.error('Error searching children:', childrenError)
            return NextResponse.json({ error: childrenError.message }, { status: 500 })
        }

        // Also search by caregiver name/phone
        const { data: caregivers, error: caregiversError } = await supabase
            .from('profiles')
            .select(`
        id,
        full_name,
        phone,
        caregivers(
          id,
          children(id, full_name, dob, gender, medical_notes)
        )
      `)
            .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
            .eq('role', 'caregiver')
            .limit(10)

        if (caregiversError) {
            console.error('Error searching caregivers:', caregiversError)
        }

        // Define result type
        interface SearchResult {
            type: 'child'
            child: {
                id: string
                full_name: string
                dob: string | null
                gender: string | null
            }
            caregiver: unknown
        }

        // Combine and format results
        const results: SearchResult[] = [
            ...(children || []).map(child => ({
                type: 'child' as const,
                child: {
                    id: child.id,
                    full_name: child.full_name,
                    dob: child.dob,
                    gender: child.gender,
                },
                caregiver: child.caregiver,
            })),
        ]

        // Add children from caregiver search
        if (caregivers) {
            for (const cg of caregivers) {
                const caregiver = (cg.caregivers as Array<{ id: string; children: Array<{ id: string; full_name: string; dob: string; gender: string; medical_notes: string | null }> }>)?.[0]
                if (caregiver?.children) {
                    for (const child of caregiver.children) {
                        // Avoid duplicates
                        if (!results.some(r => r.child.id === child.id)) {
                            results.push({
                                type: 'child' as const,
                                child: {
                                    id: child.id,
                                    full_name: child.full_name,
                                    dob: child.dob,
                                    gender: child.gender,
                                },
                                caregiver: {
                                    id: caregiver.id,
                                    profiles: [{
                                        full_name: cg.full_name,
                                        phone: cg.phone,
                                    }],
                                },
                            })
                        }
                    }
                }
            }
        }

        return NextResponse.json({ patients: results.slice(0, 15) })
    } catch (error) {
        console.error('Error in search API:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
