'use client';
import { useEffect, useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';

export default function MedicationsPage() {
  const [meds, setMeds] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', description: '', stock: '' });

  // Fetch meds
  const fetchMeds = async () => {
    const res = await fetch('/api/supplier/medications');
    const json = await res.json();
    if (json.data) setMeds(json.data);
  };

  useEffect(() => { fetchMeds(); }, []);

  // Handle Add Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/supplier/medications', {
      method: 'POST',
      body: JSON.stringify(newMed),
    });
    setIsModalOpen(false);
    setNewMed({ name: '', description: '', stock: '' });
    fetchMeds();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Medication Catalog</h1>
          <p className="text-sm text-slate-500">Manage your product inventory</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700 text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Add Medication
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
            <tr>
              <th className="p-4">Medication Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Stock Level</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {meds.map((med) => (
              <tr key={med.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800">{med.name}</td>
                <td className="p-4 text-slate-600 text-sm max-w-xs truncate">{med.description}</td>
                <td className="p-4">
                  <span className={`font-bold ${med.stock < 20 ? 'text-orange-600' : 'text-slate-800'}`}>
                    {med.stock} units
                  </span>
                </td>
                <td className="p-4">
                  {med.stock < 20 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                      <AlertCircle className="h-3 w-3" /> Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      In Stock
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden space-y-3">
        {meds.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-slate-100">
            <p className="text-slate-500">No medications found</p>
          </div>
        ) : (
          meds.map((med) => (
            <div key={med.id} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-800 truncate">{med.name}</h3>
                  <p className="text-sm text-slate-500 truncate mt-0.5">{med.description || 'No description'}</p>
                </div>
                {med.stock < 20 ? (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                    <AlertCircle className="h-3 w-3" /> Low
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    In Stock
                  </span>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className={`text-sm font-bold ${med.stock < 20 ? 'text-orange-600' : 'text-slate-800'}`}>
                  {med.stock} units available
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal for Adding Meds */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4">Add New Medication</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  value={newMed.name}
                  onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  value={newMed.description}
                  onChange={e => setNewMed({ ...newMed, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  value={newMed.stock}
                  onChange={e => setNewMed({ ...newMed, stock: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium w-full sm:w-auto"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}