"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import WaveDivider from '@/components/wave-divider'

export default function AnimatedHero() {
    return (
        <section className="relative mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden">
            {/* very slow, subtle background scale on load (optional enhancement) */}
            <motion.div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/hero-bg.png')" }}
                initial={{ scale: 1 }}
                animate={{ scale: 1.03 }}
                transition={{ duration: 20, ease: 'easeOut' }}
                aria-hidden
            />

            <div className="absolute inset-0 z-10 bg-black/35" />

            <motion.div
                className="relative z-20 mx-auto max-w-4xl text-center"
                initial="hidden"
                animate="show"
                variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.12, delayChildren: 0.06 } }
                }}
            >
                <motion.div
                    className="mb-6 inline-block rounded-full bg-pink-100/90 px-4 py-1.5 text-sm font-medium text-pink-700 backdrop-blur-sm"
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }}
                >
                    Trusted by 10,000+ families
                </motion.div>

                <motion.h1
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }}
                    className="mb-6 text-3xl sm:text-4xl font-bold leading-tight text-white [text-shadow:0_2px_4px_rgb(0_0_0/20%)] md:text-5xl"
                >
                    {"Your child's health,"} <br className="hidden md:block" />
                    <span className="text-pink-300">in caring hands</span>
                </motion.h1>

                <motion.p
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }}
                    className="mx-auto mb-8 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-200 [text-shadow:0_1px_2px_rgb(0_0_0/20%)]"
                >
                    {"Book appointments, track your child's care journey, and stay connected with our medical team — all in one secure place."}
                </motion.p>

                <motion.div
                    variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }}
                    className="flex flex-col justify-center gap-4 sm:flex-row"
                >
                    <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.15 }} style={{ display: 'inline-block' }}>
                        <Link href="/register" className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-blue-600 px-6 py-3 sm:px-8 sm:py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-linear-to-r hover:from-pink-500 hover:to-blue-600 hover:shadow-xl" style={{ color: '#ffffff' }}>
                            Create Your Account
                            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </motion.div>

                    <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ duration: 0.15 }} style={{ display: 'inline-block' }}>
                        <Link href="/login" className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl border-2 border-white/40 bg-white/5 px-6 py-3 sm:px-8 sm:py-4 text-sm font-semibold tracking-wide text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-transparent hover:bg-linear-to-r hover:from-pink-500 hover:to-blue-600" style={{ color: '#ffffff' }}>
                            I already have an account
                        </Link>
                    </motion.div>
                </motion.div>
            </motion.div>

            <div className="absolute bottom-0 left-0 right-0 z-20">
                {/* Shared WaveDivider for consistent separators */}
                <WaveDivider color="#F8FAFC" className="h-12 md:h-24" />
            </div>
        </section>
    )
}
