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
import CodigoRojoMonitor from '@/components/modules/CodigoRojoMonitor'

interface ActiveTrial { module_id: string; expires_at: string; hours_left: number }
interface ModuleStatus { subscribed_modules: string[]; active_trials: ActiveTrial[]; all_trials: string[] }
interface Props { isSignedIn: boolean; moduleStatus: ModuleStatus | null; modules: Module[]; price?: string; duration?: string; durationUnit?: string; monthlyPrice?: string; monthlyDuration?: string; monthlyUnit?: string; annualPrice?: string; annualDuration?: string; annualUnit?: string }

const BADGE: Record<string, { text: string; cls: string }> = {
  active: { text: 'Disponible', cls: 'bg-emerald-50/80 text-emerald-700 border border-emerald-200/60 shadow-sm' },
  coming_soon: { text: 'En desarrollo', cls: 'bg-slate-50/80 text-slate-500 border border-slate-200/60 shadow-sm' },
  beta: { text: 'Beta', cls: 'bg-sky-50/80 text-sky-600 border border-sky-200/60 shadow-sm' },
}

const ICON_MAP: Record<string, React.ReactNode> = {
  '🫀': <Heart className="w-5 h-5" />, '🩺': <Stethoscope className="w-5 h-5" />,
  '📊': <Activity className="w-5 h-5" />, '💊': <Shield className="w-5 h-5" />,
  '📋': <FileText className="w-5 h-5" />, '🧪': <Sparkles className="w-5 h-5" />,
  '🩸': <Syringe className="w-5 h-5" />,
}

const CL: Record<string, { text: string; bg: string; light: string; iconBg: string; ring: string; gradient: string }> = {
  '#3b82f6': { text: 'text-blue-600', bg: 'bg-blue-600', light: 'bg-blue-50/80', iconBg: 'bg-blue-50', ring: 'ring-blue-100', gradient: 'from-blue-500 to-blue-600' },
  '#8b5cf6': { text: 'text-violet-600', bg: 'bg-violet-600', light: 'bg-violet-50/80', iconBg: 'bg-violet-50', ring: 'ring-violet-100', gradient: 'from-violet-500 to-violet-600' },
  '#06b6d4': { text: 'text-cyan-600', bg: 'bg-cyan-600', light: 'bg-cyan-50/80', iconBg: 'bg-cyan-50', ring: 'ring-cyan-100', gradient: 'from-cyan-500 to-cyan-600' },
  '#10b981': { text: 'text-emerald-600', bg: 'bg-emerald-600', light: 'bg-emerald-50/80', iconBg: 'bg-emerald-50', ring: 'ring-emerald-100', gradient: 'from-emerald-500 to-emerald-600' },
  '#f59e0b': { text: 'text-amber-600', bg: 'bg-amber-600', light: 'bg-amber-50/80', iconBg: 'bg-amber-50', ring: 'ring-amber-100', gradient: 'from-amber-500 to-amber-600' },
  '#ec4899': { text: 'text-pink-600', bg: 'bg-pink-600', light: 'bg-pink-50/80', iconBg: 'bg-pink-50', ring: 'ring-pink-100', gradient: 'from-pink-500 to-pink-600' },
  '#ef4444': { text: 'text-red-600', bg: 'bg-red-600', light: 'bg-red-50/80', iconBg: 'bg-red-50', ring: 'ring-red-100', gradient: 'from-red-500 to-red-600' },
}

export function LandingClient({ isSignedIn: initialSignedIn, moduleStatus: initialStatus, modules, price = '20', duration = '1', durationUnit = 'years', monthlyPrice = '3', monthlyDuration = '1', monthlyUnit = 'months', annualPrice = '20', annualDuration = '1', annualUnit = 'years' }: Props) {
  const { isSignedIn: clerkSignedIn } = useUser()
  const isSignedIn = clerkSignedIn ?? initialSignedIn

  const [modStatus, setModStatus] = useState<ModuleStatus | null>(initialStatus)
  const [modal, setModal] = useState<'trial' | 'subscribe' | 'privacy' | 'terms' | 'cookies' | null>(null)
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [planType, setPlanType] = useState<'monthly' | 'annual'>('annual')
  const currentPrice = planType === 'monthly' ? monthlyPrice : annualPrice
  const currentDuration = planType === 'monthly' ? monthlyDuration : annualDuration
  const currentUnit = planType === 'monthly' ? monthlyUnit : annualUnit
  const currentDurationLabel = currentUnit === 'days' ? (currentDuration === '1' ? 'día' : 'días') : currentUnit === 'years' ? (currentDuration === '1' ? 'año' : 'años') : (currentDuration === '1' ? 'mes' : 'meses')
  const currentPriceTag = `$${currentPrice}/${currentDuration} ${currentDurationLabel}`
  const currentPriceShort = `$${currentPrice}`
  const savingsPercent = Math.round((1 - (parseFloat(annualPrice) / 12) / parseFloat(monthlyPrice)) * 100)

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

  if (activeModule && ['nals-monitor', 'pals-monitor', 'acls-monitor', 'codigo-rojo'].includes(activeModule)) {
    const trial = trialFor(activeModule)
    const subbed = isSubscribed(activeModule)
    const mod = modules.find(m => m.id === activeModule)
    const ModComponent = activeModule === 'nals-monitor' ? NalsMonitor : activeModule === 'pals-monitor' ? PalsMonitor : activeModule === 'acls-monitor' ? AclsMonitor : CodigoRojoMonitor
    return (
      <div className="fixed inset-0 bg-slate-950">
        <div className="pb-[44px] h-full">
          <ModComponent />
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-2xl border-t border-white/[0.04]">
          <button onClick={() => setActiveModule(null)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all duration-300 active:scale-95">
            <ArrowRight className="w-4 h-4 rotate-180" /> Catálogo
          </button>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{mod?.name}</span>
          <div className="flex items-center gap-2">
            {trial && !subbed && (
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1.5 shadow-sm">
                <Timer className="w-3.5 h-3.5" />{trial.hours_left}h
              </span>
            )}
            {subbed && (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4" /> Pro
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] selection:bg-teal-100 selection:text-teal-900 font-sans">

      <div className="relative bg-slate-900 text-white overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] animate-pulse" />
        <div className="relative text-center py-3 px-4 flex items-center justify-center gap-3">
          <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-widest uppercase">Nuevo</span>
          <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-slate-300">
            <span className="hidden sm:inline text-white font-bold">Activa cualquier módulo clínico</span> — 72 horas gratis, sin tarjeta
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </div>

      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/70 backdrop-blur-xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border-b border-slate-200/50' : 'bg-[#fafafa] border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">Medi<span className="text-slate-400">Core</span></span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {[['Módulos', '#modules'], ['Escenarios', '#scenarios'], ['Precio', '#pricing'], ['FAQ', '#faq']].map(([label, href]) => (
              <a key={label} href={href} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 transition-all duration-300">{label}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <a href="/panel" className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all duration-300 font-semibold text-[13px] shadow-sm active:scale-95">
                  Panel <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                </a>
                {modStatus && modStatus.subscribed_modules.length > 0 && (
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 uppercase tracking-widest shadow-sm">
                    {modStatus.subscribed_modules.length} activo{modStatus.subscribed_modules.length > 1 ? 's' : ''}
                  </span>
                )}
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-9 h-9 ring-2 ring-slate-100 rounded-xl' } }} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="hidden sm:block text-[13px] font-semibold text-slate-500 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100/50 transition-all duration-300">Entrar</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/10 transition-all duration-300 font-semibold text-[13px] active:scale-95">
                    Crear cuenta <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                  </button>
                </SignUpButton>
              </div>
            )}
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-4 py-4 space-y-1 shadow-2xl">
            {[['Módulos', '#modules'], ['Escenarios', '#scenarios'], ['Precio', '#pricing'], ['FAQ', '#faq']].map(([l, h]) => (
              <a key={l} href={h} onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">{l}</a>
            ))}
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-teal-50 via-slate-50/50 to-transparent rounded-full pointer-events-none -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-sky-50 via-slate-50/50 to-transparent rounded-full pointer-events-none translate-y-1/4 -translate-x-1/4" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            <div className="flex-1 max-w-2xl text-center lg:text-left z-10">
              <span className="inline-flex items-center gap-2 bg-white border border-slate-200/80 shadow-sm rounded-full px-4 py-1.5 text-[11px] font-bold text-slate-600 mb-8 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" /> Software médico profesional
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] mb-6 tracking-tight">
                Cuando cada segundo cuenta,{' '}
                <span className="text-teal-600">tu herramienta importa.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                Cronómetros de reanimación, escalas APGAR, dosis por peso, epicrisis por WhatsApp.{' '}
                <span className="text-slate-800 font-semibold">Todo funciona offline en quirófano.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-center lg:justify-start mb-8">
                <a href="#modules" className="inline-flex items-center justify-center gap-2.5 bg-slate-900 text-white px-7 py-3.5 rounded-xl hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 font-semibold text-sm active:scale-95 group">
                  Ver módulos clínicos <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#pricing" className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 px-7 py-3.5 rounded-xl font-semibold text-sm border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm transition-all duration-300">
                  {priceTag}/módulo
                </a>
              </div>

              <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center lg:justify-start">
                {[
                  { icon: <WifiOff className="w-4 h-4" />, t: 'Offline en quirófano' },
                  { icon: <MessageCircle className="w-4 h-4" />, t: 'Exporta por WhatsApp' },
                  { icon: <Timer className="w-4 h-4" />, t: '72h gratis' },
                ].map((b, i) => (
                  <span key={i} className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">{b.icon} {b.t}</span>
                ))}
              </div>
            </div>

            <div className="hidden lg:block flex-1 w-full max-w-lg">
              <div className="relative group perspective-1000">
                <div className="absolute -inset-4 bg-gradient-to-br from-teal-500/10 to-sky-500/10 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all duration-500" />
                
                <div className="relative rounded-[24px] border border-slate-200/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] bg-white overflow-hidden transform group-hover:-translate-y-2 transition-transform duration-500 ease-out">
                  
                  <div className="flex items-center gap-3 px-5 py-3 bg-[#fdfdfd] border-b border-slate-100">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                    </div>
                    <div className="flex-1 mx-4 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center px-3">
                      <Lock className="w-3 h-3 text-slate-400 mr-2" />
                      <span className="text-[11px] font-medium text-slate-500 tracking-wide">medicore.app/nals-monitor</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-6 relative">
                    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                            <Baby className="w-5 h-5 text-teal-400" />
                          </div>
                          <div>
                            <span className="text-[13px] font-bold text-white tracking-tight block">NALS Monitor</span>
                            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" /> En vivo · 14:23:45
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50 text-[10px] font-bold text-slate-400">EG <span className="text-white ml-1">39.0</span></div>
                          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50 text-[10px] font-bold text-slate-400">Kg <span className="text-white ml-1">3.00</span></div>
                        </div>
                      </div>

                      <div className="h-24 rounded-2xl bg-black/50 border border-slate-800 relative overflow-hidden mb-5">
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 80" preserveAspectRatio="none">
                          <path d="M0,40 L45,40 L52,15 L59,65 L66,30 L73,40 L118,40 L125,15 L132,65 L139,30 L146,40 L191,40 L198,15 L205,65 L212,30 L219,40 L264,40 L271,15 L278,65 L285,30 L292,40 L337,40 L344,15 L351,65 L358,30 L365,40 L400,40"
                            fill="none" stroke="url(#ecg-g)" strokeWidth="2.5" opacity="0.9" strokeLinecap="round">
                            <animate attributeName="stroke-dashoffset" from="800" to="0" dur="3s" repeatCount="indefinite" />
                          </path>
                          <defs><linearGradient id="ecg-g" x1="0" y1="0" x2="400" y2="0"><stop offset="0%" stopColor="#0f766e" /><stop offset="50%" stopColor="#2dd4bf" /><stop offset="100%" stopColor="#0f766e" /></linearGradient></defs>
                        </svg>
                        <div className="absolute top-3 left-4">
                          <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block mb-0.5">Cronómetro</span>
                          <span className="text-xl font-black text-white tabular-nums leading-none">2:47</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {['BRAD', 'ASIS', 'AESP', 'NOR'].map((r, i) => (
                          <div key={r} className={`text-center py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${i === 0 ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'}`}>{r}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { l: 'Escalas', i: <Scale className="w-4 h-4 mb-1.5 text-slate-300" /> },
                          { l: 'Gases', i: <FlaskConical className="w-4 h-4 mb-1.5 text-slate-300" /> },
                          { l: 'Drogas', i: <Syringe className="w-4 h-4 mb-1.5 text-teal-400" /> },
                          { l: 'Causas', i: <ShieldAlert className="w-4 h-4 mb-1.5 text-slate-300" /> },
                        ].map(b => (
                          <div key={b.l} className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 transition-colors cursor-pointer text-center py-3 rounded-xl flex flex-col items-center justify-center shadow-sm">
                            {b.i}<span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{b.l}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 divide-x divide-slate-100/0 md:divide-slate-100">
            {[
              { icon: <Activity className="w-5 h-5 text-slate-400" />, v: '6+', l: 'Módulos Clínicos' },
              { icon: <Shield className="w-5 h-5 text-slate-400" />, v: 'NRP 2025', l: 'Protocolos Activos' },
              { icon: <WifiOff className="w-5 h-5 text-slate-400" />, v: '100%', l: 'Funcionamiento Offline' },
              { icon: <Lock className="w-5 h-5 text-slate-400" />, v: 'Local', l: 'Procesamiento Seguro' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center px-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-3 text-slate-600">{s.icon}</div>
                <div className="text-2xl font-black text-slate-900 mb-1">{s.v}</div>
                <div className="text-xs font-semibold text-slate-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Ingeniería pensada para la clínica</h2>
            <p className="text-base sm:text-lg text-slate-500 font-medium max-w-2xl mx-auto">Software que no depende del WiFi del hospital. Procesamiento local, cero latencia, privacidad absoluta.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: <Smartphone className="w-6 h-6" />, title: 'Arquitectura PWA', desc: 'Instalable en móvil y tablet. Carga instantánea como app nativa sin pasar por tiendas.' },
              { icon: <Cpu className="w-6 h-6" />, title: 'Procesamiento Local', desc: 'Cálculos de dosis y epicrisis se procesan en tu navegador. Cero envío de datos a servidores.' },
              { icon: <Globe className="w-6 h-6" />, title: 'Sincronización Diferida', desc: 'Trabaja sin señal, genera reportes y compártelos cuando recuperes la conexión.' },
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-[24px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out group">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors duration-300 border border-slate-100">{f.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="scenarios" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">Casos de Uso</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Construido para el momento crítico</h2>
            <p className="text-base text-slate-500 font-medium max-w-2xl mx-auto">Tres escenarios clínicos reales, tres herramientas que responden al instante.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: 'Sala de Partos', tag: 'Reanimación neonatal', desc: 'Neonato de 32 semanas con bradicardia al nacer. Metrónomo 3:1 activo, adrenalina calculada por peso, APGAR automático, epicrisis lista por WhatsApp al terminar.', icon: <Heart className="w-6 h-6 text-slate-700" />, bg: 'bg-rose-50 border-rose-100/50' },
              { title: 'UCI Neonatal', tag: 'Monitoreo de turno', desc: 'Seis incubadoras activas con alertas configuradas: bradicardia, desaturación, temperatura. Entrega de turno con reporte automático y tendencias de 12 horas.', icon: <Activity className="w-6 h-6 text-slate-700" />, bg: 'bg-sky-50 border-sky-100/50' },
              { title: 'Farmacia Clínica', tag: 'Dosis exactas', desc: 'Prematuro de 1.2 kg necesita cafeína citrato. El sistema cruza peso, EG y rango terapéutico. Detecta interacción con aminofilina antes de prescribir.', icon: <Shield className="w-6 h-6 text-slate-700" />, bg: 'bg-emerald-50 border-emerald-100/50' },
            ].map((s, i) => (
              <div key={i} className="rounded-[24px] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 ease-out overflow-hidden flex flex-col">
                <div className={`p-8 border-b ${s.bg} flex-1`}>
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-200/50">{s.icon}</div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">{s.tag}</span>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{s.title}</h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Un módulo para cada flujo</h2>
              <p className="text-base text-slate-500 font-medium">{priceShort} USD/{duration} {durationLabel} por módulo · 72h de prueba gratis · Paga solo lo que uses</p>
            </div>
            <div className="text-sm font-semibold text-slate-600 bg-white px-5 py-2.5 rounded-xl border border-slate-200/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] whitespace-nowrap">
              {modules.filter(m => m.status === 'active').length} disponible{modules.filter(m => m.status === 'active').length > 1 ? 's' : ''} · {modules.filter(m => m.status !== 'active').length} en desarrollo
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {modules.map((mod) => {
              const badge = BADGE[mod.status]
              const trial = trialFor(mod.id)
              const subbed = isSubscribed(mod.id)
              const tried = hasTried(mod.id)
              const live = mod.status === 'active'
              const c = CL[mod.color] || CL['#3b82f6']

              return (
                <div key={mod.id}
                  className={`group rounded-[24px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white flex flex-col transition-all duration-500 ease-out ${live ? 'cursor-pointer hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1' : 'opacity-60 grayscale-[0.2]'}`}
                  onClick={() => { if (!live) return; if (!isSignedIn) return; handleModuleClick(mod.id) }}
                >
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl ${c.iconBg} ${c.text} ring-1 ${c.ring}`}>
                        {ICON_MAP[mod.icon] || <Heart className="w-6 h-6" />}
                      </div>
                      <div className="flex items-center gap-2">
                        {subbed && <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white uppercase tracking-wider shadow-sm">Suscrito</span>}
                        {!subbed && trial && <span className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1.5 shadow-sm"><Timer className="w-3.5 h-3.5" />{trial.hours_left}h</span>}
                        {!subbed && !trial && <span className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg ${badge.cls}`}>{badge.text}</span>}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{mod.name}</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2 flex-1">{mod.description}</p>

                    <ul className="space-y-3 mb-8">
                      {mod.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-3 text-[13px] text-slate-600 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />{f}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{priceShort} <span className="font-semibold text-slate-400 text-xs tracking-normal">USD/{duration} {durationLabel}</span></span>
                      </div>
                      {live && !isSignedIn && (
                        <SignInButton mode="modal">
                          <button onClick={e => e.stopPropagation()} className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5 hover:gap-2 transition-all">Probar <ArrowRight className="w-4 h-4 opacity-70" /></button>
                        </SignInButton>
                      )}
                      {live && isSignedIn && (
                        <span className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5 group-hover:gap-2 transition-all">
                          {subbed ? 'Abrir' : trial ? 'Continuar' : tried ? 'Suscribir' : 'Probar'} <ArrowRight className="w-4 h-4 opacity-70" />
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

      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Precio transparente.</h2>
            <p className="text-base sm:text-lg text-slate-500 font-medium max-w-2xl mx-auto">Cada módulo es independiente. Sin paquetes forzados, sin letra chica.</p>

            <div className="flex items-center justify-center gap-2 mt-10 bg-slate-100 p-1.5 rounded-2xl inline-flex mx-auto">
              <button onClick={() => setPlanType('monthly')} className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${planType === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Mensual</button>
              <button onClick={() => setPlanType('annual')} className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${planType === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                Anual {savingsPercent > 0 && <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full tracking-wide">-{savingsPercent}%</span>}
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch gap-6 max-w-4xl mx-auto">

            <div className="flex-1">
              <div className="bg-slate-900 text-white rounded-[24px] p-8 sm:p-10 shadow-xl h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-8">
                    <p className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-widest">Plan {planType === 'annual' ? 'Anual' : 'Mensual'}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black tracking-tighter" key={currentPrice}>${currentPrice}</span>
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-slate-400">USD</span>
                        <span className="text-xs font-semibold text-slate-500">/ {currentDuration} {currentDurationLabel}</span>
                      </div>
                    </div>
                    {planType === 'annual' && <p className="text-sm font-medium text-slate-400 mt-4">≈ ${(parseFloat(annualPrice) / 12).toFixed(2)} USD/mes</p>}
                  </div>

                  <div className="flex-1 space-y-4 mb-10">
                    {[
                      { t: '72 horas de prueba gratis' },
                      { t: 'Sin tarjeta para iniciar' },
                      { t: 'Funciona offline en quirófano' },
                      { t: 'Exportación ilimitada' },
                      { t: 'Actualizaciones clínicas 2025' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                        <CheckCircle2 className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        {item.t}
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-6 border-t border-slate-800">
                    <p className="text-xs font-medium text-slate-500">Cancela online cuando quieras</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-[24px] border border-slate-200/60 p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Módulos disponibles</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">Activá los que necesites para tu práctica</p>

              <div className="flex-1 space-y-3">
                {modules.map(m => {
                  const c = CL[m.color] || CL['#3b82f6']
                  const subbed = isSubscribed(m.id)
                  const trial = trialFor(m.id)
                  const live = m.status === 'active'

                  return (
                    <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border border-slate-100 transition-colors ${live ? 'hover:bg-slate-50' : 'opacity-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600`}>
                          {ICON_MAP[m.icon] || <Heart className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[11px] font-medium text-slate-500 block">{m.category}</span>
                        </div>
                      </div>
                      {subbed ? (
                        <span className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm">Activo</span>
                      ) : trial ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200/60 flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />{trial.hours_left}h</span>
                      ) : live ? (
                        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">${currentPrice}<span className="text-slate-400 font-semibold ml-0.5">/{currentUnit === 'months' ? 'mes' : currentUnit === 'days' ? 'día' : 'año'}</span></span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">Pronto</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-24 bg-[#fafafa] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Preguntas Frecuentes</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: '¿Tengo que pagar por todos los módulos?', a: 'No. Cada módulo se compra por separado a $3 USD/año. Pagás solo los que necesites para tu práctica clínica. Si solo usás NALS Monitor, solo pagás ese.' },
              { q: '¿Puedo usar el monitor en una reanimación real sin internet?', a: 'Sí. El NALS Monitor funciona 100% offline. Cronómetro, metrónomo 3:1, cálculos de dosis, todo corre en tu dispositivo. Solo necesitás conexión para exportar la epicrisis al final.' },
              { q: '¿Cómo calcula las dosis de adrenalina?', a: 'Automáticamente por peso del neonato: 0.02 mg/kg (0.2 ml/kg de 1:10,000) vía IV/CVU y 0.1 mg/kg (1 ml/kg) vía endotraqueal. Incluye bloqueo de seguridad de 2 minutos entre dosis.' },
              { q: '¿Cómo funciona el trial de 72 horas?', a: 'Al hacer clic en un módulo por primera vez, se activan 72 horas de acceso completo automáticamente. No se requiere tarjeta de crédito. Si el trial expira, podés suscribirte.' },
              { q: '¿Los datos de mis pacientes están seguros?', a: 'Los datos se procesan localmente en tu dispositivo. No subimos nombres ni IDs a nuestros servidores. Las epicrisis solo se exportan cuando vos lo decidís (WhatsApp, email o portapapeles).' },
              { q: '¿Puedo cancelar mi suscripción?', a: 'Sí. Sin contratos ni penalizaciones. Tu acceso se mantiene activo hasta que se cumpla el tiempo pagado. Las epicrisis que generaste son tuyas para siempre.' },
            ].map((faq, i) => (
              <details key={i} className="group border border-slate-200/60 rounded-[20px] bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-slate-900 text-[15px] select-none">
                  {faq.q}
                  <span className="transition-transform duration-300 group-open:rotate-180 text-slate-400 ml-4"><ChevronDown className="w-5 h-5" /></span>
                </summary>
                <div className="px-6 pb-6 text-slate-500 font-medium leading-relaxed text-sm border-t border-slate-50 pt-4">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-teal-500 opacity-20 blur-[100px]" />
        
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6 text-white leading-[1.1]">
            Precisión clínica,<br />
            <span className="text-slate-400">en tus manos.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 mb-10 font-medium max-w-xl mx-auto leading-relaxed">
            Creá tu cuenta, activá el módulo que necesites y empezá a usarlo hoy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isSignedIn ? (
              <a href="#modules" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl hover:bg-slate-100 transition-all duration-300 font-bold text-[15px] shadow-xl active:scale-95 group">
                Ver módulos <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
              </a>
            ) : (
              <SignUpButton mode="modal">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl hover:bg-slate-100 transition-all duration-300 font-bold text-[15px] shadow-xl active:scale-95 group">
                  Crear cuenta gratis <ArrowUpRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </SignUpButton>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="py-16 grid grid-cols-1 sm:grid-cols-12 gap-10 lg:gap-16">
            <div className="sm:col-span-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
                  <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-black text-xl tracking-tight text-slate-900">Medi<span className="text-slate-400">Core</span></span>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mb-8">Software clínico profesional para equipos de neonatología y cuidado crítico.</p>
              
              <a href="mailto:Jhrodriguez6832@gmail.com" className="inline-flex items-center gap-4 p-4 rounded-2xl bg-[#fafafa] hover:bg-slate-50 border border-slate-200/80 transition-all group w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-slate-900 transition-colors shadow-sm">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Soporte Directo</span>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">Jhrodriguez6832@gmail.com</span>
                </div>
              </a>
            </div>
            
            {[
              { title: 'Plataforma', links: [{ l: 'Catálogo', h: '#modules' }, { l: 'Precios', h: '#pricing' }, { l: 'FAQ', h: '#faq' }] },
              { title: 'Clínico', links: [{ l: 'Protocolos NRP', h: '#modules' }, { l: 'Escalas APGAR', h: '#modules' }, { l: 'Calculadora de dosis', h: '#modules' }] },
              { title: 'Legal', links: [{ l: 'Privacidad', a: () => setModal('privacy') }, { l: 'Términos de uso', a: () => setModal('terms') }, { l: 'Cookies', a: () => setModal('cookies') }] },
            ].map(col => (
              <div key={col.title} className="sm:col-span-2">
                <h4 className="font-bold text-[12px] text-slate-900 uppercase tracking-widest mb-6">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map((link: any) => (
                    <li key={link.l}>
                      {link.a ? (
                        <button onClick={link.a} className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors text-left">{link.l}</button>
                      ) : (
                        <a href={link.h} className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors block">{link.l}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-semibold">© {new Date().getFullYear()} MediCore Software. Todos los derechos reservados.</p>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">Hecho con <Heart className="w-3.5 h-3.5 text-slate-300" /> para profesionales</p>
          </div>
        </div>
      </footer>

      {modal && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          
          {modal === 'trial' && (
            <div className="w-full max-w-sm rounded-[24px] p-8 bg-white shadow-2xl text-center transform scale-100 transition-all duration-300" onClick={e => e.stopPropagation()}>
              <button onClick={() => setModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full"><X className="w-4 h-4" /></button>
              <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center mx-auto mb-6 border border-slate-100"><Zap className="w-7 h-7" /></div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Prueba Gratuita</h3>
              <p className="text-base font-bold text-slate-700 mb-2">{selectedMod?.name}</p>
              <p className="text-sm text-slate-500 font-medium mb-8">72 horas de acceso completo. Sin tarjeta.</p>
              <button onClick={handleStartTrial} disabled={isLoading} className="w-full py-4 rounded-xl text-[15px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 active:scale-95 flex justify-center items-center h-14 mb-3 shadow-lg shadow-slate-900/10">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activar prueba ahora'}
              </button>
              <button onClick={() => setModal(null)} disabled={isLoading} className="w-full py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300">Cancelar</button>
            </div>
          )}
          
          {modal === 'subscribe' && (
            <div className="w-full max-w-sm rounded-[24px] p-8 bg-white shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full"><X className="w-4 h-4" /></button>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Suscripción</h3>
              <p className="text-base font-bold text-slate-700 mb-2">{selectedMod?.name}</p>
              <p className="text-sm text-slate-500 font-medium mb-6">Tu período de prueba ha finalizado.</p>
              <div className="bg-[#fafafa] border border-slate-200/80 rounded-2xl p-6 mb-8">
                <div className="flex items-baseline justify-center gap-1.5 mb-2">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{priceShort}</span>
                  <span className="text-sm font-bold text-slate-400">USD/{duration} {durationLabel}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Acceso completo por 12 meses</p>
              </div>
              <button onClick={handleSubscribe} disabled={isLoading} className="w-full py-4 rounded-xl text-[15px] font-bold bg-slate-900 text-white shadow-lg shadow-slate-900/10 transition-all duration-300 active:scale-95 flex justify-center items-center h-14 mb-3">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Suscribirse — ${priceTag}`}
              </button>
              <button onClick={() => setModal(null)} disabled={isLoading} className="w-full py-3 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300">Volver al catálogo</button>
            </div>
          )}

          {modal === 'privacy' && (
            <div className="w-full max-w-lg rounded-[24px] p-8 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100"><Shield className="w-6 h-6" /></div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Política de Privacidad</h3>
              <div className="text-sm text-slate-600 font-medium space-y-5 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                <p>En <strong>MediCore Software</strong>, la privacidad clínica es nuestra máxima prioridad.</p>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">1. Procesamiento Local</h4>
                  <p>Todo el procesamiento clínico se realiza <strong>exclusivamente de forma local en tu dispositivo</strong>. No transmitimos ni almacenamos Historias Clínicas (HC) ni datos de salud protegidos (PHI) en nuestros servidores.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">2. Datos de Cuenta</h4>
                  <p>Únicamente almacenamos la información necesaria para gestionar tu licencia de acceso: correo electrónico, nombre y estado de suscripciones.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">3. Compartición de Datos</h4>
                  <p>No vendemos, alquilamos ni compartimos tus datos personales con terceros bajo ninguna circunstancia.</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="w-full mt-8 py-4 rounded-xl text-[15px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 active:scale-95">Entendido</button>
            </div>
          )}

          {modal === 'terms' && (
            <div className="w-full max-w-lg rounded-[24px] p-8 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100"><FileText className="w-6 h-6" /></div>
                <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-all"><X className="w-5 h-5" /></button>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Términos de Uso</h3>
              <div className="text-sm text-slate-600 font-medium space-y-5 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                <p>Al utilizar las herramientas de <strong>MediCore</strong>, aceptas los siguientes términos de servicio.</p>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">1. Descargo de Responsabilidad Médica</h4>
                  <p>MediCore es una herramienta informática de <strong>apoyo y referencia</strong>. <strong>NO ES UN DISPOSITIVO MÉDICO</strong>. Las calculadoras y protocolos no sustituyen el juicio clínico profesional. El usuario asume toda la responsabilidad médica.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">2. Suscripciones y Pagos</h4>
                  <p>Los accesos se otorgan por módulo individual. Todas las transacciones son definitivas y no reembolsables una vez activado el acceso completo, debido a la naturaleza digital del producto.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">3. Uso Aceptable</h4>
                  <p>La licencia de uso es personal e intransferible. Está prohibido aplicar ingeniería inversa o revender el acceso.</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="w-full mt-8 py-4 rounded-xl text-[15px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 active:scale-95">Aceptar y cerrar</button>
            </div>
          )}

          {modal === 'cookies' && (
            <div className="w-full max-w-sm rounded-[24px] p-8 bg-white shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <button onClick={() => setModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full"><X className="w-4 h-4" /></button>
              <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center mx-auto mb-6 border border-slate-100"><Database className="w-7 h-7" /></div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Política de Cookies</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                Nuestra plataforma es limpia. Utilizamos <strong>únicamente cookies técnicas esenciales</strong> para:
              </p>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-start gap-3 text-sm text-slate-600 font-medium"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Mantener tu sesión segura.</li>
                <li className="flex items-start gap-3 text-sm text-slate-600 font-medium"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Permitir almacenamiento offline PWA.</li>
                <li className="flex items-start gap-3 text-sm text-slate-600 font-medium"><CheckCircle2 className="w-5 h-5 text-slate-400" /> Prevenir ataques de seguridad.</li>
              </ul>
              <div className="bg-[#fafafa] p-4 rounded-xl border border-slate-200/80 mb-8 text-left">
                <p className="text-xs font-semibold text-slate-600">Cero publicidad. Cero rastreadores de terceros.</p>
              </div>
              <button onClick={() => setModal(null)} className="w-full py-4 rounded-xl text-[15px] font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all duration-300 active:scale-95">De acuerdo</button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}