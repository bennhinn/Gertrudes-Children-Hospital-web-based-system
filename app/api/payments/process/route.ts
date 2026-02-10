import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processPayment, PaymentRequest, PaymentResponse } from '@/lib/mock-payment-gateway';

/**
 * POST /api/payments/process
 * Process a payment using the mock payment gateway
 */
export async function POST(request: NextRequest) {
  let paymentId: string | null = null;

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

    // Parse request body
    const body: PaymentRequest = await request.json();

    // Validate required fields
    if (!body.amount || !body.invoiceId || !body.paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, invoiceId, paymentMethod' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (body.amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', body.invoiceId)
      .single();

    if (invoiceError) {
      console.error('Invoice fetch error:', invoiceError);
      return NextResponse.json({
        error: 'Invoice not found',
        details: invoiceError.message
      }, { status: 404 });
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    // Validate payment amount doesn't exceed balance due
    const balanceDue = invoice.balance_due || invoice.total;
    if (body.amount > balanceDue) {
      return NextResponse.json({
        error: 'Payment amount exceeds balance due',
        balanceDue
      }, { status: 400 });
    }

    // Create payment record with pending status
    const { data: payment, error: paymentCreateError } = await supabase
      .from('payments')
      .insert({
        invoice_id: body.invoiceId,
        child_id: invoice.child_id,
        caregiver_id: invoice.caregiver_id,
        amount: body.amount,
        method: body.paymentMethod,
        status: 'pending',
        processed_by: user.id,
      })
      .select()
      .single();

    if (paymentCreateError) {
      console.error('Payment creation error:', paymentCreateError);
      return NextResponse.json(
        {
          error: 'Failed to create payment record',
          details: paymentCreateError.message
        },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Failed to create payment record - no data returned' },
        { status: 500 }
      );
    }

    paymentId = payment.id;

    // Log transaction start
    await supabase.from('transaction_logs').insert({
      payment_id: payment.id,
      action: 'payment_initiated',
      status: 'pending',
      amount: body.amount,
      user_id: user.id,
      user_type: 'caregiver',
      metadata: {
        payment_method: body.paymentMethod,
        invoice_id: body.invoiceId,
      },
    });

    try {
      // Process payment through mock gateway
      const paymentResponse: PaymentResponse = await processPayment(body);

      // Map payment gateway status to database-valid status
      // Database only accepts: 'pending', 'paid', 'failed'
      const dbStatus = paymentResponse.success ? 'paid' : 'failed';

      // Prepare payment update data
      const paymentUpdateData: Record<string, any> = {
        status: dbStatus,
        transaction_id: paymentResponse.transactionId,
        payment_date: new Date().toISOString(),
      };

      if (paymentResponse.success) {
        paymentUpdateData.receipt_number = paymentResponse.receiptNumber;
        paymentUpdateData.completed_at = new Date().toISOString();

        // Add payment method specific fields
        if (paymentResponse.cardLast4) {
          paymentUpdateData.card_last4 = paymentResponse.cardLast4;
        }

        if (paymentResponse.cardBrand) {
          paymentUpdateData.card_brand = paymentResponse.cardBrand;
        }

        if (paymentResponse.mpesaTransactionId) {
          paymentUpdateData.mpesa_transaction_id = paymentResponse.mpesaTransactionId;

          // Safely get phone number for M-Pesa payments
          if (body.paymentDetails && 'phoneNumber' in body.paymentDetails) {
            paymentUpdateData.mpesa_phone = body.paymentDetails.phoneNumber;
          }
        }
      } else {
        // Payment failed, set error message
        if (paymentResponse.message) {
          paymentUpdateData.error_message = paymentResponse.message;
        }
      }

      // Update payment record
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update(paymentUpdateData)
        .eq('id', payment.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update payment:', updateError);

        // Log payment update failure
        await supabase.from('transaction_logs').insert({
          payment_id: payment.id,
          action: 'payment_update_failed',
          status: 'failed',
          amount: body.amount,
          user_id: user.id,
          user_type: 'caregiver',
          metadata: {
            error: updateError.message,
            error_code: updateError.code,
          },
        });

        return NextResponse.json(
          {
            error: 'Failed to update payment',
            details: updateError.message
          },
          { status: 500 }
        );
      }

      // Update invoice if payment successful
      if (paymentResponse.success) {
        const currentPaidAmount = invoice.paid_amount || 0;
        const newPaidAmount = currentPaidAmount + body.amount;
        const newBalanceDue = invoice.total - newPaidAmount;
        const newStatus = newBalanceDue <= 0 ? 'paid' : 'partially_paid';

        const { error: invoiceUpdateError } = await supabase
          .from('invoices')
          .update({
            paid_amount: newPaidAmount,
            balance_due: newBalanceDue,
            status: newStatus,
            payment_method: body.paymentMethod,
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.invoiceId);

        if (invoiceUpdateError) {
          console.error('Failed to update invoice:', invoiceUpdateError);

          // Log invoice update failure
          await supabase.from('transaction_logs').insert({
            payment_id: payment.id,
            action: 'invoice_update_failed',
            status: 'failed',
            amount: body.amount,
            user_id: user.id,
            user_type: 'caregiver',
            metadata: {
              invoice_id: body.invoiceId,
              error: invoiceUpdateError.message,
              error_code: invoiceUpdateError.code,
            },
          });

          return NextResponse.json(
            {
              error: 'Payment processed but failed to update invoice',
              details: invoiceUpdateError.message,
              paymentId: payment.id,
            },
            { status: 500 }
          );
        }

        // Log successful transaction
        await supabase.from('transaction_logs').insert({
          payment_id: payment.id,
          action: 'payment_completed',
          status: 'paid',
          amount: body.amount,
          user_id: user.id,
          user_type: 'caregiver',
          metadata: {
            transaction_id: paymentResponse.transactionId,
            receipt_number: paymentResponse.receiptNumber,
            invoice_status: newStatus,
            new_balance: newBalanceDue,
          },
        });
      } else {
        // Log failed transaction
        await supabase.from('transaction_logs').insert({
          payment_id: payment.id,
          action: 'payment_failed',
          status: 'failed',
          amount: body.amount,
          user_id: user.id,
          user_type: 'caregiver',
          metadata: {
            error_message: paymentResponse.message,
            transaction_id: paymentResponse.transactionId,
          },
        });
      }

      // Return response
      return NextResponse.json({
        success: paymentResponse.success,
        status: dbStatus,
        message: paymentResponse.message,
        transactionId: paymentResponse.transactionId,
        receiptNumber: paymentResponse.receiptNumber,
        paymentId: payment.id,
        invoiceId: body.invoiceId,
      });

    } catch (processingError) {
      console.error('Payment processing error details:', {
        error: processingError,
        message: processingError instanceof Error ? processingError.message : 'Unknown',
        stack: processingError instanceof Error ? processingError.stack : undefined,
        paymentId: payment.id,
        invoiceId: body.invoiceId,
      });

      // Update payment as failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          error_message: processingError instanceof Error ? processingError.message : 'Unknown error',
        })
        .eq('id', payment.id);

      // Log error
      await supabase.from('transaction_logs').insert({
        payment_id: payment.id,
        action: 'payment_error',
        status: 'failed',
        amount: body.amount,
        user_id: user.id,
        user_type: 'caregiver',
        metadata: {
          error: processingError instanceof Error ? processingError.message : 'Unknown error',
          stack: processingError instanceof Error ? processingError.stack : undefined,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Payment processing failed',
          details: processingError instanceof Error ? processingError.message : 'Unknown error',
          paymentId: payment.id,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Payment processing error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      paymentId,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Payment processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}