import QRCode from 'qrcode'

// Generate a short check-in code (GCH-XXXXX format)
export function generateCheckInCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Excluding 0,O,1,I to avoid confusion
  let code = 'GCH-'
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Generate QR code as data URL (base64 image)
// Now includes both the appointment ID and the short check-in code
export async function generateQRCodeDataURL(
  appointmentId: string,
  checkInCode?: string
): Promise<string> {
  const payload = JSON.stringify({
    type: 'appointment_checkin',
    id: appointmentId,
    code: checkInCode || null,
    timestamp: new Date().toISOString(),
  })

  const qrDataURL = await QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })

  return qrDataURL
}

// Generate QR code as SVG string
export async function generateQRCodeSVG(
  appointmentId: string,
  checkInCode?: string
): Promise<string> {
  const payload = JSON.stringify({
    type: 'appointment_checkin',
    id: appointmentId,
    code: checkInCode || null,
    timestamp: new Date().toISOString(),
  })

  const qrSVG = await QRCode.toString(payload, {
    type: 'svg',
    width: 300,
    margin: 2,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  })

  return qrSVG
}

// Parse QR code payload
export function parseQRPayload(payload: string): {
  type: string
  id: string
  code?: string
  timestamp: string
} | null {
  try {
    const data = JSON.parse(payload)
    if (data.type === 'appointment_checkin' && data.id) {
      return data
    }
    return null
  } catch {
    return null
  }
}

// Validate check-in code format (GCH-XXXXX)
export function isValidCheckInCode(code: string): boolean {
  return /^GCH-[A-HJ-NP-Z2-9]{5}$/i.test(code.toUpperCase())
}