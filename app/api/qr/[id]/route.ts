import { NextRequest, NextResponse } from 'next/server'
import { generateQRCodeDataURL, generateCheckInCode } from '@/utils/qr'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const appointmentId = params.id

  if (!appointmentId) {
    return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Verify appointment exists and get check-in code
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('id, status, check_in_code')
      .eq('id', appointmentId)
      .single()

    if (error || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // If no check-in code exists, generate one and save it
    let checkInCode = appointment.check_in_code
    if (!checkInCode) {
      // Generate unique code
      let attempts = 0
      while (!checkInCode && attempts < 10) {
        const newCode = generateCheckInCode()
        const { data: existing } = await supabase
          .from('appointments')
          .select('id')
          .eq('check_in_code', newCode)
          .single()

        if (!existing) {
          checkInCode = newCode
          // Save the code
          await supabase
            .from('appointments')
            .update({ check_in_code: newCode })
            .eq('id', appointmentId)
        }
        attempts++
      }
    }

    // Generate QR code with both ID and short code
    const qrDataURL = await generateQRCodeDataURL(appointmentId, checkInCode)

    return NextResponse.json({
      qrCode: qrDataURL,
      appointmentId,
      checkInCode, // Include the short code for display
      status: appointment.status,
    })
  } catch (err: any) {
    console.error('QR generation error:', err)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
