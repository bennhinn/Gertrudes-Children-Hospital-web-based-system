import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Receipt,
  Download,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  ArrowUpRight,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PDFDownloadButton } from '@/components/pdf-download-button'

// ---------- Types ----------
type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'pending'

interface Invoice {
  id: string
  invoice_number: string
  status: InvoiceStatus
  total: number
  due_date: string | null
  created_at: string
  paid_at: string | null
  child: {
    full_name: string
  } | null
  caregiver: {
    full_name: string
  } | null
  line_items: Array<{
    description: string
    amount: number
  }>
}

// ---------- Constants ----------
const ITEMS_PER_PAGE = 10

// ---------- Helpers ----------
function statusConfig(status: InvoiceStatus) {
  const configs = {
    paid: {
      variant: 'default' as const,
      icon: CheckCircle2,
      label: 'Paid',
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    },
    unpaid: {
      variant: 'destructive' as const,
      icon: AlertCircle,
      label: 'Unpaid',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
    overdue: {
      variant: 'destructive' as const,
      icon: Clock,
      label: 'Overdue',
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
    },
    pending: {
      variant: 'secondary' as const,
      icon: Clock,
      label: 'Pending',
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    },
  }
  return configs[status] || configs.pending
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------- Page Component ----------
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    status?: InvoiceStatus | 'all'
    search?: string
  }>
}) {
  // Await searchParams (Next.js 15+)
  const { page, status, search } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const currentPage = parseInt(page || '1')
  const statusFilter = status || 'all'
  const searchQuery = search || ''

  // ----- Build main query (CORRECT JOIN via caregivers -> profiles) -----
  let query = supabase
    .from('invoices')
    .select(
      `
      *,
      line_items:invoice_line_items(*),
      child:children!inner (
        full_name
      ),
      caregiver:caregivers (
        profile:profiles!inner (
          full_name
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('caregiver_id', user.id) // foreign key to caregivers table
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (searchQuery) {
    query = query.or(
      `invoice_number.ilike.%${searchQuery}%,child.full_name.ilike.%${searchQuery}%`
    )
  }

  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  const { data: rawInvoices, count, error } = await query.range(from, to)

  if (error) {
    console.error('Error fetching invoices:', error)
  }

  // 🔁 Transform raw data to match the Invoice type
  const invoices: Invoice[] =
    rawInvoices?.map((inv: any) => ({
      ...inv,
      // child already has full_name from the join
      child: inv.child,
      // caregiver profile is nested; extract full_name
      caregiver: inv.caregiver?.profile
        ? { full_name: inv.caregiver.profile.full_name }
        : null,
    })) || []

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

  // ----- Summary stats (only invoices table, no joins needed) -----
  const { data: summaryStats } = await supabase
    .from('invoices')
    .select('status, total')
    .eq('caregiver_id', user.id)

  const outstanding =
    summaryStats
      ?.filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0) || 0

  const totalPaidYTD =
    summaryStats
      ?.filter((inv) => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0) || 0

  const overdueCount =
    summaryStats?.filter((inv) => inv.status === 'overdue').length || 0

  // Placeholder – replace with real data later
  const paymentMethodCount = 2

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 pb-8">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Billing & Payments
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage invoices, payments, and insurance information
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="secondary" className="w-full sm:w-auto">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* ---------- Summary Cards ---------- */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Outstanding Balance */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-xl">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-100">
                    Outstanding Balance
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {formatCurrency(outstanding)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
              {overdueCount > 0 && (
                <p className="mt-4 flex items-center gap-1 text-sm text-emerald-100">
                  <AlertCircle className="h-4 w-4" />
                  {overdueCount} overdue invoice{overdueCount !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Total Paid YTD */}
          <Card className="border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Paid (YTD)
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatCurrency(totalPaidYTD)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Payment Methods
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {paymentMethodCount}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <Button
                variant="ghost"
                className="mt-4 h-auto p-0 text-sm text-blue-600 underline"
              >
                Manage cards
              </Button>
            </CardContent>
          </Card>

          {/* Total Invoices */}
          <Card className="border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Invoices
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {count || 0}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Receipt className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------- Filters ---------- */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="flex-row items-center justify-between border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-medium">
              <Filter className="h-5 w-5 text-slate-500" />
              Filters
            </CardTitle>
            {(statusFilter !== 'all' || searchQuery) && (
              <Link
                href="/billing"
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Clear all
              </Link>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <form className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="search"
                    placeholder="Search by invoice # or child name..."
                    defaultValue={searchQuery}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select name="status" defaultValue={statusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full sm:w-auto">
                Apply Filters
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ---------- Invoices List ---------- */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-medium">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {invoices.map((invoice) => {
                  const status = statusConfig(invoice.status)
                  const StatusIcon = status.icon

                  return (
                    <div
                      key={invoice.id}
                      className="group relative flex flex-col gap-4 p-6 transition-all hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 transition-transform group-hover:scale-105">
                          <Receipt className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              Invoice #{invoice.invoice_number}
                            </h3>
                            <Badge className={status.className}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">
                            {invoice.child?.full_name || 'Unknown Patient'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span>Issued: {formatDate(invoice.created_at)}</span>
                            {invoice.due_date && (
                              <span>Due: {formatDate(invoice.due_date)}</span>
                            )}
                            {invoice.paid_at && (
                              <span className="text-emerald-600">
                                Paid: {formatDate(invoice.paid_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                        <p className="text-xl font-bold text-slate-900">
                          {formatCurrency(invoice.total)}
                        </p>
                        <div className="flex gap-2">
                          <PDFDownloadButton invoiceId={invoice.id} />

                          {invoice.status === 'unpaid' ||
                          invoice.status === 'overdue' ? (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Pay Now
                              <ArrowUpRight className="ml-2 h-4 w-4" />
                            </Button>
                          ) : (
                            <Link href={`/billing/${invoice.id}`}>
                              <Button variant="ghost" size="sm">
                                Details
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                  <Receipt className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">
                  No invoices found
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters or clear them above.'
                    : 'You have no billing history yet.'}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <Link href="/billing">
                    <Button variant="secondary" className="mt-6">
                      Clear Filters
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------- Pagination ---------- */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-600">
              Showing <span className="font-medium">{from + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(to + 1, count || 0)}
              </span>{' '}
              of <span className="font-medium">{count}</span> invoices
            </p>
            <div className="flex gap-2">
              <Link
                href={`/billing?page=${currentPage - 1}&status=${statusFilter}&search=${encodeURIComponent(
                  searchQuery
                )}`}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                aria-disabled={currentPage <= 1}
              >
                <Button variant="secondary" size="sm" disabled={currentPage <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
              </Link>
              <Link
                href={`/billing?page=${currentPage + 1}&status=${statusFilter}&search=${encodeURIComponent(
                  searchQuery
                )}`}
                className={
                  currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
                }
                aria-disabled={currentPage >= totalPages}
              >
                <Button variant="secondary" size="sm" disabled={currentPage >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}