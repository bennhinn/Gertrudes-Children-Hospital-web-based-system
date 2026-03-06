// app/privacy/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import {
    Shield,
    Lock,
    Eye,
    Database,
    UserCheck,
    Globe,
    Bell,
    FileText,
    Mail,
    Phone,
    MapPin,
    ArrowLeft,
    ChevronRight,
    Hospital,
} from 'lucide-react'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description:
        "Learn how Gertrude's Children Hospital collects, uses, and protects your personal and health information.",
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
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20">
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
                className="group flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-700"
            >
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
                <span>{label}</span>
            </a>
        </li>
    )
}

/* ─── Page ─────────────────────────────────────────────────────── */
export default function PrivacyPolicyPage() {
    const effectiveDate = 'January 1, 2026'
    const lastUpdated = 'March 1, 2026'

    return (
        <main id="main-content" className="min-h-screen bg-slate-50/50">
            {/* ── Hero ──────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-500 to-cyan-500">
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
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg ring-2 ring-white/20">
                            <Hospital className="h-6 w-6 text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
                        Privacy Policy
                    </h1>
                    <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">
                        Your privacy matters. Learn how we collect, use, and safeguard your personal
                        and health information at Gertrude&apos;s Children Hospital.
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
                                    <TocItem href="#information-we-collect" label="Information We Collect" />
                                    <TocItem href="#how-we-use" label="How We Use Information" />
                                    <TocItem href="#legal-basis" label="Legal Basis" />
                                    <TocItem href="#sharing" label="Information Sharing" />
                                    <TocItem href="#data-security" label="Data Security" />
                                    <TocItem href="#data-retention" label="Data Retention" />
                                    <TocItem href="#your-rights" label="Your Rights" />
                                    <TocItem href="#childrens-privacy" label="Children&rsquo;s Privacy" />
                                    <TocItem href="#cookies" label="Cookies &amp; Tracking" />
                                    <TocItem href="#changes" label="Policy Changes" />
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
                                Gertrude&apos;s Children Hospital (&ldquo;GCH,&rdquo; &ldquo;we,&rdquo;
                                &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting the
                                privacy and security of your personal and health information. This Privacy
                                Policy explains how we collect, use, disclose, and safeguard information
                                when you use our website, mobile applications, patient portal, and related
                                services (collectively, the &ldquo;Services&rdquo;).
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                                By accessing or using our Services, you acknowledge that you have read and
                                understood this Privacy Policy. If you do not agree, please discontinue
                                use of our Services.
                            </p>
                        </div>

                        {/* 1 — Information We Collect */}
                        <Section id="information-we-collect" icon={Database} title="1. Information We Collect">
                            <p>We collect information in the following categories:</p>

                            <div className="space-y-3">
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1.5">Personal Information</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                        <li>Full name, date of birth, gender, and national ID or passport number</li>
                                        <li>Contact details: email address, phone number, and physical address</li>
                                        <li>Emergency contact information</li>
                                        <li>Account credentials (email and encrypted password)</li>
                                        <li>Parent/guardian information for minor patients</li>
                                    </ul>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1.5">Health Information</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                        <li>Medical history, diagnoses, treatment plans, and clinical notes</li>
                                        <li>Laboratory results and diagnostic imaging reports</li>
                                        <li>Prescription and medication records</li>
                                        <li>Immunization records</li>
                                        <li>Allergy information</li>
                                        <li>Insurance and billing information</li>
                                    </ul>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1.5">Technical Information</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                        <li>Device type, operating system, and browser information</li>
                                        <li>IP address and approximate location</li>
                                        <li>Usage patterns, pages visited, and feature interactions</li>
                                        <li>Cookies and similar tracking technologies</li>
                                    </ul>
                                </div>
                            </div>
                        </Section>

                        {/* 2 — How We Use Information */}
                        <Section id="how-we-use" icon={Eye} title="2. How We Use Your Information">
                            <p>We use your information for the following purposes:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong className="text-slate-800">Healthcare delivery:</strong> Providing medical consultations, treatments, diagnoses, and coordinating care between departments</li>
                                <li><strong className="text-slate-800">Appointment management:</strong> Scheduling, rescheduling, and sending reminders for appointments</li>
                                <li><strong className="text-slate-800">Communication:</strong> Sending lab results, prescription updates, and responding to messages</li>
                                <li><strong className="text-slate-800">Billing &amp; payments:</strong> Processing payments, generating invoices, and managing insurance claims</li>
                                <li><strong className="text-slate-800">Service improvement:</strong> Analyzing usage patterns to improve our platform and patient experience</li>
                                <li><strong className="text-slate-800">Safety &amp; compliance:</strong> Detecting fraud, ensuring network security, and complying with legal obligations</li>
                                <li><strong className="text-slate-800">Notifications:</strong> Sending push notifications, emails, and SMS messages about your care</li>
                            </ul>
                        </Section>

                        {/* 3 — Legal Basis */}
                        <Section id="legal-basis" icon={FileText} title="3. Legal Basis for Processing">
                            <p>We process your personal data based on the following legal grounds under the Kenya Data Protection Act, 2019:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong className="text-slate-800">Consent:</strong> You have given explicit consent for the processing of your personal data for specific purposes</li>
                                <li><strong className="text-slate-800">Contractual necessity:</strong> Processing is necessary for the performance of our healthcare services agreement</li>
                                <li><strong className="text-slate-800">Legal obligation:</strong> Processing is required to comply with healthcare laws and regulations in Kenya</li>
                                <li><strong className="text-slate-800">Vital interests:</strong> Processing is necessary to protect the life or health of a patient</li>
                                <li><strong className="text-slate-800">Legitimate interests:</strong> Processing is necessary for our legitimate interests in improving healthcare services, provided your rights are not overridden</li>
                            </ul>
                        </Section>

                        {/* 4 — Information Sharing */}
                        <Section id="sharing" icon={Globe} title="4. Information Sharing &amp; Disclosure">
                            <p>We do not sell your personal information. We may share your data with:</p>

                            <div className="space-y-3">
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1.5">Healthcare Providers</h3>
                                    <p>Authorized doctors, nurses, lab technicians, and pharmacists involved in your or your child&apos;s care within GCH.</p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1.5">Insurance Companies</h3>
                                    <p>For processing claims and verifying coverage, only with your prior authorization.</p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1.5">Service Providers</h3>
                                    <p>Third-party vendors who assist with hosting, analytics, payment processing, and communication services. These parties are contractually bound to protect your data.</p>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1.5">Legal Authorities</h3>
                                    <p>When required by law, court order, or to protect the rights, safety, or property of GCH and our patients.</p>
                                </div>
                            </div>
                        </Section>

                        {/* 5 — Data Security */}
                        <Section id="data-security" icon={Lock} title="5. Data Security">
                            <p>We implement robust technical and organizational measures to protect your information:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong className="text-slate-800">Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                                <li><strong className="text-slate-800">Access controls:</strong> Role-based access ensures only authorized personnel can view your data</li>
                                <li><strong className="text-slate-800">Audit logging:</strong> All access to patient records is logged and monitored</li>
                                <li><strong className="text-slate-800">Regular assessments:</strong> Periodic security audits and vulnerability assessments</li>
                                <li><strong className="text-slate-800">Staff training:</strong> Regular data protection and security training for all staff</li>
                                <li><strong className="text-slate-800">Incident response:</strong> Established procedures for detecting, reporting, and responding to data breaches</li>
                            </ul>
                            <p>
                                While we strive to protect your data, no method of transmission over the
                                internet or electronic storage is 100% secure. We cannot guarantee absolute
                                security but commit to promptly notifying affected individuals and the
                                Office of the Data Protection Commissioner in the event of a breach.
                            </p>
                        </Section>

                        {/* 6 — Data Retention */}
                        <Section id="data-retention" icon={Database} title="6. Data Retention">
                            <p>We retain your information for the following periods:</p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li><strong className="text-slate-800">Medical records:</strong> Retained in accordance with Kenyan healthcare regulations — a minimum of 10 years after the last treatment, or until the patient turns 25 (whichever is later) for minors</li>
                                <li><strong className="text-slate-800">Account data:</strong> Retained for the duration of your account and up to 2 years after account closure</li>
                                <li><strong className="text-slate-800">Billing records:</strong> Retained for a minimum of 7 years as required by tax regulations</li>
                                <li><strong className="text-slate-800">Technical logs:</strong> Retained for up to 12 months for security and performance monitoring</li>
                            </ul>
                            <p>
                                After the retention period, data is securely deleted or anonymized so it can
                                no longer be linked to you.
                            </p>
                        </Section>

                        {/* 7 — Your Rights */}
                        <Section id="your-rights" icon={UserCheck} title="7. Your Rights">
                            <p>Under the Kenya Data Protection Act, 2019, you have the right to:</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { title: 'Access', desc: 'Request a copy of the personal data we hold about you' },
                                    { title: 'Rectification', desc: 'Request correction of inaccurate or incomplete data' },
                                    { title: 'Erasure', desc: 'Request deletion of your data, subject to legal retention requirements' },
                                    { title: 'Restriction', desc: 'Request limitation of processing in certain circumstances' },
                                    { title: 'Portability', desc: 'Receive your data in a structured, machine-readable format' },
                                    { title: 'Objection', desc: 'Object to processing based on legitimate interests' },
                                ].map((right) => (
                                    <div key={right.title} className="rounded-xl bg-slate-50 p-3.5">
                                        <h3 className="font-semibold text-slate-800 mb-0.5">{right.title}</h3>
                                        <p className="text-xs text-slate-500">{right.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <p>
                                To exercise any of these rights, please contact our Data Protection Officer
                                using the details in the &ldquo;Contact Us&rdquo; section below. We will
                                respond within 30 days of receiving your request.
                            </p>
                        </Section>

                        {/* 8 — Children's Privacy */}
                        <Section id="childrens-privacy" icon={Shield} title="8. Children&rsquo;s Privacy">
                            <p>
                                As a pediatric hospital, the protection of children&apos;s data is of
                                paramount importance to us. We collect children&apos;s health information
                                solely for the purpose of providing medical care under the supervision of
                                a parent or legal guardian.
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>We require parental or guardian consent before collecting personal data from children under 18</li>
                                <li>Parents and guardians can review, modify, or request deletion of their child&apos;s data at any time</li>
                                <li>Children&apos;s data is subject to the highest level of access controls and encryption</li>
                                <li>We do not use children&apos;s data for marketing or advertising purposes</li>
                            </ul>
                        </Section>

                        {/* 9 — Cookies */}
                        <Section id="cookies" icon={Globe} title="9. Cookies &amp; Tracking Technologies">
                            <p>Our Services use cookies and similar technologies for the following purposes:</p>
                            <div className="space-y-3">
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1">Essential Cookies</h3>
                                    <p>Required for authentication, security, and basic functionality. Cannot be disabled.</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1">Functional Cookies</h3>
                                    <p>Remember your preferences such as language, theme, and notification settings.</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <h3 className="font-semibold text-slate-800 mb-1">Analytics Cookies</h3>
                                    <p>Help us understand how you use our Services so we can improve the experience. No personally identifiable information is shared with analytics providers.</p>
                                </div>
                            </div>
                            <p>
                                You can manage cookie preferences through your browser settings. Note that
                                disabling essential cookies may impact the functionality of our Services.
                            </p>
                        </Section>

                        {/* 10 — Changes */}
                        <Section id="changes" icon={Bell} title="10. Changes to This Policy">
                            <p>
                                We may update this Privacy Policy from time to time to reflect changes in
                                our practices, technology, legal requirements, or other factors. When we
                                make material changes:
                            </p>
                            <ul className="list-disc pl-5 space-y-1.5">
                                <li>We will post the updated policy on this page with a new &ldquo;Last Updated&rdquo; date</li>
                                <li>For significant changes, we will notify you via email or an in-app notification</li>
                                <li>Continued use of our Services after changes are posted constitutes acceptance of the updated policy</li>
                            </ul>
                        </Section>

                        {/* 11 — Contact */}
                        <Section id="contact" icon={Mail} title="11. Contact Us">
                            <p>
                                If you have questions about this Privacy Policy, wish to exercise your
                                data rights, or want to file a complaint, please contact us:
                            </p>
                            <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm space-y-4">
                                <div>
                                    <p className="font-semibold text-slate-800">Data Protection Officer</p>
                                    <p className="text-slate-500">Gertrude&apos;s Children Hospital</p>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                                        <a href="mailto:privacy@gch.co.ke" className="text-blue-600 hover:underline">
                                            privacy@gch.co.ke
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <Phone className="h-4 w-4 text-blue-500 shrink-0" />
                                        <a href="tel:+254123456789" className="text-blue-600 hover:underline">
                                            +254 123 456 789
                                        </a>
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <MapPin className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                        <span>Muthaiga Road, Nairobi, Kenya</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">
                                You also have the right to lodge a complaint with the Office of the Data
                                Protection Commissioner of Kenya (ODPC) at{' '}
                                <a
                                    href="https://www.odpc.go.ke"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                >
                                    www.odpc.go.ke
                                </a>
                                .
                            </p>
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
                                href="/terms"
                                className="text-xs text-slate-500 transition-colors hover:text-blue-600"
                            >
                                Terms of Service
                            </Link>
                            <span className="text-slate-200">|</span>
                            <Link
                                href="/help"
                                className="text-xs text-slate-500 transition-colors hover:text-blue-600"
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
