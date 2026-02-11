'use client'

import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { parseQRPayload } from '@/utils/qr'

interface QRScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (appointmentId: string) => Promise<void>
}

export function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleScan = async (detectedCodes: any[]) => {
    if (isProcessing) return
    const rawValue = detectedCodes[0]?.rawValue
    if (!rawValue) return

    setIsProcessing(true)
    setError(null)

    try {
      // Parse the JSON payload
      const payload = parseQRPayload(rawValue)
      let appointmentId: string | null = null

      if (payload?.id) {
        appointmentId = payload.id
      } else {
        // Optional fallback: if the QR is just a UUID (old format)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(rawValue)) {
          appointmentId = rawValue
        }
      }

      if (!appointmentId) {
        throw new Error('Invalid QR code: not a valid appointment')
      }

      await onScan(appointmentId)
      onClose() // close modal on success
    } catch (err: any) {
      setError(err.message || 'Failed to process QR code')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Scan QR Code</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scanner */}
        <div className="p-4">
          <Scanner
            onScan={handleScan}
            onError={(err) => {
              if (err && typeof err === 'object' && 'message' in err) {
                setError((err as { message?: string }).message || 'An error occurred');
              } else {
                setError('An error occurred');
              }
            }}
            constraints={{ facingMode: 'environment' }}
            paused={!isOpen || isProcessing}
            styles={{ container: { borderRadius: '12px', overflow: 'hidden' } }}
          />

          {error && (
            <p className="text-sm text-red-500 mt-3 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </p>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            Position the QR code inside the frame
          </p>
        </div>
      </div>
    </div>
  )
}