// app/help/page.tsx
'use client'

import { useState } from 'react'
import { useFAQ } from '@/hooks/UseFAQ'
import { useHelpContent } from '@/hooks/UseHelpContent'
import FAQItem from '@/components/faq-item'
import FAQSearch from '@/components/faq-search'
import {
  BookOpen,
  Star,
  HelpCircle,
  Calendar,
  CreditCard,
  Shield,
  User,
  Bell,
  Phone,
  Mail,
  Search,
  ChevronRight,
  MessageCircle,
  AlertCircle,
  X,
} from 'lucide-react'

/* ─── Category → Icon mapper ──────────────────────────────────── */
const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  appointment: <Calendar className="h-4 w-4 shrink-0" />,
  billing: <CreditCard className="h-4 w-4 shrink-0" />,
  payment: <CreditCard className="h-4 w-4 shrink-0" />,
  insurance: <Shield className="h-4 w-4 shrink-0" />,
  account: <User className="h-4 w-4 shrink-0" />,
  profile: <User className="h-4 w-4 shrink-0" />,
  notification: <Bell className="h-4 w-4 shrink-0" />,
  general: <HelpCircle className="h-4 w-4 shrink-0" />,
  record: <BookOpen className="h-4 w-4 shrink-0" />,
  lab: <Search className="h-4 w-4 shrink-0" />,
}

function getCategoryIcon(title: string): React.ReactNode {
  const key = title.toLowerCase()
  for (const [k, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (key.includes(k)) return icon
  }
  return <HelpCircle className="h-4 w-4 shrink-0" />
}

/* ─── SidebarButton ───────────────────────────────────────────── */
function SidebarButton({
  active,
  icon,
  label,
  count,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
          : 'bg-white text-slate-700 ring-1 ring-slate-100 hover:bg-blue-50 hover:ring-blue-200 hover:text-blue-700'
        }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-blue-100'
          }`}
      >
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}
        >
          {count}
        </span>
      )}
      <ChevronRight
        className={`h-3.5 w-3.5 shrink-0 transition-all ${active ? 'opacity-70' : 'opacity-0 group-hover:opacity-40'
          }`}
        aria-hidden="true"
      />
    </button>
  )
}

/* ─── EmptyState ──────────────────────────────────────────────── */
function EmptyState({ searchMode }: { searchMode: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-slate-100 sm:px-10 sm:py-16">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Search className="h-7 w-7 text-slate-400" aria-hidden="true" />
      </div>
      <h3 className="mb-1.5 text-lg font-bold text-slate-900">No results found</h3>
      <p className="max-w-xs text-sm leading-relaxed text-slate-500">
        {searchMode
          ? 'Try different keywords or browse our categories for help topics.'
          : 'There are no questions in this category yet. Try another one.'}
      </p>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────────────────── */
export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [searchMode, setSearchMode] = useState(false)

  const { items: categories } = useHelpContent()
  const { items: faqItems, loading, error, searchFAQ, markHelpful } = useFAQ({
    categoryId: selectedCategory,
    limit: 100,
  })

  // Filter to only FAQ categories (id > 10)
  const faqCategories = categories.filter((cat) => cat.display_order > 10)

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      setSearchMode(true)
      setSelectedCategory(undefined)
      await searchFAQ(query)
    } else {
      setSearchMode(false)
    }
  }

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId)
    setSearchMode(false)
  }

  const activeTitle = searchMode
    ? 'Search Results'
    : selectedCategory
      ? faqCategories.find((c) => c.id === selectedCategory)?.title ?? 'FAQ'
      : 'Frequently Asked Questions'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero header ─────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-linear-to-br from-blue-700 via-blue-600 to-blue-500 px-4 py-10 text-white sm:px-6 sm:py-16">
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-100 ring-1 ring-white/20">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Support Centre
          </div>

          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            How can we help you?
          </h1>
          <p className="mb-8 max-w-lg text-sm leading-relaxed text-blue-100 sm:text-base">
            Find answers to common questions about our services, appointments,
            and care — fast.
          </p>

          {/* Search */}
          <div className="mx-auto max-w-2xl">
            <FAQSearch onSearch={handleSearch} />
          </div>

          {/* Quick stat chips */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-blue-200">
            {[
              { icon: <BookOpen className="h-3.5 w-3.5" />, label: `${faqCategories.length} categories` },
              { icon: <HelpCircle className="h-3.5 w-3.5" />, label: 'Instant answers' },
              { icon: <Phone className="h-3.5 w-3.5" />, label: '24/7 support' },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15"
              >
                {icon}
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          {/* ── Sidebar ─────────────────────────────────────────── */}
          <aside className="lg:col-span-1" aria-label="FAQ categories">
            <div className="lg:sticky lg:top-6 space-y-1.5">
              {/* Section label */}
              <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Browse
              </p>

              <SidebarButton
                active={!selectedCategory && !searchMode}
                icon={<BookOpen className="h-4 w-4" />}
                label="All Questions"
                count={faqItems.length || undefined}
                onClick={() => {
                  setSelectedCategory(undefined)
                  setSearchMode(false)
                }}
              />
              <SidebarButton
                active={false}
                icon={<Star className="h-4 w-4" />}
                label="Popular"
                onClick={() => {
                  setSelectedCategory(undefined)
                  setSearchMode(false)
                }}
              />

              {faqCategories.length > 0 && (
                <>
                  <p className="mb-1 mt-5 px-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Categories
                  </p>
                  {/* Scrollable on mobile, full height on desktop */}
                  <div className="max-h-[50vh] space-y-1.5 overflow-y-auto scrollbar-hide lg:max-h-none">
                    {faqCategories.map((category) => (
                      <SidebarButton
                        key={category.id}
                        active={selectedCategory === category.id}
                        icon={getCategoryIcon(category.title)}
                        label={category.title}
                        onClick={() => handleCategorySelect(category.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* ── Main content ────────────────────────────────────── */}
          <main className="lg:col-span-3" aria-label="FAQ results">
            {/* Results header */}
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {activeTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? 'Loading answers\u2026'
                    : `${faqItems.length} question${faqItems.length !== 1 ? 's' : ''} found`}
                </p>
              </div>

              {/* Active category chip */}
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100 min-h-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  {faqCategories.find((c) => c.id === selectedCategory)?.title}
                  <X className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* ── Error state ───────────────────────────────────── */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:p-5"
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold text-red-700">Something went wrong</p>
                  <p className="mt-0.5 text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* ── Loading skeleton ──────────────────────────────── */}
            {loading && (
              <div className="space-y-3" aria-label="Loading FAQs">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl bg-white p-5 ring-1 ring-slate-100 sm:p-6"
                  >
                    <div className="mb-3 h-5 w-3/4 rounded-lg bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-3.5 rounded bg-slate-100" />
                      <div className="h-3.5 w-5/6 rounded bg-slate-100" />
                      <div className="h-3.5 w-4/6 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── FAQ list ──────────────────────────────────────── */}
            {!loading && !error && (
              <div className="space-y-3">
                {faqItems.length === 0 ? (
                  <EmptyState searchMode={searchMode} />
                ) : (
                  faqItems.map((item) => (
                    <FAQItem key={item.id} item={item} onMarkHelpful={markHelpful} />
                  ))
                )}
              </div>
            )}
          </main>
        </div>

        {/* ── Still Need Help ───────────────────────────────────── */}
        <div className="relative mt-10 overflow-hidden rounded-2xl bg-linear-to-br from-blue-700 via-blue-600 to-blue-500 p-6 text-white sm:mt-14 sm:p-10">
          {/* Decorative blobs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-blue-400/20 blur-2xl"
          />

          <div className="relative text-center">
            {/* Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <MessageCircle className="h-6 w-6" aria-hidden="true" />
            </div>

            <h2 className="mb-2 text-xl font-bold sm:text-2xl">Still need help?</h2>
            <p className="mx-auto mb-7 max-w-sm text-sm leading-relaxed text-blue-100 sm:text-base">
              Our support team is available around the clock to assist you with
              any question.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <a
                href="tel:+254700123456"
                className="inline-flex min-h-11.5 w-full items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-md shadow-blue-900/20 transition-all hover:bg-blue-50 hover:shadow-lg active:scale-[0.98] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Call Us
              </a>
              <a
                href="mailto:support@gch.co.ke"
                className="inline-flex min-h-11.5 w-full items-center justify-center gap-2.5 rounded-xl bg-white/15 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition-all hover:bg-white/25 active:scale-[0.98] sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}