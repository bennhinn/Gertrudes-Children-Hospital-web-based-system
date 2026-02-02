'use client';

import { useEffect, useState } from 'react';
import { BarChart3, PieChart, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/supplier/analytics')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Business Analytics</h1>
        <p className="text-sm text-slate-500">Inventory health and fulfillment performance</p>
      </div>

      {/* High Level Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Requests"
          value={data.summary.totalOrders}
          icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Fulfillment"
          value={`${data.summary.deliveryRate}%`}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Low Stock"
          value={data.summary.lowStockCount}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          title="Catalog"
          value={data.summary.activeInventory}
          icon={<Activity className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base">
            <PieChart className="h-4 w-4 sm:h-5 sm:w-5" /> Order Status Distribution
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {['pending', 'approved', 'delivered', 'cancelled'].map(status => {
              const count = data.statusCounts[status] || 0;
              const percentage = data.summary.totalOrders > 0
                ? (count / data.summary.totalOrders) * 100
                : 0;

              return (
                <div key={status}>
                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                    <span className="capitalize text-slate-600">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${status === 'delivered' ? 'bg-green-500' :
                          status === 'pending' ? 'bg-amber-500' :
                            status === 'cancelled' ? 'bg-red-400' : 'bg-blue-500'
                        }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Inventory List */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 sm:mb-6 text-sm sm:text-base">Restock Priority</h3>
          <div className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] sm:text-xs text-slate-400 uppercase border-b border-slate-50">
                  <th className="pb-3 font-medium">Medication</th>
                  <th className="pb-3 font-medium text-right">Units Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.inventoryHealth.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-slate-700 truncate max-w-[150px] sm:max-w-none">{item.name}</td>
                    <td className="py-2.5 sm:py-3 text-sm text-right">
                      <span className={`px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold ${item.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                        {item.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-3 sm:p-5 rounded-xl border border-slate-100 shadow-sm">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 ${color} rounded-lg flex items-center justify-center mb-2 sm:mb-3`}>
        {icon}
      </div>
      <p className="text-[10px] sm:text-sm text-slate-500 font-medium">{title}</p>
      <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mt-0.5 sm:mt-1">{value}</h2>
    </div>
  );
}