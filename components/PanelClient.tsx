'use client'

import { useState, useCallback, useEffect } from 'react'
import { UserButton, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import type { Module } from '@/types'
import {
  Heart, Stethoscope, Activity, Shield, Sparkles, FileText,
  CheckCircle2, ArrowRight, Timer, Lock, Loader2, X,
  Scale, FlaskConical, Syringe, ShieldAlert, ChevronLeft,
  PanelLeftClose, PanelLeftOpen, Home, CreditCard, LogOut,
  Zap, Crown, Clock, AlertTriangle, ExternalLink
} from 'lucide-react'
import NalsMonitor from '@/components/modules/NalsMonitor'
import PalsMonitor from '@/components/modules/PalsMonitor'
import AclsMonitor from '@/components/modules/AclsMonitor'

interface ActiveTrial { module_id: string; expires_at: string; hours_left: number }

interface Props {
  userName: string
  userImage: string
  modules: Module[]
  subscribedModules: string[]
  activeTrials: ActiveTrial[]
  allTrials: string[]
}

const ICON_MAP: Record<string, React.ReactNode> = {
  '🫀': <Heart className="w-4 h-4" />, '🩺': <Stethoscope className="w-4 h-4" />,
  '📊': <Activity className="w-4 h-4" />, '💊': <Shield className="w-4 h-4" />,
  '📋': <FileText className="w-4 h-4" />, '🧪': <Sparkles className="w-4 h-4" />,
}

const CL: Record<string, { text: string; bg: string; light: string; border: string }> = {
  '#3b82f6': { text: 'text-blue-500', bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200' },
  '#8b5cf6': { text: 'text-violet-500', bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200' },
  '#06b6d4': { text: 'text-cyan-500', bg: 'bg-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-200' },
  '#10b981': { text: 'text-emerald-500', bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200' },
  '#f59e0b': { text: 'text-amber-500', bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200' },
  '#ec4899': { text: 'text-pink-500', bg: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-200' },
  '#ef4444': { text: 'text-red-500', bg: 'bg-red-500', light: 'bg-red-50', border: 'border-red-200' },
}

export function PanelClient({ userName, userImage, modules, subscribedModules, activeTrials, allTrials }: Props) {
  const router = useRouter()
  const { signOut } = useClerk()

  const [sidebar, setSidebar] = useState(false)
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [modal, setModal] = useState<'trial' | 'subscribe' | 'no_access' | null>(null)
  const [selectedMod, setSelectedMod] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [subMods, setSubMods] = useState(subscribedModules)
  const [trials, setTrials] = useState(activeTrials)
  const [allTr, setAllTr] = useState(allTrials)

  const trialFor = (id: string) => trials.find(t => t.module_id === id)
  const isSub = (id: string) => subMods.includes(id)
  const hasTried = (id: string) => allTr.includes(id)

  const accessibleModules = modules.filter(m => m.status === 'active' && (isSub(m.id) || trialFor(m.id)))
  const availableModules = modules.filter(m => m.status === 'active')
  const lockedModules = availableModules.filter(m => !isSub(m.id) && !trialFor(m.id))

  const refreshStatus = useCallback(async () => {
    const r = await fetch('/api/modules/status')
    if (r.ok) {
      const d = await r.json()
      setSubMods(d.subscribed_modules || [])
      setTrials(d.active_trials || [])
      setAllTr(d.all_trials || [])
    }
  }, [])

  const openModule = async (id: string) => {
    const m = modules.find(x => x.id === id)
    if (!m || m.status !== 'active') return

    try {
      const r = await fetch(`/api/modules/access/${id}`)
      if (!r.ok) return
      const d = await r.json()

      if (d.access) {
        setActiveModule(id)
        setSidebar(false)
        return
      }

      setSelectedMod(id)
      if (d.reason === 'no_access') setModal('trial')
      else if (d.reason === 'trial_expired') setModal('subscribe')
      else setModal('no_access')
    } catch (e) {
      console.error(e)
    }
  }

  const startTrial = async () => {
    if (!selectedMod) return
    setIsLoading(true)
    await fetch(`/api/modules/trial/${selectedMod}`, { method: 'POST' })
    await refreshStatus()
    setModal(null)
    setActiveModule(selectedMod)
    setIsLoading(false)
  }

  const subscribe = async () => {
    if (!selectedMod) return
    setIsLoading(true)
    const r = await fetch(`/api/modules/subscribe/${selectedMod}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_ref: 'SIM_' + Date.now() })
    })
    if (r.ok) { await refreshStatus(); setModal(null); setActiveModule(selectedMod) }
    setIsLoading(false)
  }

  const selMod = modules.find(m => m.id === selectedMod)

  // Close sidebar on desktop resize
  useEffect(() => {
    const h = () => { if (window.innerWidth >= 768) setSidebar(false) }
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  // ════════════════════════════════
  // MODULE FULLSCREEN
  // ════════════════════════════════
  const renderModule = (moduleId: string) => {
    const trial = trialFor(moduleId)
    const sub = isSub(moduleId)
    const mod = modules.find(m => m.id === moduleId)
    const ModComponent = moduleId === 'nals-monitor' ? NalsMonitor : moduleId === 'pals-monitor' ? PalsMonitor : moduleId === 'acls-monitor' ? AclsMonitor : null
    if (!ModComponent || !mod) return null

    return (
      <div className="fixed inset-0 bg-[#040812]">
        <div className="pb-[44px] h-full">
          <ModComponent />
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between px-3 py-2 bg-black/70 backdrop-blur-xl border-t border-white/[0.06]">
          <button onClick={() => setActiveModule(null)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95">
            <ChevronLeft className="w-4 h-4" /> Panel
          </button>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{mod.name}</span>
          <div className="flex items-center gap-2">
            {trial && !sub && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                <Timer className="w-3 h-3" />{trial.hours_left}h
              </span>
            )}
            {sub && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                <Crown className="w-3 h-3" /> Pro
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (activeModule && ['nals-monitor', 'pals-monitor', 'acls-monitor'].includes(activeModule)) {
    return renderModule(activeModule)
  }

  // ════════════════════════════════
  // PANEL / DASHBOARD
  // ════════════════════════════════
  return (
    <div className="fixed inset-0 flex bg-slate-50">

      {/* ─── SIDEBAR (desktop always visible, mobile toggle) ─── */}
      <aside className={`fixed md:relative z-40 h-full w-[260px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-out ${sidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Sidebar header */}
        <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm shadow-teal-500/20">
              <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-black tracking-tight text-slate-900">Medi<span className="text-teal-600">Core</span></span>
          </div>
          <button onClick={() => setSidebar(false)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Home */}
          <button onClick={() => { setActiveModule(null); setSidebar(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${!activeModule ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <Home className="w-4 h-4" /> Panel Principal
          </button>

          {/* Accessible modules */}
          {accessibleModules.length > 0 && (
            <div className="pt-4 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Mis Módulos</span>
            </div>
          )}
          {accessibleModules.map(m => {
            const c = CL[m.color] || CL['#3b82f6']
            const trial = trialFor(m.id)
            const sub = isSub(m.id)
            return (
              <button key={m.id} onClick={() => openModule(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${activeModule === m.id ? `${c.light} ${c.text}` : 'text-slate-600 hover:bg-slate-50'}`}>
                <div className={`w-7 h-7 rounded-lg ${activeModule === m.id ? c.bg : 'bg-slate-100'} flex items-center justify-center ${activeModule === m.id ? 'text-white' : c.text} transition-colors`}>
                  {ICON_MAP[m.icon]}
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-[13px] leading-tight">{m.name}</span>
                  {trial && !sub && <span className="text-[9px] font-medium text-amber-500">{trial.hours_left}h trial</span>}
                  {sub && <span className="text-[9px] font-medium text-emerald-500">Suscrito</span>}
                </div>
              </button>
            )
          })}

          {/* Locked modules */}
          {lockedModules.length > 0 && (
            <div className="pt-4 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Disponibles</span>
            </div>
          )}
          {lockedModules.map(m => {
            const c = CL[m.color] || CL['#3b82f6']
            return (
              <button key={m.id} onClick={() => openModule(m.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-500 transition-colors">
                  {ICON_MAP[m.icon]}
                </div>
                <div className="flex-1 text-left">
                  <span className="block text-[13px] leading-tight">{m.name}</span>
                  <span className="text-[9px] font-medium text-slate-400">{hasTried(m.id) ? '$3/año' : '72h gratis'}</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-300" />
              </button>
            )
          })}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <button onClick={() => router.push('/#pricing')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
            <CreditCard className="w-4 h-4" /> Precios
          </button>
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
            <div className="flex-1 min-w-0">
              <span className="block text-[13px] font-bold text-slate-700 truncate">{userName}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sidebar && <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setSidebar(false)} />}

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebar(true)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 -ml-1">
              <PanelLeftOpen className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              {activeModule ? modules.find(m => m.id === activeModule)?.name : 'Panel Principal'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {accessibleModules.length > 0 && (
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 hidden sm:block">
                {subMods.length} suscrito{subMods.length !== 1 ? 's' : ''} · {trials.length} trial{trials.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {!activeModule ? (
            /* ── DASHBOARD HOME ── */
            <div className="p-5 md:p-8 max-w-4xl mx-auto">
              {/* Welcome */}
              <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 mb-1">Hola, {userName.split(' ')[0]} 👋</h1>
                <p className="text-sm text-slate-500 font-medium">Accede a tus herramientas clínicas desde aquí.</p>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center"><Crown className="w-4 h-4 text-teal-600" /></div></div>
                  <span className="text-2xl font-black text-slate-900">{subMods.length}</span>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Suscritos</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Timer className="w-4 h-4 text-amber-600" /></div></div>
                  <span className="text-2xl font-black text-slate-900">{trials.length}</span>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Trials activos</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hidden sm:block">
                  <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Activity className="w-4 h-4 text-blue-600" /></div></div>
                  <span className="text-2xl font-black text-slate-900">{availableModules.length}</span>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Módulos totales</span>
                </div>
              </div>

              {/* Accessible modules */}
              {accessibleModules.length > 0 && (
                <>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Mis Herramientas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                    {accessibleModules.map(m => {
                      const c = CL[m.color] || CL['#3b82f6']
                      const trial = trialFor(m.id)
                      const sub = isSub(m.id)
                      return (
                        <button key={m.id} onClick={() => openModule(m.id)}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all text-left group active:scale-[0.98]">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg === 'bg-blue-500' ? 'from-blue-500 to-blue-600' : c.bg === 'bg-emerald-500' ? 'from-emerald-500 to-emerald-600' : 'from-teal-500 to-cyan-500'} flex items-center justify-center text-white shadow-sm`}>
                              {ICON_MAP[m.icon]}
                            </div>
                            {sub && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">PRO</span>}
                            {trial && !sub && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">{trial.hours_left}h</span>}
                          </div>
                          <h4 className="text-base font-black text-slate-900 mb-0.5">{m.name}</h4>
                          <p className="text-xs text-slate-500 font-medium mb-3">{m.tagline}</p>
                          <span className={`text-xs font-bold ${c.text} flex items-center gap-1 group-hover:gap-2 transition-all`}>
                            Abrir módulo <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Empty state */}
              {accessibleModules.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Sin módulos activos</h3>
                  <p className="text-sm text-slate-500 font-medium mb-5 max-w-sm mx-auto">
                    Aún no tenés módulos activos. Activá un trial gratuito de 72h o suscribite a un módulo.
                  </p>
                  <button onClick={() => router.push('/#modules')} className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-500 transition-all active:scale-[0.97] shadow-sm">
                    Ver catálogo <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Available to activate */}
              {lockedModules.length > 0 && (
                <>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Activar Módulos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lockedModules.map(m => {
                      const c = CL[m.color] || CL['#3b82f6']
                      const tried = hasTried(m.id)
                      return (
                        <button key={m.id} onClick={() => openModule(m.id)}
                          className="bg-white rounded-2xl border border-dashed border-slate-200 p-5 hover:border-slate-300 transition-all text-left group active:scale-[0.98]">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl ${c.light} flex items-center justify-center ${c.text}`}>
                              {ICON_MAP[m.icon]}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                              {tried ? '$3/año' : '72h gratis'}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-700 mb-0.5">{m.name}</h4>
                          <p className="text-xs text-slate-400 font-medium mb-3">{m.tagline}</p>
                          <span className="text-xs font-bold text-teal-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                            {tried ? 'Suscribirse' : 'Activar trial'} <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">
              Módulo no disponible
            </div>
          )}
        </div>
      </main>

      {/* ─── MODALS ─── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setModal(null)}>

          {modal === 'trial' && (
            <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-5 border border-teal-100 ring-4 ring-teal-50/50">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Activar Trial</h3>
              <p className="text-base font-black text-teal-600 mb-1">{selMod?.name}</p>
              <p className="text-sm text-slate-500 font-medium mb-6">72 horas de acceso completo. Sin tarjeta.</p>
              <button onClick={startTrial} disabled={isLoading} className="w-full py-3.5 rounded-xl text-sm font-black bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98] flex justify-center items-center h-12 mb-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activar ahora'}
              </button>
              <button onClick={() => setModal(null)} className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">Cancelar</button>
            </div>
          )}

          {modal === 'subscribe' && (
            <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 border border-amber-100">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Trial expirado</h3>
              <p className="text-base font-black text-teal-600 mb-1">{selMod?.name}</p>
              <p className="text-sm text-slate-500 font-medium mb-4">Tu período de prueba terminó</p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
                <div className="flex items-baseline justify-center gap-1 mb-0.5">
                  <span className="text-4xl font-black text-slate-900 tracking-tighter">$3</span>
                  <span className="text-sm font-black text-slate-400">USD/año</span>
                </div>
                <p className="text-[11px] text-slate-500 font-bold">Acceso por 12 meses</p>
              </div>
              <button onClick={subscribe} disabled={isLoading} className="w-full py-3.5 rounded-xl text-sm font-black bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98] flex justify-center items-center h-12 mb-2">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Suscribirse — $3/año'}
              </button>
              <button onClick={() => setModal(null)} className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">Volver</button>
            </div>
          )}

          {modal === 'no_access' && (
            <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5 border border-red-100">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Sin acceso</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Necesitás una suscripción activa o trial para acceder a este módulo.</p>
              <button onClick={() => { setModal(null); router.push('/#pricing') }} className="w-full py-3.5 rounded-xl text-sm font-black bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98] mb-2">
                Ver precios
              </button>
              <button onClick={() => setModal(null)} className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">Cerrar</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}