import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface InvoiceItem {
  item_type: 'consultation' | 'lab_test' | 'prescription' | 'procedure' | 'registration' | 'other';
  item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_percent?: number;
}

export interface CreateInvoiceRequest {
  child_id: string;
  caregiver_id: string;
  items: InvoiceItem[];
  consultation_id?: string;
  pharmacy_sale_id?: string;
  lab_order_ids?: string[];
  due_date?: string;
  notes?: string;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `INV-${year}-${timestamp}${random}`;
}

/**
 * Calculate invoice totals
 */
function calculateInvoiceTotals(items: InvoiceItem[]) {
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  const lineItems = items.map((item) => {
    const itemSubtotal = item.unit_price * item.quantity;
    const discount = (itemSubtotal * (item.discount_percent || 0)) / 100;
    const taxableAmount = itemSubtotal - discount;
    const tax = (taxableAmount * (item.tax_percent || 0)) / 100;
    const lineTotal = taxableAmount + tax;

    subtotal += itemSubtotal;
    totalDiscount += discount;
    totalTax += tax;

    return {
      ...item,
      line_total: lineTotal,
    };
  });

  const total = subtotal - totalDiscount + totalTax;

  return {
    lineItems,
    subtotal,
    tax_amount: totalTax,
    discount_amount: totalDiscount,
    total,
  };
}

/**
 * GET /api/invoices
 * Fetch invoices with optional filters
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const caregiver_id = searchParams.get('caregiver_id');
    const status = searchParams.get('status');
    const from_date = searchParams.get('from_date');
    const to_date = searchParams.get('to_date');
    const limit = searchParams.get('limit') || '20';
    const offset = searchParams.get('offset') || '0';

    if (!caregiver_id) {
      return NextResponse.json({ error: 'Missing caregiver_id parameter' }, { status: 400 });
    }

    // Build query
    let query = supabase
      .from('invoices')
      .select(`
        *,
        child:children(id, full_name),
        line_items:invoice_line_items(*)
      `)
      .eq('caregiver_id', caregiver_id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (from_date) {
      query = query.gte('invoice_date', from_date);
    }

    if (to_date) {
      query = query.lte('invoice_date', to_date);
    }

    // Apply pagination
    const from = parseInt(offset);
    const to = from + parseInt(limit) - 1;
    query = query.range(from, to);

    // Execute query
    const { data: invoices, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // Transform the data to match frontend expectations
    const formattedInvoices = invoices.map((invoice: any) => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      total: invoice.total,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      discount_amount: invoice.discount_amount,
      status: invoice.status,
      balance_due: invoice.balance_due,
      line_items: (invoice.line_items || []).map((item: any) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        line_total: item.line_total,
      })),
      child: invoice.child,
      due_date: invoice.due_date,
      created_at: invoice.created_at,
      invoice_date: invoice.invoice_date,
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      count: invoices.length,
      has_more: invoices.length >= parseInt(limit),
    });
  } catch (error) {
    console.error('Invoices fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch invoices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
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
    const body: CreateInvoiceRequest = await request.json();

    // Validate required fields
    if (!body.child_id || !body.caregiver_id || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: child_id, caregiver_id, items' },
        { status: 400 }
      );
    }

    // Calculate totals
    const { lineItems, subtotal, tax_amount, discount_amount, total } =
      calculateInvoiceTotals(body.items);

    // Generate invoice number
    const invoice_number = generateInvoiceNumber();

    // Set due date (default: 7 days from now)
    const due_date =
      body.due_date ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number,
        child_id: body.child_id,
        caregiver_id: body.caregiver_id,
        consultation_id: body.consultation_id,
        pharmacy_sale_id: body.pharmacy_sale_id,
        lab_order_ids: body.lab_order_ids,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date,
        subtotal,
        tax_amount,
        discount_amount,
        total,
        paid_amount: 0,
        balance_due: total,
        status: 'pending',
        notes: body.notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice creation error:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // Create invoice line items
    const lineItemsToInsert = lineItems.map((item) => ({
      invoice_id: invoice.id,
      item_type: item.item_type,
      item_id: item.item_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent || 0,
      tax_percent: item.tax_percent || 0,
      line_total: item.line_total,
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsToInsert);

    if (lineItemsError) {
      console.error('Line items creation error:', lineItemsError);
      // Rollback invoice creation
      await supabase.from('invoices').delete().eq('id', invoice.id);
      return NextResponse.json({ error: 'Failed to create invoice line items' }, { status: 500 });
    }

    // Return created invoice with line items
    return NextResponse.json({
      invoice: {
        ...invoice,
        line_items: lineItems,
      },
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      {
        error: 'Invoice creation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}