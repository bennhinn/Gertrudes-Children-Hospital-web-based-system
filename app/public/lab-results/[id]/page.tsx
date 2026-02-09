'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, FileText, AlertTriangle, Clock, User, Calendar } from 'lucide-react'

export default function PublicLabResultPage() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('lab_orders')
                    .select(`
            *,
            child:children(id, full_name, date_of_birth, gender),
            doctor:doctors!lab_orders_doctor_id_fkey(id, profiles(full_name)),
            collected_by:lab_technicians!lab_orders_collected_by_fkey(id, profiles(full_name)),
            reviewed_by_doctor:doctors!lab_orders_reviewed_by_fkey(id, profiles(full_name))
          `)
                    .eq('id', params.id)
                    .single()

                if (error) throw error
                setOrder(data)
            } catch (err) {
                console.error('Error loading public lab result:', err)
            } finally {
                setLoading(false)
            }
        }

        if (params.id) load()
    }, [params.id])

    if (loading) return <div className="p-6">Loading...</div>
    if (!order) return <div className="p-6">Result not found</div>

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-semibold">{order.test_name || order.test_type}</h1>
            </div>

            <div className={`rounded-xl p-4 mb-4 ${order.abnormal_findings ? 'border-2 border-amber-200 bg-amber-50' : 'border-2 border-green-200 bg-green-50'}`}>
                <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${order.abnormal_findings ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                        {order.abnormal_findings ? <AlertTriangle className="h-5 w-5" /> : <svg className="h-5 w-5" />}
                    </div>
                    <div>
                        <p className="font-semibold mb-1">{order.abnormal_findings ? 'Abnormal Results' : 'Completed'}</p>
                        <p className="text-sm text-slate-700">Patient: {order.child?.full_name}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl p-4 mb-4">
                <h2 className="font-semibold mb-2">Results</h2>
                <p className="whitespace-pre-wrap">{order.results || 'No detailed results available'}</p>
            </div>

            <div className="flex gap-2">
                <Button onClick={async () => {
                    try {
                        const root = document.getElementById('public-lab-result-root')!
                        // Try dynamic import of html2canvas (if installed)
                        let html2canvas: any = null
                        try {
                            html2canvas = (await import('html2canvas')).default
                        } catch (e) {
                            console.warn('html2canvas not available, falling back to print dialog', e)
                        }

                        if (html2canvas) {
                            const canvas = await html2canvas(root, { scale: 2 })
                            const imgData = canvas.toDataURL('image/png')
                            const { jsPDF } = await import('jspdf')
                            const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] })
                            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
                            pdf.save(`${order.test_name || order.test_type || 'lab-result'}-${order.id}.pdf`)
                            return
                        }

                        // Fallback: open print dialog so user can save as PDF
                        const printWindow = window.open('', '_blank')
                        if (!printWindow) return
                        printWindow.document.open()
                        printWindow.document.write(`
                  <html>
                    <head>
                      <title>Lab Result</title>
                    </head>
                    <body>
                      ${document.getElementById('public-lab-result-root')?.innerHTML}
                    </body>
                  </html>
                `)
                        Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach((node) => {
                            try { printWindow.document.head.appendChild(node.cloneNode(true)) } catch (e) { }
                        })
                        printWindow.document.close()
                        setTimeout(() => { printWindow.print(); setTimeout(() => printWindow.close(), 500) }, 500)
                    } catch (err) {
                        console.error('Error generating PDF:', err)
                        alert('Failed to generate PDF. You can use the browser print dialog as fallback.')
                    }
                }}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                </Button>
                <Button variant="secondary" onClick={() => router.push('/')}>Home</Button>
            </div>
        </div>
    )
}
