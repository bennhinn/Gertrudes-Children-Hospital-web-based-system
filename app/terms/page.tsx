// app/terms/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import {
    Scale,
    FileText,
    Shield,
    AlertTriangle,
    Ban,
    CreditCard,
    Globe,
    Gavel,
    Mail,
    Phone,
    MapPin,
    ArrowLeft,
    ChevronRight,
    Hospital,
    UserCheck,
    Clock,
} from 'lucide-react'

export const metadata: Metadata = {
    title: 'Terms of Service',
    description:
        "Read the terms and conditions governing your use of Gertrude's Children Hospital digital services.",
}

/* ─── Section wrapper ─────────────────────────────────────────── */
function Section({
    id,
    icon: Icon,
    title,
    children,
}: {
    id: string
    icon: React.ComponentType<{ className?: string }>
    title: string
    children: React.ReactNode
}) {
    return (
        <section id={id} className="scroll-mt-24">
            <div className="flex items-start gap-3 mb-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20">
                    <Icon className="h-4.5 w-4.5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
            </div>
            <div className="pl-12 space-y-4 text-sm leading-relaxed text-slate-600">
                {children}
            </div>
        </section>
    )
}

/* ─── Table of Contents item ──────────────────────────────────── */
function TocItem({ href, label }: { href: string; label: string }) {
    return (
        <li>
            <a
                href={href}
                className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-all hover:bg-emerald-50 hover:text-emerald-700"
            >
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                <span>{label}</span>
            </a>
        </li>
    )
}

/* ─── Page ─────────────────────────────────────────────────────── */
export default function TermsOfServicePage() {
    const effectiveDate = 'January 1, 2026'
    const lastUpdated = 'March 1, 2026'

    return (
        <main id="main-content" className="min-h-screen bg-slate-50/50">
            {/* ── Hero ──────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-linear-to-br from-emerald-600 via-emerald-500 to-teal-500">
                <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

                <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg ring-2 ring-white/20">
                            <Scale className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg ring-2 ring-white/20">
                            <Hospital className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                        Terms of Service
                    </h1>
                    <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">
                        The terms and conditions governing your use of Gertrude&apos;s Children
                        Hospital digital services and patient portal.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                            <FileText className="h-3.5 w-3.5" />
                            Effective: {effectiveDate}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                            Last updated: {lastUpdated}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────────── */}
            <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
                <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
                    {/* Table of Contents — sticky sidebar on lg */}
                    <aside className="lg:sticky lg:top-6 lg:w-64 lg:shrink-0 lg:self-start">
                        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                On this page
                            </p>
                            <nav aria-label="Table of contents">
                                <ul className="space-y-0.5">
                                    <TocItem href="#acceptance" label="Acceptance of Terms" />
                                    <TocItem href="#eligibility" label="Eligibility" />
                                    <TocItem href="#services" label="Description of Services" />
                                    <TocItem href="#accounts" label="User Accounts" />
                                    <TocItem href="#acceptable-use" label="Acceptable Use" />
                                    <TocItem href="#medical-disclaimer" label="Medical Disclaimer" />
                                    <TocItem href="#payments" label="Payments &amp; Billing" />
                                    <TocItem href="#intellectual-property" label="Intellectual Property" />
                                    <TocItem href="#limitation" label="Limitation of Liability" />
                                    <TocItem href="#termination" label="Termination" />
                                    <TocItem href="#governing-law" label="Governing Law" />
                                    <TocItem href="#changes" label="Changes to Terms" />
                                    <TocItem href="#contact" label="Contact Us" />
                                </ul>
                            </nav>
                        </div>
                    </aside>

                    {/* Main content */}
                    <div className="min-w-0 flex-1 space-y-10">
                        {/* Intro card */}
                        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
                            <p className="text-sm leading-relaxed text-slate-600">
                                These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding
                                agreement between you (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or
                                &ldquo;your&rdquo;) and Gertrude&apos;s Children Hospital
                                (&ldquo;GCH,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or
                                &ldquo;us&rdquo;) governing your access to and use of our website, patient
                                portal, mobile applications, and related digital services (collectively,
                                the &ldquo;Services&rdquo;).
                            </p>
                            <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    <strong>Important:</strong> By creating an account or using our Services,
                                    you agree to be bound by these Terms. If you do not agree, please do not
                                    use our Services.
                                </p>
                            </div>
                        </div>

                        {/* 1 — Acceptance */}
                        <Section id="acceptance" icon={FileText} title="1. Acceptance of Terms">
                            <p>
                                By accessing or using the Services, you confirm that you have read,
                                understood, and agree to be bound by these Terms and our{' '}
                                <Link href="/privacy" className="text-blue-600 hover:underline font-medium">
                                    Privacy Policy
                                </Link>
                                , which is incorporated herein by reference.
                            </p>
                            <p>
                                If you are accessing the Services on behalf of a minor child as a parent
                                or legal guardian, you agree to these Terms on their behalf and accept
                                responsibility for their use of the Services.
                            </p>
                        </Section>

                        {/* 2 — Eligibility */}
                        <Section id="eligibility" icon={UserCheck} title="2. Eligibility">
                            <p>To use our Services, you must:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Be at least 18 years of age, or access the Services under the supervision of a parent or legal guardian</li>
                                <li>Provide accurate and complete registration information</li>
                                <li>Have the legal capacity to enter into a binding agreement</li>
                                <li>Be a current or prospective patient, caregiver, or authorized representative at GCH</li>
                            </ul>
                            <p>
                                We reserve the right to refuse service, terminate accounts, or cancel access
                                at our sole discretion if these conditions are not met.
                            </p>
                        </Section>

                        {/* 3 — Description of Services */}
                        <Section id="services" icon={Globe} title="3. Description of Services">
                            <p>GCH provides the following digital services through our platform:</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { title: 'Patient Portal', desc: 'Access health records, lab results, and treatment summaries' },
                                    { title: 'Appointment Booking', desc: 'Schedule, reschedule, and cancel appointments online' },
                                    { title: 'Secure Messaging', desc: 'Communicate with your healthcare team securely' },
                                    { title: 'Billing & Payments', desc: 'View invoices, make payments, and track billing history' },
                                    { title: 'Prescription Management', desc: 'View current prescriptions and request refills' },
                                    { title: 'Notifications', desc: 'Receive reminders, alerts, and health updates' },
                                ].map((service) => (
                                    <div key={service.title} className="rounded-xl bg-slate-50 p-3.5">
                                        <h3 className="font-semibold text-slate-800 mb-0.5">{service.title}</h3>
                                        <p className="text-xs text-slate-500">{service.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <p>
                                We reserve the right to modify, suspend, or discontinue any part of
                                the Services at any time with reasonable notice.
                            </p>
                        </Section>

                        {/* 4 — User Accounts */}
                        <Section id="accounts" icon={Shield} title="4. User Accounts">
                            <p>When creating and maintaining an account, you agree to:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong className="text-slate-800">Accurate information:</strong> Provide truthful, current, and complete information during registration and keep it updated</li>
                                <li><strong className="text-slate-800">Account security:</strong> Maintain the confidentiality of your login credentials and not share your account with others</li>
                                <li><strong className="text-slate-800">Unauthorized access:</strong> Notify us immediately of any unauthorized use of your account or security breach</li>
                                <li><strong className="text-slate-800">Responsibility:</strong> Accept responsibility for all activity that occurs under your account</li>
                            </ul>
                            <p>
                                We may suspend or terminate your account if we suspect unauthorized use,
                                fraudulent activity, or violation of these Terms.
                            </p>
                        </Section>

                        {/* 5 — Acceptable Use */}
                        <Section id="acceptable-use" icon={Ban} title="5. Acceptable Use Policy">
                            <p>You agree not to use the Services to:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Violate any applicable laws, regulations, or third-party rights</li>
                                <li>Submit false, misleading, or fraudulent information</li>
                                <li>Impersonate another person or access another user&apos;s account without authorization</li>
                                <li>Attempt to gain unauthorized access to our systems, networks, or data</li>
                                <li>Interfere with or disrupt the integrity or performance of the Services</li>
                                <li>Upload or transmit malware, viruses, or other harmful code</li>
                                <li>Harvest, scrape, or collect user information without consent</li>
                                <li>Use the Services for any commercial purpose unrelated to your healthcare at GCH</li>
                            </ul>
                            <p>
                                Violation of this policy may result in immediate suspension or termination
                                of your account and may be reported to appropriate authorities.
                            </p>
                        </Section>

                        {/* 6 — Medical Disclaimer */}
                        <Section id="medical-disclaimer" icon={AlertTriangle} title="6. Medical Disclaimer">
                            <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-100">
                                <p className="text-sm text-red-800">
                                    <strong>The Services are not a substitute for professional medical
                                        advice, diagnosis, or treatment.</strong> Always seek the advice of a
                                    qualified healthcare provider with any questions you may have regarding a
                                    medical condition.
                                </p>
                            </div>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>Information provided through the patient portal is for informational purposes and to support — not replace — the doctor-patient relationship</li>
                                <li>In case of a medical emergency, call emergency services immediately or visit the nearest emergency department</li>
                                <li>Secure messaging is not monitored in real-time and should not be used for urgent medical concerns</li>
                                <li>Lab results displayed in the portal should be reviewed with your healthcare provider for proper interpretation</li>
                            </ul>
                        </Section>

                        {/* 7 — Payments & Billing */}
                        <Section id="payments" icon={CreditCard} title="7. Payments &amp; Billing">
                            <p>By using our payment services, you agree to the following:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong className="text-slate-800">Fees:</strong> You are responsible for all charges incurred for medical services rendered at GCH. Fees are displayed in Kenyan Shillings (KES)</li>
                                <li><strong className="text-slate-800">Payment methods:</strong> We accept M-Pesa, credit/debit cards, bank transfers, and insurance. All electronic payments are processed through secure, PCI-DSS compliant providers</li>
                                <li><strong className="text-slate-800">Insurance:</strong> If applicable, we will submit claims to your insurance provider. You are responsible for any co-pays, deductibles, or amounts not covered by insurance</li>
                                <li><strong className="text-slate-800">Refunds:</strong> Refund requests are handled on a case-by-case basis. Approved refunds are processed within 14 business days</li>
                                <li><strong className="text-slate-800">Disputes:</strong> Billing disputes must be raised within 30 days of the invoice date by contacting our billing department</li>
                            </ul>
                        </Section>

                        {/* 8 — Intellectual Property */}
                        <Section id="intellectual-property" icon={Gavel} title="8. Intellectual Property">
                            <p>
                                All content, features, and functionality of the Services — including but
                                not limited to text, graphics, logos, icons, images, software, and design
                                — are owned by or licensed to GCH and are protected by Kenyan and
                                international copyright, trademark, and intellectual property laws.
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>You may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent</li>
                                <li>The GCH name, logo, and all related marks are trademarks of Gertrude&apos;s Children Hospital and may not be used without permission</li>
                                <li>You retain ownership of any personal content you submit (such as feedback), but grant us a non-exclusive license to use it for improving our Services</li>
                            </ul>
                        </Section>

                        {/* 9 — Limitation of Liability */}
                        <Section id="limitation" icon={Shield} title="9. Limitation of Liability">
                            <p>To the maximum extent permitted by Kenyan law:</p>
                            <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                                <p>
                                    <strong className="text-slate-800">No warranty:</strong> The Services are
                                    provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
                                    warranties of any kind, whether express or implied, including warranties
                                    of merchantability, fitness for a particular purpose, or non-infringement.
                                </p>
                                <p>
                                    <strong className="text-slate-800">Liability cap:</strong> GCH shall not
                                    be liable for any indirect, incidental, special, consequential, or
                                    punitive damages arising from your use of the Services, including but not
                                    limited to loss of data, revenue, or profits.
                                </p>
                                <p>
                                    <strong className="text-slate-800">Service availability:</strong> We do
                                    not guarantee uninterrupted, timely, or error-free access to the
                                    Services. Scheduled maintenance and unforeseen circumstances may cause
                                    temporary unavailability.
                                </p>
                            </div>
                            <p>
                                Nothing in these Terms excludes or limits our liability for death or
                                personal injury caused by our negligence, fraud, or any other liability
                                that cannot be excluded by law.
                            </p>
                        </Section>

                        {/* 10 — Termination */}
                        <Section id="termination" icon={Clock} title="10. Termination">
                            <p>
                                Either party may terminate this agreement at any time:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong className="text-slate-800">By you:</strong> You may delete your account at any time through the Settings page or by contacting support. Certain data may be retained as required by healthcare regulations</li>
                                <li><strong className="text-slate-800">By us:</strong> We may suspend or terminate your access if you breach these Terms, engage in fraudulent activity, or if required by law</li>
                            </ul>
                            <p>
                                Upon termination, your right to use the Services ceases immediately.
                                Provisions that by their nature should survive termination (including
                                limitation of liability, intellectual property, and dispute resolution)
                                will remain in effect.
                            </p>
                        </Section>

                        {/* 11 — Governing Law */}
                        <Section id="governing-law" icon={Gavel} title="11. Governing Law &amp; Disputes">
                            <p>
                                These Terms are governed by and construed in accordance with the laws of
                                the Republic of Kenya, without regard to conflict-of-law principles.
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong className="text-slate-800">Dispute resolution:</strong> Any disputes arising from these Terms shall first be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to mediation</li>
                                <li><strong className="text-slate-800">Jurisdiction:</strong> If mediation fails, disputes shall be submitted to the exclusive jurisdiction of the courts of Nairobi, Kenya</li>
                                <li><strong className="text-slate-800">Severability:</strong> If any provision of these Terms is found invalid or unenforceable, the remaining provisions shall continue in full force and effect</li>
                            </ul>
                        </Section>

                        {/* 12 — Changes */}
                        <Section id="changes" icon={FileText} title="12. Changes to These Terms">
                            <p>
                                We reserve the right to modify these Terms at any time. When material
                                changes are made:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>We will update the &ldquo;Last Updated&rdquo; date at the top of this page</li>
                                <li>For significant changes, we will provide notice via email or an in-app notification at least 14 days before the changes take effect</li>
                                <li>Your continued use of the Services after the effective date constitutes acceptance of the revised Terms</li>
                                <li>If you do not agree to the updated Terms, you must discontinue use of the Services and delete your account</li>
                            </ul>
                        </Section>

                        {/* 13 — Contact */}
                        <Section id="contact" icon={Mail} title="13. Contact Us">
                            <p>
                                For questions, concerns, or complaints regarding these Terms, please
                                contact us:
                            </p>
                            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm space-y-4">
                                <div>
                                    <p className="font-semibold text-slate-800">Legal Department</p>
                                    <p className="text-slate-500">Gertrude&apos;s Children Hospital</p>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <Mail className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <a href="mailto:legal@gch.co.ke" className="text-emerald-600 hover:underline">
                                            legal@gch.co.ke
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <a href="tel:+254123456789" className="text-emerald-600 hover:underline">
                                            +254 123 456 789
                                        </a>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>Muthaiga Road, Nairobi, Kenya</span>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </div>
                </div>
            </div>

            {/* ── Footer ────────────────────────────────────────────── */}
            <footer className="border-t border-slate-100 bg-white">
                <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                        <p className="text-xs text-slate-400">
                            &copy; {new Date().getFullYear()} Gertrude&apos;s Children Hospital. All
                            rights reserved.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link
                                href="/privacy"
                                className="text-xs text-slate-500 transition-colors hover:text-emerald-600"
                            >
                                Privacy Policy
                            </Link>
                            <span className="text-slate-200">|</span>
                            <Link
                                href="/help"
                                className="text-xs text-slate-500 transition-colors hover:text-emerald-600"
                            >
                                Help Center
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    )
}
