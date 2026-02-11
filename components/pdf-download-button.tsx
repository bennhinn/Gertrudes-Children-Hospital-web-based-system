'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { generateInvoicePDF } from '@/app/actions/generate-invoice-pdf'

export function PDFDownloadButton({ invoiceId }: { invoiceId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const response = await generateInvoicePDF(invoiceId)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      a.click()
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="secondary" 
      size="sm" 
      onClick={handleDownload} 
      disabled={loading}
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      PDF
    </Button>
  )
}