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
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supply Orders</h1>
          <p className="text-gray-500">Manage pharmacy requests and fulfillment</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          Refresh List
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      <div className="grid gap-4">
        {orders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="text-gray-500">Incoming pharmacy requests will appear here.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg border ${getStatusStyles(order.status)}`}>
                  {order.status === 'pending' && <Clock size={24} />}
                  {order.status === 'approved' && <Package size={24} />}
                  {order.status === 'delivered' && <CheckCircle size={24} />}
                  {order.status === 'cancelled' && <XCircle size={24} />}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {order.medications?.name || 'Loading medication...'}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium uppercase ${getStatusStyles(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    Requested Quantity: <span className="font-bold text-gray-900">{order.quantity} units</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    ID: #{order.id.slice(0, 8)} • {new Date(order.requested_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                {order.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateStatus(order.id, 'approved')}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-semibold transition-colors"
                    >
                      Approve Order
                    </button>
                    <button 
                      onClick={() => updateStatus(order.id, 'cancelled')}
                      className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium"
                    >
                      Decline
                    </button>
                  </>
                )}

                {order.status === 'approved' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'delivered')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center gap-2"
                  >
                    <Truck size={16} /> Mark as Shipped
                  </button>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                    <CheckCircle size={18} />
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