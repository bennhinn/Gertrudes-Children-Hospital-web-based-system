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

/* ─────────────────────────────────────────────────────────────────
   DESIGN SYSTEM CSS
   ───────────────────────────────────────────────────────────────── */
const DS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=Nunito:wght@500;600;700;800;900&display=swap');

  /* ── tokens ── */
  :root {
    --blue:#2563EB; --blue-d:#1D4ED8; --blue-dd:#1E3A5F;
    --blue-l:#DBEAFE; --blue-s:#EFF6FF;
    --indigo:#6366F1; --indigo-d:#4338CA; --indigo-l:#E0E7FF;
    --teal:#0D9488; --teal-l:#CCFBF1;
    --pink:#F43F5E; --pink-d:#E11D48; --pink-l:#FFE4E6;
    --emerald:#10B981; --amber:#F59E0B; --purple:#8B5CF6;
    --text-h:#0F172A; --text-b:#1E293B; --text-s:#475569; --text-m:#64748B; --text-x:#94A3B8;
    --spring:cubic-bezier(0.34,1.56,0.64,1);
    --ease:cubic-bezier(0.4,0,0.2,1);
    --clay-sm:0 5px 0 rgba(0,0,0,.10),0 10px 24px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.80);
    --clay-md:0 7px 0 rgba(0,0,0,.11),0 14px 32px rgba(0,0,0,.09),inset 0 1.5px 0 rgba(255,255,255,.72);
    --clay-lg:0 10px 0 rgba(0,0,0,.12),0 20px 44px rgba(0,0,0,.10),inset 0 1.5px 0 rgba(255,255,255,.65);
    --clay-xl:0 14px 0 rgba(0,0,0,.13),0 28px 60px rgba(0,0,0,.12),inset 0 2px 0 rgba(255,255,255,.60);
    --clay-md-h:0 12px 0 rgba(0,0,0,.13),0 24px 52px rgba(0,0,0,.11),inset 0 1.5px 0 rgba(255,255,255,.72);
    --clay-lg-h:0 16px 0 rgba(0,0,0,.14),0 32px 64px rgba(0,0,0,.13),inset 0 2px 0 rgba(255,255,255,.65);
  }

  /* ── fonts ── */
  .f-display { font-family:'Fraunces',Georgia,serif !important; }
  .f-body    { font-family:'Nunito',ui-rounded,sans-serif !important; }

  /* ── animated gradient text ── */
  @keyframes gsh { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  .grad-cool { background:linear-gradient(135deg,var(--blue-d),var(--indigo),var(--teal),var(--blue)); background-size:300% 300%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:gsh 6s ease infinite; }
  .grad-warm { background:linear-gradient(135deg,var(--pink),var(--amber),var(--emerald),var(--pink)); background-size:300% 300%; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:gsh 5s ease infinite; }

  /* ── section reveal ── */
  @keyframes rUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  .reveal  { animation:rUp .6s var(--ease) both; }
  .rd1{animation-delay:.06s} .rd2{animation-delay:.13s} .rd3{animation-delay:.20s}
  .rd4{animation-delay:.27s} .rd5{animation-delay:.34s}

  /* ── section badge ── */
  .badge {
    display:inline-flex; align-items:center; gap:6px;
    border-radius:999px; padding:5px 16px;
    font-family:'Nunito',sans-serif; font-size:11px; font-weight:900;
    text-transform:uppercase; letter-spacing:.07em;
    box-shadow:var(--clay-sm);
  }
  .badge-blue   { background:linear-gradient(135deg,#EFF6FF,#DBEAFE); color:var(--blue-d); }
  .badge-pink   { background:linear-gradient(135deg,#FFF1F2,#FFE4E6); color:var(--pink-d); }
  .badge-teal   { background:linear-gradient(135deg,#F0FDFA,#CCFBF1); color:var(--teal); }
  .badge-indigo { background:linear-gradient(135deg,#EEF2FF,#E0E7FF); color:var(--indigo-d); }
  .badge-amber  { background:linear-gradient(135deg,#FFFBEB,#FDE68A); color:#92400E; }

  /* ── icon bubble ── */
  .ico {
    border-radius:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0;
    box-shadow:0 4px 0 rgba(0,0,0,.14),0 8px 18px rgba(0,0,0,.11),inset 0 1px 0 rgba(255,255,255,.45);
    transition:transform .28s var(--spring);
  }

  /* ── TRUST CARDS ── */
  .trust-card {
    border-radius:24px; overflow:hidden; position:relative; padding:32px;
    box-shadow:var(--clay-lg);
    transition:transform .28s var(--spring),box-shadow .28s var(--ease);
  }
  .trust-card::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; z-index:2; }
  .trust-card:hover { transform:translateY(-8px) rotate(.2deg); box-shadow:var(--clay-lg-h); }
  .trust-card:hover .ico { transform:rotate(-12deg) scale(1.18); }
  .trust-blue  { background:linear-gradient(145deg,#fff,#F0F7FF); }
  .trust-blue::before  { background:linear-gradient(90deg,#2563EB,#6366F1); }
  .trust-green { background:linear-gradient(145deg,#fff,#F0FDF9); }
  .trust-green::before { background:linear-gradient(90deg,#10B981,#0D9488); }
  .trust-pink  { background:linear-gradient(145deg,#fff,#FFF5F7); }
  .trust-pink::before  { background:linear-gradient(90deg,#F43F5E,#F97316); }

  /* ── ABOUT FRAME ── */
  .about-frame {
    border-radius:28px; padding:10px;
    background:linear-gradient(135deg,white,#EFF6FF,white);
    box-shadow:var(--clay-xl); position:relative;
  }
  .about-badge {
    position:absolute; bottom:-14px; right:-8px; border-radius:20px; padding:16px 20px;
    background:linear-gradient(135deg,#2563EB,#1D4ED8);
    box-shadow:0 8px 0 rgba(37,99,235,.30),0 14px 32px rgba(37,99,235,.25),inset 0 1px 0 rgba(255,255,255,.30);
    border:3px solid white;
  }
  .feat-chip {
    display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:16px;
    box-shadow:var(--clay-sm); background:white;
    font-family:'Nunito',sans-serif; font-weight:800; font-size:13px; color:var(--text-b);
    transition:transform .2s var(--spring);
  }
  .feat-chip:hover { transform:translateY(-3px); }

  /* ── LOCATION CARDS ── */
  .loc-card {
    border-radius:24px; overflow:hidden; position:relative; display:block; text-decoration:none;
    box-shadow:var(--clay-lg);
    transition:transform .28s var(--spring),box-shadow .28s var(--ease);
  }
  .loc-card:hover { transform:translateY(-8px) scale(1.01); box-shadow:var(--clay-lg-h); }
  .loc-reveal { opacity:0; transform:translateY(6px); transition:opacity .3s ease,transform .3s ease; }
  .loc-card:hover .loc-reveal { opacity:1; transform:translateY(0); }
  @keyframes openPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
  .loc-open {
    position:absolute; top:12px; right:12px;
    background:linear-gradient(135deg,#10B981,#059669); color:white;
    border-radius:999px; padding:4px 12px; font-size:11px; font-weight:900;
    font-family:'Nunito',sans-serif; border:2px solid rgba(255,255,255,.4);
    box-shadow:0 3px 0 rgba(16,185,129,.3),0 5px 14px rgba(16,185,129,.25);
    animation:openPulse 2.5s ease-in-out infinite;
    opacity:0; transform:translateY(-4px); transition:opacity .3s ease,transform .3s ease;
  }
  .loc-card:hover .loc-open { opacity:1; transform:translateY(0); }

  /* ── BENTO GRID ── */
  .bento { display:grid; grid-template-columns:repeat(12,1fr); gap:16px; }
  .b7 { grid-column:span 7; } .b5 { grid-column:span 5; } .b6 { grid-column:span 6; }
  @media(max-width:768px){ .b7,.b5,.b6{ grid-column:span 12; } }
  .bento-tile {
    border-radius:24px; overflow:hidden; position:relative; min-height:200px;
    box-shadow:var(--clay-lg);
    transition:transform .28s var(--spring),box-shadow .28s var(--ease);
  }
  .bento-tile:hover { transform:translateY(-7px) scale(1.01); box-shadow:var(--clay-lg-h); }
  .bento-tile:hover .ico { transform:rotate(-12deg) scale(1.2); }
  /* grain overlay */
  .bento-tile::after {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:0; border-radius:inherit;
    background:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity:.025;
  }
  .bento-tile > * { position:relative; z-index:1; }

  /* ── STATS dark aurora section ── */
  .stats-bg {
    background:
      radial-gradient(ellipse 70% 80% at 0% 50%,rgba(29,78,216,.95),transparent 65%),
      radial-gradient(ellipse 60% 70% at 100% 50%,rgba(79,70,229,.9),transparent 60%),
      radial-gradient(ellipse 50% 60% at 50% 100%,rgba(13,148,136,.8),transparent 55%),
      #0F172A;
    position:relative; overflow:hidden;
  }
  .stats-bg::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  }
  @keyframes twinkle { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.9;transform:scale(1.6)} }
  .star { position:absolute; border-radius:50%; background:white; animation:twinkle var(--dur,3s) ease-in-out var(--del,0s) infinite; }

  /* ── WHY CARDS ── */
  .why-card {
    border-radius:24px; overflow:hidden; text-align:center; padding:36px 28px; background:white;
    box-shadow:var(--clay-lg);
    transition:transform .28s var(--spring),box-shadow .28s var(--ease);
  }
  .why-card:hover { transform:translateY(-8px) rotate(-.3deg); box-shadow:var(--clay-lg-h); }
  .why-ico {
    width:68px; height:68px; border-radius:22px; margin:0 auto 20px;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 6px 0 rgba(0,0,0,.13),0 12px 28px rgba(0,0,0,.10),inset 0 1px 0 rgba(255,255,255,.40);
    transition:transform .28s var(--spring);
  }
  .why-card:hover .why-ico { transform:scale(1.15) rotate(-10deg); }

  /* ── STEP CARDS ── */
  .step-card {
    border-radius:20px; padding:28px 16px 20px; text-align:center; background:white;
    position:relative; box-shadow:var(--clay-md);
    transition:transform .25s var(--spring),box-shadow .25s var(--ease);
  }
  .step-card:hover { transform:translateY(-6px); box-shadow:var(--clay-md-h); }
  .step-num {
    position:absolute; top:-13px; left:50%; transform:translateX(-50%);
    width:28px; height:28px; border-radius:50%; font-size:11px; font-weight:900;
    color:white; display:flex; align-items:center; justify-content:center;
    box-shadow:0 3px 0 rgba(0,0,0,.15),0 5px 12px rgba(0,0,0,.12);
    border:2.5px solid white; font-family:'Nunito',sans-serif;
  }
  .step-ico {
    width:52px; height:52px; border-radius:18px; margin:8px auto 16px;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 0 rgba(0,0,0,.12),0 8px 20px rgba(0,0,0,.10),inset 0 1px 0 rgba(255,255,255,.45);
    transition:transform .25s var(--spring);
  }
  .step-card:hover .step-ico { transform:rotate(-10deg) scale(1.1); }

  /* ── TESTIMONIAL CARDS ── */
  .testi-card {
    border-radius:24px; padding:28px; overflow:hidden; position:relative; display:flex; flex-direction:column;
    background:rgba(255,255,255,.82);
    backdrop-filter:blur(16px) saturate(1.4); -webkit-backdrop-filter:blur(16px) saturate(1.4);
    border:1.5px solid rgba(255,255,255,.90);
    box-shadow:0 8px 0 rgba(0,0,0,.07),0 16px 40px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.95);
    transition:transform .28s var(--spring),box-shadow .28s var(--ease);
  }
  .testi-card:hover { transform:translateY(-7px); box-shadow:0 14px 0 rgba(0,0,0,.09),0 28px 56px rgba(0,0,0,.10),inset 0 1px 0 rgba(255,255,255,.95); }
  .testi-card::before {
    content:'"'; position:absolute; top:-10px; left:20px;
    font-size:120px; font-family:'Fraunces',serif; font-weight:900; line-height:1;
    color:rgba(37,99,235,.05); pointer-events:none; z-index:0;
  }
  .testi-card > * { position:relative; z-index:1; }
  .verified {
    display:inline-flex; align-items:center; gap:5px; border-radius:999px; padding:4px 11px;
    font-size:11px; font-weight:800; font-family:'Nunito',sans-serif;
    background:linear-gradient(135deg,#ECFDF5,#A7F3D0); color:#059669;
    box-shadow:0 2px 0 rgba(0,0,0,.05),inset 0 1px 0 rgba(255,255,255,.8);
  }

  /* ── CONTACT ── */
  .contact-wrap {
    border-radius:32px; overflow:hidden;
    box-shadow:0 16px 0 rgba(29,78,216,.22),0 28px 64px rgba(29,78,216,.18),inset 0 1px 0 rgba(255,255,255,.18);
  }
  .contact-glass {
    background:rgba(255,255,255,.10); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
    border-left:1px solid rgba(255,255,255,.15);
  }
  .contact-ico {
    width:42px; height:42px; border-radius:14px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.2);
    box-shadow:0 2px 0 rgba(0,0,0,.10),inset 0 1px 0 rgba(255,255,255,.25);
  }

  /* ── CTA ── */
  .cta-wrap {
    border-radius:32px; overflow:hidden; position:relative;
    background:linear-gradient(135deg,#1D4ED8,#4338CA,#0D9488);
    box-shadow:0 16px 0 rgba(29,78,216,.20),0 28px 64px rgba(29,78,216,.18),inset 0 1px 0 rgba(255,255,255,.20);
  }
  @keyframes ctaBlob { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.1) rotate(5deg)} }
  .cta-blob { position:absolute; border-radius:50%; background:rgba(255,255,255,.08); animation:ctaBlob 7s ease-in-out infinite; pointer-events:none; }
  .cta-btn {
    display:inline-flex; align-items:center; gap:8px; border-radius:999px;
    font-family:'Nunito',sans-serif; font-weight:900; font-size:15px;
    background:white; color:var(--blue-d); padding:16px 36px; text-decoration:none;
    box-shadow:0 6px 0 rgba(0,0,0,.15),0 10px 28px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.9);
    transition:transform .25s var(--spring),box-shadow .25s var(--ease);
  }
  .cta-btn:hover { transform:translateY(-4px) scale(1.02); box-shadow:0 10px 0 rgba(0,0,0,.18),0 18px 40px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.9); }
  .cta-btn:active { transform:translateY(3px); }

  /* ── FOOTER ── */
  .ds-footer {
    background:rgba(255,255,255,.88);
    backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
    border-top:1.5px solid rgba(255,255,255,.9);
    box-shadow:0 -4px 24px rgba(0,0,0,.04);
  }
  .footer-brand {
    width:40px; height:40px; border-radius:14px;
    background:linear-gradient(135deg,#2563EB,#1D4ED8);
    box-shadow:var(--clay-sm);
    display:flex; align-items:center; justify-content:center;
  }
  .footer-link {
    font-size:13px; font-weight:700; color:#475569;
    transition:color .18s ease; text-decoration:none;
    font-family:'Nunito',sans-serif; display:inline-block;
  }
  .footer-link:hover { color:#2563EB; }
`

/* ─────────────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────────────── */
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
      <style dangerouslySetInnerHTML={{ __html: DS }} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HEADER — DO NOT TOUCH
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO — DO NOT TOUCH
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatedHero />

      {/* ── Trust Indicators ────────────────────────────────────── */}
      <section style={{ padding: '72px 24px', background: 'transparent' }} aria-label="Why families trust us">
        <div className="mx-auto max-w-7xl">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
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
      <section id="about" style={{ padding: '80px 24px', background: 'transparent' }}>
        <div className="mx-auto max-w-7xl">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 60, alignItems: 'center' }}>
            {/* Text */}
            <div className="reveal rd1">
              <SectionBadge color="blue">About Us</SectionBadge>
              <h2 className="f-display" style={{ marginTop: 16, fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, lineHeight: 1.15, color: '#0F172A' }}>
                Caring for Kenya&rsquo;s Children{' '}
                <span className="grad-cool">Since 1947</span>
              </h2>
              <p className="f-body" style={{ marginTop: 20, fontSize: 15, lineHeight: 1.75, color: '#475569', fontWeight: 600 }}>
                Gertrude&rsquo;s Children Hospital is East Africa&rsquo;s leading pediatric healthcare institution, dedicated to providing comprehensive, compassionate care for children from birth through adolescence.
              </p>
              <p className="f-body" style={{ marginTop: 12, fontSize: 15, lineHeight: 1.75, color: '#475569', fontWeight: 600 }}>
                Our mission is to deliver exceptional medical care in a child-friendly environment, ensuring every young patient feels safe, comfortable, and supported throughout their healthcare journey.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
                <div className="feat-chip">
                  <div className="ico" style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#F43F5E,#E11D48)' }}>
                    <Heart className="h-4 w-4" color="white" />
                  </div>
                  Child-Centered Care
                </div>
                <div className="feat-chip">
                  <div className="ico" style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)' }}>
                    <Sparkles className="h-4 w-4" color="white" />
                  </div>
                  Excellence in Medicine
                </div>
              </div>
            </div>

            {/* Image */}
            <div style={{ position: 'relative' }} className="reveal rd2">
              <div className="about-frame">
                <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', position: 'relative' }}>
                  <Image
                    src="/images/happy-family.jpg"
                    alt="Happy family at Gertrude's Children Hospital"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.35) 0%,transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 }}>
                    <p className="f-body" style={{ fontSize: 13, fontWeight: 700, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,.5)' }}>
                      Families trust us with their most precious ones
                    </p>
                  </div>
                </div>
              </div>
              <div className="about-badge">
                <p className="f-display" style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}>75+</p>
                <p className="f-body" style={{ fontSize: 11, fontWeight: 800, color: 'rgba(219,234,254,.85)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.5px' }}>Years of Care</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave → Locations */}
      <div className="-mt-1">
        <WaveDivider color="#F8FAFC" className="h-10 md:h-20" />
      </div>

      {/* ── Locations ───────────────────────────────────────────── */}
      <section id="locations" style={{ padding: '80px 24px', background: 'transparent' }}>
        <div className="mx-auto max-w-7xl">
          <div style={{ textAlign: 'center', marginBottom: 52 }} className="reveal">
            <SectionBadge color="blue">Our Locations</SectionBadge>
            <h2 className="f-display" style={{ marginTop: 16, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 700, color: '#0F172A' }}>
              Visit <span className="grad-cool">Gertrude&rsquo;s Children&rsquo;s Hospital</span> Today
            </h2>
            <p className="f-body" style={{ marginTop: 12, maxWidth: 480, margin: '12px auto 0', fontSize: 15, color: '#475569', fontWeight: 600 }}>
              Choose a location near you and book your appointment with ease.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            <LocationCard image="/images/locations/Muthaiga.jpg"        name="Muthaiga"      mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Muthaiga+Nairobi+Kenya"      featured={true} />
            <LocationCard image="/images/locations/Lavington.jpg"       name="Lavington"     mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Lavington+Nairobi+Kenya" />
            <LocationCard image="/images/locations/Karen.jpg"           name="Karen"         mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Karen+Nairobi+Kenya" />
            <LocationCard image="/images/locations/village-market.jpeg" name="Village Market" mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Village+Market+Nairobi+Kenya" />
            <LocationCard image="/images/locations/Mlolongo.jpg"        name="Mlolongo"      mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Mlolongo+Kenya" />
            <LocationCard image="/images/locations/Mimosa.jpg"          name="Mimosa"        mapUrl="https://maps.google.com/?q=Gertrude's+Children's+Hospital+Mimosa+Nairobi+Kenya" />
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────── */}
      <section id="services" style={{ padding: '80px 24px', background: 'transparent' }}>
        <div className="mx-auto max-w-7xl">
          <div style={{ textAlign: 'center', marginBottom: 52 }} className="reveal">
            <SectionBadge color="pink">Our Services</SectionBadge>
            <h2 className="f-display" style={{ marginTop: 16, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 700, color: '#0F172A' }}>
              Comprehensive <span className="grad-cool">Pediatric Care</span>
            </h2>
            <p className="f-body" style={{ marginTop: 12, maxWidth: 520, margin: '12px auto 0', fontSize: 15, color: '#475569', fontWeight: 600 }}>
              From routine check-ups to specialized treatments, we offer a full range of services designed specifically for children&rsquo;s unique healthcare needs.
            </p>
          </div>

          {/* Bento grid */}
          <div className="bento">
            {/* Hero tile — large dark navy */}
            <div className="bento-tile b7 reveal rd1"
              style={{ background: 'linear-gradient(135deg,#1E3A5F,#2563EB,#1D4ED8)', padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 300 }}>
              <div className="ico" style={{ width: 56, height: 56, background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)', marginBottom: 20 }}>
                <Stethoscope size={26} color="white" />
              </div>
              <h3 className="f-display" style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 10 }}>Pediatric Consultation</h3>
              <p className="f-body" style={{ fontSize: 14, lineHeight: 1.65, color: 'rgba(219,234,254,.85)', fontWeight: 600 }}>
                Expert consultations with experienced pediatricians for all child health concerns. Same-day appointments available.
              </p>
              <div style={{ marginTop: 20 }}>
                <span className="f-body" style={{ background: 'rgba(255,255,255,.15)', color: 'white', borderRadius: 999, padding: '5px 14px', fontSize: 12, fontWeight: 800, backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.2)' }}>
                  Most Popular
                </span>
              </div>
            </div>

            {/* Small tile — teal */}
            <div className="bento-tile b5 reveal rd2" style={{ background: 'linear-gradient(135deg,#F0FDF9,#CCFBF1)', padding: 28 }}>
              <div className="ico" style={{ width: 50, height: 50, background: 'linear-gradient(135deg,#10B981,#0D9488)', marginBottom: 16 }}>
                <FlaskConical size={22} color="white" />
              </div>
              <h3 className="f-display" style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Laboratory Services</h3>
              <p className="f-body" style={{ fontSize: 13, lineHeight: 1.65, color: '#475569', fontWeight: 600 }}>
                State-of-the-art diagnostic testing with child-friendly sample collection.
              </p>
            </div>

            {/* Small tile — rose */}
            <div className="bento-tile b6 reveal rd3" style={{ background: 'linear-gradient(135deg,#FFF5F7,#FFE4E6)', padding: 28 }}>
              <div className="ico" style={{ width: 50, height: 50, background: 'linear-gradient(135deg,#F43F5E,#E11D48)', marginBottom: 16 }}>
                <Pill size={22} color="white" />
              </div>
              <h3 className="f-display" style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Pharmacy Services</h3>
              <p className="f-body" style={{ fontSize: 13, lineHeight: 1.65, color: '#475569', fontWeight: 600 }}>
                Pediatric-formulated medications and professional pharmaceutical guidance.
              </p>
            </div>

            {/* Small tile — indigo */}
            <div className="bento-tile b6 reveal rd4" style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', padding: 28 }}>
              <div className="ico" style={{ width: 50, height: 50, background: 'linear-gradient(135deg,#6366F1,#4338CA)', marginBottom: 16 }}>
                <ClipboardList size={22} color="white" />
              </div>
              <h3 className="f-display" style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Reception &amp; Admissions</h3>
              <p className="f-body" style={{ fontSize: 13, lineHeight: 1.65, color: '#475569', fontWeight: 600 }}>
                Streamlined registration and admission process for stress-free visits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ───────────────────────────────────────── */}
      <section id="why-us" style={{ padding: '80px 24px', background: 'transparent' }}>
        <div className="mx-auto max-w-7xl">
          <div style={{ textAlign: 'center', marginBottom: 52 }} className="reveal">
            <SectionBadge color="blue">Why Choose Us</SectionBadge>
            <h2 className="f-display" style={{ marginTop: 16, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 700, color: '#0F172A' }}>
              Your Child Deserves <span className="grad-cool">the Best Care</span>
            </h2>
            <p className="f-body" style={{ marginTop: 12, maxWidth: 420, margin: '12px auto 0', fontSize: 15, color: '#475569', fontWeight: 600 }}>
              Three pillars that set us apart from every other healthcare provider.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            <WhyChooseCard icon={<UserCheck className="h-7 w-7" />} title="Experienced Specialists"   description="Our team of board-certified pediatricians brings decades of combined experience in child healthcare." />
            <WhyChooseCard icon={<Palette   className="h-7 w-7" />} title="Child-Friendly Facilities" description="Colorful, welcoming spaces designed to make children feel comfortable and reduce anxiety." />
            <WhyChooseCard icon={<Award     className="h-7 w-7" />} title="Safe &amp; Reliable Care"  description="Rigorous safety protocols and quality standards ensure your child receives the best possible care." />
          </div>
        </div>
      </section>

      {/* ── Impact Stats ────────────────────────────────────────── */}
      <section className="stats-bg" style={{ padding: '80px 24px', position: 'relative' }} aria-label="Our impact">
        {/* Twinkling stars */}
        {([
          { w:3, h:3, t:'12%', l:'8%',  dur:'2.5s', del:'0s'   },
          { w:2, h:2, t:'25%', l:'18%', dur:'3.2s', del:'.5s'  },
          { w:4, h:4, t:'8%',  l:'55%', dur:'2.8s', del:'1s'   },
          { w:2, h:2, t:'35%', l:'72%', dur:'3.5s', del:'.3s'  },
          { w:3, h:3, t:'18%', l:'85%', dur:'2.2s', del:'.8s'  },
          { w:2, h:2, t:'65%', l:'5%',  dur:'3.8s', del:'1.2s' },
          { w:3, h:3, t:'75%', l:'90%', dur:'2.6s', del:'.6s'  },
        ] as const).map((s, i) => (
          <div key={i} className="star" style={{ width: s.w, height: s.h, top: s.t, left: s.l, ['--dur' as string]: s.dur, ['--del' as string]: s.del }} />
        ))}
        <div style={{ position: 'relative', zIndex: 1 }} className="mx-auto max-w-7xl">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 className="f-display" style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              Making a Difference,{' '}
              <span style={{ color: '#93C5FD' }}>One Child at a Time</span>
            </h2>
            <p className="f-body" style={{ marginTop: 12, fontSize: 15, color: 'rgba(219,234,254,.75)', fontWeight: 600 }}>
              Our commitment to pediatric excellence is reflected in the lives we&rsquo;ve touched.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            <StatCard end={75}  suffix="+"  label="Years of Service"     delay={0} />
            <StatCard end={500} suffix="K+" label="Children Treated"     delay={150} />
            <StatCard end={150} suffix="+"  label="Pediatric Specialists" delay={300} />
            <StatCard end={98}  suffix="%"  label="Parent Satisfaction"  delay={450} />
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'transparent' }} aria-label="How it works">
        <div className="mx-auto max-w-7xl">
          <div style={{ textAlign: 'center', marginBottom: 52 }} className="reveal">
            <SectionBadge color="pink">How It Works</SectionBadge>
            <h2 className="f-display" style={{ marginTop: 16, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 700, color: '#0F172A' }}>
              Your Journey <span className="grad-cool">With Us</span>
            </h2>
            <p className="f-body" style={{ marginTop: 12, maxWidth: 440, margin: '12px auto 0', fontSize: 15, color: '#475569', fontWeight: 600 }}>
              Getting care for your child has never been easier. Follow these simple steps.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 20, position: 'relative' }}>
            <StepCard step={1} icon={<ClipboardList className="h-6 w-6" />} title="Register"         description="Create your caregiver account in minutes" />
            <StepCard step={2} icon={<Calendar      className="h-6 w-6" />} title="Book Appointment" description="Choose a convenient date and time" />
            <StepCard step={3} icon={<MessageSquare className="h-6 w-6" />} title="Receive QR Code"  description="Get your unique appointment QR code" />
            <StepCard step={4} icon={<Hospital      className="h-6 w-6" />} title="Visit Hospital"   description="Check in quickly with your QR code" />
            <StepCard step={5} icon={<Heart         className="h-6 w-6" />} title="Get Care"         description="Your child receives expert attention" />
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'transparent' }} aria-label="Testimonials">
        <div className="mx-auto max-w-7xl">
          <div style={{ textAlign: 'center', marginBottom: 52 }} className="reveal">
            <SectionBadge color="blue">Testimonials</SectionBadge>
            <h2 className="f-display" style={{ marginTop: 16, fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 700, color: '#0F172A' }}>
              What Parents <span className="grad-warm">Say About Us</span>
            </h2>
            <p className="f-body" style={{ marginTop: 12, maxWidth: 420, margin: '12px auto 0', fontSize: 15, color: '#475569', fontWeight: 600 }}>
              Real stories from real families who trust us with their children&rsquo;s health.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            <TestimonialCard quote="The doctors were incredibly patient with my anxious toddler. We felt so cared for throughout our visit."                                                       name="Sarah M." role="Mother of 2" rating={5} />
            <TestimonialCard quote="The online booking system saved us so much time. No more long waits! Highly recommend this hospital."                                                          name="James K." role="Father of 3" rating={5} />
            <TestimonialCard quote="From reception to pharmacy, every staff member was friendly and professional. Best pediatric care in Nairobi!" name="Grace W." role="Mother of 1" rating={5} />
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '80px 24px', background: 'transparent' }}>
        <div className="mx-auto max-w-7xl">
          <div className="contact-wrap reveal" style={{ background: 'linear-gradient(135deg,#1E3A5F,#2563EB,#1D4ED8)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
              {/* Info */}
              <div style={{ padding: 'clamp(32px,5vw,64px)' }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,.18)', color: 'white', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.25)', marginBottom: 16 }}>
                  <Phone size={11} /> Get In Touch
                </span>
                <h2 className="f-display" style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 10, marginTop: 16 }}>
                  Need Help or Have Questions?
                </h2>
                <p className="f-body" style={{ fontSize: 14, color: 'rgba(219,234,254,.8)', fontWeight: 600, marginBottom: 32, lineHeight: 1.7 }}>
                  Our support team is here to assist you. Reach out through any of our channels.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                  <ContactItem icon={<Phone  className="h-5 w-5" />} label="Emergency Line" value="+254 700 123 456" />
                  <ContactItem icon={<Mail   className="h-5 w-5" />} label="Email Support"  value="support@gch.co.ke" />
                  <ContactItem icon={<MapPin className="h-5 w-5" />} label="Main Location"  value="Muthaiga, Nairobi, Kenya" />
                  <ContactItem icon={<Clock  className="h-5 w-5" />} label="Working Hours"  value="24/7 Emergency Services" />
                </div>
              </div>
              {/* Brand panel */}
              <div className="contact-glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 88, height: 88, borderRadius: 28, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 6px 0 rgba(0,0,0,.1),0 12px 28px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.3)' }}>
                    <Hospital className="h-10 w-10" color="white" />
                  </div>
                  <p className="f-display" style={{ fontSize: 18, fontWeight: 700, color: 'white', lineHeight: 1.3 }}>Gertrude&rsquo;s Children Hospital</p>
                  <p className="f-body" style={{ fontSize: 13, color: 'rgba(219,234,254,.65)', fontWeight: 600, marginTop: 6 }}>Always here for your little ones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: 'transparent' }} aria-label="Get started">
        <div className="mx-auto max-w-2xl reveal">
          <div className="cta-wrap" style={{ padding: 'clamp(48px,6vw,80px) clamp(32px,5vw,64px)', textAlign: 'center' }}>
            <div className="cta-blob" style={{ width: 260, height: 260, top: -80, right: -60 }} />
            <div className="cta-blob" style={{ width: 180, height: 180, bottom: -60, left: -40, animationDelay: '3s' }} />
            <div className="cta-blob" style={{ width: 120, height: 120, top: '40%', left: '20%', animationDelay: '6s', opacity: .5 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,.18)', color: 'white', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.25)', marginBottom: 20, display: 'inline-flex' }}>
                <Sparkles size={11} /> New to our hospital?
              </span>
              <h2 className="f-display" style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 12, marginTop: 16 }}>
                Start Your Child&rsquo;s Care Journey
              </h2>
              <p className="f-body" style={{ fontSize: 15, color: 'rgba(219,234,254,.8)', fontWeight: 600, maxWidth: 380, margin: '0 auto 36px' }}>
                Creating an account takes less than 2 minutes. We&rsquo;ll guide you through every step.
              </p>
              <Link href="/register" className="cta-btn">
                Get Started — It&rsquo;s Free
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="ds-footer" style={{ padding: '56px 24px 32px' }} role="contentinfo">
        <div className="mx-auto max-w-7xl">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 40, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div className="footer-brand"><Hospital className="h-4 w-4" color="white" /></div>
                <span className="f-display" style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>GCH</span>
              </div>
              <p className="f-body" style={{ fontSize: 13, lineHeight: 1.7, color: '#64748B', fontWeight: 600 }}>
                Leading pediatric care in East Africa since 1947. Trusted by thousands of families.
              </p>
            </div>
            {/* Support */}
            <div>
              <p className="f-body" style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#94A3B8', marginBottom: 16 }}>Support</p>
              <div style={{ marginBottom: 10 }}><Link href="/help"     className="footer-link">Help Center / FAQ</Link></div>
              <div style={{ marginBottom: 10 }}><Link href="/help"     className="footer-link">Booking Guide</Link></div>
              <div style={{ marginBottom: 10 }}><Link href="/#contact" className="footer-link">Contact Us</Link></div>
            </div>
            {/* Portal */}
            <div>
              <p className="f-body" style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#94A3B8', marginBottom: 16 }}>Portal</p>
              <div style={{ marginBottom: 10 }}><Link href="/login"    className="footer-link">Sign In</Link></div>
              <div style={{ marginBottom: 10 }}><Link href="/register" className="footer-link">Register</Link></div>
              <div style={{ marginBottom: 10 }}><Link href="/help"     className="footer-link">Medical Records Help</Link></div>
            </div>
            {/* Legal */}
            <div>
              <p className="f-body" style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#94A3B8', marginBottom: 16 }}>Legal</p>
              <div style={{ marginBottom: 10 }}><Link href="/privacy" className="footer-link">Privacy Policy</Link></div>
              <div style={{ marginBottom: 10 }}><Link href="/terms"   className="footer-link">Terms of Service</Link></div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(226,232,240,.6)', paddingTop: 24, textAlign: 'center' }}>
            <p className="f-body" style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
              &copy; {new Date().getFullYear()} Gertrude&rsquo;s Children Hospital. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
   All prop signatures match the original exactly.
   ───────────────────────────────────────────────────────────────── */

/** Reusable section badge */
function SectionBadge({ children, color }: { children: React.ReactNode; color: 'blue' | 'pink' }) {
  const cls = { blue: 'badge badge-blue', pink: 'badge badge-pink' }
  return <span className={cls[color]}>{children}</span>
}

/** Trust indicator card */
function TrustCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  // Derive theme from icon color hint embedded in the icon's className
  const iconStr = String((icon as any)?.props?.className ?? '')
  const theme = iconStr.includes('blue')
    ? 'trust-blue'
    : description.includes('schedule') || description.includes('Schedule') || description.includes('Book')
    ? 'trust-green'
    : 'trust-pink'

  const iconBgs: Record<string, string> = {
    'trust-blue':  'linear-gradient(135deg,#2563EB,#1D4ED8)',
    'trust-green': 'linear-gradient(135deg,#10B981,#0D9488)',
    'trust-pink':  'linear-gradient(135deg,#F43F5E,#F97316)',
  }

  return (
    <div className={`trust-card ${theme} reveal`}>
      <div className="ico" style={{ width: 52, height: 52, background: iconBgs[theme], marginBottom: 22 }}>
        {/* Clone icon with forced white color */}
        <span style={{ color: 'white', display: 'contents' }}>{icon}</span>
      </div>
      <h3 className="f-display" style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{title}</h3>
      <p className="f-body" style={{ fontSize: 14, lineHeight: 1.7, color: '#475569', fontWeight: 600 }}>{description}</p>
    </div>
  )
}

/** Service card — replaced by bento tiles above; kept for type-compat */
function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bento-tile reveal" style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', padding: 28 }}>
      <div className="ico" style={{ width: 50, height: 50, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', marginBottom: 16 }}>
        <span style={{ color: 'white', display: 'contents' }}>{icon}</span>
      </div>
      <h3 className="f-display" style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{title}</h3>
      <p className="f-body" style={{ fontSize: 13, lineHeight: 1.65, color: '#475569', fontWeight: 600 }}>{description}</p>
    </div>
  )
}

/** Why choose us card */
function WhyChooseCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  const bgs = [
    'linear-gradient(135deg,#2563EB,#1D4ED8)',
    'linear-gradient(135deg,#F43F5E,#E11D48)',
    'linear-gradient(135deg,#F59E0B,#D97706)',
  ]
  // Rotate through colors by hashing title
  const idx = title.length % 3
  return (
    <div className="why-card reveal">
      <div className="why-ico" style={{ background: bgs[idx] }}>
        <span style={{ color: 'white', display: 'contents' }}>{icon}</span>
      </div>
      <h3 className="f-display" style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{title}</h3>
      <p className="f-body" style={{ fontSize: 14, lineHeight: 1.7, color: '#475569', fontWeight: 600 }}>{description}</p>
    </div>
  )
}

/** Step card with number badge */
function StepCard({ step, icon, title, description }: { step: number; icon: React.ReactNode; title: string; description: string }) {
  const numBgs = [
    'linear-gradient(135deg,#F43F5E,#E11D48)',
    'linear-gradient(135deg,#F59E0B,#D97706)',
    'linear-gradient(135deg,#10B981,#059669)',
    'linear-gradient(135deg,#8B5CF6,#7C3AED)',
    'linear-gradient(135deg,#2563EB,#1D4ED8)',
  ]
  const icoBgs = [
    'linear-gradient(135deg,#6366F1,#4338CA)',
    'linear-gradient(135deg,#2563EB,#1D4ED8)',
    'linear-gradient(135deg,#10B981,#0D9488)',
    'linear-gradient(135deg,#F43F5E,#E11D48)',
    'linear-gradient(135deg,#F59E0B,#D97706)',
  ]
  const i = step - 1
  return (
    <div className="step-card reveal">
      <div className="step-num" style={{ background: numBgs[i] }}>{step}</div>
      <div className="step-ico" style={{ background: icoBgs[i] }}>
        <span style={{ color: 'white', display: 'contents' }}>{icon}</span>
      </div>
      <p className="f-display" style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{title}</p>
      <p className="f-body" style={{ fontSize: 12, lineHeight: 1.65, color: '#64748B', fontWeight: 600 }}>{description}</p>
    </div>
  )
}

/** Testimonial card */
function TestimonialCard({ quote, name, role, rating }: { quote: string; name: string; role: string; rating: number }) {
  return (
    <div className="testi-card reveal">
      <div style={{ display: 'flex', gap: 3, marginBottom: 16 }} aria-label={`Rating: ${rating} out of 5 stars`}>
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <blockquote style={{ flex: 1, marginBottom: 20 }}>
        <p className="f-body" style={{ fontSize: 14, lineHeight: 1.75, color: '#334155', fontStyle: 'italic', fontWeight: 600 }}>
          &ldquo;{quote}&rdquo;
        </p>
      </blockquote>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(226,232,240,.6)', paddingTop: 18 }}>
        <div style={{ width: 40, height: 40, borderRadius: 14, background: 'linear-gradient(135deg,#DBEAFE,#C7D2FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 rgba(0,0,0,.07),inset 0 1px 0 rgba(255,255,255,.7)', flexShrink: 0 }}>
          <UserCheck className="h-4 w-4" color="#2563EB" />
        </div>
        <div>
          <p className="f-body" style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{name}</p>
          <p className="f-body" style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>{role}</p>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <span className="verified"><Award className="h-3 w-3" /> Verified Patient</span>
      </div>
    </div>
  )
}

/** Contact detail item */
function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div className="contact-ico">
        <span style={{ color: 'white', display: 'contents' }}>{icon}</span>
      </div>
      <div>
        <p className="f-body" style={{ fontSize: 11, fontWeight: 800, color: 'rgba(147,197,253,.8)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{label}</p>
        <p className="f-body" style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>{value}</p>
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
      className="loc-card reveal"
    >
      <div
        className={featured ? undefined : undefined}
        style={{
          backgroundImage: `url('${image}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          aspectRatio: featured ? '16/9' : '4/5',
          transition: 'transform .5s ease',
        }}
        role="img"
        aria-label={`Photo of ${name} branch`}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.65) 0%,rgba(0,0,0,.1) 50%,transparent 100%)' }} />

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <MapPin className="h-4 w-4" color="rgba(255,255,255,.8)" />
          <span className="f-display" style={{ fontSize: 17, fontWeight: 700, color: 'white' }}>{name}</span>
        </div>
        <div className="loc-reveal">
          <span className="f-body" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 999, padding: '7px 16px', fontSize: 12, fontWeight: 800, color: '#0F172A', boxShadow: '0 3px 0 rgba(0,0,0,.10),0 5px 14px rgba(0,0,0,.12)' }}>
            View on Map <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
      <div className="loc-open">Open Now</div>
    </a>
  )
}