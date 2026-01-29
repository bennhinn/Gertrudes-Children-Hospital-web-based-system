// components/faq-item.tsx
'use client'

import { useState } from 'react'

interface FAQItemProps {
  item: {
    id: number
    question: string
    answer: string
    tags: string[]
    views_count: number
    helpful_count: number
    category_icon: string
    category_title: string
  }
  onMarkHelpful: (id: number, helpful: boolean, feedback?: string) => Promise<void>
}

export default function FAQItem({ item, onMarkHelpful }: FAQItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')

  const handleHelpful = async (helpful: boolean) => {
    await onMarkHelpful(item.id, helpful)
    setFeedbackGiven(true)
    
    if (!helpful) {
      setShowFeedbackForm(true)
    }
  }

  const handleSubmitFeedback = async () => {
    if (feedbackText.trim()) {
      await onMarkHelpful(item.id, false, feedbackText)
      setShowFeedbackForm(false)
      setFeedbackText('')
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Question Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{item.category_icon}</span>
            <div>
              <h3 className="font-semibold text-blue-900 leading-relaxed">
                {item.question}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">
                  {item.category_title}
                </span>
                {item.views_count > 10 && (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    👁️ {item.views_count} views
                  </span>
                )}
              </div>
            </div>
          </div>
          <svg
            className={`h-6 w-6 flex-shrink-0 text-blue-600 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Answer Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-6 py-5">
          {/* Answer Text */}
          <div className="prose prose-blue max-w-none">
            <p className="whitespace-pre-line text-slate-700 leading-relaxed">
              {item.answer}
            </p>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Feedback Section */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            {!feedbackGiven ? (
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">
                  Was this helpful?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleHelpful(true)}
                    className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                  >
                    <span>👍</span>
                    <span>Yes</span>
                  </button>
                  <button
                    onClick={() => handleHelpful(false)}
                    className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                  >
                    <span>👎</span>
                    <span>No</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-green-50 px-4 py-3">
                <p className="text-sm font-medium text-green-700">
                  ✓ Thank you for your feedback!
                </p>
              </div>
            )}

            {/* Feedback Form */}
            {showFeedbackForm && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  How can we improve this answer?
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Your feedback helps us improve..."
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleSubmitFeedback}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowFeedbackForm(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}