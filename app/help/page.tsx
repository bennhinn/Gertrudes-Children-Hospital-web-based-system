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
  
  // Fetch categories for filtering
  const { items: categories } = useHelpContent()
  
  // Fetch FAQ items
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
      {/* Header */}
      <div className="bg-blue-600 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-4 text-4xl font-bold">How Can We Help You?</h1>
          <p className="mb-8 text-blue-100">
            Find answers to common questions about our services, appointments, and care
          </p>
          
          {/* Search Bar */}
          <FAQSearch onSearch={handleSearch} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Categories */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6">
              <h2 className="mb-4 text-lg font-semibold text-blue-900">Categories</h2>
              
              {/* All Categories */}
              <button
                onClick={() => {
                  setSelectedCategory(undefined)
                  setSearchMode(false)
                }}
                className={`mb-2 w-full rounded-lg px-4 py-3 text-left transition-colors ${
                  !selectedCategory && !searchMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <span className="font-medium">All Questions</span>
                </div>
              </button>

              {/* Popular Questions */}
              <button
                onClick={() => {
                  setSelectedCategory(undefined)
                  setSearchMode(false)
                  // TODO: Fetch popular questions
                }}
                className="mb-4 w-full rounded-lg bg-white px-4 py-3 text-left text-slate-700 transition-colors hover:bg-blue-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <span className="font-medium">Popular</span>
                </div>
              </button>

              {/* Category List */}
              <div className="space-y-2">
                {faqCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full rounded-lg px-4 py-3 text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-700 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-sm font-medium">{category.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content - FAQ Items */}
          <main className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-blue-900">
                {searchMode 
                  ? 'Search Results' 
                  : selectedCategory 
                    ? faqCategories.find(c => c.id === selectedCategory)?.title 
                    : 'Frequently Asked Questions'}
              </h2>
              <p className="mt-2 text-slate-600">
                {loading ? 'Loading...' : `${faqItems.length} questions found`}
              </p>
            </div>

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl bg-white p-6 shadow-sm">
                    <div className="mb-4 h-6 w-3/4 rounded bg-slate-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 rounded bg-slate-200"></div>
                      <div className="h-4 w-5/6 rounded bg-slate-200"></div>
                      <div className="h-4 w-4/6 rounded bg-slate-200"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FAQ Items */}
            {!loading && !error && (
              <div className="space-y-4">
                {faqItems.length === 0 ? (
                  <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                    <div className="mb-4 text-6xl">🔍</div>
                    <h3 className="mb-2 text-xl font-semibold text-blue-900">
                      No results found
                    </h3>
                    <p className="text-slate-600">
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

        {/* Contact Section */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold">Still Need Help?</h2>
            <p className="mb-6 text-blue-100">
              Our support team is here to assist you with any questions
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="tel:+254700123456"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                <span>📞</span>
                <span>Call Us</span>
              </a>
              <a
                href="mailto:support@gch.co.ke"
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-6 py-3 font-medium text-white transition-colors hover:bg-white/30"
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