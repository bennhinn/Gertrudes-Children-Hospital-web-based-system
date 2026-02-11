import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'

export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'pending'

export const statusConfig = (status: InvoiceStatus) => {
  const configs = {
    paid: {
      icon: CheckCircle2,
      label: 'Paid',
      className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
    },
    unpaid: {
      icon: AlertCircle,
      label: 'Unpaid',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
    overdue: {
      icon: Clock,
      label: 'Overdue',
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    },
  }
  return configs[status] || configs.pending
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}