import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/payments/history
 * Get payment history for the authenticated user
 * Query params:
 *   - child_id: Filter by child (optional)
 *   - status: Filter by status (optional)
 *   - from_date: Start date filter (optional)
 *   - to_date: End date filter (optional)
 *   - limit: Number of records (default: 50)
 *   - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('child_id');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isStaff = profile?.role && ['admin', 'receptionist', 'doctor'].includes(profile.role);

    // Build query
    let query = supabase
      .from('payments')
      .select(
        `
        *,
        invoice:invoices (
          id,
          invoice_number,
          total,
          status
        ),
        child:children (
          id,
          full_name
        ),
        caregiver:caregivers (
          id,
          profiles (
            full_name
          )
        ),
        refunds:payment_refunds (
          id,
          refund_amount,
          status
        )
      `,
        { count: 'exact' }
      );

    // Filter by user access
    if (!isStaff) {
      // Caregivers can only see their own payments
      query = query.eq('caregiver_id', user.id);
    }

    // Apply filters
    if (childId) {
      query = query.eq('child_id', childId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (fromDate) {
      query = query.gte('payment_date', fromDate);
    }

    if (toDate) {
      query = query.lte('payment_date', toDate);
    }

    // Apply pagination and sorting
    query = query
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: payments, error: paymentsError, count } = await query;

    if (paymentsError) {
      console.error('Payments fetch error:', paymentsError);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Calculate summary statistics
    const totalPaid = payments?.reduce(
      (sum, payment) => sum + parseFloat(payment.amount || 0),
      0
    ) || 0;

    const completedPayments = payments?.filter((p) => p.status === 'completed').length || 0;
    const failedPayments = payments?.filter((p) => p.status === 'failed').length || 0;
    const pendingPayments = payments?.filter((p) => p.status === 'pending').length || 0;

    return NextResponse.json({
      payments: payments || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      summary: {
        totalPaid,
        completedPayments,
        failedPayments,
        pendingPayments,
      },
    });
  } catch (error) {
    console.error('Payment history error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch payment history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}