'use client';
import { useEffect, useState } from 'react';
import { Package, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

export default function SupplierDashboard() {
  const [stats, setStats] = useState({ totalMeds: 0, lowStock: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const res = await fetch('/api/supplier/stats');
      const data = await res.json();
      setStats(data);
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-slate-800">Overview</h1>
        <p className="text-sm text-slate-500">Welcome to your supplier dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {/* Total Meds Card */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">Total Products</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{stats.totalMeds}</h3>
            </div>
            <div className="p-2 sm:p-3 bg-teal-50 rounded-lg text-teal-600">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-green-600 mt-3 flex items-center gap-1">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" /> Active Catalog
          </p>
        </div>

        {/* Low Stock Card */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">Low Stock Alerts</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{stats.lowStock}</h3>
            </div>
            <div className="p-2 sm:p-3 bg-orange-50 rounded-lg text-orange-600">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-orange-600 mt-3">Needs attention</p>
        </div>

        {/* Pending Orders Card */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">Pending Requests</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{stats.pendingOrders}</h3>
            </div>
            <div className="p-2 sm:p-3 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-blue-600 mt-3">Awaiting approval</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">Welcome Back</h2>
        <p className="text-sm text-slate-600">Use the navigation below to manage your inventory and orders.</p>
      </div>
    </div>
  );
}