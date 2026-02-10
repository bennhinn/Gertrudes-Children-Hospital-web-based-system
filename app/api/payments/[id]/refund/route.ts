import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processRefund } from '@/lib/mock-payment-gateway';

export interface RefundRequest {
  amount: number;
  reason: string;
}

/**
 * POST /api/payments/[id]/refund
 * Process a refund for a payment
 */
export async function POST(
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

    // Parse request body
    const body: RefundRequest = await request.json();

    // Validate required fields
    if (!body.amount || !body.reason) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, reason' },
        { status: 400 }
      );
    }

    // Fetch payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(
        `
        *,
        invoice:invoices (
          id,
          total,
          paid_amount,
          balance_due,
          status
        )
      `
      )
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment can be refunded
    if (payment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Only completed payments can be refunded' },
        { status: 400 }
      );
    }

    // Check if payment was already refunded
    if (payment.status === 'refunded') {
      return NextResponse.json({ error: 'Payment already refunded' }, { status: 400 });
    }

    // Validate refund amount
    if (body.amount > parseFloat(payment.amount)) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed payment amount' },
        { status: 400 }
      );
    }

    // Check for existing refunds
    const { data: existingRefunds } = await supabase
      .from('payment_refunds')
      .select('refund_amount')
      .eq('original_payment_id', paymentId)
      .eq('status', 'completed');

    const totalRefunded = existingRefunds?.reduce(
      (sum, refund) => sum + parseFloat(refund.refund_amount.toString()),
      0
    ) || 0;

    if (totalRefunded + body.amount > parseFloat(payment.amount)) {
      return NextResponse.json(
        { error: 'Total refund amount would exceed payment amount' },
        { status: 400 }
      );
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isCaregiver = payment.caregiver_id === user.id;

    // Caregivers can only request refunds, not approve them
    const refundStatus = isCaregiver ? 'pending' : 'approved';

    // Create refund record
    const { data: refundRecord, error: refundCreateError } = await supabase
      .from('payment_refunds')
      .insert({
        original_payment_id: paymentId,
        invoice_id: payment.invoice_id,
        refund_amount: body.amount,
        refund_reason: body.reason,
        requested_by: user.id,
        approved_by: isAdmin ? user.id : null,
        status: refundStatus,
        refund_method: payment.method,
      })
      .select()
      .single();

    if (refundCreateError || !refundRecord) {
      return NextResponse.json({ error: 'Failed to create refund record' }, { status: 500 });
    }

    // If auto-approved (admin initiated), process immediately
    if (refundStatus === 'approved') {
      // Process refund through mock gateway
      const refundResult = await processRefund(paymentId, body.amount, body.reason);

      if (refundResult.success) {
        // Update refund record
        await supabase
          .from('payment_refunds')
          .update({
            refund_number: refundResult.refundNumber,
            status: 'completed',
            completed_at: new Date().toISOString(),
            processed_by: user.id,
          })
          .eq('id', refundRecord.id);

        // Update payment status
        const isFullRefund = totalRefunded + body.amount >= parseFloat(payment.amount);
        await supabase
          .from('payments')
          .update({
            status: isFullRefund ? 'refunded' : 'completed',
          })
          .eq('id', paymentId);

        // Update invoice
        if (payment.invoice) {
          const newPaidAmount = parseFloat(payment.invoice.paid_amount) - body.amount;
          const newBalanceDue = parseFloat(payment.invoice.total) - newPaidAmount;

          await supabase
            .from('invoices')
            .update({
              paid_amount: newPaidAmount,
              balance_due: newBalanceDue,
              status: newBalanceDue <= 0 ? 'paid' : newPaidAmount > 0 ? 'partially_paid' : 'pending',
            })
            .eq('id', payment.invoice_id);
        }

        // Log transaction
        await supabase.from('transaction_logs').insert({
          payment_id: paymentId,
          action: 'refund_completed',
          status: 'completed',
          amount: body.amount,
          user_id: user.id,
          user_type: profile?.role || 'unknown',
          metadata: {
            refund_number: refundResult.refundNumber,
            reason: body.reason,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Refund processed successfully',
          refund: {
            ...refundRecord,
            refund_number: refundResult.refundNumber,
            status: 'completed',
          },
        });
      } else {
        // Mark refund as failed
        await supabase
          .from('payment_refunds')
          .update({
            status: 'rejected',
            notes: refundResult.message,
          })
          .eq('id', refundRecord.id);

        return NextResponse.json(
          {
            success: false,
            error: 'Refund processing failed',
            message: refundResult.message,
          },
          { status: 500 }
        );
      }
    }

    // If pending approval (caregiver initiated)
    return NextResponse.json({
      success: true,
      message: 'Refund request submitted for approval',
      refund: refundRecord,
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      {
        error: 'Refund processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/[id]/refund
 * Get refund status for a payment
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

    // Fetch refunds for this payment
    const { data: refunds, error: refundsError } = await supabase
      .from('payment_refunds')
      .select(
        `
        *,
        requested_by_profile:profiles!payment_refunds_requested_by_fkey (
          full_name
        ),
        approved_by_profile:profiles!payment_refunds_approved_by_fkey (
          full_name
        ),
        processed_by_profile:profiles!payment_refunds_processed_by_fkey (
          full_name
        )
      `
      )
      .eq('original_payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (refundsError) {
      return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
    }

    return NextResponse.json({ refunds: refunds || [] });
  } catch (error) {
    console.error('Refund fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch refund information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}