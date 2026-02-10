"use client"

import React, { useEffect, useState } from 'react'
import { usePayment, formatCurrency, getStatusColor } from '@/hooks/usePayment'
import {
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  FileText,
  Filter,
  X,
  Smartphone,
  TrendingUp,
  DollarSign,
  Loader,
  AlertTriangle,
  Wallet,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PaymentTransaction {
  id: string
  invoice_id?: string
  invoice?: {
    id: string
    invoice_number: string
    status: string
  }
  amount: number | string
  status: string
  method?: string
  payment_date?: string
  created_at: string
  child?: {
    full_name: string
  }
  fees?: number
  receipt_number?: string
  transaction_id?: string
}

export default function PaymentHistoryTable({ caregiverId }: { caregiverId: string }) {
  const { getPaymentHistory, generateReceipt, getInvoices } = usePayment()
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fromDate, setFromDate] = useState<string | undefined>()
  const [toDate, setToDate] = useState<string | undefined>()
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch payments and invoices in parallel
      const [paymentRes, invoiceRes] = await Promise.allSettled([
        getPaymentHistory({ 
          limit: 20, 
          from_date: fromDate, 
          to_date: toDate 
        }),
        getInvoices({
          caregiver_id: caregiverId,
          status: 'pending',
          from_date: fromDate,
          to_date: toDate,
          limit: 20
        })
      ])

      // Handle payments result
      if (paymentRes.status === 'fulfilled') {
        setPayments(paymentRes.value.payments || [])
      } else {
        console.error('Failed to fetch payments:', paymentRes.reason)
      }

      // Handle invoices result
      if (invoiceRes.status === 'fulfilled') {
        setInvoices(invoiceRes.value.invoices || [])
      } else {
        console.error('Failed to fetch invoices:', invoiceRes.reason)
      }

    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = async (paymentId: string) => {
    setDownloadingReceiptId(paymentId)
    try {
      await generateReceipt(paymentId)
    } catch (err) {
      console.error('Receipt download failed', err)
      alert('Failed to download receipt')
    } finally {
      setDownloadingReceiptId(null)
    }
  }

  // Enhanced status normalization
  const normalizeStatus = (status?: string): 'completed' | 'pending' | 'failed' => {
    if (!status) return 'pending'
    const normalized = status.toLowerCase().trim()
    
    if (normalized.includes('complete') || 
        normalized.includes('paid') || 
        normalized.includes('success') ||
        normalized.includes('approved')) {
      return 'completed'
    }
    
    if (normalized.includes('fail') || 
        normalized.includes('reject') || 
        normalized.includes('cancel') ||
        normalized.includes('error')) {
      return 'failed'
    }
    
    return 'pending'
  }

  // Combine payments and invoices for display
  const getAllTransactions = (): PaymentTransaction[] => {
    const allTransactions: PaymentTransaction[] = [...payments]
    
    // Add pending invoices that don't have corresponding payments
    invoices.forEach(invoice => {
      // Check if this invoice already has a payment
      const hasPayment = payments.some(p => p.invoice_id === invoice.id || p.invoice?.id === invoice.id)
      
      if (!hasPayment && invoice.status === 'pending') {
        allTransactions.push({
          id: `invoice-${invoice.id}`,
          invoice_id: invoice.id,
          invoice: {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            status: 'pending'
          },
          amount: invoice.balance_due || invoice.total || 0,
          status: 'pending',
          method: 'unpaid',
          created_at: invoice.created_at || new Date().toISOString(),
          child: invoice.child,
          // Mark as invoice-only (no payment record)
          receipt_number: undefined
        })
      }
    })
    
    // Sort by date (newest first)
    return allTransactions.sort((a, b) => 
      new Date(b.payment_date || b.created_at).getTime() - 
      new Date(a.payment_date || a.created_at).getTime()
    )
  }

  const getPaymentMethodIcon = (method?: string) => {
    if (!method) return <Clock className="h-3.5 w-3.5" />
    
    switch (method.toLowerCase()) {
      case 'mpesa':
      case 'mobile':
        return <Smartphone className="h-3.5 w-3.5" />
      case 'card':
      case 'credit':
      case 'debit':
        return <CreditCard className="h-3.5 w-3.5" />
      case 'insurance':
        return <Shield className="h-3.5 w-3.5" />
      case 'bank_transfer':
      case 'bank':
        return <Wallet className="h-3.5 w-3.5" />
      case 'unpaid':
        return <AlertTriangle className="h-3.5 w-3.5" />
      default:
        return <CreditCard className="h-3.5 w-3.5" />
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const clearFilters = () => {
    setFromDate(undefined)
    setToDate(undefined)
  }

  const hasActiveFilters = fromDate || toDate

  // Get all transactions including pending invoices
  const allTransactions = getAllTransactions()
  
  // Calculate stats from ALL transactions (payments + pending invoices)
  const completedTransactions = allTransactions.filter(t => normalizeStatus(t.status) === 'completed')
  const pendingTransactions = allTransactions.filter(t => normalizeStatus(t.status) === 'pending')
  const completedTotal = completedTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const pendingTotal = pendingTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  const totalVolume = allTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0)

  return (
    <div className="space-y-4">
      {/* Mobile Header with Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment History</h2>
              <p className="text-xs text-slate-500">Track all transactions</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 disabled:opacity-50"
            aria-label="Refresh"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Date Filter - Mobile Optimized */}
        <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/50 p-3 ring-1 ring-slate-200/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-800">Filter by date</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="space-y-1">
              <label htmlFor="from-date" className="text-xs font-medium text-slate-700">
                From date
              </label>
              <input
                id="from-date"
                type="date"
                value={fromDate || ''}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                max={toDate || undefined}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="to-date" className="text-xs font-medium text-slate-700">
                To date
              </label>
              <input
                id="to-date"
                type="date"
                value={toDate || ''}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                min={fromDate || undefined}
              />
            </div>
          </div>

          <Button
            onClick={fetchData}
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-transform"
          >
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Mobile Stats - Stacked Layout */}
      {allTransactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Payment Summary</span>
            <span className="text-xs text-slate-500">{allTransactions.length} total</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Completed Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-4 ring-1 ring-emerald-200/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-emerald-800">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">
                    {formatCurrency(completedTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="green" className="h-5 px-2 text-xs font-semibold">
                    {completedTransactions.length} txns
                  </Badge>
                  <p className="mt-1 text-xs text-emerald-700/80">
                    {completedTransactions.length > 0
                      ? `${((completedTotal / totalVolume) * 100).toFixed(0)}% of total`
                      : 'No completed payments'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Pending Card - NOW INCLUDES PENDING INVOICES */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 ring-1 ring-amber-200/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <span className="text-sm font-semibold text-amber-800">Pending</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatCurrency(pendingTotal)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="yellow" className="h-5 px-2 text-xs font-semibold">
                    {pendingTransactions.length} txns
                  </Badge>
                  <p className="mt-1 text-xs text-amber-700/80">
                    {pendingTransactions.length > 0
                      ? `${((pendingTotal / totalVolume) * 100).toFixed(0)}% of total`
                      : 'No pending transactions'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Total Volume Card */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 p-4 ring-1 ring-blue-200/50">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                      <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-blue-800">Total Volume</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(totalVolume)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="blue" className="h-5 px-2 text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">
                    All transactions
                  </Badge>
                  <p className="mt-1 text-xs text-blue-700/80">
                    {allTransactions.length} total
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Show breakdown of what's included */}
          {invoices.length > 0 && (
            <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Including:</span>
                <div className="flex gap-2">
                  <span className="font-medium text-slate-800">
                    {payments.length} payment{payments.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-medium text-amber-600">
                    {invoices.length} pending invoice{invoices.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction List (Payments + Invoices) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Recent Transactions {allTransactions.length > 0 && `(${allTransactions.length})`}
          </h3>
          <div className="text-xs text-slate-500">
            {allTransactions.length > 0 && 'Sorted by date'}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 ring-1 ring-slate-100">
            <div className="relative">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-100 border-t-blue-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">Loading transactions...</p>
          </div>
        ) : allTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-white to-slate-50 border border-slate-200 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm ring-1 ring-slate-100">
              <FileText className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="mt-5 text-base font-bold text-slate-900">No transactions found</h3>
            <p className="mt-2 max-w-[280px] text-sm text-slate-600">
              {hasActiveFilters
                ? 'No transactions match your current filters'
                : 'Your transaction history will appear here'
              }
            </p>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="secondary"
                size="sm"
                className="mt-4 h-10 text-sm"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {allTransactions.map((transaction) => {
              const status = normalizeStatus(transaction.status)
              const isCompleted = status === 'completed'
              const isPending = status === 'pending'
              const isInvoiceOnly = !transaction.receipt_number && transaction.method === 'unpaid'

              return (
                <div
                  key={transaction.id}
                  className={`rounded-xl bg-white p-3.5 shadow-sm ring-1 ${
                    isInvoiceOnly 
                      ? 'ring-amber-200 hover:ring-amber-300' 
                      : 'ring-slate-200 hover:ring-slate-300'
                  } transition-all active:scale-[0.995]`}
                >
                  {/* Transaction Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-600'
                          : isPending
                            ? isInvoiceOnly
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-amber-50 text-amber-600'
                            : 'bg-red-50 text-red-600'
                      }`}>
                        {isInvoiceOnly ? (
                          <FileText className="h-4.5 w-4.5" />
                        ) : (
                          <Receipt className="h-4.5 w-4.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {transaction.invoice?.invoice_number || 'INV-###'}
                          </p>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant={getStatusColor(transaction.status)}
                              className="h-5 px-2 text-[11px] uppercase font-semibold whitespace-nowrap"
                            >
                              {isInvoiceOnly ? 'UNPAID INVOICE' : transaction.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {formatDateTime(transaction.payment_date || transaction.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="space-y-0.5">
                      {transaction.child?.full_name && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">For:</span>
                          <span className="font-medium text-slate-900 truncate">
                            {transaction.child.full_name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        {getPaymentMethodIcon(transaction.method)}
                        <span className="text-slate-600 capitalize truncate">
                          {isInvoiceOnly ? 'Awaiting Payment' : transaction.method || 'Not specified'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(Number(transaction.amount || 0))}
                        </p>
                        {transaction.fees && transaction.fees > 0 ? (
                          <p className="text-[11px] text-slate-500">Fees: {formatCurrency(transaction.fees)}</p>
                        ) : isInvoiceOnly && (
                          <p className="text-[11px] text-amber-600">Payment pending</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 border-t border-slate-100">
                    {isCompleted && !isInvoiceOnly ? (
                      <Button
                        onClick={() => handleDownload(transaction.id.replace('invoice-', ''))}
                        disabled={downloadingReceiptId === transaction.id}
                        variant="secondary"
                        size="sm"
                        className="w-full h-9 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                      >
                        {downloadingReceiptId === transaction.id ? (
                          <>
                            <Loader className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Download Receipt
                          </>
                        )}
                      </Button>
                    ) : isInvoiceOnly ? (
                      <div className="text-center">
                        <span className="text-xs text-amber-600 font-medium">
                          This invoice is awaiting payment
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-xs text-slate-500">
                          {isPending
                            ? 'Receipt available after payment completion'
                            : 'No receipt available'
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Load More */}
        {allTransactions.length >= 20 && (
          <Button
            variant="secondary"
            className="w-full h-11 text-sm font-medium border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={fetchData}
          >
            Load More Transactions
          </Button>
        )}
      </div>
    </div>
  )
}