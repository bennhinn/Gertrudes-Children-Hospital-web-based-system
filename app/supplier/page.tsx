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

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Meds Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalMeds}</h3>
            </div>
            <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
              <Package size={24} />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-4 flex items-center gap-1">
            <CheckCircle size={14} /> Active Catalog
          </p>
        </div>

        {/* Low Stock Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.lowStock}</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-sm text-orange-600 mt-4">Needs attention</p>
        </div>

        {/* Pending Orders Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Requests</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.pendingOrders}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-4">Awaiting approval</p>
        </div>
      </div>
      
      {/* Quick Actions / Recent Activity could go here */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
        <h2 className="text-xl font-bold mb-4">Welcome Back</h2>
        <p className="text-gray-600">Select an option from the sidebar to manage your inventory and orders.</p>
      </div>
    </div>
  );
}