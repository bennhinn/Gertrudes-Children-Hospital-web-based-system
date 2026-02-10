"use client"

import React from 'react'

export interface Metrics {
  todaysRevenue?: number
  weeklyRevenue?: number
  monthlyRevenue?: number
  outstandingBalance?: number
  failedTransactions?: number
}

export default function FinancialMetricsCards({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-xs text-slate-500">Today's Revenue</div>
        <div className="text-xl font-bold">{metrics.todaysRevenue ?? 0}</div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-xs text-slate-500">Weekly Revenue</div>
        <div className="text-xl font-bold">{metrics.weeklyRevenue ?? 0}</div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-xs text-slate-500">Monthly Revenue</div>
        <div className="text-xl font-bold">{metrics.monthlyRevenue ?? 0}</div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-xs text-slate-500">Outstanding Balance</div>
        <div className="text-xl font-bold">{metrics.outstandingBalance ?? 0}</div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        <div className="text-xs text-slate-500">Failed Transactions</div>
        <div className="text-xl font-bold">{metrics.failedTransactions ?? 0}</div>
      </div>
    </div>
  )
}
