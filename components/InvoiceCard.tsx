"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/hooks/usePayment'
import { Receipt, Calendar, AlertCircle, CheckCircle, Clock, Download, ArrowRight } from 'lucide-react'

export interface InvoiceLineItem {
  id?: string
  description: string
  quantity: number
  line_total: number | string
}

export interface InvoiceProps {
  invoice: {
    id: string
    invoice_number: string
    total: number | string
    subtotal?: number | string
    tax_amount?: number | string
    discount_amount?: number | string
    status?: string
    balance_due?: number | string
    line_items?: InvoiceLineItem[]
    child?: { id?: string; full_name?: string }
    due_date?: string
  }
  onPay?: (invoice: any) => void
  onDownloadReceipt?: (paymentId: string) => void
}

export default function InvoiceCard({ invoice, onPay, onDownloadReceipt }: InvoiceProps) {
  const status = invoice.status || 'pending'
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Paid'
        }
      case 'pending':
        return {
          color: 'bg-amber-100 text-amber-800',
          icon: <Clock className="h-3 w-3" />,
          text: 'Pending'
        }
      case 'overdue':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Overdue'
        }
      default:
        return {
          color: 'bg-slate-100 text-slate-800',
          icon: <Clock className="h-3 w-3" />,
          text: status
        }
    }
  }

  const statusConfig = getStatusConfig(status)
  const isPaid = status === 'paid'
  const balance = Number(invoice.balance_due || invoice.total || 0)

  return (
    <div className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300 transition-all active:scale-[0.995]">
      {/* Header - Mobile Optimized */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            status === 'paid' ? 'bg-green-50 text-green-600' :
            status === 'pending' ? 'bg-amber-50 text-amber-600' :
            status === 'overdue' ? 'bg-red-50 text-red-600' :
            'bg-slate-50 text-slate-600'
          }`}>
            <Receipt className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-sm font-bold text-slate-900 truncate">
                {invoice.invoice_number}
              </p>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${statusConfig.color}`}>
                {statusConfig.icon}
                <span className="hidden sm:inline">{statusConfig.text}</span>
                <span className="sm:hidden">{statusConfig.text.charAt(0)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {invoice.child?.full_name && (
                <>
                  <span className="truncate max-w-[100px]">{invoice.child.full_name}</span>
                  <span>•</span>
                </>
              )}
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{invoice.due_date || 'No due date'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Items:</span>
            <span className="font-medium text-slate-900">
              {invoice.line_items?.length || 0}
            </span>
          </div>
          {invoice.line_items?.[0] && (
            <div className="text-slate-600 truncate max-w-[150px]">
              {invoice.line_items[0].description}
              {invoice.line_items.length > 1 && ` +${invoice.line_items.length - 1} more`}
            </div>
          )}
        </div>
        
        <div className="text-right space-y-0.5">
          <div>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(balance)}
            </p>
            {invoice.discount_amount && Number(invoice.discount_amount) > 0 && (
              <p className="text-[11px] text-green-600">
                -{formatCurrency(Number(invoice.discount_amount))} discount
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Button - Always visible on mobile */}
      <div className="pt-3 border-t border-slate-100">
        {isPaid ? (
          <button
            onClick={() => onDownloadReceipt && onDownloadReceipt(invoice.id)}
            className="w-full h-9 flex items-center justify-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-all active:scale-[0.98]"
          >
            <Download className="h-3.5 w-3.5" />
            Download Receipt
          </button>
        ) : (
          <button
            onClick={() => onPay && onPay(invoice)}
            className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Pay {formatCurrency(balance)}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}