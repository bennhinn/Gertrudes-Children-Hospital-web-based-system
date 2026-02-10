import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface ReceiptData {
  receiptNumber: string;
  invoiceNumber: string;
  paymentDate: string;
  paymentTime: string;
  caregiverName: string;
  childName: string;
  childAge?: number;
  items: Array<{
    description: string;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  transactionId: string;
  cardLast4?: string;
  cardBrand?: string;
  mpesaPhone?: string;
  mpesaTransactionId?: string;
}

/**
 * Format currency
 */
function formatCurrency(amount: number, currency: string = 'KES'): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format payment method display
 */
function formatPaymentMethod(data: ReceiptData): string {
  switch (data.paymentMethod) {
    case 'card':
      return `${data.cardBrand} ****${data.cardLast4}`;
    case 'mpesa':
      return `M-Pesa - ${data.mpesaPhone}`;
    case 'cash':
      return 'Cash';
    case 'insurance':
      return 'Insurance';
    case 'bank_transfer':
      return 'Bank Transfer';
    default:
      return data.paymentMethod;
  }
}

/**
 * Generate PDF receipt
 */
export async function generateReceiptPDF(data: ReceiptData): Promise<Blob> {
  const doc = new jsPDF();

  // Colors
  const primaryColor = '#10B981'; // Green
  const textColor = '#1F2937';
  const lightGray = '#F3F4F6';

  // Header with hospital branding
  doc.setFillColor(16, 185, 129); // Green background
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text("GERTRUDE'S CHILDREN'S HOSPITAL", 105, 15, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Payment Receipt', 105, 24, { align: 'center' });

  // Receipt details box
  doc.setTextColor(textColor);
  doc.setFillColor(243, 244, 246);
  doc.rect(15, 45, 180, 30, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt #:', 20, 55);
  doc.text('Invoice #:', 20, 62);
  doc.text('Date:', 20, 69);

  doc.setFont('helvetica', 'normal');
  doc.text(data.receiptNumber, 50, 55);
  doc.text(data.invoiceNumber, 50, 62);
  doc.text(`${data.paymentDate} at ${data.paymentTime}`, 50, 69);

  // Bill to section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BILL TO:', 20, 90);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(data.caregiverName, 20, 98);
  doc.text(
    `Patient: ${data.childName}${data.childAge ? ` (${data.childAge} years)` : ''}`,
    20,
    105
  );

  // Items table
  let yPos = 120;

  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(15, yPos, 180, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 20, yPos + 7);
  doc.text('AMOUNT', 175, yPos + 7, { align: 'right' });

  yPos += 15;

  // Table rows
  doc.setFont('helvetica', 'normal');
  data.items.forEach((item) => {
    doc.text(item.description, 20, yPos);
    doc.text(formatCurrency(item.amount), 175, yPos, { align: 'right' });
    yPos += 7;
  });

  // Add some spacing
  yPos += 5;

  // Totals section
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos, 195, yPos);
  yPos += 8;

  doc.text('Subtotal:', 130, yPos);
  doc.text(formatCurrency(data.subtotal), 175, yPos, { align: 'right' });
  yPos += 7;

  if (data.discount && data.discount > 0) {
    doc.text('Discount:', 130, yPos);
    doc.text(`-${formatCurrency(data.discount)}`, 175, yPos, { align: 'right' });
    yPos += 7;
  }

  doc.text('Tax (16%):', 130, yPos);
  doc.text(formatCurrency(data.tax), 175, yPos, { align: 'right' });
  yPos += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', 130, yPos);
  doc.text(formatCurrency(data.total), 175, yPos, { align: 'right' });

  yPos += 15;

  // Payment details
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos, 195, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PAYMENT DETAILS', 20, yPos);
  yPos += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Payment Method:', 20, yPos);
  doc.text(formatPaymentMethod(data), 70, yPos);
  yPos += 7;

  doc.text('Transaction ID:', 20, yPos);
  doc.text(data.transactionId, 70, yPos);
  yPos += 7;

  if (data.mpesaTransactionId) {
    doc.text('M-Pesa Ref:', 20, yPos);
    doc.text(data.mpesaTransactionId, 70, yPos);
    yPos += 7;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 20, yPos);
  doc.setTextColor(16, 185, 129);
  doc.text('PAID', 70, yPos);
  doc.setTextColor(textColor);

  // Generate QR code
  try {
    const qrCodeData = await QRCode.toDataURL(
      JSON.stringify({
        receiptNumber: data.receiptNumber,
        amount: data.total,
        date: data.paymentDate,
      })
    );

    doc.addImage(qrCodeData, 'PNG', 165, yPos + 10, 25, 25);

    doc.setFontSize(8);
    doc.text('Scan to verify', 177.5, yPos + 38, { align: 'center' });
  } catch (error) {
    console.error('QR code generation failed:', error);
  }

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for choosing Gertrude\'s Children\'s Hospital!', 105, 270, {
    align: 'center',
  });

  doc.setFontSize(8);
  doc.text('Muthaiga Road, Nairobi | +254 709 800 000 | info@gertrudes.org', 105, 277, {
    align: 'center',
  });

  // Return as blob
  return doc.output('blob');
}

/**
 * Generate and download receipt
 */
export async function downloadReceipt(data: ReceiptData): Promise<void> {
  const pdfBlob = await generateReceiptPDF(data);
  const url = URL.createObjectURL(pdfBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `Receipt-${data.receiptNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}