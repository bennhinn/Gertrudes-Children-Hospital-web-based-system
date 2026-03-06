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
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50 pb-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden bg-linear-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5 motion-safe:animate-pulse sm:h-64 sm:w-64" aria-hidden="true" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5 motion-safe:animate-pulse [animation-delay:1s] sm:h-48 sm:w-48" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-emerald-100 backdrop-blur-sm">
                <Wallet className="h-3 w-3" />
                Financial Overview
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Billing & Payments
              </h1>
              <p className="mt-1 text-sm text-emerald-100 sm:text-base">
                Manage invoices, payments, and insurance information
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full sm:w-auto bg-white/15 text-white backdrop-blur-md hover:bg-white/25 border border-white/20 active:scale-95 transition-transform">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 sm:space-y-8">
        {/* ---------- Summary Cards ---------- */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 sm:gap-5">
          {/* Outstanding Balance */}
          <Card className="group relative col-span-2 overflow-hidden border-0 bg-linear-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] sm:col-span-1">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />
            <CardContent className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-100 sm:text-sm">
                    Outstanding
                  </p>
                  <p className="mt-1 text-2xl font-bold text-white tracking-tight sm:mt-2 sm:text-3xl">
                    {formatCurrency(outstanding)}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12">
                  <Wallet className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
              {overdueCount > 0 && (
                <p className="mt-3 flex items-center gap-1 text-xs text-amber-100 sm:mt-4 sm:text-sm">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {overdueCount} overdue invoice{overdueCount !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Total Paid YTD */}
          <Card className="group overflow-hidden border-0 shadow-sm ring-1 ring-emerald-100 bg-linear-to-br from-white via-white to-emerald-50/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
            <CardContent className="relative p-4 sm:p-6">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-50 transition-transform duration-500 group-hover:scale-125 sm:-right-6 sm:-top-6 sm:h-24 sm:w-24" aria-hidden="true" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-900 sm:text-sm">
                    Total Paid (YTD)
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600 tracking-tight sm:mt-2 sm:text-3xl">
                    {formatCurrency(totalPaidYTD)}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12">
                  <CheckCircle2 className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="group overflow-hidden border-0 shadow-sm ring-1 ring-blue-100 bg-linear-to-br from-white via-white to-blue-50/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
            <CardContent className="relative p-4 sm:p-6">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-125 sm:-right-6 sm:-top-6 sm:h-24 sm:w-24" aria-hidden="true" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-900 sm:text-sm">
                    Payment Methods
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-600 tracking-tight sm:mt-2 sm:text-3xl">
                    {paymentMethodCount}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12">
                  <CreditCard className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
              <p className="relative mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer sm:mt-4 sm:text-sm">
                Manage cards &rarr;
              </p>
            </CardContent>
          </Card>

          {/* Total Invoices */}
          <Card className="group overflow-hidden border-0 shadow-sm ring-1 ring-purple-100 bg-linear-to-br from-white via-white to-purple-50/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
            <CardContent className="relative p-4 sm:p-6">
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-purple-50 transition-transform duration-500 group-hover:scale-125 sm:-right-6 sm:-top-6 sm:h-24 sm:w-24" aria-hidden="true" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-900 sm:text-sm">
                    Total Invoices
                  </p>
                  <p className="mt-1 text-2xl font-bold text-purple-600 tracking-tight sm:mt-2 sm:text-3xl">
                    {count || 0}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12">
                  <Receipt className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------- Filters ---------- */}
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:rounded-2xl sm:p-5">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="search"
                placeholder="Search by invoice # or child name..."
                defaultValue={searchQuery}
                className="pl-10 rounded-lg ring-1 ring-slate-200 border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
            <Select name="status" defaultValue={statusFilter}>
              <SelectTrigger className="w-full rounded-lg ring-1 ring-slate-200 border-0 sm:w-45">
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
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-transform sm:flex-none">
                <Filter className="h-4 w-4 mr-1.5" />
                Apply
              </Button>
              {(statusFilter !== 'all' || searchQuery) && (
                <Link href="/billing" className="flex-1 sm:flex-none">
                  <Button variant="ghost" type="button" className="w-full text-slate-500 hover:text-slate-700 active:scale-95 transition-transform">
                    Clear
                  </Button>
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* ---------- Invoices List ---------- */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 sm:rounded-2xl">
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
            <h2 className="text-base font-bold text-slate-800 sm:text-lg">Invoices</h2>
          </div>
          {invoices.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {invoices.map((invoice) => {
                const status = statusConfig(invoice.status)
                const StatusIcon = status.icon

                return (
                  <div
                    key={invoice.id}
                    className="group relative flex flex-col gap-3 px-4 py-4 transition-all duration-150 hover:bg-slate-50/80 active:bg-slate-100/60 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-5"
                  >
                    <div className="flex items-start gap-3 min-w-0 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 ring-1 ring-emerald-100 transition-transform duration-200 group-hover:scale-105 sm:h-12 sm:w-12">
                        <Receipt className="h-5 w-5 text-emerald-600 sm:h-6 sm:w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <h3 className="text-sm font-bold text-slate-800 sm:text-base">
                            Invoice #{invoice.invoice_number}
                          </h3>
                          <Badge className={`${status.className} border-0 text-[11px] font-semibold sm:text-xs`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500 truncate sm:mt-1 sm:text-sm">
                          {invoice.child?.full_name || 'Unknown Patient'}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 sm:mt-2 sm:gap-x-4 sm:text-sm sm:text-slate-500">
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

                    <div className="flex items-center justify-between gap-3 pl-13 sm:flex-col sm:items-end sm:gap-2 sm:pl-0">
                      <p className="text-lg font-bold text-slate-800 sm:text-xl">
                        {formatCurrency(invoice.total)}
                      </p>
                      <div className="flex gap-2">
                        <PDFDownloadButton invoiceId={invoice.id} />

                        {invoice.status === 'unpaid' ||
                          invoice.status === 'overdue' ? (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 active:scale-95 transition-all text-xs sm:text-sm"
                          >
                            Pay Now
                            <ArrowUpRight className="ml-1 h-3.5 w-3.5 sm:ml-2 sm:h-4 sm:w-4" />
                          </Button>
                        ) : (
                          <Link href={`/billing/${invoice.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs sm:text-sm active:scale-95 transition-transform">
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
            <div className="py-16 text-center sm:py-20">
              <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 sm:h-20 sm:w-20 sm:rounded-3xl">
                <Receipt className="h-8 w-8 text-slate-400 sm:h-10 sm:w-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 sm:text-xl">
                No invoices found
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters or clear them above.'
                  : 'You have no billing history yet.'}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <Link href="/billing">
                  <Button variant="secondary" className="mt-6 active:scale-95 transition-transform">
                    Clear Filters
                  </Button>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* ---------- Pagination ---------- */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 sm:flex-row sm:rounded-2xl">
            <p className="text-xs text-slate-500 sm:text-sm">
              Showing <span className="font-semibold text-slate-700">{from + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(to + 1, count || 0)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{count}</span> invoices
            </p>
            <div className="flex gap-2">
              <Link
                href={`/billing?page=${currentPage - 1}&status=${statusFilter}&search=${encodeURIComponent(
                  searchQuery
                )}`}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                aria-disabled={currentPage <= 1}
              >
                <Button variant="secondary" size="sm" disabled={currentPage <= 1} className="rounded-lg ring-1 ring-slate-200 border-0 active:scale-95 transition-transform">
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
              </Link>
              <div className="flex items-center px-3 text-sm font-medium text-slate-700">
                {currentPage} / {totalPages}
              </div>
              <Link
                href={`/billing?page=${currentPage + 1}&status=${statusFilter}&search=${encodeURIComponent(
                  searchQuery
                )}`}
                className={
                  currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
                }
                aria-disabled={currentPage >= totalPages}
              >
                <Button variant="secondary" size="sm" disabled={currentPage >= totalPages} className="rounded-lg ring-1 ring-slate-200 border-0 active:scale-95 transition-transform">
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