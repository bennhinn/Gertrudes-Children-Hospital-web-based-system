// app/page.tsx (optimized)
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
  Sparkles
} from 'lucide-react'

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
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-pink-50">
      {/* Header - now with scroll-aware styling */}
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-md'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-colors ${
                scrolled
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-white/20 backdrop-blur-sm text-white'
              }`}
            >
              <Hospital className="h-5 w-5" />
            </div>
            <span
              className={`hidden sm:inline text-base sm:text-lg font-bold tracking-tight transition-colors ${
                scrolled ? 'text-blue-900' : 'text-white'
              }`}
            >
              Gertrude's Children Hospital
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <nav className="hidden items-center gap-6 md:flex">
              {['About', 'Services', 'Why Us', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className={`inline-flex items-center h-10 px-2 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    scrolled
                      ? 'text-blue-800 hover:text-blue-600'
                      : 'text-white hover:text-white/80'
                  }`}
                >
                  {item}
                </a>
              ))}
            </nav>
            <MobileMenu scrolled={scrolled} />
            <Link
              href="/login"
              className={`hidden sm:inline-flex items-center h-10 rounded-full px-5 text-sm font-semibold shadow-md transition-all duration-300 hover:shadow-lg group ${
                scrolled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Animated hero (client component) - extends under header */}
      <AnimatedHero />

      {/* Trust Indicators - improved contrast and playful icons */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 bg-[#F8FAFC]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          <TrustCard
            icon={<Shield className="h-7 w-7 text-blue-600" />}
            title="Safe & Secure"
            description="Your family's information is protected with bank-level encryption"
          />
          <TrustCard
            icon={<Calendar className="h-7 w-7 text-blue-600" />}
            title="Easy Scheduling"
            description="Book appointments in seconds, get reminders, never miss a visit"
          />
          <TrustCard
            icon={<MessageSquare className="h-7 w-7 text-blue-600" />}
            title="Stay Connected"
            description="Message your care team and access records anytime"
          />
        </div>
      </section>

      {/* Wave divider (into About - white background) */}
      <div className="-mt-2">
        <WaveDivider color="#ffffff" className="h-12 md:h-24" />
      </div>

      {/* About Section - richer imagery and text contrast */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
              About Us
            </span>
            <h2 className="mb-6 text-3xl font-bold text-blue-900 md:text-4xl">
              Caring for Kenya's Children Since 1947
            </h2>
            <p className="mb-4 leading-relaxed text-slate-700">
              Gertrude's Children Hospital is East Africa's leading pediatric healthcare institution, dedicated to providing comprehensive, compassionate care for children from birth through adolescence.
            </p>
            <p className="mb-6 leading-relaxed text-slate-700">
              Our mission is to deliver exceptional medical care in a child-friendly environment, ensuring every young patient feels safe, comfortable, and supported throughout their healthcare journey.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                  <Heart className="h-5 w-5 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Child-Centered Care</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700">Excellence in Medicine</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-pink-100 p-8">
              <div className="aspect-square rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src="/images/happy-family.jpg"
                    alt="Happy family at Gertrude's Children Hospital"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                    <p className="text-sm font-medium text-white drop-shadow-lg">
                      Families trust us with their most precious ones
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 rounded-xl bg-blue-600 p-4 text-white shadow-lg">
              <p className="text-2xl font-bold">75+</p>
              <p className="text-sm">Years of Care</p>
            </div>
          </div>
        </div>
      </section>

      {/* Wave divider into Locations (slate background) */}
      <div className="-mt-2">
        <WaveDivider color="#F8FAFC" className="h-12 md:h-24" />
      </div>

      {/* Locations Section - improved card hover */}
      <section id="locations" className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
              Our Locations
            </span>
            <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">
              Visit Gertrude's Children's Hospital Today
            </h2>
            <p className="mx-auto max-w-2xl text-slate-700">
              Choose a location near you and book your appointment with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Services Section - brighter icons, better contrast */}
      <section id="services" className="bg-gradient-to-b from-white to-blue-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-pink-100 px-4 py-1.5 text-sm font-medium text-pink-700">
              Our Services
            </span>
            <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">
              Comprehensive Pediatric Care
            </h2>
            <p className="mx-auto max-w-2xl text-slate-700">
              From routine check-ups to specialized treatments, we offer a full range of services designed specifically for children's unique healthcare needs.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ServiceCard
              icon={<Stethoscope className="h-7 w-7" />}
              title="Pediatric Consultation"
              description="Expert consultations with experienced pediatricians for all child health concerns"
            />
            <ServiceCard
              icon={<FlaskConical className="h-7 w-7" />}
              title="Laboratory Services"
              description="State-of-the-art diagnostic testing with child-friendly sample collection"
            />
            <ServiceCard
              icon={<Pill className="h-7 w-7" />}
              title="Pharmacy Services"
              description="Pediatric-formulated medications and professional pharmaceutical guidance"
            />
            <ServiceCard
              icon={<ClipboardList className="h-7 w-7" />}
              title="Reception & Admissions"
              description="Streamlined registration and admission process for stress-free visits"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - playful icons with background */}
      <section id="why-us" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
              Why Choose Us
            </span>
            <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">
              Your Child Deserves the Best Care
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <WhyChooseCard
              icon={<UserCheck className="h-8 w-8" />}
              title="Experienced Specialists"
              description="Our team of board-certified pediatricians brings decades of combined experience in child healthcare."
            />
            <WhyChooseCard
              icon={<Palette className="h-8 w-8" />}
              title="Child-Friendly Facilities"
              description="Colorful, welcoming spaces designed to make children feel comfortable and reduce anxiety."
            />
            <WhyChooseCard
              icon={<Award className="h-8 w-8" />}
              title="Safe & Reliable Care"
              description="Rigorous safety protocols and quality standards ensure your child receives the best possible care."
            />
          </div>
        </div>
      </section>

      {/* Impact Stats Section - already high contrast */}
      <section className="relative overflow-hidden bg-blue-600 px-4 py-16 sm:px-6 sm:py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-white"></div>
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Making a Difference, One Child at a Time
            </h2>
            <p className="mx-auto max-w-2xl text-blue-100">
              Our commitment to pediatric excellence is reflected in the lives we've touched.
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard end={75} suffix="+" label="Years of Service" delay={0} />
            <StatCard end={500} suffix="K+" label="Children Treated" delay={150} />
            <StatCard end={150} suffix="+" label="Pediatric Specialists" delay={300} />
            <StatCard end={98} suffix="%" label="Parent Satisfaction" delay={450} />
          </div>
        </div>
      </section>

      {/* How It Works Section - more vibrant step indicators */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-pink-100 px-4 py-1.5 text-sm font-medium text-pink-700">
              How It Works
            </span>
            <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">
              Your Journey With Us
            </h2>
            <p className="mx-auto max-w-2xl text-slate-700">
              Getting care for your child has never been easier. Follow these simple steps.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-8 hidden h-0.5 w-3/4 -translate-x-1/2 bg-gradient-to-r from-blue-200 via-pink-200 to-blue-200 lg:block"></div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
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

      {/* Testimonials Section - richer cards */}
      <section className="bg-gradient-to-b from-blue-50 to-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
              Testimonials
            </span>
            <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">
              What Parents Say About Us
            </h2>
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

      {/* Contact Section - already high contrast */}
      <section id="contact" className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-blue-700 shadow-xl">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12">
                <h2 className="mb-4 text-3xl font-bold text-white">Need Help or Have Questions?</h2>
                <p className="mb-8 text-blue-100">Our support team is here to assist you. Reach out through any of our channels.</p>
                <div className="space-y-4">
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
                    label="Location"
                    value="Muthaiga, Nairobi, Kenya"
                  />
                  <ContactItem
                    icon={<Clock className="h-5 w-5" />}
                    label="Working Hours"
                    value="24/7 Emergency Services"
                  />
                </div>
              </div>
              <div className="flex items-center justify-center bg-blue-500/30 p-8">
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <Hospital className="h-16 w-16 text-white" />
                  </div>
                  <p className="text-lg font-semibold text-white">Gertrude's Children Hospital</p>
                  <p className="text-blue-100">Always here for your little ones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA - more playful */}
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 text-center">
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-pink-50 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-pink-200/30 blur-2xl"></div>
          <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-blue-200/30 blur-2xl"></div>
          <h2 className="mb-4 text-2xl font-bold text-blue-900">New to our hospital?</h2>
          <p className="mb-6 text-slate-700">
            Creating an account takes less than 2 minutes. We'll guide you through every step.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-4 font-semibold text-white transition-all duration-300 hover:bg-blue-700 hover:shadow-lg hover:scale-105"
          >
            Get Started — It's Free
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* Footer - improved contrast and layout */}
      <footer className="border-t border-slate-200 bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2 font-bold text-blue-900">
              <Hospital className="h-5 w-5" />
              GCH
            </div>
            <p className="text-sm text-slate-600">Leading pediatric care in East Africa since 1947.</p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-blue-900">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="text-slate-600 hover:text-blue-600 transition-colors">Help Center / FAQ</Link></li>
              <li><Link href="/help" className="text-slate-600 hover:text-blue-600 transition-colors">Booking Guide</Link></li>
              <li><Link href="/#contact" className="text-slate-600 hover:text-blue-600 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-blue-900">Portal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="text-slate-600 hover:text-blue-600 transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="text-slate-600 hover:text-blue-600 transition-colors">Register</Link></li>
              <li><Link href="/help" className="text-slate-600 hover:text-blue-600 transition-colors">Medical Records Help</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-blue-900">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-600 hover:text-blue-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Gertrude's Children Hospital.
        </div>
      </footer>
    </main>
  )
}

// Enhanced TrustCard with better hover and contrast
function TrustCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group rounded-xl border border-slate-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 min-h-37.5 flex flex-col">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-100">
        {icon}
      </div>
      <h3 className="mb-3 text-lg font-semibold text-blue-900">{title}</h3>
      <p className="mt-auto text-sm leading-relaxed text-slate-700">{description}</p>
    </div>
  )
}

// ServiceCard with richer icon background
function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-pink-100 text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:from-blue-600 group-hover:to-pink-600 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-blue-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-700">{description}</p>
    </div>
  )
}

// WhyChooseCard with improved contrast
function WhyChooseCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-pink-50 text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:from-blue-600 group-hover:to-pink-600 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-blue-900">{title}</h3>
      <p className="text-slate-700">{description}</p>
    </div>
  )
}

// StepCard with brighter step badge
function StepCard({ step, icon, title, description }: { step: number; icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="relative text-center group">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl">
        {icon}
      </div>
      <div className="absolute -top-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-pink-500 text-xs font-bold text-white shadow-md">
        {step}
      </div>
      <h3 className="mb-2 font-semibold text-blue-900">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  )
}

// TestimonialCard with verified badge contrast fix
function TestimonialCard({ quote, name, role, rating }: { quote: string; name: string; role: string; rating: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="mb-4 flex items-center gap-1">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <div className="mb-4 text-3xl text-pink-300">"</div>
      <p className="mb-6 italic text-slate-700">{quote}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-pink-100">
          <UserCheck className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-blue-900">{name}</p>
          <p className="text-sm text-slate-500">{role}</p>
        </div>
      </div>
      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        <Award className="h-3 w-3" />
        Verified Patient
      </div>
    </div>
  )
}

// ContactItem (unchanged – already good)
function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white">
        {icon}
      </div>
      <div>
        <p className="text-sm text-blue-200">{label}</p>
        <p className="font-medium text-white">{value}</p>
      </div>
    </div>
  )
}

// LocationCard with refined hover and contrast
function LocationCard({ image, name, mapUrl, featured = false }: { image: string; name: string; mapUrl: string; featured?: boolean }) {
  return (
    <a
      href={mapUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative block overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
        featured ? 'sm:col-span-2 sm:row-span-2' : ''
      }`}
    >
      <div
        className={`bg-cover bg-center transition-transform duration-500 group-hover:scale-110 ${
          featured ? 'aspect-[4/3]' : 'aspect-[3/4]'
        }`}
        style={{ backgroundImage: `url('${image}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 transition-all duration-300 group-hover:to-black/70" />

      <div className="absolute bottom-0 left-0 right-0 p-4 transform transition-all duration-300">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-white drop-shadow-md" />
          <span className="text-lg font-semibold text-white drop-shadow-md">{name}</span>
        </div>

        <div className="transform translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            <span>View on Map</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 opacity-0 transform scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100">
        <div className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          Available Today
        </div>
      </div>
    </a>
  )
}