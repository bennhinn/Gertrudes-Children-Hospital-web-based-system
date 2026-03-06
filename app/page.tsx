// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AnimatedNumber from '@/components/animated-number'
import StatCard from '@/components/stat-card'
import AnimatedHero from '@/components/hero-animated'
import WaveDivider from '@/components/wave-divider'
import MobileMenu from '@/components/mobile-menu'
import {
  Hospital,
  Shield,
  Calendar,
  MessageSquare,
  Stethoscope,
  FlaskConical,
  Pill,
  ClipboardList,
  UserCheck,
  Palette,
  Award,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Star,
  Heart,
  Sparkles,
  ChevronRight
} from 'lucide-react'

/* ─── Page ─────────────────────────────────────────────────────── */
export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main id="main-content" className="min-h-screen bg-white">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        role="banner"
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-b border-slate-100'
          : 'bg-transparent'
          }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 min-h-0">
            <div
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-all duration-300 ${scrolled
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/15 backdrop-blur-md text-white ring-1 ring-white/20'
                }`}
            >
              <Hospital className="h-5 w-5" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span
                className={`text-[15px] font-bold leading-tight tracking-tight transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-white'
                  }`}
              >
                Gertrude&rsquo;s Children Hospital
              </span>
              <span
                className={`text-[11px] font-medium tracking-wide uppercase transition-colors duration-300 ${scrolled ? 'text-slate-400' : 'text-white/60'
                  }`}
              >
                Pediatric Excellence
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Nav */}
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
              {['About', 'Services', 'Why Us', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className={`inline-flex items-center h-9 rounded-lg px-3 text-[13px] font-medium transition-all duration-200 ${scrolled
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {item}
                </a>
              ))}
            </nav>

            <MobileMenu scrolled={scrolled} />

            {/* CTA Button */}
            <Link
              href="/login"
              className={`hidden sm:inline-flex items-center gap-1.5 h-9 rounded-lg px-4 text-[13px] font-semibold transition-all duration-300 ${scrolled
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/25'
                : 'bg-white text-blue-700 hover:bg-white/95 shadow-lg shadow-black/10'
                }`}
            >
              <span>Sign In</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <AnimatedHero />

      {/* ── Trust Indicators ────────────────────────────────────── */}
      <section className="relative bg-slate-50" aria-label="Why families trust us">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:items-stretch">
            <TrustCard
              icon={<Shield className="h-6 w-6 text-blue-600" />}
              title="Safe & Secure"
              description="Your family's information is protected with bank-level encryption and HIPAA-grade privacy controls."
            />
            <TrustCard
              icon={<Calendar className="h-6 w-6 text-blue-600" />}
              title="Easy Scheduling"
              description="Book appointments in seconds, get automatic reminders, and never miss a visit again."
            />
            <TrustCard
              icon={<MessageSquare className="h-6 w-6 text-blue-600" />}
              title="Stay Connected"
              description="Message your care team directly and access health records anytime, anywhere."
            />
          </div>
        </div>
      </section>

      {/* Wave → About */}
      <div className="-mt-1">
        <WaveDivider color="#ffffff" className="h-10 md:h-20" />
      </div>

      {/* ── About Section ───────────────────────────────────────── */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 md:items-center lg:gap-20">
          {/* Text */}
          <div>
            <SectionBadge color="blue">About Us</SectionBadge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Caring for Kenya&rsquo;s Children Since 1947
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600">
              Gertrude&rsquo;s Children Hospital is East Africa&rsquo;s leading pediatric healthcare institution, dedicated to providing comprehensive, compassionate care for children from birth through adolescence.
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Our mission is to deliver exceptional medical care in a child-friendly environment, ensuring every young patient feels safe, comfortable, and supported throughout their healthcare journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 ring-1 ring-pink-100">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Child-Centered Care</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Excellence in Medicine</span>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl bg-linear-to-br from-blue-50 via-white to-pink-50 p-3 ring-1 ring-slate-100">
              <div className="aspect-4/3 overflow-hidden rounded-2xl">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/happy-family.jpg"
                    alt="Happy family at Gertrude's Children Hospital"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900/30 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-sm font-medium text-white drop-shadow-md">
                      Families trust us with their most precious ones
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Stats badge */}
            <div className="absolute -bottom-5 -right-2 sm:-right-5 rounded-2xl bg-blue-600 px-5 py-4 text-white shadow-xl shadow-blue-600/25 ring-4 ring-white">
              <p className="text-2xl font-extrabold leading-none">75+</p>
              <p className="mt-1 text-xs font-medium text-blue-100">Years of Care</p>
            </div>
          </div>
        </div>
      </section>

      {/* Wave → Locations */}
      <div className="-mt-1">
        <WaveDivider color="#F8FAFC" className="h-10 md:h-20" />
      </div>

      {/* ── Locations ───────────────────────────────────────────── */}
      <section id="locations" className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <SectionBadge color="blue">Our Locations</SectionBadge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Visit Gertrude&rsquo;s Children&rsquo;s Hospital Today
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              Choose a location near you and book your appointment with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LocationCard
              image="/images/locations/Muthaiga.jpg"
              name="Muthaiga"
              mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Muthaiga+Nairobi+Kenya"
              featured={true}
            />
            <LocationCard
              image="/images/locations/Lavington.jpg"
              name="Lavington"
              mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Lavington+Nairobi+Kenya"
            />
            <LocationCard
              image="/images/locations/Karen.jpg"
              name="Karen"
              mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Karen+Nairobi+Kenya"
            />
            <LocationCard
              image="/images/locations/village-market.jpeg"
              name="Village Market"
              mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Village+Market+Nairobi+Kenya"
            />
            <LocationCard
              image="/images/locations/Mlolongo.jpg"
              name="Mlolongo"
              mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Mlolongo+Kenya"
            />
            <LocationCard
              image="/images/locations/Mimosa.jpg"
              name="Mimosa"
              mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Mimosa+Nairobi+Kenya"
            />
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────── */}
      <section id="services" className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <SectionBadge color="pink">Our Services</SectionBadge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Comprehensive Pediatric Care
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              From routine check-ups to specialized treatments, we offer a full range of services designed specifically for children&rsquo;s unique healthcare needs.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <ServiceCard
              icon={<Stethoscope className="h-6 w-6" />}
              title="Pediatric Consultation"
              description="Expert consultations with experienced pediatricians for all child health concerns"
            />
            <ServiceCard
              icon={<FlaskConical className="h-6 w-6" />}
              title="Laboratory Services"
              description="State-of-the-art diagnostic testing with child-friendly sample collection"
            />
            <ServiceCard
              icon={<Pill className="h-6 w-6" />}
              title="Pharmacy Services"
              description="Pediatric-formulated medications and professional pharmaceutical guidance"
            />
            <ServiceCard
              icon={<ClipboardList className="h-6 w-6" />}
              title="Reception & Admissions"
              description="Streamlined registration and admission process for stress-free visits"
            />
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ───────────────────────────────────────── */}
      <section id="why-us" className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <SectionBadge color="blue">Why Choose Us</SectionBadge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Your Child Deserves the Best Care
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
              Three pillars that set us apart from every other healthcare provider.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <WhyChooseCard
              icon={<UserCheck className="h-7 w-7" />}
              title="Experienced Specialists"
              description="Our team of board-certified pediatricians brings decades of combined experience in child healthcare."
            />
            <WhyChooseCard
              icon={<Palette className="h-7 w-7" />}
              title="Child-Friendly Facilities"
              description="Colorful, welcoming spaces designed to make children feel comfortable and reduce anxiety."
            />
            <WhyChooseCard
              icon={<Award className="h-7 w-7" />}
              title="Safe & Reliable Care"
              description="Rigorous safety protocols and quality standards ensure your child receives the best possible care."
            />
          </div>
        </div>
      </section>

      {/* ── Impact Stats ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 px-4 py-16 sm:px-6 sm:py-24 lg:px-8" aria-label="Our impact">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-blue-400/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Making a Difference, One Child at a Time
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-blue-100/80">
              Our commitment to pediatric excellence is reflected in the lives we&rsquo;ve touched.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard end={75} suffix="+" label="Years of Service" delay={0} />
            <StatCard end={500} suffix="K+" label="Children Treated" delay={150} />
            <StatCard end={150} suffix="+" label="Pediatric Specialists" delay={300} />
            <StatCard end={98} suffix="%" label="Parent Satisfaction" delay={450} />
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8" aria-label="How it works">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <SectionBadge color="pink">How It Works</SectionBadge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Your Journey With Us
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              Getting care for your child has never been easier. Follow these simple steps.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-1/2 top-8 hidden h-px w-[70%] -translate-x-1/2 lg:block" aria-hidden="true">
              <div className="h-full w-full bg-linear-to-r from-transparent via-blue-200 to-transparent" />
            </div>

            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-6">
              <StepCard
                step={1}
                icon={<ClipboardList className="h-6 w-6" />}
                title="Register"
                description="Create your caregiver account in minutes"
              />
              <StepCard
                step={2}
                icon={<Calendar className="h-6 w-6" />}
                title="Book Appointment"
                description="Choose a convenient date and time"
              />
              <StepCard
                step={3}
                icon={<MessageSquare className="h-6 w-6" />}
                title="Receive QR Code"
                description="Get your unique appointment QR code"
              />
              <StepCard
                step={4}
                icon={<Hospital className="h-6 w-6" />}
                title="Visit Hospital"
                description="Check in quickly with your QR code"
              />
              <StepCard
                step={5}
                icon={<Heart className="h-6 w-6" />}
                title="Get Care"
                description="Your child receives expert attention"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-24 lg:px-8" aria-label="Testimonials">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <SectionBadge color="blue">Testimonials</SectionBadge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              What Parents Say About Us
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-slate-600">
              Real stories from real families who trust us with their children&rsquo;s health.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <TestimonialCard
              quote="The doctors were incredibly patient with my anxious toddler. We felt so cared for throughout our visit."
              name="Sarah M."
              role="Mother of 2"
              rating={5}
            />
            <TestimonialCard
              quote="The online booking system saved us so much time. No more long waits! Highly recommend this hospital."
              name="James K."
              role="Father of 3"
              rating={5}
            />
            <TestimonialCard
              quote="From reception to pharmacy, every staff member was friendly and professional. Best pediatric care in Nairobi!"
              name="Grace W."
              role="Mother of 1"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────── */}
      <section id="contact" className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 shadow-2xl shadow-blue-900/20">
            <div className="grid md:grid-cols-5">
              {/* Info */}
              <div className="p-8 md:col-span-3 md:p-12 lg:p-16">
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Need Help or Have Questions?
                </h2>
                <p className="mt-3 text-base text-blue-100/80">
                  Our support team is here to assist you. Reach out through any of our channels.
                </p>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <ContactItem
                    icon={<Phone className="h-5 w-5" />}
                    label="Emergency Line"
                    value="+254 700 123 456"
                  />
                  <ContactItem
                    icon={<Mail className="h-5 w-5" />}
                    label="Email Support"
                    value="support@gch.co.ke"
                  />
                  <ContactItem
                    icon={<MapPin className="h-5 w-5" />}
                    label="Main Location"
                    value="Muthaiga, Nairobi, Kenya"
                  />
                  <ContactItem
                    icon={<Clock className="h-5 w-5" />}
                    label="Working Hours"
                    value="24/7 Emergency Services"
                  />
                </div>
              </div>

              {/* Brand panel */}
              <div className="hidden md:col-span-2 md:flex items-center justify-center bg-white/5 backdrop-blur-sm p-8">
                <div className="text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                    <Hospital className="h-10 w-10 text-white" />
                  </div>
                  <p className="mt-5 text-lg font-bold text-white">Gertrude&rsquo;s Children Hospital</p>
                  <p className="mt-1 text-sm text-blue-200/70">Always here for your little ones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-label="Get started">
        <div className="mx-auto max-w-2xl text-center">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-50 via-white to-pink-50 p-8 ring-1 ring-slate-100 sm:p-12">
            {/* Decorative blurs */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-pink-200/40 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" aria-hidden="true" />

            <div className="relative">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                New to our hospital?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base text-slate-600">
                Creating an account takes less than 2 minutes. We&rsquo;ll guide you through every step.
              </p>
              <Link
                href="/register"
                className="group mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98]"
              >
                Get Started — It&rsquo;s Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8" role="contentinfo">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Hospital className="h-4.5 w-4.5" />
                </div>
                <span className="text-[15px] font-bold text-slate-900">GCH</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-500">
                Leading pediatric care in East Africa since 1947. Trusted by thousands of families.
              </p>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Support</h4>
              <ul className="mt-4 space-y-3">
                <li><Link href="/help" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Help Center / FAQ</Link></li>
                <li><Link href="/help" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Booking Guide</Link></li>
                <li><Link href="/#contact" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Contact Us</Link></li>
              </ul>
            </div>

            {/* Portal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Portal</h4>
              <ul className="mt-4 space-y-3">
                <li><Link href="/login" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Sign In</Link></li>
                <li><Link href="/register" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Register</Link></li>
                <li><Link href="/help" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Medical Records Help</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</h4>
              <ul className="mt-4 space-y-3">
                <li><Link href="/privacy" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-slate-600 transition-colors hover:text-blue-600">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-100 pt-8 text-center">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Gertrude&rsquo;s Children Hospital. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ─── Sub-components ───────────────────────────────────────────── */

/** Reusable section badge */
function SectionBadge({ children, color }: { children: React.ReactNode; color: 'blue' | 'pink' }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
    pink: 'bg-pink-50 text-pink-700 ring-1 ring-pink-100',
  }
  return (
    <span className={`inline-block rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider ${styles[color]}`}>
      {children}
    </span>
  )
}

/** Trust indicator card */
function TrustCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group flex flex-col rounded-2xl bg-white p-7 ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-100 transition-colors duration-300 group-hover:bg-blue-600 group-hover:ring-blue-600 group-hover:text-white [&>svg]:transition-colors [&>svg]:duration-300 [&>svg]:group-hover:text-white">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-auto text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  )
}

/** Service card */
function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group flex flex-col rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-100 transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 hover:ring-slate-200">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-600/30">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-auto text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  )
}

/** Why choose us card */
function WhyChooseCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group rounded-2xl bg-white p-8 text-center ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-blue-600/25">
        {icon}
      </div>
      <h3 className="mb-3 text-lg font-bold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  )
}

/** Step card with number badge */
function StepCard({ step, icon, title, description }: { step: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative text-center group">
      <div className="relative mx-auto mb-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-blue-600/30">
          {icon}
        </div>
        {/* Step number */}
        <div className="absolute -right-1 -top-1 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
          {step}
        </div>
      </div>
      <h3 className="mb-1.5 text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  )
}

/** Testimonial card */
function TestimonialCard({ quote, name, role, rating }: { quote: string; name: string; role: string; rating: number }) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-7 ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5">
      {/* Stars */}
      <div className="mb-4 flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="mb-6 flex-1">
        <p className="text-sm leading-relaxed text-slate-600 italic">&ldquo;{quote}&rdquo;</p>
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 border-t border-slate-50 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
          <UserCheck className="h-4.5 w-4.5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-400">{role}</p>
        </div>
      </div>

      {/* Verified badge */}
      <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
        <Award className="h-3 w-3" />
        Verified Patient
      </div>
    </div>
  )
}

/** Contact detail item */
function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/10">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-blue-200/70">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  )
}

/** Location card with hover reveal */
function LocationCard({ image, name, mapUrl, featured = false }: { image: string; name: string; mapUrl: string; featured?: boolean }) {
  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View ${name} location on Google Maps`}
      className={`group relative block overflow-hidden rounded-2xl ring-1 ring-slate-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-300/30 hover:-translate-y-1 ${featured ? 'sm:col-span-2 sm:row-span-2' : ''
        }`}
    >
      <div
        className={`bg-cover bg-center transition-transform duration-500 group-hover:scale-105 ${featured ? 'aspect-4/3' : 'aspect-3/4'
          }`}
        style={{ backgroundImage: `url('${image}')` }}
        role="img"
        aria-label={`Photo of ${name} branch`}
      />
      <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 via-slate-900/10 to-transparent transition-all duration-300" />

      <div className="absolute bottom-0 left-0 right-0 p-5 transition-all duration-300">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-white/80" />
          <span className="text-base font-bold text-white">{name}</span>
        </div>

        <div className="translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-900 shadow-lg">
            View on Map
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="absolute right-3 top-3 scale-90 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
        <span className="inline-block rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
          Open Now
        </span>
      </div>
    </a>
  )
}