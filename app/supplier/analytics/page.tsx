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

  if (loading) return <div className="p-10 text-center">Analysing data...</div>;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
        <p className="text-gray-500">Inventory health and fulfillment performance</p>
      </div>

      {/* High Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Requests" 
          value={data.summary.totalOrders} 
          icon={<BarChart3 className="text-blue-600" />} 
          color="bg-blue-50"
        />
        <StatCard 
          title="Fulfillment Rate" 
          value={`${data.summary.deliveryRate}%`} 
          icon={<TrendingUp className="text-green-600" />} 
          color="bg-green-50"
        />
        <StatCard 
          title="Low Stock Items" 
          value={data.summary.lowStockCount} 
          icon={<AlertTriangle className="text-amber-600" />} 
          color="bg-amber-50"
        />
        <StatCard 
          title="Live Catalog" 
          value={data.summary.activeInventory} 
          icon={<Activity className="text-purple-600" />} 
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <PieChart size={20} /> Order Status Distribution
          </h3>
          <div className="space-y-4">
            {['pending', 'approved', 'delivered', 'cancelled'].map(status => {
              const count = data.statusCounts[status] || 0;
              const percentage = data.summary.totalOrders > 0 
                ? (count / data.summary.totalOrders) * 100 
                : 0;
              
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-600">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'delivered' ? 'bg-green-500' : 
                        status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'
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
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Restock Priority (Lowest Stock)</h3>
          <div className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-gray-400 uppercase border-b border-gray-50">
                  <th className="pb-3 font-medium">Medication</th>
                  <th className="pb-3 font-medium text-right">Units Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.inventoryHealth.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-3 text-sm font-medium text-gray-700">{item.name}</td>
                    <td className="py-3 text-sm text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        item.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
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
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h2 className="text-2xl font-bold text-gray-900 mt-1">{value}</h2>
    </div>
  );
}