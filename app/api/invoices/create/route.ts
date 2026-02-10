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
 * POST /api/invoices/create
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