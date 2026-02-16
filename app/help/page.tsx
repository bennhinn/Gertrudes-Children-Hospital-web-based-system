// app/help/page.tsx
'use client'

import { useState } from 'react'
import { useFAQ } from '@/hooks/UseFAQ'
import { useHelpContent } from '@/hooks/UseHelpContent'
import FAQItem from '@/components/faq-item'
import FAQSearch from '@/components/faq-search'

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [searchMode, setSearchMode] = useState(false)
  
  const { items: categories } = useHelpContent()
  const { items: faqItems, loading, error, searchFAQ, markHelpful } = useFAQ({
    categoryId: selectedCategory,
    limit: 100
  })

  // Filter to only FAQ categories (id > 10)
  const faqCategories = categories.filter(cat => cat.display_order > 10)

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header - reduced padding and font size on mobile */}
      <div className="bg-blue-600 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-4xl">
            How Can We Help You?
          </h1>
          <p className="mb-6 text-sm text-blue-100 sm:mb-8 sm:text-base">
            Find answers to common questions about our services, appointments, and care
          </p>
          
          {/* Search Bar - full width on mobile */}
          <div className="w-full">
            <FAQSearch onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Stack sidebar above main content on mobile, grid on larger screens */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          {/* Sidebar - Categories */}
          <aside className="lg:col-span-1">
            {/* Remove sticky on mobile, keep on larger screens */}
            <div className="lg:sticky lg:top-6">
              <h2 className="mb-3 text-base font-semibold text-blue-900 sm:mb-4 sm:text-lg">
                Categories
              </h2>
              
              {/* All Categories button - larger tap target */}
              <button
                onClick={() => {
                  setSelectedCategory(undefined)
                  setSearchMode(false)
                }}
                className={`mb-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors min-h-[44px] ${
                  !selectedCategory && !searchMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-blue-50'
                }`}
              >
                <span className="text-xl sm:text-2xl">📚</span>
                <span className="text-sm font-medium sm:text-base">All Questions</span>
              </button>

              {/* Popular Questions - larger tap target */}
              <button
                onClick={() => {
                  setSelectedCategory(undefined)
                  setSearchMode(false)
                  // TODO: Fetch popular questions
                }}
                className="mb-4 flex w-full items-center gap-3 rounded-lg bg-white px-4 py-3 text-left text-slate-700 transition-colors hover:bg-blue-50 min-h-[44px]"
              >
                <span className="text-xl sm:text-2xl">⭐</span>
                <span className="text-sm font-medium sm:text-base">Popular</span>
              </button>

              {/* Category List - scroll horizontally on very small screens if needed */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto lg:max-h-none">
                {faqCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors min-h-[44px] ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-lg sm:text-xl">{category.icon}</span>
                    <span className="text-xs font-medium sm:text-sm">{category.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content - FAQ Items */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl font-bold text-blue-900 sm:text-2xl">
                {searchMode 
                  ? 'Search Results' 
                  : selectedCategory 
                    ? faqCategories.find(c => c.id === selectedCategory)?.title 
                    : 'Frequently Asked Questions'}
              </h2>
              <p className="mt-1 text-sm text-slate-600 sm:mt-2 sm:text-base">
                {loading ? 'Loading...' : `${faqItems.length} questions found`}
              </p>
            </div>

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center sm:p-6">
                <p className="text-sm text-red-600 sm:text-base">{error}</p>
              </div>
            )}

            {/* Loading State - adjust skeleton sizes */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-white p-4 shadow-sm sm:p-6">
                    <div className="mb-3 h-5 w-3/4 rounded bg-slate-200 sm:mb-4 sm:h-6"></div>
                    <div className="space-y-2">
                      <div className="h-3 rounded bg-slate-200 sm:h-4"></div>
                      <div className="h-3 w-5/6 rounded bg-slate-200 sm:h-4"></div>
                      <div className="h-3 w-4/6 rounded bg-slate-200 sm:h-4"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FAQ Items */}
            {!loading && !error && (
              <div className="space-y-4">
                {faqItems.length === 0 ? (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm sm:p-12">
                    <div className="mb-3 text-5xl sm:mb-4 sm:text-6xl">🔍</div>
                    <h3 className="mb-1 text-lg font-semibold text-blue-900 sm:mb-2 sm:text-xl">
                      No results found
                    </h3>
                    <p className="text-sm text-slate-600 sm:text-base">
                      Try adjusting your search or browse our categories
                    </p>
                  </div>
                ) : (
                  faqItems.map((item) => (
                    <FAQItem 
                      key={item.id} 
                      item={item} 
                      onMarkHelpful={markHelpful}
                    />
                  ))
                )}
              </div>
            )}
          </main>
        </div>

        {/* Contact Section - stacked buttons on mobile */}
        <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white sm:mt-12 sm:p-8">
          <div className="text-center">
            <h2 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">Still Need Help?</h2>
            <p className="mb-5 text-sm text-blue-100 sm:mb-6 sm:text-base">
              Our support team is here to assist you with any questions
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
              <a
                href="tel:+254700123456"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                <span>📞</span>
                <span>Call Us</span>
              </a>
              <a
                href="mailto:support@gch.co.ke"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-white/20 px-6 py-3 font-medium text-white transition-colors hover:bg-white/30"
              >
                <span>📧</span>
                <span>Email Us</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}