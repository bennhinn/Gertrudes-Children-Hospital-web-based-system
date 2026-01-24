'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

interface Medication {
    id: string
    name: string
    description: string | null
    stock: number
    supplier_id: string | null
    supplier: {
        full_name: string
    } | null
}

type StockFilter = 'all' | 'low' | 'out' | 'good'

export default function PharmacyInventoryPage() {
    const [medications, setMedications] = useState<Medication[]>([])
    const [loading, setLoading] = useState(true)
    const [stockFilter, setStockFilter] = useState<StockFilter>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        stock: 0,
    })

    const loadMedications = useCallback(async () => {
        try {
            const supabase = createClient()

            const { data, error } = await supabase
                .from('medications')
                .select(`
          *,
          supplier:profiles(full_name)
        `)
                .order('name', { ascending: true })

            if (error) throw error

            console.log('💊 Loaded medications:', data?.length || 0)
            setMedications(data || [])
        } catch (error) {
            console.error('Error loading medications:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadMedications()

        const supabase = createClient()
        const channel = supabase
            .channel('medications-inventory')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'medications' },
                () => loadMedications()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadMedications])

    async function handleAddMedication() {
        setSaving(true)

        try {
            const supabase = createClient()

            const { error } = await supabase
                .from('medications')
                .insert([{
                    name: formData.name,
                    description: formData.description || null,
                    stock: formData.stock,
                }])

            if (error) throw error

            alert('✅ Medication added successfully!')
            setShowAddModal(false)
            setFormData({ name: '', description: '', stock: 0 })
            loadMedications()
        } catch (error: any) {
            console.error('Error adding medication:', error)
            alert(`❌ Failed to add medication: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    async function handleUpdateMedication() {
        if (!selectedMedication) return

        setSaving(true)

        try {
            const supabase = createClient()

            const { error } = await supabase
                .from('medications')
                .update({
                    name: formData.name,
                    description: formData.description || null,
                    stock: formData.stock,
                })
                .eq('id', selectedMedication.id)

            if (error) throw error

            alert('✅ Medication updated successfully!')
            setShowEditModal(false)
            setSelectedMedication(null)
            loadMedications()
        } catch (error: any) {
            console.error('Error updating medication:', error)
            alert(`❌ Failed to update medication: ${error.message}`)
        } finally {
            setSaving(false)
        }
    }

    async function handleDeleteMedication(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return
        }

        try {
            const supabase = createClient()

            const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', id)

            if (error) throw error

            alert('✅ Medication deleted successfully!')
            loadMedications()
        } catch (error: any) {
            console.error('Error deleting medication:', error)
            alert(`❌ Failed to delete medication: ${error.message}`)
        }
    }

    function openEditModal(medication: Medication) {
        setSelectedMedication(medication)
        setFormData({
            name: medication.name,
            description: medication.description || '',
            stock: medication.stock,
        })
        setShowEditModal(true)
    }

    function getStockStatus(stock: number): { label: string; color: string; bg: string } {
        if (stock === 0) return { label: 'Out of Stock', color: 'text-red-700', bg: 'bg-red-100' }
        if (stock < 20) return { label: 'Low Stock', color: 'text-yellow-700', bg: 'bg-yellow-100' }
        return { label: 'In Stock', color: 'text-green-700', bg: 'bg-green-100' }
    }

    const filteredMedications = medications.filter(m => {
        if (searchTerm && !m.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false
        }
        if (stockFilter === 'out' && m.stock !== 0) return false
        if (stockFilter === 'low' && (m.stock === 0 || m.stock >= 20)) return false
        if (stockFilter === 'good' && m.stock < 20) return false
        return true
    })

    const stats = {
        total: medications.length,
        outOfStock: medications.filter(m => m.stock === 0).length,
        lowStock: medications.filter(m => m.stock > 0 && m.stock < 20).length,
        inStock: medications.filter(m => m.stock >= 20).length,
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-24 animate-pulse rounded-xl bg-slate-200"></div>
                <div className="h-64 animate-pulse rounded-xl bg-slate-200"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-6">
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Medication</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Medication Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Paracetamol 500mg"
                            />
                        </div>
                        <div>
                            <Label htmlFor="stock">Initial Stock Quantity *</Label>
                            <Input
                                id="stock"
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description, usage, or notes..."
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddMedication} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                                {saving ? 'Adding...' : 'Add Medication'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Medication</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-name">Medication Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-stock">Stock Quantity *</Label>
                            <Input
                                id="edit-stock"
                                type="number"
                                min="0"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateMedication} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
                    <p className="text-slate-500">Manage medication stock levels</p>
                </div>
                <Button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    ➕ Add Medication
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                    onClick={() => setStockFilter('all')}
                    className={`rounded-xl p-4 text-left transition-all bg-gradient-to-br from-purple-50 to-violet-50 shadow-md hover:shadow-lg ${stockFilter === 'all' ? 'ring-2 ring-purple-500' : ''}`}
                >
                    <p className="text-sm text-purple-700">Total Items</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
                </button>

                <button
                    onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
                    className={`rounded-xl p-4 text-left transition-all bg-gradient-to-br from-red-50 to-rose-50 shadow-md hover:shadow-lg ${stockFilter === 'out' ? 'ring-2 ring-red-500' : ''}`}
                >
                    <p className="text-sm text-red-700">Out of Stock</p>
                    <p className="text-3xl font-bold text-red-600">{stats.outOfStock}</p>
                </button>

                <button
                    onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
                    className={`rounded-xl p-4 text-left transition-all bg-gradient-to-br from-yellow-50 to-orange-50 shadow-md hover:shadow-lg ${stockFilter === 'low' ? 'ring-2 ring-yellow-500' : ''}`}
                >
                    <p className="text-sm text-yellow-700">Low Stock</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.lowStock}</p>
                </button>

                <button
                    onClick={() => setStockFilter(stockFilter === 'good' ? 'all' : 'good')}
                    className={`rounded-xl p-4 text-left transition-all bg-gradient-to-br from-green-50 to-emerald-50 shadow-md hover:shadow-lg ${stockFilter === 'good' ? 'ring-2 ring-green-500' : ''}`}
                >
                    <p className="text-sm text-green-700">In Stock</p>
                    <p className="text-3xl font-bold text-green-600">{stats.inStock}</p>
                </button>
            </div>

            <div>
                <Input
                    type="text"
                    placeholder="Search medications by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">
                        {filteredMedications.length} Medication{filteredMedications.length !== 1 ? 's' : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredMedications.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-4xl">📦</p>
                            <p className="mt-4 text-lg font-medium text-slate-600">No medications found</p>
                            <p className="text-slate-400">{searchTerm ? 'Try adjusting your search' : 'Add your first medication to get started'}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredMedications.map((medication) => {
                                const stockStatus = getStockStatus(medication.stock)
                                return (
                                    <div
                                        key={medication.id}
                                        className={`rounded-xl border p-4 transition-all ${
                                            medication.stock === 0
                                                ? 'border-red-200 bg-red-50/50'
                                                : medication.stock < 20
                                                    ? 'border-yellow-200 bg-yellow-50/50'
                                                    : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl ${
                                                    medication.stock === 0
                                                        ? 'bg-red-100'
                                                        : medication.stock < 20
                                                            ? 'bg-yellow-100'
                                                            : 'bg-green-100'
                                                }`}>
                                                    💊
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-slate-800">{medication.name}</h3>
                                                        <Badge className={`${stockStatus.bg} ${stockStatus.color} border-0`}>
                                                            {stockStatus.label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-1">
                                                        Stock: <span className="font-bold">{medication.stock}</span> units
                                                    </p>
                                                    {medication.description && (
                                                        <p className="text-xs text-slate-400 mt-1">{medication.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => openEditModal(medication)}
                                                    className="bg-white"
                                                >
                                                    ✏️ Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleDeleteMedication(medication.id, medication.name)}
                                                    className="bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    🗑️ Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}