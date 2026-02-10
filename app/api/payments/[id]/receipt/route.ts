import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReceiptPDF, ReceiptData } from '@/lib/receipt-generator';

/**
 * GET /api/payments/[id]/receipt
 * Generate and return PDF receipt for a payment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentId = params.id;

    // Fetch payment with related data
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(
        `
        *,
        invoice:invoices (
          *,
          line_items:invoice_line_items (*),
          child:children (
            id,
            full_name,
            date_of_birth
          ),
          caregiver:caregivers (
            id,
            profiles (
              full_name
            )
          )
        )
      `
      )
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment is completed
    if (payment.status !== 'completed') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Verify user has access to this payment
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isCaregiver = payment.caregiver_id === user.id;
    const isStaff = profile?.role && ['admin', 'receptionist', 'doctor'].includes(profile.role);

    if (!isCaregiver && !isStaff) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate child age
    let childAge: number | undefined;
    if (payment.invoice?.child?.date_of_birth) {
      const birthDate = new Date(payment.invoice.child.date_of_birth);
      const today = new Date();
      childAge = today.getFullYear() - birthDate.getFullYear();
    }

    // Format payment date and time
    const paymentDate = new Date(payment.payment_date || payment.created_at);
    const formattedDate = paymentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = paymentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Prepare receipt data
    const receiptData: ReceiptData = {
      receiptNumber: payment.receipt_number || `RCP-${payment.id.slice(0, 8).toUpperCase()}`,
      invoiceNumber: payment.invoice?.invoice_number || 'N/A',
      paymentDate: formattedDate,
      paymentTime: formattedTime,
      caregiverName: payment.invoice?.caregiver?.profiles?.full_name || 'Unknown',
      childName: payment.invoice?.child?.full_name || 'Unknown',
      childAge,
      items:
        payment.invoice?.line_items?.map((item: any) => ({
          description: item.description,
          amount: parseFloat(item.line_total),
        })) || [],
      subtotal: parseFloat(payment.invoice?.subtotal || 0),
      tax: parseFloat(payment.invoice?.tax_amount || 0),
      discount: parseFloat(payment.invoice?.discount_amount || 0),
      total: parseFloat(payment.amount),
      paymentMethod: payment.method,
      transactionId: payment.transaction_id || 'N/A',
      cardLast4: payment.card_last4,
      cardBrand: payment.card_brand,
      mpesaPhone: payment.mpesa_phone,
      mpesaTransactionId: payment.mpesa_transaction_id,
    };

    // Generate PDF
    const pdfBlob = await generateReceiptPDF(receiptData);

    // Convert blob to buffer
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Receipt-${receiptData.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Receipt generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate receipt',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}