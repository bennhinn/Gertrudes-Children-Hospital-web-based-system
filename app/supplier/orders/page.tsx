'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  AlertCircle
} from 'lucide-react';

// This is the default export Next.js is looking for
export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch orders from the API route we created
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/supplier/orders');
      const json = await res.json();

      if (json.error) throw new Error(json.error);
      setOrders(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. Handle status updates (Approve / Deliver)
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/supplier/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update order');

      // Refresh list after successful update
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'approved': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Supply Orders</h1>
          <p className="text-sm text-slate-500">Manage pharmacy requests and fulfillment</p>
        </div>
        <button
          onClick={fetchOrders}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium self-start sm:self-auto"
        >
          Refresh List
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 sm:p-12 text-center">
            <Package className="mx-auto text-slate-300 mb-4 h-10 w-10 sm:h-12 sm:w-12" />
            <h3 className="text-base sm:text-lg font-medium text-slate-800">No orders yet</h3>
            <p className="text-sm text-slate-500 mt-1">Incoming pharmacy requests will appear here.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg border shrink-0 ${getStatusStyles(order.status)}`}>
                  {order.status === 'pending' && <Clock className="h-5 w-5" />}
                  {order.status === 'approved' && <Package className="h-5 w-5" />}
                  {order.status === 'delivered' && <CheckCircle className="h-5 w-5" />}
                  {order.status === 'cancelled' && <XCircle className="h-5 w-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                      {order.medications?.name || 'Loading...'}
                    </h3>
                    <span className={`shrink-0 text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-medium uppercase ${getStatusStyles(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mt-1">
                    Qty: <span className="font-bold text-slate-800">{order.quantity} units</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    #{order.id.slice(0, 8)} • {new Date(order.requested_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(order.id, 'approved')}
                      className="flex-1 sm:flex-none px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-xs sm:text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs sm:text-sm font-medium"
                    >
                      Decline
                    </button>
                  </>
                )}

                {order.status === 'approved' && (
                  <button
                    onClick={() => updateStatus(order.id, 'delivered')}
                    className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Truck className="h-4 w-4" /> Mark Shipped
                  </button>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs sm:text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Delivered {new Date(order.delivered_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}