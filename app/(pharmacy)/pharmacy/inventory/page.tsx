'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Package, History, Plus, Loader2, Download, ShoppingCart, AlertTriangle, Truck, Pill, TrendingDown } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface DispensingLog {
    id: string
    medication_name: string
    quantity: number
    dispensed_at: string
    patient_name: string
    remaining_stock: number
}

interface Medication {
    id: string
    name: string
    description: string | null
    stock: number
    supplier_id: string | null
}

interface Supplier {
    id: string
    profiles: {
        full_name: string
    } | null
    company_name?: string | null
}

interface SupplyOrder {
    id: string
    requested_at: string
    delivered_at?: string
    quantity: number
    status: string
    medication_id: string
    supplier_id: string | null
    medication: {
        name: string
        stock: number
    }
}

export default function PharmacyInventoryPage() {
    const [medications, setMedications] = useState<Medication[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [orders, setOrders] = useState<SupplyOrder[]>([])
    const [dispensingLogs, setDispensingLogs] = useState<DispensingLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [dispensingSearchTerm, setDispensingSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showOrderModal, setShowOrderModal] = useState(false)
    const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)
    const [orderQuantity, setOrderQuantity] = useState(50)
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({ name: '', stock: 0 })

    const loadData = useCallback(async () => {
        try {
            const supabase = createClient()
            const { data: medData } = await supabase.from('medications').select('*').order('name', { ascending: true })
            const { data: orderData } = await supabase.from('supply_orders')
                .select(`id, requested_at, delivered_at, quantity, status, medication_id, supplier_id, medication:medications(name, stock)`)
                .order('requested_at', { ascending: false })

            // Load all suppliers - query suppliers table and join with profiles
            const { data: supplierData, error: supplierError } = await supabase
                .from('suppliers')
                .select('id, company_name, profiles(full_name)')

            if (supplierError) {
                console.error('Error loading suppliers:', supplierError)
            }

            // Load dispensing logs - prescriptions link to children directly via child_id
            const { data: dispensedPrescriptions, error: prescError } = await supabase
                .from('prescriptions')
                .select(`
                    id,
                    dispensed_at,
                    status,
                    child:children(full_name),
                    items:prescription_items(
                        id,
                        medication_name,
                        quantity,
                        created_at
                    )
                `)
                .eq('status', 'dispensed')
                .order('dispensed_at', { ascending: false })
                .limit(100)

            if (prescError) {
                console.error('Error fetching dispensing logs:', prescError)
            }

            setMedications(medData || [])
            // Map suppliers - normalize the profile join
            console.log('📦 Raw supplier data:', supplierData)
            setSuppliers((supplierData || []).map((s: any) => {
                // The join returns 'profiles' (plural) as the key
                const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
                return {
                    id: s.id,
                    company_name: s.company_name,
                    profiles: profile ? { full_name: profile.full_name } : null
                }
            }))
            setOrders((orderData || []).map((order: any) => ({
                ...order,
                medication: Array.isArray(order.medication) ? order.medication[0] : (order.medication || { name: 'Unknown', stock: 0 })
            })))

            // Transform dispensing data to logs with current stock
            // Flatten prescription items from each dispensed prescription
            const logs: DispensingLog[] = []
            for (const prescription of (dispensedPrescriptions || [])) {
                // Now child is directly on prescription, not nested under patient
                const child = Array.isArray(prescription.child) ? prescription.child[0] : prescription.child
                const items = Array.isArray(prescription.items) ? prescription.items : []

                for (const item of items) {
                    // Find current stock for this medication
                    const currentMed = (medData || []).find((m: Medication) =>
                        m.name.toLowerCase() === item.medication_name?.toLowerCase()
                    )

                    logs.push({
                        id: item.id,
                        medication_name: item.medication_name || 'Unknown',
                        quantity: item.quantity || 0,
                        dispensed_at: prescription.dispensed_at || item.created_at || new Date().toISOString(),
                        patient_name: child?.full_name || 'Unknown Patient',
                        remaining_stock: currentMed?.stock ?? 0
                    })
                }
            }

            // Sort by dispensed date descending (most recent first)
            logs.sort((a, b) => new Date(b.dispensed_at).getTime() - new Date(a.dispensed_at).getTime())
            setDispensingLogs(logs)
        } catch (error) { console.error(error) } finally { setLoading(false) }
    }, [])

    useEffect(() => {
        loadData()
        const supabase = createClient()
        const channel = supabase.channel('pharmacy-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, () => loadData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_orders' }, () => loadData())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [loadData])

    // --- PDF GENERATOR LOGIC ---
    const generatePDF = (order: SupplyOrder) => {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.text("PHARMACY SUPPLY RECEIPT", 14, 22)
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Order ID: ${order.id}`, 14, 30)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35)

        // Table Data
        autoTable(doc, {
            startY: 45,
            head: [['Item Name', 'Quantity', 'Status', 'Date Requested', 'Date Delivered']],
            body: [[
                order.medication.name,
                order.quantity.toString(),
                order.status.toUpperCase(),
                new Date(order.requested_at).toLocaleDateString(),
                order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : 'N/A'
            ]],
            theme: 'striped',
            headStyles: { fillColor: [107, 33, 168] } // Purple color
        })

        doc.save(`Receipt_${order.medication.name}_${order.id.slice(0, 5)}.pdf`)
    }

    async function handleCreateOrder(medication: Medication) {
        setSelectedMedication(medication)
        setOrderQuantity(50)
        setSelectedSupplierId(medication.supplier_id || '')
        setShowOrderModal(true)
    }

    async function submitOrder() {
        if (!selectedMedication || !selectedSupplierId) {
            alert('Please select a supplier')
            return
        }
        setSaving(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('supply_orders').insert([{
                medication_id: selectedMedication.id,
                supplier_id: selectedSupplierId,
                pharmacist_id: user?.id,
                quantity: orderQuantity,
                status: 'pending'
            }])

            // Update the medication's default supplier
            await supabase.from('medications')
                .update({ supplier_id: selectedSupplierId })
                .eq('id', selectedMedication.id)

            setShowOrderModal(false)
            setSelectedMedication(null)
            loadData()
            alert('✅ Order placed successfully!')
        } catch (error: any) { alert(error.message) } finally { setSaving(false) }
    }

    async function handleMarkAsDelivered(order: SupplyOrder) {
        if (!confirm(`Confirm delivery?`)) return
        setSaving(true)
        try {
            const supabase = createClient()
            await supabase.from('supply_orders').update({
                status: 'delivered',
                delivered_at: new Date().toISOString()
            }).eq('id', order.id)

            const newStock = (order.medication.stock || 0) + order.quantity
            await supabase.from('medications').update({ stock: newStock }).eq('id', order.medication_id)
            loadData()
        } catch (error: any) { alert(error.message) } finally { setSaving(false) }
    }

    async function handleAddMedication() {
        if (!formData.name.trim()) return
        setSaving(true)
        try {
            const supabase = createClient()
            await supabase.from('medications').insert([formData])
            setShowAddModal(false)
            setFormData({ name: '', stock: 0 })
            loadData()
        } catch (error: any) { alert(error.message) } finally { setSaving(false) }
    }

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-8 pb-24 lg:pb-8 space-y-6 overflow-x-hidden">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Pharmacy Inventory</h1>
                    <p className="text-sm text-slate-500">Stock management and supply chain tracking</p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" /> Add New Medication
                </Button>
            </div>

            <Tabs defaultValue="inventory" className="space-y-4">
                <div className="overflow-x-auto -mx-4 px-4">
                    <TabsList className="bg-slate-100 p-1 w-max min-w-full sm:w-auto">
                        <TabsTrigger value="inventory" className="text-xs sm:text-sm"><Package className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Inventory</span><span className="sm:hidden">Stock</span></TabsTrigger>
                        <TabsTrigger value="dispensed" className="text-xs sm:text-sm"><TrendingDown className="w-4 h-4 mr-1 sm:mr-2" /> Dispensed</TabsTrigger>
                        <TabsTrigger value="orders" className="text-xs sm:text-sm"><History className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Supply Orders</span><span className="sm:hidden">Orders</span></TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="inventory" className="space-y-4">
                    <Input
                        placeholder="Search stock..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {medications.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map((med) => (
                            <Card key={med.id} className="border-slate-200">
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg">{med.name}</h3>
                                        <Badge variant="secondary" className={med.stock < 20 ? "bg-red-100 text-red-700" : ""}>{med.stock} Units</Badge>
                                    </div>
                                    {/* FIX: Simplified button logic to fix hover visibility */}
                                    <Button
                                        variant="secondary"
                                        className="w-full border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                                        onClick={() => handleCreateOrder(med)}
                                        disabled={saving}
                                    >
                                        Request Restock
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="dispensed" className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                        <Input
                            placeholder="Search by medication or patient..."
                            value={dispensingSearchTerm}
                            onChange={(e) => setDispensingSearchTerm(e.target.value)}
                            className="max-w-md"
                        />
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Pill className="h-4 w-4" />
                            <span>Total Dispensed: {dispensingLogs.reduce((acc, log) => acc + log.quantity, 0)} units</span>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        {(() => {
                            // Group by medication and calculate totals
                            const summary = dispensingLogs.reduce((acc, log) => {
                                if (!acc[log.medication_name]) {
                                    acc[log.medication_name] = {
                                        total_dispensed: 0,
                                        remaining: log.remaining_stock,
                                        count: 0
                                    }
                                }
                                acc[log.medication_name].total_dispensed += log.quantity
                                acc[log.medication_name].count++
                                return acc
                            }, {} as Record<string, { total_dispensed: number; remaining: number; count: number }>)

                            return Object.entries(summary)
                                .sort((a, b) => b[1].total_dispensed - a[1].total_dispensed)
                                .slice(0, 4)
                                .map(([name, data]) => (
                                    <Card key={name} className="border-slate-200 overflow-hidden">
                                        <CardContent className="p-3">
                                            <p className="text-xs text-slate-500 truncate" title={name}>{name}</p>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-xl font-bold text-purple-600">-{data.total_dispensed}</span>
                                                <span className="text-xs text-slate-400">dispensed</span>
                                            </div>
                                            <p className="text-xs mt-1">
                                                <span className={data.remaining < 20 ? 'text-red-600 font-semibold' : 'text-emerald-600'}>
                                                    {data.remaining} remaining
                                                </span>
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))
                        })()}
                    </div>

                    <Card className="border-slate-200">
                        <CardHeader className="bg-slate-50 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingDown className="h-5 w-5 text-purple-600" />
                                Dispensing History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {dispensingLogs.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">
                                        <Pill className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p>No medications dispensed yet.</p>
                                    </div>
                                ) : (
                                    (() => {
                                        // Group logs by date for history view
                                        const filteredLogs = dispensingLogs.filter(log =>
                                            log.medication_name.toLowerCase().includes(dispensingSearchTerm.toLowerCase()) ||
                                            log.patient_name.toLowerCase().includes(dispensingSearchTerm.toLowerCase())
                                        )

                                        const groupedByDate = filteredLogs.reduce((acc, log) => {
                                            const dateKey = new Date(log.dispensed_at).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            if (!acc[dateKey]) acc[dateKey] = []
                                            acc[dateKey].push(log)
                                            return acc
                                        }, {} as Record<string, DispensingLog[]>)

                                        return Object.entries(groupedByDate).map(([date, logs]) => (
                                            <div key={date}>
                                                {/* Date Header */}
                                                <div className="bg-slate-100 px-3 py-2 sticky top-0">
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-600">{date}</p>
                                                    <p className="text-xs text-slate-400">{logs.length} item{logs.length !== 1 ? 's' : ''} dispensed</p>
                                                </div>
                                                {/* Logs for this date */}
                                                {logs.map((log) => (
                                                    <div key={log.id} className="p-3 border-b border-slate-50 last:border-0">
                                                        <div className="flex items-start gap-3">
                                                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                                <Pill className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-sm text-slate-800 truncate">{log.medication_name}</p>
                                                                <p className="text-xs text-slate-500 truncate">
                                                                    Patient: {log.patient_name}
                                                                </p>
                                                                <div className="flex items-center justify-between mt-2 gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge className="bg-red-100 text-red-700 text-xs">
                                                                            -{log.quantity} units
                                                                        </Badge>
                                                                        <span className="text-xs text-slate-400">
                                                                            {new Date(log.dispensed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-center px-2 py-1 rounded bg-slate-100">
                                                                        <p className="text-[10px] text-slate-500">Stock Now</p>
                                                                        <p className={`text-sm font-bold ${log.remaining_stock < 20 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                            {log.remaining_stock}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    })()
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders">
                    <Card className="border-slate-200">
                        <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-lg">Order History</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {orders.length === 0 ? <div className="p-12 text-center text-slate-400">No recent orders.</div> : (
                                    orders.map((order) => {
                                        // Look up supplier name from suppliers array
                                        const supplierProfile = suppliers.find(s => s.id === order.supplier_id)?.profiles
                                        return (
                                            <div key={order.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="text-left">
                                                    <p className="font-bold">{order.medication?.name}</p>
                                                    <p className="text-xs text-slate-500">
                                                        Qty: {order.quantity} • {new Date(order.requested_at).toLocaleDateString()}
                                                    </p>
                                                    {supplierProfile?.full_name && (
                                                        <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                                                            <Truck className="h-3 w-3" />
                                                            Supplier: {supplierProfile.full_name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                                                        {order.status.toUpperCase()}
                                                    </Badge>

                                                    {/* ACTIONS */}
                                                    {order.status === 'pending' && (
                                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleMarkAsDelivered(order)}>
                                                            <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Delivered
                                                        </Button>
                                                    )}

                                                    {order.status === 'delivered' && (
                                                        <Button size="sm" variant="secondary" onClick={() => generatePDF(order)}>
                                                            <Download className="w-4 h-4 mr-1" /> PDF
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Register New Stock Item</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Label>Medication Name</Label>
                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        <Label>Initial Stock</Label>
                        <Input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })} />
                        <Button onClick={handleAddMedication} className="w-full bg-purple-600" disabled={saving}>Confirm Registration</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Order Modal with Supplier Selection */}
            <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-purple-600" />
                            Request Restock
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {selectedMedication && (
                            <div className="rounded-lg bg-purple-50 p-3">
                                <p className="text-sm text-purple-700">Ordering for:</p>
                                <p className="font-semibold text-purple-900">{selectedMedication.name}</p>
                                <p className="text-xs text-purple-600">Current Stock: {selectedMedication.stock} units</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity to Order</Label>
                            <Input
                                id="quantity"
                                type="number"
                                value={orderQuantity}
                                onChange={e => setOrderQuantity(parseInt(e.target.value) || 0)}
                                min={1}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supplier">Select Supplier *</Label>
                            <select
                                id="supplier"
                                value={selectedSupplierId}
                                onChange={e => setSelectedSupplierId(e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">-- Choose a supplier --</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.company_name || supplier.profiles?.full_name || 'Unknown Supplier'}
                                    </option>
                                ))}
                            </select>
                            {suppliers.length === 0 && (
                                <p className="flex items-center gap-1 text-xs text-amber-600">
                                    <AlertTriangle className="h-3 w-3" />
                                    No suppliers registered. Ask admin to add suppliers.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setShowOrderModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={submitOrder}
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                disabled={saving || !selectedSupplierId}
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Truck className="h-4 w-4 mr-2" />}
                                Place Order
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}