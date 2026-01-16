"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false)

    // Handle escape key and body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"

            const handleEscape = (e: KeyboardEvent) => {
                if (e.key === "Escape") setIsOpen(false)
            }

            document.addEventListener("keydown", handleEscape)
            return () => {
                document.body.style.overflow = ""
                document.removeEventListener("keydown", handleEscape)
            }
        } else {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    // Close menu when clicking nav links
    const handleLinkClick = () => setIsOpen(false)

    return (
        <div className="sm:hidden">
            {/* Hamburger Button - Only visible on mobile */}
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
                aria-expanded={isOpen}
                className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm text-white transition-all hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Mobile Menu Overlay & Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Menu Panel */}
                    <div
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transition-transform"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mobile menu"
                    >
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                                        <span className="text-xl">🏥</span>
                                    </div>
                                    <span className="text-base font-bold text-blue-900">GCH</span>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    aria-label="Close menu"
                                    className="inline-flex items-center justify-center h-10 w-10 rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-6">
                                {/* Navigation Links */}
                                <nav className="space-y-1">
                                    <a
                                        href="#about"
                                        onClick={handleLinkClick}
                                        className="flex items-center h-14 rounded-xl px-4 text-base font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        <span className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-xl">📖</span>
                                        About
                                    </a>
                                    <a
                                        href="#services"
                                        onClick={handleLinkClick}
                                        className="flex items-center h-14 rounded-xl px-4 text-base font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        <span className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 text-xl">🏥</span>
                                        Services
                                    </a>
                                    <a
                                        href="#why-us"
                                        onClick={handleLinkClick}
                                        className="flex items-center h-14 rounded-xl px-4 text-base font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        <span className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-xl">⭐</span>
                                        Why Us
                                    </a>
                                    <a
                                        href="#contact"
                                        onClick={handleLinkClick}
                                        className="flex items-center h-14 rounded-xl px-4 text-base font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        <span className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-xl">📞</span>
                                        Contact
                                    </a>
                                </nav>

                                {/* Sign In Button - after nav links */}
                                <div className="mt-8">
                                    <Link
                                        href="/login"
                                        onClick={handleLinkClick}
                                        className="flex items-center justify-center h-12 w-full rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-slate-100 px-6 py-4">
                                <p className="text-xs text-center text-slate-500">
                                    Need help? <a href="mailto:support@gch.co.ke" className="text-blue-600 font-medium hover:underline">support@gch.co.ke</a>
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
