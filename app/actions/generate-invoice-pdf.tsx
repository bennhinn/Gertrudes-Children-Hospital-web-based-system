'use server'

import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import InvoicePDF from '@/components/invoice-pdf'
import { redirect } from 'next/navigation'

export async function generateInvoicePDF(invoiceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ✅ Correct join: invoices → caregivers → profiles (no email)
  const { data: rawInvoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      line_items:invoice_line_items(*),
      child:children!inner (
        full_name
      ),
      caregiver:caregivers (
        id,
        profile:profiles!inner (
          full_name
        )
      )
    `)
    .eq('id', invoiceId)
    .eq('caregiver_id', user.id) // foreign key to caregivers
    .single()

  if (error || !rawInvoice) {
    console.error('Invoice fetch error:', error)
    throw new Error('Invoice not found or access denied')
  }

  // 🔁 Transform to match expected structure { full_name, email? }
  const invoice = {
    ...rawInvoice,
    caregiver: rawInvoice.caregiver?.profile
      ? {
          full_name: rawInvoice.caregiver.profile.full_name,
          // Use the authenticated user's email – it belongs to this caregiver
          email: user.email || '',
        }
      : null,
  }

  const pdfBuffer = await renderToBuffer(<InvoicePDF invoice={invoice} />)
  const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' })

  return new Response(pdfBlob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  })
}