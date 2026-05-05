'use client'

import { useState, useCallback, useEffect } from 'react'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import type { Module } from '@/types'
import {
  Heart, Stethoscope, Activity, Baby, Shield, Zap,
  CheckCircle2, ArrowRight, ArrowUpRight, ChevronDown,
  Sparkles, Timer, WifiOff, MessageCircle, FileText,
  Smartphone, Database, Server, Loader2, X, Clock,
  Scale, FlaskConical, Syringe, ShieldAlert, Star,
  Globe, Lock, Cpu, BarChart3, Users, TrendingUp,
  Play, ExternalLink, Menu, ChevronRight
} from 'lucide-react'
import NalsMonitor from '@/components/modules/NalsMonitor'
import PalsMonitor from '@/components/modules/PalsMonitor'
import AclsMonitor from '@/components/modules/AclsMonitor'

interface ActiveTrial { module_id: string; expires_at: string; hours_left: number }
interface ModuleStatus { subscribed_modules: string[]; active_trials: ActiveTrial[]; all_trials: string[] }
interface Props { isSignedIn: boolean; moduleStatus: ModuleStatus | null; modules: Module[]; price?: string; duration?: string; durationUnit?: string }

const BADGE: Record<string, { text: string; cls: string }> = {
  active: { text: 'Disponible', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  coming_soon: { text: 'En desarrollo', cls: 'bg-slate-50 text-slate-500 border border-slate-200' },
  beta: { text: 'Beta', cls: 'bg-sky-50 text-sky-600 border border-sky-200' },
}

const ICON_MAP: Record<string, React.ReactNode> = {
  '🫀': <Heart className="w-5 h-5" />, '🩺': <Stethoscope className="w-5 h-5" />,
  '📊': <Activity className="w-5 h-5" />, '💊': <Shield className="w-5 h-5" />,
  '📋': <FileText className="w-5 h-5" />, '🧪': <Sparkles className="w-5 h-5" />,
  '🩸': <Syringe className="w-5 h-5" />,
}

const CL: Record<string, { text: string; bg: string; light: string; iconBg: string; ring: string; gradient: string }> = {
  '#3b82f6': { text: 'text-blue-600', bg: 'bg-blue-600', light: 'bg-blue-50', iconBg: 'bg-blue-100', ring: 'ring-blue-200', gradient: 'from-blue-500 to-blue-600' },
  '#8b5cf6': { text: 'text-violet-600', bg: 'bg-violet-600', light: 'bg-violet-50', iconBg: 'bg-violet-100', ring: 'ring-violet-200', gradient: 'from-violet-500 to-violet-600' },
  '#06b6d4': { text: 'text-cyan-600', bg: 'bg-cyan-600', light: 'bg-cyan-50', iconBg: 'bg-cyan-100', ring: 'ring-cyan-200', gradient: 'from-cyan-500 to-cyan-600' },
  '#10b981': { text: 'text-emerald-600', bg: 'bg-emerald-600', light: 'bg-emerald-50', iconBg: 'bg-emerald-100', ring: 'ring-emerald-200', gradient: 'from-emerald-500 to-emerald-600' },
  '#f59e0b': { text: 'text-amber-600', bg: 'bg-amber-600', light: 'bg-amber-50', iconBg: 'bg-amber-100', ring: 'ring-amber-200', gradient: 'from-amber-500 to-amber-600' },
  '#ec4899': { text: 'text-pink-600', bg: 'bg-pink-600', light: 'bg-pink-50', iconBg: 'bg-pink-100', ring: 'ring-pink-200', gradient: 'from-pink-500 to-pink-600' },
  '#ef4444': { text: 'text-red-600', bg: 'bg-red-600', light: 'bg-red-50', iconBg: 'bg-red-100', ring: 'ring-red-200', gradient: 'from-red-500 to-red-600' },
}

export function LandingClient({ isSignedIn: initialSignedIn, moduleStatus: initialStatus, modules, price = '3.00', duration = '12', durationUnit = 'months' }: Props) {
  const { isSignedIn: clerkSignedIn } = useUser()
  const isSignedIn = clerkSignedIn ?? initialSignedIn

  const [modStatus, setModStatus] = useState<ModuleStatus | null>(initialStatus)
  const [modal, setModal] = useState<'trial' | 'subscribe' | null>(null)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  const refreshStatus = useCallback(async () => {
    const r = await fetch('/api/modules/status')
    if (r.ok) setModStatus(await r.json())
  }, [])

  const handleModuleClick = async (id: string) => {
    const m = modules.find(x => x.id === id)
    if (!m || m.status !== 'active') return
    if (!isSignedIn) return
    try {
      const r = await fetch(`/api/modules/access/${id}`)
      if (!r.ok) { console.error('Server error:', r.status); return }
      const d = await r.json()
      if (d.access) { setActiveModule(id); return }
      setSelectedModule(id)
      if (d.reason === 'no_access') setModal('trial')
      else if (d.reason === 'trial_expired') setModal('subscribe')
    } catch (e) { console.error('API error:', e) }
  }

  const handleStartTrial = async () => {
    if (!selectedModule) return
    setIsLoading(true)
    await fetch(`/api/modules/trial/${selectedModule}`, { method: 'POST' })
    await refreshStatus()
    setModal(null); setActiveModule(selectedModule); setIsLoading(false)
  }

  const handleSubscribe = async () => {
    if (!selectedModule) return
    setIsLoading(true)
    const r = await fetch(`/api/modules/subscribe/${selectedModule}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_ref: 'SIM_' + Date.now() })
    })
    if (r.ok) { await refreshStatus(); setModal(null); setActiveModule(selectedModule) }
    setIsLoading(false)
  }

  const trialFor = (id: string) => modStatus?.active_trials?.find(t => t.module_id === id)
  const isSubscribed = (id: string) => modStatus?.subscribed_modules?.includes(id)
  const hasTried = (id: string) => modStatus?.all_trials?.includes(id)
  const selectedMod = modules.find(m => m.id === selectedModule)
  const durationLabel = durationUnit === 'days' ? (duration === '1' ? 'día' : 'días') : durationUnit === 'years' ? (duration === '1' ? 'año' : 'años') : (duration === '1' ? 'mes' : 'meses')
  const priceTag = `$${price}/${duration} ${durationLabel}`
  const priceShort = `$${price}`

  // ══════════════════════════════════════════════
  //  VISTA MÓDULO ACTIVO (FULLSCREEN)
  // ══════════════════════════════════════════════
  if (activeModule && ['nals-monitor', 'pals-monitor', 'acls-monitor'].includes(activeModule)) {
    const trial = trialFor(activeModule)
    const subbed = isSubscribed(activeModule)
    const mod = modules.find(m => m.id === activeModule)
    const ModComponent = activeModule === 'nals-monitor' ? NalsMonitor : activeModule === 'pals-monitor' ? PalsMonitor : AclsMonitor
    return (
      <div className="fixed inset-0 bg-slate-950">
        <div className="pb-[44px] h-full">
          <ModComponent />
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between px-3 py-2 bg-black/70 backdrop-blur-xl border-t border-white/[0.06]">
          <button onClick={() => setActiveModule(null)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Catálogo
          </button>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{mod?.name}</span>
          <div className="flex items-center gap-2">
            {trial && !subbed && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                <Timer className="w-3 h-3" />{trial.hours_left}h
              </span>
            )}
            {subbed && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pro
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════
  //  LANDING PAGE
  // ══════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white">

      {/* ━━━ TOPBAR PROMOCIONAL ━━━ */}
      <div className="relative bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-pulse" />
        <div className="relative text-center py-2.5 px-4">
          <span className="inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-bold tracking-wide">
            <span className="bg-white/20 backdrop-blur rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase">Nuevo</span>
            <span className="hidden sm:inline">Activa cualquier módulo clínico</span> — 72 horas gratis, sin tarjeta
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </span>
        </div>
      </div>

      {/* ━━━ NAVBAR ━━━ */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/85 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-b border-slate-100' : 'bg-white border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-10 flex items-center justify-between h-[52px] sm:h-[60px]">
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">Medi<span className="text-teal-600">Core</span></span>
          </div>

          <div className="hidden md:flex items-center">
            {[['Módulos', '#modules'], ['Escenarios', '#scenarios'], ['Precio', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={label} href={href} className="px-3.5 py-1.5 mx-0.5 rounded-lg text-[13px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50/80 transition-all">{label}</a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <a href="/panel" className="inline-flex items-center gap-1 sm:gap-1.5 bg-teal-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-teal-500 transition-all font-bold text-[12px] sm:text-[13px] shadow-sm active:scale-[0.97]">
                  Panel <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </a>
                {modStatus && modStatus.subscribed_modules.length > 0 && (
                  <span className="hidden sm:inline-flex text-[10px] font-black px-2.5 py-1 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white uppercase tracking-widest shadow-sm shadow-teal-500/20">
                    {modStatus.subscribed_modules.length} módulo{modStatus.subscribed_modules.length > 1 ? 's' : ''} activo{modStatus.subscribed_modules.length > 1 ? 's' : ''}
                  </span>
                )}
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-8 h-8 ring-2 ring-teal-100' } }} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="hidden sm:block text-[13px] font-bold text-slate-500 hover:text-slate-900 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition-all">Entrar</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all font-bold text-[13px] shadow-lg shadow-slate-900/10 active:scale-[0.97]">
                    Crear cuenta <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </SignUpButton>
              </div>
            )}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-600">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden bg-white border-t border-slate-100 px-5 py-4 space-y-1">
            {[['Módulos', '#modules'], ['Escenarios', '#scenarios'], ['Precio', '#pricing'], ['FAQ', '#faq']].map(([l, h]) => (
              <a key={l} href={h} onClick={() => setMobileMenu(false)} className="block px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">{l}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-teal-50/80 via-cyan-50/40 to-transparent rounded-full pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-rose-50/30 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute top-40 left-1/3 w-32 h-32 bg-violet-50/20 blur-[60px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-10 pt-8 pb-6 sm:pt-14 sm:pb-8 lg:pt-20 lg:pb-12 relative">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

            {/* ← TEXT */}
            <div className="flex-1 max-w-xl text-center lg:text-left z-10">
              <span className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200/80 rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-bold text-teal-700 mb-4 sm:mb-6 anim-rise uppercase tracking-wider">
                <Heart className="w-3 h-3 anim-heartbeat" /> Software médico profesional
              </span>

              <h1 className="text-[1.75rem] sm:text-[2.5rem] lg:text-[3.25rem] font-black text-slate-900 leading-[1.1] mb-4 anim-rise d1 tracking-tight">
                Cuando cada segundo cuenta,{' '}
                <span className="relative inline-block pb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-cyan-500 to-teal-600">tu herramienta importa</span>
                  <svg className="absolute bottom-0 left-[-4%] w-[108%] h-4 opacity-90" viewBox="0 0 320 16" fill="none" preserveAspectRatio="none">
                    <path d="M4 12 C40 4, 80 2, 120 7 S200 14, 240 6 S300 2, 316 10" stroke="url(#ug)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                    <path d="M4 12 C40 4, 80 2, 120 7 S200 14, 240 6 S300 2, 316 10" stroke="url(#ug)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.15" />
                    <defs><linearGradient id="ug" x1="0" y1="0" x2="320" y2="0"><stop offset="0%" stopColor="#0d9488" /><stop offset="50%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#0d9488" /></linearGradient></defs>
                  </svg>
                </span>
              </h1>

              <p className="text-sm sm:text-[15px] text-slate-500 font-medium leading-relaxed mb-5 anim-rise d2">
                Cronómetros de reanimación, escalas APGAR, dosis por peso, epicrisis por WhatsApp.{' '}
                <span className="text-slate-800 font-bold">Todo funciona offline en quirófano.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 mb-5 anim-rise d3 justify-center lg:justify-start">
                <a href="#modules" className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-xl hover:bg-teal-500 transition-all font-bold text-sm shadow-xl shadow-teal-600/20 active:scale-[0.97] group">
                  Ver módulos clínicos <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#pricing" className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-5 py-3 rounded-xl font-bold text-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                  {priceTag}/módulo
                </a>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 anim-rise d4 items-center lg:items-start">
                {[
                  { icon: <WifiOff className="w-3.5 h-3.5" />, t: 'Offline en quirófano' },
                  { icon: <MessageCircle className="w-3.5 h-3.5" />, t: 'Exporta por WhatsApp' },
                  { icon: <Timer className="w-3.5 h-3.5" />, t: '72h gratis' },
                ].map((b, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">{b.icon} {b.t}</span>
                ))}
              </div>
            </div>

            {/* → HERO VISUAL — hidden on mobile */}
            <div className="hidden lg:block flex-1 max-w-md w-full anim-rise d3">
  <div className="relative">
    {/* Glow background - sutil pero presente */}
    <div className="absolute -inset-6 bg-gradient-to-br from-teal-100/40 via-cyan-100/30 to-blue-100/40 rounded-[3rem] blur-2xl pointer-events-none" />

    {/* Contenedor principal con sombra premium */}
    <div className="relative rounded-2xl border border-slate-200/80 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)] bg-white overflow-hidden">
      
      {/* Mockup Browser Chrome (Contexto de App Web) */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200/60">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-300 shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 shadow-sm" />
        </div>
        <div className="flex-1 mx-2 h-6 rounded-md bg-white border border-slate-200 flex items-center px-2.5 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 ring-2 ring-emerald-100 animate-pulse" />
          <span className="text-[10px] font-medium text-slate-400">medicore.app/nals-monitor</span>
        </div>
      </div>

      {/* Top gradient accent */}
      <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />

      {/* Monitor body (Estilo Premium del Hero Visual) */}
      <div className="bg-[#060c18] p-4 relative">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 0.5px, transparent 0.5px)', backgroundSize: '16px 16px' }} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Baby className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black text-white uppercase tracking-tight block leading-none">NALS Monitor <span className="text-blue-400">Pro</span></span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] font-bold text-slate-500">En vivo · 14:23:45</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="bg-white/[0.05] px-2 py-1 rounded border border-white/[0.06] text-[8px] font-black text-slate-300">EG <span className="text-white">39.0</span></div>
              <div className="bg-white/[0.05] px-2 py-1 rounded border border-white/[0.06] text-[8px] font-black text-slate-300">Kg <span className="text-white">3.00</span></div>
            </div>
          </div>

          {/* ECG Display Avanzado */}
          <div className="h-[64px] rounded-xl bg-black/40 border border-white/[0.04] relative overflow-hidden mb-3">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 55" preserveAspectRatio="none">
              <path d="M0,28 L45,28 L52,10 L59,46 L66,20 L73,28 L118,28 L125,10 L132,46 L139,20 L146,28 L191,28 L198,10 L205,46 L212,20 L219,28 L264,28 L271,10 L278,46 L285,20 L292,28 L337,28 L344,10 L351,46 L358,20 L365,28 L400,28"
                fill="none" stroke="url(#ecg-g)" strokeWidth="2" opacity="0.8" strokeLinecap="round">
                <animate attributeName="stroke-dashoffset" from="800" to="0" dur="2.5s" repeatCount="indefinite" />
              </path>
              <defs><linearGradient id="ecg-g" x1="0" y1="0" x2="400" y2="0"><stop offset="0%" stopColor="#22d3ee" /><stop offset="50%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
            </svg>
            <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-8 h-8 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute top-1.5 left-2.5">
              <span className="text-[6px] font-bold uppercase text-cyan-400/50 block">Cronómetro</span>
              <span className="text-[12px] font-black text-white tabular-nums leading-tight">2:47</span>
            </div>
            <div className="absolute top-1.5 right-2.5 text-right">
              <span className="text-[6px] font-bold uppercase text-slate-500 block">Evaluación</span>
              <span className="text-[12px] font-black text-cyan-300 tabular-nums leading-tight">13<span className="text-[8px] text-slate-500">s</span></span>
            </div>
          </div>

          {/* Rhythm selection */}
          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
            {['BRAD', 'ASIS', 'AESP', 'NOR'].map((r, i) => (
              <div key={r} className={`text-center py-1.5 rounded text-[7px] font-black uppercase transition-all ${i === 0 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06]'}`}>{r}</div>
            ))}
          </div>

          {/* Triad status */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { l: 'TÉRMINO', active: false },
              { l: 'GASPING', active: true, danger: true },
              { l: 'FLÁCIDO', active: true, danger: true },
              { l: 'SIMÉTRICO', active: false },
            ].map((t, i) => (
              <div key={i} className={`text-center py-1.5 rounded-lg text-[6px] font-black uppercase ${t.danger && t.active ? 'bg-red-500/15 text-red-300 border border-red-500/20' : 'bg-white/[0.02] text-slate-500 border border-white/[0.04]'}`}>{t.l}</div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { l: 'Escalas', c: 'from-indigo-600 to-indigo-500', i: <Scale className="w-3 h-3" /> },
              { l: 'Gases', c: 'from-blue-600 to-blue-500', i: <FlaskConical className="w-3 h-3" /> },
              { l: 'Drogas', c: 'from-emerald-600 to-emerald-500', i: <Syringe className="w-3 h-3" /> },
              { l: 'Causas', c: 'from-slate-700 to-slate-600', i: <ShieldAlert className="w-3 h-3 text-amber-400" /> },
            ].map(b => (
              <div key={b.l} className={`bg-gradient-to-b ${b.c} text-center py-2 rounded-lg text-white flex flex-col items-center gap-0.5 shadow-sm`}>
                {b.i}<span className="text-[7px] font-black uppercase tracking-wide">{b.l}</span>
              </div>
            ))}
          </div>

          {/* Mini log preview */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.04] space-y-1">
            {[
              { t: '14:23:01', m: 'INICIO REANIMACIÓN (3:1)', c: 'text-amber-400' },
              { t: '14:23:45', m: 'ADRENALINA IV 0.6 ml', c: 'text-emerald-400' },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-[7.5px]">
                <span className="text-slate-600 font-bold tabular-nums w-10">{l.t}</span>
                <span className={`font-bold uppercase ${l.c}`}>{l.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Bottom badges combinados */}
  <div className="flex items-center justify-center gap-3 mt-4">
    {[
      { icon: <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />, t: 'Tiempo real' },
      { icon: <WifiOff className="w-3 h-3 text-slate-400" />, t: 'Offline' },
      { icon: <ShieldAlert className="w-3 h-3 text-slate-400" />, t: 'v19.5' },
    ].map((b, i) => (
      <div key={i} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2.5 py-1 shadow-sm">
        {b.icon}
        <span className="text-[9px] font-bold text-slate-500">{b.t}</span>
      </div>
    ))}
  </div>
</div>
          </div>
        </div>
      </section>

      {/* ━━━ TRUST METRICS ━━━ */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />, v: '6+', l: 'Módulos' },
            { icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />, v: 'NRP 2025', l: 'Protocolos' },
            { icon: <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />, v: '100%', l: 'Offline' },
            { icon: <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />, v: 'Local', l: 'Datos seguros' },
          ].map((s, i) => (
            <div key={i} className="py-3.5 sm:py-5 px-3 sm:px-5 flex items-center gap-2.5 sm:gap-3 border-b sm:border-b-0 border-r border-slate-100 last:border-r-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">{s.icon}</div>
              <div><div className="text-sm sm:text-lg font-black text-slate-900 leading-tight">{s.v}</div><div className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wide">{s.l}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ CAPABILITIES ━━━ */}
      <section className="py-14 sm:py-20 px-4 sm:px-5 bg-gradient-to-b from-white to-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14 anim-rise">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-3">Ingeniería pensada para la clínica</h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium max-w-xl mx-auto">Software que no depende del WiFi del hospital. Procesamiento local, cero latencia, privacidad absoluta.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: <Smartphone className="w-5 h-5" />, title: 'Arquitectura PWA', desc: 'Instalable en móvil y tablet. Carga instantánea como app nativa sin pasar por tiendas.' },
              { icon: <Cpu className="w-5 h-5" />, title: 'Procesamiento Local', desc: 'Cálculos de dosis y epicrisis se procesan en tu navegador. Cero envío de datos a servidores.' },
              { icon: <Globe className="w-5 h-5" />, title: 'Sincronización Diferida', desc: 'Trabaja sin señal, genera reportes y compártelos cuando recuperes la conexión.' },
            ].map((f, i) => (
              <div key={i} className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all group anim-slide d2">
                <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center mb-5 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors border border-slate-100">{f.icon}</div>
                <h3 className="text-base font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ SCENARIOS ━━━ */}
      <section id="scenarios" className="py-14 sm:py-20 px-4 sm:px-5 bg-slate-900 relative overflow-hidden grain">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block bg-white/5 text-slate-300 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/10 mb-4 sm:mb-5">Casos de Uso</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-2 sm:mb-3">Construido para el momento crítico</h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Tres escenarios clínicos reales, tres herramientas que responden al instante.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              { title: 'Sala de Partos', tag: 'Reanimación neonatal', desc: 'Neonato de 32 semanas con bradicardia al nacer. Metrónomo 3:1 activo, adrenalina calculada por peso, APGAR automático, epicrisis lista por WhatsApp al terminar.', gradient: 'from-rose-500 to-pink-600', icon: <Heart className="w-6 h-6 text-white" /> },
              { title: 'UCI Neonatal', tag: 'Monitoreo de turno', desc: 'Seis incubadoras activas con alertas configuradas: bradicardia, desaturación, temperatura. Entrega de turno con reporte automático y tendencias de 12 horas.', gradient: 'from-cyan-500 to-blue-600', icon: <Activity className="w-6 h-6 text-white" /> },
              { title: 'Farmacia Clínica', tag: 'Dosis exactas', desc: 'Prematuro de 1.2 kg necesita cafeína citrato. El sistema cruza peso, EG y rango terapéutico. Detecta interacción con aminofilina antes de prescribir.', gradient: 'from-emerald-500 to-teal-600', icon: <Shield className="w-6 h-6 text-white" /> },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-slate-800/50 border border-white/5 hover:-translate-y-1 transition-all duration-300 group">
                <div className={`bg-gradient-to-br ${s.gradient} p-5 sm:p-7 relative overflow-hidden`}>
                  <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-4 border border-white/10 relative z-10">{s.icon}</div>
                  <span className="text-[10px] font-black text-white/70 uppercase tracking-widest block mb-1 relative z-10">{s.tag}</span>
                  <h3 className="text-xl font-black text-white relative z-10">{s.title}</h3>
                </div>
                <div className="p-5 sm:p-7"><p className="text-sm text-slate-300 font-medium leading-relaxed">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ MODULES CATALOG ━━━ */}
      <section id="modules" className="py-14 sm:py-20 px-4 sm:px-5 bg-slate-50/60">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-4 sm:gap-5">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-800 text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">
                <Sparkles className="w-3 h-3" /> Catálogo Clínico
              </span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mb-2">Un módulo para cada flujo crítico</h2>
              <p className="text-sm sm:text-base text-slate-500 font-medium">{priceShort} USD/{duration} {durationLabel} por módulo · 72h de prueba gratis · Paga solo lo que uses</p>
            </div>
            <div className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm whitespace-nowrap">
              {modules.filter(m => m.status === 'active').length} disponible{modules.filter(m => m.status === 'active').length > 1 ? 's' : ''} · {modules.filter(m => m.status !== 'active').length} en desarrollo
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {modules.map((mod, idx) => {
              const badge = BADGE[mod.status]
              const trial = trialFor(mod.id)
              const subbed = isSubscribed(mod.id)
              const tried = hasTried(mod.id)
              const live = mod.status === 'active'
              const c = CL[mod.color] || CL['#3b82f6']

              return (
                <div key={mod.id}
                  className={`group rounded-2xl border border-slate-200/80 overflow-hidden bg-white card-lift flex flex-col anim-slide d${Math.min(idx + 1, 6)} ${live ? 'cursor-pointer' : 'opacity-50 grayscale-[0.15]'}`}
                  onClick={() => { if (!live) return; if (!isSignedIn) return; handleModuleClick(mod.id) }}
                >
                  {/* Color strip */}
                  <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${mod.color}, ${mod.color}88)` }} />

                  <div className="p-5 sm:p-6 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className={`${c.iconBg} p-2.5 rounded-xl ${c.text} ring-4 ${c.ring}/30 shadow-sm`}>
                        {ICON_MAP[mod.icon] || <Heart className="w-5 h-5" />}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {subbed && <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">Suscrito</span>}
                        {!subbed && trial && <span className="text-[9px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><Timer className="w-3 h-3" />{trial.hours_left}h</span>}
                        {!subbed && !trial && <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${badge.cls}`}>{badge.text}</span>}
                      </div>
                    </div>

                    {/* Info */}
                    <h3 className="text-base font-black text-slate-900 mb-0.5 group-hover:text-slate-800 transition-colors">{mod.name}</h3>
                    <p className={`text-xs font-bold ${c.text} mb-3`}>{mod.tagline}</p>
                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-5 line-clamp-2">{mod.description}</p>

                    {/* Features */}
                    <ul className="space-y-2 mb-5">
                      {mod.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${c.text} flex-shrink-0 mt-0.5`} />{f}
                        </li>
                      ))}
                    </ul>
                    {mod.features.length > 3 && <p className={`text-[11px] font-bold ${c.text} mb-4`}>+{mod.features.length - 3} características más</p>}

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{priceShort} <span className="font-bold text-slate-400">USD/{duration} {durationLabel}</span></span>
                      {live && !isSignedIn && (
                        <SignInButton mode="modal">
                          <button onClick={e => e.stopPropagation()} className={`text-xs font-black ${c.text} flex items-center gap-1 hover:gap-2 transition-all`}>Probar gratis <ArrowRight className="w-3.5 h-3.5" /></button>
                        </SignInButton>
                      )}
                      {live && isSignedIn && (
                        <span className={`text-xs font-black ${c.text} flex items-center gap-1 group-hover:gap-2 transition-all`}>
                          {subbed ? 'Abrir' : trial ? 'Continuar' : tried ? 'Suscribirse' : 'Probar gratis'} <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section id="pricing" className="py-14 sm:py-24 px-4 sm:px-5 bg-gradient-to-b from-white via-slate-50/50 to-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-teal-50/40 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header centrado */}
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-teal-200 mb-5">
              <Sparkles className="w-3 h-3" /> Precio transparente
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">Paga solo lo que realmente usas.</h2>
            <p className="text-base text-slate-500 font-medium max-w-lg mx-auto">Cada módulo es independiente. Sin paquetes forzados, sin letra chica.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch gap-4 sm:gap-6 max-w-4xl mx-auto">

            {/* Card izquierda — El precio grande */}
            <div className="flex-1 relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-teal-200/25 via-cyan-100/15 to-emerald-200/20 rounded-[2.5rem] blur-2xl pointer-events-none" />
              <div className="relative bg-white rounded-[2rem] border-2 border-teal-300/50 p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(13,148,136,0.12)] h-full flex flex-col">
                <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-[10px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-teal-500/25">Recomendado</div>

                <div className="pt-4 mb-6">
                  <p className="text-sm font-bold text-slate-500 mb-4">Suscripción por módulo</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter leading-none">{priceShort}</span>
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-400">USD</span>
                      <span className="text-xs font-bold text-slate-300 -mt-1">por {duration} {durationLabel}</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-teal-600 mt-3 bg-teal-50 inline-block px-3 py-1 rounded-full border border-teal-100">≈ ${(parseFloat(price) / Math.max(1, parseInt(duration))).toFixed(2)} USD/{durationUnit === 'months' ? 'mes' : durationUnit === 'days' ? 'día' : 'año'} por módulo</p>
                </div>

                <div className="flex-1 space-y-3.5 mb-8">
                  {[
                    { t: '72 horas de prueba gratis', icon: <Timer className="w-4 h-4 text-teal-600" /> },
                    { t: 'Sin tarjeta para iniciar', icon: <Lock className="w-4 h-4 text-teal-600" /> },
                    { t: 'Funciona offline en quirófano', icon: <WifiOff className="w-4 h-4 text-teal-600" /> },
                    { t: 'Exportación ilimitada', icon: <ArrowUpRight className="w-4 h-4 text-teal-600" /> },
                    { t: 'Actualizaciones clínicas 2025', icon: <Shield className="w-4 h-4 text-teal-600" /> },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                      <div className="bg-teal-50 p-1.5 rounded-lg border border-teal-100 flex-shrink-0">{item.icon}</div>
                      {item.t}
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400">✓ Cancela online cuando quieras</p>
                </div>
              </div>
            </div>

            {/* Card derecha — Módulos disponibles */}
            <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col">
              <h3 className="text-lg font-black text-slate-900 mb-1">Módulos disponibles</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Activá los que necesites para tu práctica</p>

              <div className="flex-1 space-y-2">
                {modules.map(m => {
                  const c = CL[m.color] || CL['#3b82f6']
                  const subbed = isSubscribed(m.id)
                  const trial = trialFor(m.id)
                  const live = m.status === 'active'

                  return (
                    <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${live ? 'hover:bg-slate-50' : 'opacity-40'}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                        <div className={`shrink-0 ${c.iconBg} p-2 rounded-xl ${c.text} ring-2 ${c.ring}/20`}>
                          {ICON_MAP[m.icon] || <Heart className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold text-slate-800 block truncate">{m.name}</span>
                          <span className="text-[10px] font-medium text-slate-400 block truncate">{m.category}</span>
                        </div>
                      </div>
                      {subbed ? (
                        <span className="text-[10px] font-black text-white bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1.5 rounded-full shadow-sm shadow-teal-500/20">Activo</span>
                      ) : trial ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1"><Timer className="w-3 h-3" />{trial.hours_left}h</span>
                      ) : live ? (
                        <span className="text-[11px] font-black text-slate-800 bg-slate-100 px-3 py-1.5 rounded-full">{priceShort}<span className="text-slate-400 font-bold">/{duration}{durationUnit === 'months' ? 'm' : durationUnit === 'days' ? 'd' : 'a'}</span></span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">Pronto</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-bold">Cada módulo tiene su propio trial de 72h</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FAQ ━━━ */}
      <section id="faq" className="py-14 sm:py-20 bg-slate-50 border-y border-slate-200 px-4 sm:px-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Preguntas Frecuentes</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: '¿Tengo que pagar por todos los módulos?', a: 'No. Cada módulo se compra por separado a $3 USD/año. Pagás solo los que necesites para tu práctica clínica. Si solo usás NALS Monitor, solo pagás ese.' },
              { q: '¿Puedo usar el monitor en una reanimación real sin internet?', a: 'Sí. El NALS Monitor funciona 100% offline. Cronómetro, metrónomo 3:1, cálculos de dosis, todo corre en tu dispositivo. Solo necesitás conexión para exportar la epicrisis al final.' },
              { q: '¿Cómo calcula las dosis de adrenalina?', a: 'Automáticamente por peso del neonato: 0.02 mg/kg (0.2 ml/kg de 1:10,000) vía IV/CVU y 0.1 mg/kg (1 ml/kg) vía endotraqueal. Incluye bloqueo de seguridad de 2 minutos entre dosis.' },
              { q: '¿Cómo funciona el trial de 72 horas?', a: 'Al hacer clic en un módulo por primera vez, se activan 72 horas de acceso completo automáticamente. No se requiere tarjeta de crédito. Si el trial expira, podés suscribirte por $3/año.' },
              { q: '¿Los datos de mis pacientes están seguros?', a: 'Los datos se procesan localmente en tu dispositivo. No subimos nombres ni IDs a nuestros servidores. Las epicrisis solo se exportan cuando vos lo decidís (WhatsApp, email o portapapeles).' },
              { q: '¿Puedo cancelar mi suscripción?', a: 'Sí. Sin contratos ni penalizaciones. Tu acceso se mantiene activo hasta que se cumpla el año pagado. Las epicrisis que generaste son tuyas para siempre.' },
            ].map((faq, i) => (
              <details key={i} className="group border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer p-4 sm:p-5 font-bold text-slate-900 text-[13px] sm:text-[15px] select-none leading-snug">
                  {faq.q}
                  <span className="transition-transform duration-300 group-open:rotate-180 bg-slate-50 text-slate-400 rounded-full p-1.5 flex-shrink-0 ml-3"><ChevronDown className="w-4 h-4" /></span>
                </summary>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-slate-500 font-medium leading-relaxed text-sm border-t border-slate-50 pt-3 sm:pt-4">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

     {/* ━━━ CTA ━━━ */}
      <section className="relative py-16 sm:py-28 overflow-hidden bg-gradient-to-b from-teal-600 via-teal-700 to-cyan-800">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/[0.03] rounded-full pointer-events-none" />
        <div className="absolute top-10 left-[15%] w-24 h-24 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-16 right-[20%] w-36 h-36 bg-cyan-300/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto px-5 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5 mb-8">
            <Heart className="w-3.5 h-3.5 text-white anim-heartbeat" />
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Para profesionales de neonatología</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-5 sm:mb-6 text-white leading-[1.08]">
            Precisión clínica,<br />
            <span className="relative inline-block pb-3">
              <span className="text-cyan-200">en tus manos.</span>
              <svg className="absolute bottom-0 left-[-2%] w-[104%] h-3 opacity-50" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none">
                <path d="M4 9 C60 3, 120 3, 150 8 S240 3, 296 9" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-teal-100/70 mb-8 sm:mb-10 font-medium max-w-xl mx-auto leading-relaxed">
            Creá tu cuenta, activá el módulo que necesites y empezá a usarlo hoy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            {isSignedIn ? (
              <a href="#modules" className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white text-teal-700 px-8 py-3.5 sm:py-4 rounded-2xl hover:bg-teal-50 transition-all font-black text-base shadow-2xl shadow-black/10 active:scale-[0.98] group">
                Ver módulos <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            ) : (
              <SignUpButton mode="modal">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white text-teal-700 px-8 py-3.5 sm:py-4 rounded-2xl hover:bg-teal-50 transition-all font-black text-base shadow-2xl shadow-black/10 active:scale-[0.98] group">
                  Crear cuenta gratis <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </SignUpButton>
            )}
            <a href="#pricing" className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-bold transition-colors">
              Ver precios <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-5 mt-6 sm:mt-8">
            {['Sin tarjeta', '72h gratis', 'Offline'].map((t, i) => (
              <span key={i} className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold text-white/40">
                <CheckCircle2 className="w-3 h-3 text-white/30" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="bg-slate-50 border-t border-slate-200 px-4 sm:px-5">
        <div className="max-w-7xl mx-auto">
          {/* Top section with CTA */}
          <div className="py-12 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-1">¿Listo para modernizar tu práctica?</h3>
              <p className="text-sm text-slate-500 font-medium">Empezá gratis hoy. Sin tarjeta de crédito.</p>
            </div>
            {isSignedIn ? (
              <a href="#modules" className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-500 transition-all shadow-sm active:scale-[0.97]">
                Ir a módulos <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-500 transition-all shadow-sm active:scale-[0.97]">
                  Comenzar gratis <ArrowUpRight className="w-4 h-4" />
                </button>
              </SignUpButton>
            )}
          </div>

          {/* Links grid */}
          <div className="py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-12 gap-8 sm:gap-10">
            <div className="sm:col-span-4">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm shadow-teal-500/20">
                  <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-black text-lg tracking-tight text-slate-900">Medi<span className="text-teal-600">Core</span></span>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mb-5">Software clínico profesional para equipos de neonatología y cuidado crítico pediátrico.</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-bold text-slate-400">Todos los sistemas operativos</span>
              </div>
            </div>
            {[
              { title: 'Plataforma', links: [['Catálogo', '#modules'], ['Precios', '#pricing'], ['FAQ', '#faq'], ['Changelog', '#']] },
              { title: 'Clínico', links: [['Protocolos NRP', '#'], ['Escalas APGAR', '#'], ['Calculadora de dosis', '#'], ['Guías 2025', '#']] },
              { title: 'Legal', links: [['Privacidad', '#'], ['Términos de uso', '#'], ['Cookies', '#'], ['Contacto', '#']] },
            ].map(col => (
              <div key={col.title} className="sm:col-span-2 sm:col-start-auto">
                <h4 className="font-black text-[11px] text-slate-900 uppercase tracking-widest mb-4">{col.title}</h4>
                <ul className="space-y-2.5">{col.links.map(([l, h]) => <li key={l}><a href={h} className="text-sm text-slate-500 hover:text-teal-600 font-medium transition-colors">{l}</a></li>)}</ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 font-bold">© {new Date().getFullYear()} MediCore Software · Todos los derechos reservados</p>
            <p className="text-xs text-slate-400 font-medium">Hecho con <Heart className="w-3 h-3 text-teal-500 inline" /> para profesionales de la salud</p>
          </div>
        </div>
      </footer>

      {/* ━━━ MODALS ━━━ */}
      {modal && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          {modal === 'trial' && (
            <div className="w-full max-w-sm rounded-[2rem] p-8 bg-white shadow-2xl anim-slide text-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setModal(null)} className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-6 border border-teal-100 ring-4 ring-teal-50/50"><Zap className="w-7 h-7" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">Prueba Gratuita</h3>
              <p className="text-base font-black text-teal-600 mb-1">{selectedMod?.name}</p>
              <p className="text-sm text-slate-500 font-medium mb-7">72 horas de acceso completo. Sin tarjeta.</p>
              <button onClick={handleStartTrial} disabled={isLoading} className="w-full py-3.5 rounded-xl text-sm font-black bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98] flex justify-center items-center h-12 mb-3">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activar prueba ahora'}
              </button>
              <button onClick={() => setModal(null)} disabled={isLoading} className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
            </div>
          )}
          {modal === 'subscribe' && (
            <div className="w-full max-w-sm rounded-[2rem] p-8 bg-white shadow-2xl anim-slide text-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setModal(null)} className="absolute top-5 right-5 text-slate-300 hover:text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
              <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">Suscribirse al módulo</h3>
              <p className="text-base font-black text-teal-600 mb-1">{selectedMod?.name}</p>
              <p className="text-sm text-slate-500 font-medium mb-5">Tu período de prueba ha terminado</p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
                <div className="flex items-baseline justify-center gap-1 mb-0.5">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">{priceShort}</span>
                  <span className="text-sm font-black text-slate-400">USD/{duration} {durationLabel}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-bold">Acceso a {selectedMod?.name} por 12 meses</p>
              </div>
              <button onClick={handleSubscribe} disabled={isLoading} className="w-full py-3.5 rounded-xl text-sm font-black bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] flex justify-center items-center h-12 mb-3">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Suscribirse — ${priceTag}`}
              </button>
              <button onClick={() => setModal(null)} disabled={isLoading} className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all">Volver al catálogo</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}