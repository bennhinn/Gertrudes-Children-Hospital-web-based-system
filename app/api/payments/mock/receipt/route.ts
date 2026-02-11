import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoice = searchParams.get('invoice') || 'unknown';
    
    // Create a simple PDF content (in reality, use a PDF library)
    const pdfContent = `
      %PDF-1.4
      1 0 obj
      << /Type /Catalog /Pages 2 0 R >>
      endobj
      2 0 obj
      << /Type /Pages /Kids [3 0 R] /Count 1 >>
      endobj
      3 0 obj
      << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
      endobj
      4 0 obj
      << /Length 44 >>
      stream
      BT
      /F1 12 Tf
      100 700 Td
      (Receipt for Invoice: ${invoice}) Tj
      ET
      endstream
      endobj
      xref
      0 5
      0000000000 65535 f
      0000000009 00000 n
      0000000053 00000 n
      0000000107 00000 n
      0000000188 00000 n
      trailer
      << /Size 5 /Root 1 0 R >>
      startxref
      300
      %%EOF
    `;
    
    return new Response(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt_${invoice}.pdf"`,
      },
    });
    
  } catch (error) {
    console.error('Error generating mock PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate mock PDF' },
      { status: 500 }
    );
  }
}