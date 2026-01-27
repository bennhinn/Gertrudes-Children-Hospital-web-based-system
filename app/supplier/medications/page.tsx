'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, AlertCircle } from 'lucide-react';

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
    fetchMeds(); // Refresh list
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Medication Catalog</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"
        >
          <Plus size={18} /> Add Medication
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="p-4">Medication Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Stock Level</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {meds.map((med) => (
              <tr key={med.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{med.name}</td>
                <td className="p-4 text-gray-600 text-sm">{med.description}</td>
                <td className="p-4">
                  <span className={`font-bold ${med.stock < 20 ? 'text-orange-600' : 'text-gray-800'}`}>
                    {med.stock} units
                  </span>
                </td>
                <td className="p-4">
                  {med.stock < 20 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                      <AlertCircle size={12} /> Low Stock
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

      {/* Simple Modal for Adding Meds */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Medication</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input 
                  className="w-full border rounded-lg p-2"
                  value={newMed.name}
                  onChange={e => setNewMed({...newMed, name: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input 
                  className="w-full border rounded-lg p-2"
                  value={newMed.description}
                  onChange={e => setNewMed({...newMed, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Stock</label>
                <input 
                  type="number"
                  className="w-full border rounded-lg p-2"
                  value={newMed.stock}
                  onChange={e => setNewMed({...newMed, stock: e.target.value})}
                  required 
                />
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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