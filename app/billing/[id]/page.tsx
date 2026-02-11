import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { PDFDownloadButton } from '@/components/pdf-download-button'

// ---------- Types ----------
type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'pending'
interface LineItem { description: string; amount: number }
interface Child { full_name: string }
interface Caregiver { full_name: string; email?: string } // email optional
interface Invoice {
  id: string
  invoice_number: string
  status: InvoiceStatus
  total: number
  due_date: string | null
  created_at: string
  paid_at: string | null
  child: Child | null
  caregiver: Caregiver | null
  line_items: LineItem[]
}

// ---------- Utilities ----------
const statusConfig = (status: InvoiceStatus) => ({
  paid: { icon: CheckCircle2, label: 'Paid', className: 'bg-emerald-100 text-emerald-700' },
  unpaid: { icon: AlertCircle, label: 'Unpaid', className: 'bg-amber-100 text-amber-700' },
  overdue: { icon: Clock, label: 'Overdue', className: 'bg-red-100 text-red-700' },
  pending: { icon: Clock, label: 'Pending', className: 'bg-slate-100 text-slate-700' },
}[status] || { icon: Clock, label: 'Pending', className: 'bg-slate-100 text-slate-700' })

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount)

const formatDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

// ---------- Page Component ----------
export default async function InvoiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ✅ Correct join – NO email field
  const { data: rawInvoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      line_items:invoice_line_items(*),
      child:children!inner (
        full_name
      ),
      caregiver:caregivers (
        id,
        profile:profiles!inner (
          full_name
        )
      )
    `)
    .eq('id', id)
    .eq('caregiver_id', user.id)
    .single()

  if (error || !rawInvoice) {
    console.error('Invoice fetch error:', error)
    notFound()
  }

  // 🔁 Transform – use authenticated user's email for the caregiver
  const invoice: Invoice = {
    ...rawInvoice,
    caregiver: rawInvoice.caregiver?.profile
      ? {
          full_name: rawInvoice.caregiver.profile.full_name,
          email: user.email || undefined, // optional – you can omit it if not needed
        }
      : null,
  }

  const status = statusConfig(invoice.status)
  const StatusIcon = status.icon

  return (
    <main className="min-h-screen bg-slate-50 pb-8">
      {/* Back navigation */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link href="/billing" className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Billing
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoice #{invoice.invoice_number}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge className={status.className}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
              <span className="text-sm text-slate-500">Issued {formatDate(invoice.created_at)}</span>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <PDFDownloadButton invoiceId={invoice.id} />
            {['unpaid', 'overdue'].includes(invoice.status) && (
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            )}
          </div>
        </div>

        {/* Two‑column layout */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left column – Details */}
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500">PATIENT</p>
                <p className="mt-1 font-medium">{invoice.child?.full_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">CAREGIVER</p>
                <p className="mt-1 font-medium">{invoice.caregiver?.full_name}</p>
                {/* Email is now optional – you can show it or hide it */}
                {invoice.caregiver?.email && (
                  <p className="text-sm text-slate-600">{invoice.caregiver.email}</p>
                )}
              </div>
              <hr className="border-slate-200" />
              <div>
                <p className="text-xs font-medium text-slate-500">DUE DATE</p>
                <p className="mt-1 font-medium">{formatDate(invoice.due_date)}</p>
              </div>
              {invoice.paid_at && (
                <div>
                  <p className="text-xs font-medium text-slate-500">PAID ON</p>
                  <p className="mt-1 font-medium text-emerald-600">{formatDate(invoice.paid_at)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right column – Items */}
          <Card className="md:col-span-2">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="space-y-3">
                {invoice.line_items.map((item: LineItem, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-700">{item.description}</span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <hr className="my-4 border-slate-200" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}