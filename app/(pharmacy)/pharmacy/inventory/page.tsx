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
import { CheckCircle2, Package, History, Plus, Loader2, FileText, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Medication {
    id: string
    name: string
    description: string | null
    stock: number
    supplier_id: string | null
}

interface SupplyOrder {
    id: string
    requested_at: string
    delivered_at?: string
    quantity: number
    status: string
    medication_id: string
    medication: {
        name: string
        stock: number
    }
}

export default function PharmacyInventoryPage() {
    const [medications, setMedications] = useState<Medication[]>([])
    const [orders, setOrders] = useState<SupplyOrder[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({ name: '', stock: 0 })

    const loadData = useCallback(async () => {
        try {
            const supabase = createClient()
            const { data: medData } = await supabase.from('medications').select('*').order('name', { ascending: true })
            const { data: orderData } = await supabase.from('supply_orders')
                .select(`id, requested_at, delivered_at, quantity, status, medication_id, medication:medications(name, stock)`)
                .order('requested_at', { ascending: false })

            setMedications(medData || [])
            setOrders((orderData || []).map((order: any) => ({
                ...order,
                medication: Array.isArray(order.medication) ? order.medication[0] : (order.medication || { name: 'Unknown', stock: 0 })
            })))
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
        const qty = prompt(`Request restock for ${medication.name}:`, "50")
        if (!qty || isNaN(parseInt(qty))) return
        setSaving(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from('supply_orders').insert([{
                medication_id: medication.id,
                supplier_id: medication.supplier_id,
                pharmacist_id: user?.id,
                quantity: parseInt(qty),
                status: 'pending'
            }])
            loadData()
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
        <div className="max-w-6xl mx-auto p-4 lg:p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Pharmacy Inventory</h1>
                    <p className="text-slate-500">Stock management and supply chain tracking</p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Add New Medication
                </Button>
            </div>

            <Tabs defaultValue="inventory" className="space-y-6">
                <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="inventory"><Package className="w-4 h-4 mr-2" /> Inventory</TabsTrigger>
                    <TabsTrigger value="orders"><History className="w-4 h-4 mr-2" /> Supply Orders</TabsTrigger>
                </TabsList>

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

                <TabsContent value="orders">
                    <Card className="border-slate-200">
                        <CardHeader className="bg-slate-50 border-b"><CardTitle className="text-lg">Order History</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {orders.length === 0 ? <div className="p-12 text-center text-slate-400">No recent orders.</div> : (
                                    orders.map((order) => (
                                        <div key={order.id} className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div className="text-center sm:text-left">
                                                <p className="font-bold">{order.medication?.name}</p>
                                                <p className="text-xs text-slate-500">Qty: {order.quantity} • {new Date(order.requested_at).toLocaleDateString()}</p>
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
                                                    <Button size="sm" variant="primary" onClick={() => generatePDF(order)}>
                                                        <Download className="w-4 h-4 mr-1" /> PDF
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
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
                        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <Label>Initial Stock</Label>
                        <Input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                        <Button onClick={handleAddMedication} className="w-full bg-purple-600" disabled={saving}>Confirm Registration</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}