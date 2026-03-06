import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Receipt, Download, CreditCard, AlertCircle, CheckCircle2,
  Clock, ChevronLeft, ChevronRight, Filter, Search,
  ArrowUpRight, Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PDFDownloadButton } from '@/components/pdf-download-button'

// ─── Clay Design System ───────────────────────────────────────────────────────
const clayCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');

  :root {
    --bg: #EEF2FF;
    --emerald: #10B981; --emerald-s: #ECFDF5; --emerald-l: #A7F3D0;
    --amber: #F59E0B;   --amber-s: #FFFBEB;   --amber-l: #FDE68A;
    --indigo: #6366F1;  --indigo-s: #EEF2FF;  --indigo-l: #C7D2FE;
    --purple: #8B5CF6;  --purple-s: #EDE9FE;  --purple-l: #DDD6FE;
    --sky: #0EA5E9;     --sky-s: #F0F9FF;     --sky-l: #BAE6FD;
    --rose: #F43F5E;    --rose-s: #FFF1F2;
    --orange: #F97316;  --orange-s: #FFF7ED;  --orange-l: #FED7AA;
    --text-dark: #1E1B4B; --text-mid: #4C4C72; --text-muted: #9090B0;
    --clay-sm:  0 4px 0 rgba(0,0,0,.12), 0 6px 16px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.7);
    --clay-md:  0 6px 0 rgba(0,0,0,.13), 0 10px 24px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.65);
    --clay-lg:  0 8px 0 rgba(0,0,0,.14), 0 16px 40px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.6);
    --clay-pressed: 0 2px 0 rgba(0,0,0,.12), inset 0 2px 4px rgba(0,0,0,.08);
    --spring: cubic-bezier(0.34,1.56,0.64,1);
  }

  .clay-page * { font-family: 'Nunito', sans-serif !important; box-sizing: border-box; }

  /* noise grain overlay */
  .clay-page::before {
    content:''; position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    opacity:.35;
  }

  /* ── HERO HEADER ── */
  .clay-hero {
    background: linear-gradient(135deg, #059669, #10B981, #0D9488);
    position: relative; overflow: hidden;
  }
  .clay-hero::after {
    content:''; position:absolute; inset:0;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
  }
  @keyframes blobFloat { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.08) rotate(5deg)} }
  .hero-blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.08); pointer-events:none; animation:blobFloat 8s ease-in-out infinite; }
  .clay-hero-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,.18); backdrop-filter: blur(8px);
    border-radius: 999px; padding: 5px 14px; font-size: 12px; font-weight: 800;
    color: #ECFDF5; border: 1px solid rgba(255,255,255,.25);
    box-shadow: 0 2px 0 rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.15);
    margin-bottom: 10px;
  }
  .clay-back-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,.18); backdrop-filter: blur(8px);
    border-radius: 999px; padding: 10px 20px; font-size: 13px; font-weight: 800;
    color: white; border: 1px solid rgba(255,255,255,.25); cursor: pointer;
    box-shadow: 0 3px 0 rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.2);
    transition: transform .2s var(--spring), background .2s ease;
    text-decoration: none;
  }
  .clay-back-btn:hover { background: rgba(255,255,255,.28); transform: translateY(-2px); }
  .clay-back-btn:active { transform: translateY(2px); }

  /* ── STAT CARDS ── */
  .clay-stat {
    border-radius: 24px !important; border: none !important;
    box-shadow: var(--clay-md) !important; overflow: hidden; position: relative;
    transition: transform .22s var(--spring), box-shadow .22s ease;
    cursor: default;
  }
  .clay-stat:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 14px 0 rgba(0,0,0,.13), 0 24px 52px rgba(0,0,0,.13), inset 0 1px 0 rgba(255,255,255,.65) !important;
  }
  .clay-stat:active { transform: translateY(3px); box-shadow: var(--clay-pressed) !important; }
  .stat-blob { position:absolute; border-radius:50%; pointer-events:none; background:rgba(255,255,255,.14); }
  .clay-stat:hover .clay-ico { transform: rotate(-10deg) scale(1.15) !important; }

  /* ── ICON BUBBLE ── */
  .clay-ico {
    border-radius: 16px;
    box-shadow: 0 4px 0 rgba(0,0,0,.15), 0 8px 16px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.5);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: transform .22s var(--spring);
  }

  /* ── FILTER BAR ── */
  .clay-filter {
    border-radius: 24px; border: none;
    box-shadow: var(--clay-md); background: white;
    padding: 18px 22px;
  }
  .clay-search-wrap { position: relative; flex: 1; }
  .clay-search-ico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9090B0; pointer-events: none; }
  .clay-search {
    border-radius: 999px !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.07), inset 0 -1px 0 rgba(255,255,255,.8) !important;
    border: 1.5px solid #A7F3D0 !important;
    font-weight: 600 !important; background: #FAFBFF !important;
    padding: 10px 14px 10px 42px !important; font-size: 14px; width: 100%;
    transition: border-color .2s, box-shadow .2s; color: #1E1B4B;
  }
  .clay-search:focus { border-color: #10B981 !important; box-shadow: inset 0 2px 6px rgba(0,0,0,.05), 0 0 0 3px rgba(16,185,129,.12) !important; outline: none !important; }

  /* ── STATUS SELECT ── */
  .clay-select {
    border-radius: 999px !important;
    box-shadow: inset 0 2px 6px rgba(0,0,0,.07), 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #A7F3D0 !important;
    font-weight: 700 !important; background: #FAFBFF !important;
    padding: 9px 18px; font-size: 14px; cursor: pointer; color: #1E1B4B;
    appearance: none; min-width: 160px;
    transition: border-color .2s;
  }
  .clay-select:focus { border-color: #10B981 !important; outline: none !important; }

  /* ── APPLY BUTTON ── */
  .clay-apply {
    border-radius: 999px !important; border: none !important;
    background: linear-gradient(135deg, #10B981, #059669) !important; color: white !important;
    box-shadow: 0 5px 0 rgba(16,185,129,.35), 0 8px 20px rgba(16,185,129,.25), inset 0 1px 0 rgba(255,255,255,.3) !important;
    font-weight: 800 !important; padding: 10px 22px; font-size: 14px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px;
    transition: transform .2s var(--spring), box-shadow .2s ease !important;
    text-decoration: none;
  }
  .clay-apply:hover { transform: translateY(-3px) !important; box-shadow: 0 8px 0 rgba(16,185,129,.4), 0 14px 32px rgba(16,185,129,.3), inset 0 1px 0 rgba(255,255,255,.3) !important; }
  .clay-apply:active { transform: translateY(3px) !important; }

  /* ── CLEAR BUTTON ── */
  .clay-clear {
    border-radius: 999px !important;
    box-shadow: 0 3px 0 rgba(0,0,0,.08), 0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9) !important;
    border: 1.5px solid #A7F3D0 !important; background: white !important;
    font-weight: 700 !important; padding: 10px 20px; font-size: 14px; cursor: pointer;
    color: #4C4C72; display: inline-flex; align-items: center; gap: 6px;
    transition: transform .18s var(--spring) !important; text-decoration: none;
  }
  .clay-clear:hover { transform: translateY(-2px) !important; }

  /* ── INVOICE LIST PANEL ── */
  .clay-list-panel {
    border-radius: 24px; border: none;
    box-shadow: var(--clay-md); background: white; overflow: hidden;
  }
  .clay-list-head {
    padding: 18px 24px 16px; border-bottom: 1px solid #ECFDF5;
    display: flex; align-items: center; gap: 10px;
  }

  /* ── INVOICE ROW ── */
  .clay-invoice-row {
    padding: 16px 22px;
    border-bottom: 1px solid #F0FDF4;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    transition: background .15s ease, transform .15s var(--spring);
    flex-wrap: wrap;
  }
  .clay-invoice-row:last-child { border-bottom: none; }
  .clay-invoice-row:hover { background: #F0FDF4; }
  .clay-invoice-row:hover .inv-ico { transform: scale(1.1) rotate(-5deg); }
  .inv-ico {
    border-radius: 16px; flex-shrink: 0;
    box-shadow: 0 3px 0 rgba(16,185,129,.2), 0 5px 14px rgba(16,185,129,.1), inset 0 1px 0 rgba(255,255,255,.6);
    display: flex; align-items: center; justify-content: center;
    transition: transform .22s var(--spring);
    background: linear-gradient(135deg, #ECFDF5, #A7F3D0);
  }

  /* ── STATUS BADGE ── */
  .clay-badge {
    border-radius: 999px; font-weight: 800; font-size: 11px; padding: 3px 10px;
    box-shadow: 0 2px 0 rgba(0,0,0,.07), inset 0 1px 0 rgba(255,255,255,.6);
    display: inline-flex; align-items: center; gap: 4px;
  }

  /* ── PAY NOW BUTTON ── */
  .clay-pay {
    border-radius: 999px !important; border: none !important;
    background: linear-gradient(135deg, #10B981, #059669) !important; color: white !important;
    box-shadow: 0 4px 0 rgba(16,185,129,.3), 0 6px 16px rgba(16,185,129,.2), inset 0 1px 0 rgba(255,255,255,.3) !important;
    font-weight: 800 !important; padding: 7px 16px; font-size: 12px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 5px;
    transition: transform .2s var(--spring), box-shadow .2s ease !important;
  }
  .clay-pay:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 0 rgba(16,185,129,.35), 0 10px 24px rgba(16,185,129,.25), inset 0 1px 0 rgba(255,255,255,.3) !important; }
  .clay-pay:active { transform: translateY(2px) !important; }

  /* ── DETAILS LINK ── */
  .clay-details {
    border-radius: 999px;
    box-shadow: 0 3px 0 rgba(0,0,0,.07), 0 5px 12px rgba(0,0,0,.05), inset 0 1px 0 rgba(255,255,255,.9);
    border: 1.5px solid #A7F3D0; background: white; font-weight: 700;
    padding: 6px 14px; font-size: 12px; cursor: pointer; color: #059669;
    display: inline-flex; align-items: center; gap: 5px; text-decoration: none;
    transition: transform .18s var(--spring);
  }
  .clay-details:hover { transform: translateY(-2px); }

  /* ── PAGINATION ── */
  .clay-pagination {
    border-radius: 24px; border: none;
    box-shadow: var(--clay-md); background: white;
    padding: 16px 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  }
  .clay-page-btn {
    border-radius: 999px;
    box-shadow: 0 3px 0 rgba(0,0,0,.08), 0 5px 12px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.9);
    border: 1.5px solid #A7F3D0; background: white; font-weight: 700;
    width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #059669;
    transition: transform .18s var(--spring);
  }
  .clay-page-btn:hover { transform: translateY(-2px); }
  .clay-page-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }
  .clay-page-indicator {
    background: linear-gradient(135deg, #ECFDF5, #A7F3D0);
    border-radius: 999px; padding: 6px 18px; font-size: 13px; font-weight: 800; color: #15803D;
    box-shadow: 0 2px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.7);
  }

  /* ── EMPTY STATE ── */
  .clay-empty { padding: 60px 24px; text-align: center; }
  @keyframes emptyBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .clay-empty-ico {
    width: 72px; height: 72px; border-radius: 22px;
    background: linear-gradient(135deg, #ECFDF5, #A7F3D0);
    box-shadow: var(--clay-sm);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; animation: emptyBounce 3.5s ease-in-out infinite;
  }

  /* ── DECORATIVE BLOBS ── */
  @keyframes bgBlob { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07) rotate(4deg)} }
  .deco-blob { position:fixed; border-radius:50%; pointer-events:none; animation:bgBlob 8s ease-in-out infinite; z-index:0; }
`;

// ---------- Types ----------
type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'pending'

interface Invoice {
  id: string
  invoice_number: string
  status: InvoiceStatus
  total: number
  due_date: string | null
  created_at: string
  paid_at: string | null
  child: { full_name: string } | null
  caregiver: { full_name: string } | null
  line_items: Array<{ description: string; amount: number }>
}

const ITEMS_PER_PAGE = 10

// ---------- Helpers ----------
function statusCfg(status: InvoiceStatus) {
  const configs = {
    paid:    { icon: CheckCircle2, label: 'Paid',    bg: '#DCFCE7', color: '#15803D' },
    unpaid:  { icon: AlertCircle,  label: 'Unpaid',  bg: '#FEF9C3', color: '#A16207' },
    overdue: { icon: Clock,        label: 'Overdue', bg: '#FFE4E6', color: '#BE123C' },
    pending: { icon: Clock,        label: 'Pending', bg: '#F1F5F9', color: '#475569' },
  }
  return configs[status] || configs.pending
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---------- Page Component ----------
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: InvoiceStatus | 'all'; search?: string }>
}) {
  const { page, status, search } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentPage = parseInt(page || '1')
  const statusFilter = status || 'all'
  const searchQuery = search || ''

  let query = supabase
    .from('invoices')
    .select(`*, line_items:invoice_line_items(*), child:children!inner(full_name), caregiver:caregivers(profile:profiles!inner(full_name))`, { count: 'exact' })
    .eq('caregiver_id', user.id)
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (searchQuery) query = query.or(`invoice_number.ilike.%${searchQuery}%,child.full_name.ilike.%${searchQuery}%`)

  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1
  const { data: rawInvoices, count, error } = await query.range(from, to)

  if (error) console.error('Error fetching invoices:', error)

  const invoices: Invoice[] = rawInvoices?.map((inv: any) => ({
    ...inv,
    child: inv.child,
    caregiver: inv.caregiver?.profile ? { full_name: inv.caregiver.profile.full_name } : null,
  })) || []

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

  const { data: summaryStats } = await supabase.from('invoices').select('status, total').eq('caregiver_id', user.id)
  const outstanding = summaryStats?.filter(i => i.status === 'unpaid' || i.status === 'overdue').reduce((s, i) => s + (i.total || 0), 0) || 0
  const totalPaidYTD = summaryStats?.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0) || 0
  const overdueCount = summaryStats?.filter(i => i.status === 'overdue').length || 0
  const paymentMethodCount = 2

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: clayCSS }} />

      <main className="clay-page" style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative' }}>

        {/* Background blobs */}
        <div className="deco-blob" style={{ width: 420, height: 420, background: 'radial-gradient(circle,rgba(16,185,129,.07),transparent 70%)', top: -100, right: -80 }} />
        <div className="deco-blob" style={{ width: 300, height: 300, background: 'radial-gradient(circle,rgba(99,102,241,.05),transparent 70%)', bottom: 200, left: -70, animationDelay: '4s' }} />

        {/* ── HERO HEADER ── */}
        <section className="clay-hero">
          <div className="hero-blob" style={{ width: 280, height: 280, top: -80, right: -60 }} />
          <div className="hero-blob" style={{ width: 200, height: 200, bottom: -60, left: -40, animationDelay: '3s', opacity: .6 }} />
          <div className="hero-blob" style={{ width: 120, height: 120, top: '30%', left: '40%', animationDelay: '6s', opacity: .4 }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '32px 24px 36px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
              <div>
                <div className="clay-hero-badge">
                  <Wallet size={13} /> Financial Overview
                </div>
                <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 34, fontWeight: 700, color: 'white', lineHeight: 1.1, margin: '0 0 6px' }}>
                  Billing & Payments
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(236,253,245,.85)', fontWeight: 600 }}>
                  Manage invoices, payments, and insurance information
                </p>
              </div>
              <Link href="/dashboard" className="clay-back-btn">
                <ChevronLeft size={15} /> Back to Dashboard
              </Link>
            </div>
          </div>
        </section>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '28px 24px 56px' }}>

          {/* ── STAT CARDS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14, marginBottom: 24 }}>

            {/* Outstanding */}
            <div className="clay-stat" style={{ background: 'linear-gradient(135deg,#FFFBEB,#FDE68A)', padding: '20px 22px', gridColumn: 'span 1' }}>
              <div className="stat-blob" style={{ width: 110, height: 110, bottom: -30, right: -30 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: 1 }}>Outstanding</p>
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, margin: '6px 0 8px' }}>{formatCurrency(outstanding)}</p>
                  {overdueCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#F43F5E' }}>
                      <AlertCircle size={12} /> {overdueCount} overdue invoice{overdueCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className="clay-ico" style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#F59E0B,#D97706)', color: 'white' }}>
                  <Wallet size={21} />
                </div>
              </div>
            </div>

            {/* Total Paid YTD */}
            <div className="clay-stat" style={{ background: 'linear-gradient(135deg,#ECFDF5,#A7F3D0)', padding: '20px 22px' }}>
              <div className="stat-blob" style={{ width: 100, height: 100, bottom: -26, right: -26 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#15803D', textTransform: 'uppercase', letterSpacing: 1 }}>Total Paid (YTD)</p>
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, marginTop: 6 }}>{formatCurrency(totalPaidYTD)}</p>
                </div>
                <div className="clay-ico" style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white' }}>
                  <CheckCircle2 size={21} />
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="clay-stat" style={{ background: 'linear-gradient(135deg,#EEF2FF,#C7D2FE)', padding: '20px 22px' }}>
              <div className="stat-blob" style={{ width: 100, height: 100, bottom: -26, right: -26 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1 }}>Payment Methods</p>
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, marginTop: 6, marginBottom: 8 }}>{paymentMethodCount}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6366F1', cursor: 'pointer' }}>Manage cards →</span>
                </div>
                <div className="clay-ico" style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: 'white' }}>
                  <CreditCard size={21} />
                </div>
              </div>
            </div>

            {/* Total Invoices */}
            <div className="clay-stat" style={{ background: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', padding: '20px 22px' }}>
              <div className="stat-blob" style={{ width: 100, height: 100, bottom: -26, right: -26 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: 1 }}>Total Invoices</p>
                  <p style={{ fontFamily: 'Fraunces, serif', fontSize: 36, fontWeight: 700, color: '#1E1B4B', lineHeight: 1, marginTop: 6 }}>{count || 0}</p>
                </div>
                <div className="clay-ico" style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', color: 'white' }}>
                  <Receipt size={21} />
                </div>
              </div>
            </div>

          </div>

          {/* ── FILTER BAR ── */}
          <div className="clay-filter" style={{ marginBottom: 20 }}>
            <form style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              {/* Search */}
              <div className="clay-search-wrap">
                <Search size={15} className="clay-search-ico" />
                <input name="search" placeholder="Search by invoice # or child name…" defaultValue={searchQuery} className="clay-search" style={{ fontFamily: 'Nunito, sans-serif' }} />
              </div>
              {/* Status select */}
              <select name="status" defaultValue={statusFilter} className="clay-select" style={{ fontFamily: 'Nunito, sans-serif' }}>
                <option value="all">All Statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="pending">Pending</option>
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="clay-apply">
                  <Filter size={14} /> Apply
                </button>
                {(statusFilter !== 'all' || searchQuery) && (
                  <Link href="/billing" className="clay-clear">✕ Clear</Link>
                )}
              </div>
            </form>
          </div>

          {/* ── INVOICE LIST ── */}
          <div className="clay-list-panel">
            <div className="clay-list-head">
              <div className="clay-ico" style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white' }}>
                <Receipt size={16} />
              </div>
              <p style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>Invoices</p>
              <span style={{ background: '#ECFDF5', color: '#15803D', borderRadius: 999, padding: '3px 11px', fontSize: 12, fontWeight: 800, marginLeft: 4, boxShadow: '0 2px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.8)' }}>
                {count || 0}
              </span>
            </div>

            {invoices.length > 0 ? (
              <div>
                {invoices.map(invoice => {
                  const sc = statusCfg(invoice.status)
                  const StatusIcon = sc.icon
                  const isUnpaid = invoice.status === 'unpaid' || invoice.status === 'overdue'
                  return (
                    <div key={invoice.id} className="clay-invoice-row">
                      {/* Left: icon + info */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                        <div className="inv-ico" style={{ width: 46, height: 46 }}>
                          <Receipt size={20} style={{ color: '#10B981' }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <p style={{ fontWeight: 800, color: '#1E1B4B', fontSize: 14 }}>
                              Invoice #{invoice.invoice_number}
                            </p>
                            <span className="clay-badge" style={{ background: sc.bg, color: sc.color }}>
                              <StatusIcon size={10} /> {sc.label}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {invoice.child?.full_name || 'Unknown Patient'}
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 11, color: '#9090B0', fontWeight: 600 }}>
                            <span>Issued: {formatDate(invoice.created_at)}</span>
                            {invoice.due_date && <span>Due: {formatDate(invoice.due_date)}</span>}
                            {invoice.paid_at && <span style={{ color: '#10B981' }}>Paid: {formatDate(invoice.paid_at)}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: amount + actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 700, color: '#1E1B4B' }}>
                          {formatCurrency(invoice.total)}
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <PDFDownloadButton invoiceId={invoice.id} />
                          {isUnpaid ? (
                            <button className="clay-pay">
                              Pay Now <ArrowUpRight size={13} />
                            </button>
                          ) : (
                            <Link href={`/billing/${invoice.id}`} className="clay-details">
                              Details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="clay-empty">
                <div className="clay-empty-ico">
                  <Receipt size={30} style={{ color: '#10B981' }} />
                </div>
                <p style={{ fontFamily: 'Fraunces, serif', fontSize: 20, fontWeight: 700, color: '#1E1B4B' }}>No invoices found</p>
                <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600, marginTop: 6, marginBottom: 20, maxWidth: 280, margin: '6px auto 20px' }}>
                  {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters or clear them above.' : 'You have no billing history yet.'}
                </p>
                {(searchQuery || statusFilter !== 'all') && (
                  <Link href="/billing" className="clay-apply" style={{ margin: '0 auto', width: 'fit-content' }}>
                    ✕ Clear Filters
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div className="clay-pagination" style={{ marginTop: 20 }}>
              <p style={{ fontSize: 13, color: '#9090B0', fontWeight: 600 }}>
                Showing{' '}
                <span style={{ fontWeight: 800, color: '#1E1B4B' }}>{from + 1}</span>
                {' '}to{' '}
                <span style={{ fontWeight: 800, color: '#1E1B4B' }}>{Math.min(to + 1, count || 0)}</span>
                {' '}of{' '}
                <span style={{ fontWeight: 800, color: '#1E1B4B' }}>{count}</span> invoices
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link
                  href={`/billing?page=${currentPage - 1}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`}
                  style={{ pointerEvents: currentPage <= 1 ? 'none' : 'auto', opacity: currentPage <= 1 ? .4 : 1 }}
                >
                  <button className="clay-page-btn" disabled={currentPage <= 1}>
                    <ChevronLeft size={16} />
                  </button>
                </Link>
                <div className="clay-page-indicator">{currentPage} / {totalPages}</div>
                <Link
                  href={`/billing?page=${currentPage + 1}&status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`}
                  style={{ pointerEvents: currentPage >= totalPages ? 'none' : 'auto', opacity: currentPage >= totalPages ? .4 : 1 }}
                >
                  <button className="clay-page-btn" disabled={currentPage >= totalPages}>
                    <ChevronRight size={16} />
                  </button>
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  )
}