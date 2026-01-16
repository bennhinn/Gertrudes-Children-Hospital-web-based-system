import Link from 'next/link'
import AnimatedNumber from '@/components/animated-number'
import StatCard from '@/components/stat-card'
import AnimatedHero from '@/components/hero-animated'
import WaveDivider from '@/components/wave-divider'
import MobileMenu from '@/components/mobile-menu'

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-b from-blue-50 via-white to-pink-50">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-60 bg-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 sm:py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-lg">🏥</span>
            </div>
            <span className="hidden sm:inline text-base sm:text-lg font-bold tracking-tight text-white">{"Gertrude's Children Hospital"}</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <nav className="hidden items-center gap-6 md:flex">
              <a href="#about" className="inline-flex items-center h-10 px-2 text-sm font-medium text-white transition-all duration-200 hover:text-white" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>About</a>
              <a href="#services" className="inline-flex items-center h-10 px-2 text-sm font-medium text-white transition-all duration-200 hover:text-white" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>Services</a>
              <a href="#why-us" className="inline-flex items-center h-10 px-2 text-sm font-medium text-white transition-all duration-200 hover:text-white" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>Why Us</a>
              <a href="#contact" className="inline-flex items-center h-10 px-2 text-sm font-medium text-white transition-all duration-200 hover:text-white" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>Contact</a>
            </nav>
            <MobileMenu />
            <Link href="/login" className="hidden sm:inline-flex items-center h-10 rounded-full bg-white px-5 text-sm font-semibold shadow-md transition-all duration-300 hover:bg-linear-to-r hover:from-pink-400 hover:to-blue-600 hover:shadow-lg group">
              <span className="text-blue-600 transition-colors duration-200 group-hover:text-white">Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Animated hero (client component) - extends under header */}
      <AnimatedHero />

      {/* Trust Indicators */}
      <section className="mx-auto max-w-7xl px-6 py-16 bg-[#F8FAFC]">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:items-stretch">
          <TrustCard icon="🔒" title="Safe & Secure" description="Your family's information is protected with bank-level encryption" />
          <TrustCard icon="📅" title="Easy Scheduling" description="Book appointments in seconds, get reminders, never miss a visit" />
          <TrustCard icon="💬" title="Stay Connected" description="Message your care team and access records anytime" />
        </div>
      </section>

      {/* Wave divider (into About - white background) */}
      <div className="-mt-2">
        <WaveDivider color="#ffffff" className="h-12 md:h-24" />
      </div>


      {/* About Section */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">About Us</span>
            <h2 className="mb-6 text-3xl font-bold text-blue-900 md:text-4xl">Caring for Kenya's Children Since 1947</h2>
            <p className="mb-4 leading-relaxed text-slate-600">Gertrude's Children Hospital is East Africa's leading pediatric healthcare institution, dedicated to providing comprehensive, compassionate care for children from birth through adolescence.</p>
            <p className="mb-6 leading-relaxed text-slate-600">Our mission is to deliver exceptional medical care in a child-friendly environment, ensuring every young patient feels safe, comfortable, and supported throughout their healthcare journey.</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100"><span className="text-lg">❤️</span></div>
                <span className="text-sm font-medium text-slate-700">Child-Centered Care</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100"><span className="text-lg">🌟</span></div>
                <span className="text-sm font-medium text-slate-700">Excellence in Medicine</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl bg-linear-to-br from-blue-100 to-pink-100 p-8">
              <div className="aspect-square rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl">👨‍👩‍👧‍👦</span>
                  <p className="mt-4 text-sm text-slate-600">Families trust us with their most precious ones</p>
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


      {/* Locations Section */}
      <section id="locations" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          {/* Move heading above the grid so both columns align */}
          <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">Visit Gertrude's Children's Hospital today</h2>
          <p className="mb-8 text-slate-600">Learn more about Gertrude's Children's Hospital locations or choose a specific location near you.</p>

          <div className="grid gap-8 lg:grid-cols-5 lg:items-stretch">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <LocationCard image="/images/locations/Muthaiga.jpg" name="Muthaiga" mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Muthaiga+Nairobi+Kenya" />
                <LocationCard image="/images/locations/Lavington.jpg" name="Lavington" mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Lavington+Nairobi+Kenya" />
                <LocationCard image="/images/locations/Karen.jpg" name="Karen" mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Karen+Nairobi+Kenya" />
                <LocationCard image="/images/locations/village-market.jpeg" name="Village Market" mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Village+Market+Nairobi+Kenya" />
                <LocationCard image="/images/locations/Mlolongo.jpg" name="Mlolongo" mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Mlolongo+Kenya" />
                <LocationCard image="/images/locations/Mimosa.jpg" name="Mimosa" mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Mimosa+Nairobi+Kenya" />
              </div>
            </div>

            <div className="relative hidden lg:block lg:col-span-2">
              <div className="h-full overflow-hidden rounded-3xl bg-linear-to-br from-teal-400 to-cyan-500">
                <div
                  className="relative h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: "url('/images/locations/featured-child.jpg')" }}
                >
                  <div className="flex h-full w-full flex-col justify-end bg-linear-to-t from-black/30 to-transparent p-6">
                    <Link href="/register" className="inline-flex w-fit items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-cyan-500 hover:shadow-xl">
                      <span>Book Appointment</span>
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-linear-to-b from-white to-blue-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-pink-100 px-4 py-1.5 text-sm font-medium text-pink-700">Our Services</span>
            <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">Comprehensive Pediatric Care</h2>
            <p className="mx-auto max-w-2xl text-slate-600">From routine check-ups to specialized treatments, we offer a full range of services designed specifically for children's unique healthcare needs.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ServiceCard icon="🩺" title="Pediatric Consultation" description="Expert consultations with experienced pediatricians for all child health concerns" />
            <ServiceCard icon="🔬" title="Laboratory Services" description="State-of-the-art diagnostic testing with child-friendly sample collection" />
            <ServiceCard icon="💊" title="Pharmacy Services" description="Pediatric-formulated medications and professional pharmaceutical guidance" />
            <ServiceCard icon="🏥" title="Reception & Admissions" description="Streamlined registration and admission process for stress-free visits" />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">Why Choose Us</span>
            <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">Your Child Deserves the Best Care</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <WhyChooseCard icon="👨‍⚕️" title="Experienced Specialists" description="Our team of board-certified pediatricians brings decades of combined experience in child healthcare." />
            <WhyChooseCard icon="🎨" title="Child-Friendly Facilities" description="Colorful, welcoming spaces designed to make children feel comfortable and reduce anxiety." />
            <WhyChooseCard icon="🛡️" title="Safe & Reliable Care" description="Rigorous safety protocols and quality standards ensure your child receives the best possible care." />
          </div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section className="relative overflow-hidden bg-blue-600 px-6 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-white"></div>
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Making a Difference, One Child at a Time</h2>
            <p className="mx-auto max-w-2xl text-blue-100">Our commitment to pediatric excellence is reflected in the lives we've touched.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard end={75} suffix="+" label="Years of Service" delay={0} />
            <StatCard end={500} suffix="K+" label="Children Treated" delay={150} />
            <StatCard end={150} suffix="+" label="Pediatric Specialists" delay={300} />
            <StatCard end={98} suffix="%" label="Parent Satisfaction" delay={450} />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-pink-100 px-4 py-1.5 text-sm font-medium text-pink-700">How It Works</span>
            <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">Your Journey With Us</h2>
            <p className="mx-auto max-w-2xl text-slate-600">Getting care for your child has never been easier. Follow these simple steps.</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-8 hidden h-0.5 w-3/4 -translate-x-1/2 bg-linear-to-r from-blue-200 via-pink-200 to-blue-200 lg:block"></div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
              <StepCard step={1} icon="📝" title="Register" description="Create your caregiver account in minutes" />
              <StepCard step={2} icon="📅" title="Book Appointment" description="Choose a convenient date and time" />
              <StepCard step={3} icon="📱" title="Receive QR Code" description="Get your unique appointment QR code" />
              <StepCard step={4} icon="🏥" title="Visit Hospital" description="Check in quickly with your QR code" />
              <StepCard step={5} icon="💝" title="Get Care" description="Your child receives expert attention" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-linear-to-b from-blue-50 to-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">Testimonials</span>
            <h2 className="mb-4 text-3xl font-bold text-blue-900 md:text-4xl">What Parents Say About Us</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <TestimonialCard quote="The doctors were incredibly patient with my anxious toddler. We felt so cared for throughout our visit." name="Sarah M." role="Mother of 2" />
            <TestimonialCard quote="The online booking system saved us so much time. No more long waits! Highly recommend this hospital." name="James K." role="Father of 3" />
            <TestimonialCard quote="From reception to pharmacy, every staff member was friendly and professional. Best pediatric care in Nairobi!" name="Grace W." role="Mother of 1" />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-3xl bg-linear-to-r from-blue-600 to-blue-700 shadow-xl">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12">
                <h2 className="mb-4 text-3xl font-bold text-white">Need Help or Have Questions?</h2>
                <p className="mb-8 text-blue-100">Our support team is here to assist you. Reach out through any of our channels.</p>
                <div className="space-y-4">
                  <ContactItem icon="📞" label="Emergency Line" value="+254 700 123 456" />
                  <ContactItem icon="📧" label="Email Support" value="support@gch.co.ke" />
                  <ContactItem icon="📍" label="Location" value="Muthaiga, Nairobi, Kenya" />
                  <ContactItem icon="🕐" label="Working Hours" value="24/7 Emergency Services" />
                </div>
              </div>
              <div className="flex items-center justify-center bg-blue-500/30 p-8">
                <div className="text-center">
                  <div className="mb-4 text-6xl">🏥</div>
                  <p className="text-lg font-semibold text-white">Gertrude's Children Hospital</p>
                  <p className="text-blue-100">Always here for your little ones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gentle CTA */}
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="rounded-2xl bg-linear-to-r from-blue-50 to-pink-50 p-8 md:p-12">
          <h2 className="mb-4 text-2xl font-bold text-blue-900">New to our hospital?</h2>
          <p className="mb-6 text-slate-600">{"Creating an account takes less than 2 minutes. We'll guide you through every step."}</p>
          <Link href="/register" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700">
            {"Get Started — It's Free"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600"><span className="text-lg text-white">🏥</span></div>
                <span className="font-semibold text-blue-900">GCH</span>
              </div>
              <p className="text-sm text-slate-600">Providing exceptional pediatric care for East African families since 1947.</p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-blue-900">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="transition-colors hover:text-blue-600">About Us</a></li>
                <li><a href="#" className="transition-colors hover:text-blue-600">Our Services</a></li>
                <li><a href="#" className="transition-colors hover:text-blue-600">Find a Doctor</a></li>
                <li><a href="#" className="transition-colors hover:text-blue-600">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-blue-900">Patient Portal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link href="/login" className="transition-colors hover:text-blue-600">Sign In</Link></li>
                <li><Link href="/register" className="transition-colors hover:text-blue-600">Register</Link></li>
                <li><a href="#" className="transition-colors hover:text-blue-600">Book Appointment</a></li>
                <li><a href="#" className="transition-colors hover:text-blue-600">View Records</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-blue-900">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#" className="transition-colors hover:text-blue-600">Privacy Policy</a></li>
                <li><a href="#" className="transition-colors hover:text-blue-600">Terms of Service</a></li>
                <li><a href="#" className="transition-colors hover:text-blue-600">Cookie Policy</a></li>
                <li><a href="#" className="transition-colors hover:text-blue-600">Accessibility</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
            <p>{`© ${new Date().getFullYear()} Gertrude's Children Hospital. All rights reserved.`}</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function TrustCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-md min-h-37.5 flex flex-col">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-3xl">{icon}</div>
      <h3 className="mb-3 text-lg font-semibold text-blue-900">{title}</h3>
      <p className="mt-auto text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  )
}

function ServiceCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-blue-100 to-pink-100 text-3xl transition-transform group-hover:scale-110">{icon}</div>
      <h3 className="mb-2 font-semibold text-blue-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  )
}

function WhyChooseCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-50 to-pink-50 text-4xl">{icon}</div>
      <h3 className="mb-3 text-xl font-semibold text-blue-900">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  )
}

// `StatCard` is provided by the client component at `components/stat-card.tsx`

function StepCard({ step, icon, title, description }: { step: number; icon: string; title: string; description: string }) {
  return (
    <div className="relative text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-3xl shadow-lg">{icon}</div>
      <div className="absolute -top-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-pink-400 text-xs font-bold text-white">{step}</div>
      <h3 className="mb-2 font-semibold text-blue-900">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  )
}

function TestimonialCard({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 text-3xl text-pink-300">"</div>
      <p className="mb-6 italic text-slate-600">{quote}</p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-pink-100 text-lg">👤</div>
        <div>
          <p className="font-semibold text-blue-900">{name}</p>
          <p className="text-sm text-slate-500">{role}</p>
        </div>
      </div>
    </div>
  )
}

function ContactItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-xl">{icon}</div>
      <div>
        <p className="text-sm text-blue-200">{label}</p>
        <p className="font-medium text-white">{value}</p>
      </div>
    </div>
  )
}

function LocationCard({ image, name, mapUrl }: { image: string; name: string; mapUrl: string }) {
  return (
    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden rounded-xl">
      <div className="aspect-4/5 bg-cover bg-center transition-transform duration-300 group-hover:scale-105" style={{ backgroundImage: `url('${image}')` }}>
      </div>
      <div className="absolute inset-0 flex items-end p-3 bg-linear-to-b from-transparent via-transparent to-black/20 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium text-white">{name}</span>
        </div>
      </div>
    </a>
  )
}