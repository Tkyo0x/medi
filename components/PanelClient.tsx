'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { UserButton, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import type { Module } from '@/types'
import {
  Heart, Stethoscope, Activity, Shield, Sparkles, FileText,
  CheckCircle2, ArrowRight, Timer, Lock, Loader2, X,
  Scale, FlaskConical, Syringe, ShieldAlert, ChevronLeft,
  PanelLeftClose, PanelLeftOpen, Home, CreditCard, LogOut,
  Zap, Crown, Clock, AlertTriangle, ExternalLink,
  Settings, Users, BarChart3, Trash2, Plus, Search,
  RefreshCw, Eye, Ban, Gift, Database, HelpCircle
} from 'lucide-react'
import NalsMonitor from '@/components/modules/NalsMonitor'
import PalsMonitor from '@/components/modules/PalsMonitor'
import AclsMonitor from '@/components/modules/AclsMonitor'
import CodigoRojoMonitor from '@/components/modules/CodigoRojoMonitor'

interface ActiveTrial { module_id: string; expires_at: string; hours_left: number }

interface Props {
  userId: string
  userName: string
  userImage: string
  isAdmin: boolean
  modules: Module[]
  subscribedModules: string[]
  activeTrials: ActiveTrial[]
  allTrials: string[]
}

const ICON_MAP: Record<string, React.ReactNode> = {
  '🫀': <Heart className="w-5 h-5" />, '🩺': <Stethoscope className="w-5 h-5" />,
  '📊': <Activity className="w-5 h-5" />, '💊': <Shield className="w-5 h-5" />,
  '📋': <FileText className="w-5 h-5" />, '🧪': <Sparkles className="w-5 h-5" />,
  '🩸': <Syringe className="w-5 h-5" />,
}

const CL: Record<string, { text: string; bg: string; light: string; border: string }> = {
  '#3b82f6': { text: 'text-blue-600', bg: 'bg-blue-600', light: 'bg-blue-50', border: 'border-blue-200' },
  '#8b5cf6': { text: 'text-violet-600', bg: 'bg-violet-600', light: 'bg-violet-50', border: 'border-violet-200' },
  '#06b6d4': { text: 'text-cyan-600', bg: 'bg-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200' },
  '#10b981': { text: 'text-emerald-600', bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' },
  '#f59e0b': { text: 'text-amber-600', bg: 'bg-amber-600', light: 'bg-amber-50', border: 'border-amber-200' },
  '#ec4899': { text: 'text-pink-600', bg: 'bg-pink-600', light: 'bg-pink-50', border: 'border-pink-200' },
  '#ef4444': { text: 'text-red-600', bg: 'bg-red-600', light: 'bg-red-50', border: 'border-red-200' },
}

export function PanelClient({ userId, userName, userImage, isAdmin, modules, subscribedModules, activeTrials, allTrials }: Props) {
  const router = useRouter()
  const { signOut } = useClerk()

  const [sidebar, setSidebar] = useState(false)
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [panelView, setPanelView] = useState<'home' | 'admin'>('home')
  const [modal, setModal] = useState<'trial' | 'subscribe' | 'no_access' | null>(null)
  const [selectedMod, setSelectedMod] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [subMods, setSubMods] = useState(subscribedModules)
  const [trials, setTrials] = useState(activeTrials)
  const [allTr, setAllTr] = useState(allTrials)

  // Admin state
  const [adminTab, setAdminTab] = useState<'stats' | 'subs' | 'trials' | 'logs' | 'users' | 'config'>('stats')
  const [adminStats, setAdminStats] = useState<any>(null)
  const [adminSubs, setAdminSubs] = useState<any[]>([])
  const [adminTrials, setAdminTrials] = useState<any[]>([])
  const [adminLogs, setAdminLogs] = useState<any[]>([])
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [grantModule, setGrantModule] = useState('')
  const [appConfig, setAppConfig] = useState<Record<string, string>>({})
  const [configSaving, setConfigSaving] = useState(false)
  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  const trialFor = (id: string) => trials.find(t => t.module_id === id)
  const isSub = (id: string) => isAdmin || subMods.includes(id)
  const hasTried = (id: string) => allTr.includes(id)

  const accessibleModules = isAdmin
    ? modules.filter(m => m.status === 'active')
    : modules.filter(m => m.status === 'active' && (subMods.includes(m.id) || trialFor(m.id)))
  const availableModules = modules.filter(m => m.status === 'active')
  const lockedModules = isAdmin ? [] : availableModules.filter(m => !subMods.includes(m.id) && !trialFor(m.id))

  const refreshStatus = useCallback(async () => {
    const r = await fetch('/api/modules/status')
    if (r.ok) { const d = await r.json(); setSubMods(d.subscribed_modules || []); setTrials(d.active_trials || []); setAllTr(d.all_trials || []) }
  }, [])

  const openModule = async (id: string) => {
    const m = modules.find(x => x.id === id)
    if (!m || m.status !== 'active') return
    if (isAdmin) { setActiveModule(id); setSidebar(false); return }
    try {
      const r = await fetch(`/api/modules/access/${id}`)
      if (!r.ok) return
      const d = await r.json()
      if (d.access) { setActiveModule(id); setSidebar(false); return }
      setSelectedMod(id)
      if (d.reason === 'no_access') setModal('trial')
      else if (d.reason === 'trial_expired') setModal('subscribe')
      else setModal('no_access')
    } catch (e) { console.error(e) }
  }

  const startTrial = async () => {
    if (!selectedMod) return
    setIsLoading(true)
    await fetch(`/api/modules/trial/${selectedMod}`, { method: 'POST' })
    await refreshStatus(); setModal(null); setActiveModule(selectedMod); setIsLoading(false)
  }

  const selMod = modules.find(m => m.id === selectedMod)

  useEffect(() => { const h = () => { if (window.innerWidth >= 768) setSidebar(false) }; window.addEventListener('resize', h); return () => window.removeEventListener('resize', h) }, [])

  // Admin data fetchers
  const loadAdminStats = async () => { setAdminLoading(true); const r = await fetch('/api/admin/stats'); if (r.ok) setAdminStats(await r.json()); setAdminLoading(false) }
  const loadAdminSubs = async () => { setAdminLoading(true); const r = await fetch('/api/admin/subscriptions'); if (r.ok) setAdminSubs(await r.json()); setAdminLoading(false) }
  const loadAdminTrials = async () => { setAdminLoading(true); const r = await fetch('/api/admin/trials'); if (r.ok) setAdminTrials(await r.json()); setAdminLoading(false) }
  const loadAdminLogs = async () => { setAdminLoading(true); const r = await fetch('/api/admin/logs?limit=100'); if (r.ok) setAdminLogs(await r.json()); setAdminLoading(false) }
  const loadAdminUsers = async () => { setAdminLoading(true); const r = await fetch('/api/admin/users'); if (r.ok) setAdminUsers(await r.json()); setAdminLoading(false) }

  const searchUsers = (q: string) => {
    setUserSearch(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (q.trim() === '') {
      fetch('/api/admin/users').then(r => r.json()).then(data => setUserResults(data)).catch(() => {})
      return
    }
    searchTimer.current = setTimeout(async () => {
      const r = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`)
      if (r.ok) setUserResults(await r.json())
    }, 400)
  }

  const loadAdminTab = (tab: typeof adminTab) => {
    setAdminTab(tab)
    if (tab === 'stats') loadAdminStats()
    else if (tab === 'subs') loadAdminSubs()
    else if (tab === 'trials') loadAdminTrials()
    else if (tab === 'logs') loadAdminLogs()
    else if (tab === 'users') loadAdminUsers()
    else if (tab === 'config') loadConfig()
  }

  const loadConfig = async () => { setAdminLoading(true); const r = await fetch('/api/admin/config'); if (r.ok) setAppConfig(await r.json()); setAdminLoading(false) }
  const saveConfig = async () => { setConfigSaving(true); await fetch('/api/admin/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(appConfig) }); setConfigSaving(false) }

  useEffect(() => { if (panelView === 'admin') loadAdminStats() }, [panelView])

  const grantSub = async () => {
    if (!selectedUser || !grantModule) return
    setAdminLoading(true)
    await fetch('/api/admin/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: selectedUser.id, module_id: grantModule, months: 12 }) })
    setSelectedUser(null); setGrantModule(''); setUserSearch(''); setUserResults([])
    loadAdminSubs(); setAdminLoading(false)
  }

  const grantTrial = async () => {
    if (!selectedUser || !grantModule) return
    setAdminLoading(true)
    await fetch('/api/admin/trials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: selectedUser.id, module_id: grantModule, hours: 72 }) })
    setSelectedUser(null); setGrantModule(''); setUserSearch(''); setUserResults([])
    loadAdminTrials(); setAdminLoading(false)
  }

  const deleteRecord = async (type: 'subs' | 'trials', id: string) => {
    const url = type === 'subs' ? '/api/admin/subscriptions' : '/api/admin/trials'
    await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (type === 'subs') loadAdminSubs(); else loadAdminTrials()
  }

  const renderModule = (moduleId: string) => {
    const trial = trialFor(moduleId)
    const sub = isSub(moduleId)
    const mod = modules.find(m => m.id === moduleId)
    const Comp = moduleId === 'nals-monitor' ? NalsMonitor : moduleId === 'pals-monitor' ? PalsMonitor : moduleId === 'acls-monitor' ? AclsMonitor : moduleId === 'codigo-rojo' ? CodigoRojoMonitor : null
    if (!Comp || !mod) return null
    return (
      <div className="fixed inset-0 bg-[#040812]">
        <div className="pb-[44px] h-full"><Comp /></div>
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between px-3 py-2 bg-black/70 backdrop-blur-xl border-t border-white/[0.06]">
          <button onClick={() => setActiveModule(null)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95"><ChevronLeft className="w-4 h-4" /> Panel</button>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{mod.name}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => { const evt = new CustomEvent('open-tutorial'); window.dispatchEvent(evt) }} className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all"><HelpCircle className="w-3.5 h-3.5" /></button>
            {isAdmin && <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20">Admin</span>}
            {!isAdmin && trial && !sub && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1"><Timer className="w-3 h-3" />{trial.hours_left}h</span>}
            {!isAdmin && sub && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1"><Crown className="w-3 h-3" /> Pro</span>}
          </div>
        </div>
      </div>
    )
  }

  if (activeModule && ['nals-monitor', 'pals-monitor', 'acls-monitor', 'codigo-rojo'].includes(activeModule)) return renderModule(activeModule)

  // ════════════════════════════════
  // ADMIN PANEL VIEW
  // ════════════════════════════════
  const AdminView = () => (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2"><Settings className="w-6 h-6 text-violet-600" /> Panel Administrativo</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Gestión avanzada de usuarios, suscripciones y configuración.</p>
        </div>
        <button onClick={() => loadAdminTab(adminTab)} className="p-2.5 rounded-xl hover:bg-slate-200/50 bg-slate-100 text-slate-500 transition-all active:scale-95"><RefreshCw className="w-5 h-5" /></button>
      </div>

      {/* Admin tabs */}
      <div className="flex gap-2 mb-6 sm:mb-8 bg-slate-100/50 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide border border-slate-200/50">
        {[
          { id: 'stats' as const, l: 'Resumen', i: <BarChart3 className="w-4 h-4" /> },
          { id: 'users' as const, l: 'Usuarios', i: <Users className="w-4 h-4" /> },
          { id: 'subs' as const, l: 'Suscripciones', i: <Crown className="w-4 h-4" /> },
          { id: 'trials' as const, l: 'Trials', i: <Timer className="w-4 h-4" /> },
          { id: 'logs' as const, l: 'Logs', i: <Eye className="w-4 h-4" /> },
          { id: 'config' as const, l: 'Config', i: <Settings className="w-4 h-4" /> },
        ].map(t => (
          <button key={t.id} onClick={() => loadAdminTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${adminTab === t.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'}`}>
            {t.i} {t.l}
          </button>
        ))}
      </div>

      {adminLoading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>}

      {/* STATS */}
      {!adminLoading && adminTab === 'stats' && adminStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { l: 'Suscripciones', v: adminStats.total_subscriptions, c: 'text-emerald-600', bg: 'bg-emerald-50' },
              { l: 'Trials Totales', v: adminStats.total_trials, c: 'text-amber-600', bg: 'bg-amber-50' },
              { l: 'Trials Activos', v: adminStats.active_trials, c: 'text-blue-600', bg: 'bg-blue-50' },
              { l: 'Accesos Registrados', v: adminStats.total_access_logs, c: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{s.v}</span>
                <span className={`block text-xs font-bold uppercase tracking-wide mt-2 ${s.c}`}>{s.l}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.keys(adminStats.subs_by_module).length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> Suscripciones por Módulo</h3>
                <div className="space-y-3">
                  {Object.entries(adminStats.subs_by_module).map(([mod, count]) => (
                    <div key={mod} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-sm font-bold text-slate-700">{mod}</span>
                      <span className="text-lg font-black text-slate-900 bg-white px-3 py-1 rounded-xl shadow-sm">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminStats.recent_logs?.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Actividad Reciente</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {adminStats.recent_logs.map((l: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">{new Date(l.created_at).toLocaleTimeString('es-ES', { hour12: false })}</span>
                        <span className="font-bold text-sm text-slate-700 truncate max-w-[140px]">{l.user_email || l.user_id?.slice(-8)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 hidden sm:block">{l.module_id}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${l.action?.includes('sub') ? 'bg-emerald-100 text-emerald-700' : l.action?.includes('trial') ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{l.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OTHER ADMIN TABS... (Keeping structure identical, just adding subtle aesthetic touches to padding/rounding if needed, but primarily maintaining your logic) */}
      {!adminLoading && adminTab === 'config' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2"><CreditCard className="w-5 h-5 text-teal-600" /> Precios y Duración</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Precio Módulo (USD)</label>
                <input type="number" step="0.01" value={appConfig.module_price || ''} onChange={e => setAppConfig(p => ({ ...p, module_price: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base font-black text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Duración</label>
                <input type="number" value={appConfig.subscription_duration || ''} onChange={e => setAppConfig(p => ({ ...p, subscription_duration: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-base font-black text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Unidad</label>
                <select value={appConfig.subscription_unit || 'months'} onChange={e => setAppConfig(p => ({ ...p, subscription_unit: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all appearance-none cursor-pointer">
                  <option value="days">Días</option>
                  <option value="months">Meses</option>
                  <option value="years">Años</option>
                </select>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0"><Zap className="w-5 h-5 text-teal-600" /></div>
               <p className="text-sm text-slate-600 font-medium">
                 El precio actual configurado es de <span className="font-black text-slate-900">${appConfig.module_price || '3.00'} USD</span> por <span className="font-black text-slate-900">{appConfig.subscription_duration || '12'} {appConfig.subscription_unit === 'days' ? 'días' : appConfig.subscription_unit === 'years' ? 'años' : 'meses'}</span>.
               </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> Identidad de Marca</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Nombre de la Aplicación</label>
                <input type="text" value={appConfig.app_name || ''} onChange={e => setAppConfig(p => ({ ...p, app_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">URL del Logotipo</label>
                <input type="text" placeholder="https://ejemplo.com/logo.png" value={appConfig.logo_url || ''} onChange={e => setAppConfig(p => ({ ...p, logo_url: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all bg-slate-50 focus:bg-white" />
                {appConfig.logo_url && (
                  <div className="mt-4 flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex items-center justify-center">
                       <img src={appConfig.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                    </div>
                    <div>
                       <span className="text-sm font-bold text-slate-900 block">Vista previa activa</span>
                       <span className="text-xs text-slate-500">Este logo se mostrará en correos y pasarelas.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button onClick={saveConfig} disabled={configSaving}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-base font-black hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 flex justify-center items-center gap-2">
            {configSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Guardar Configuración Global</>}
          </button>
        </div>
      )}

      {/* ─── SUBSCRIPTIONS ─── */}
      {!adminLoading && adminTab === 'subs' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> Otorgar Suscripción</h3>
            {/* User search */}
            <div className="relative mb-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
                <Search className="w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Buscar por email o nombre..." value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : userSearch}
                  onChange={e => { setSelectedUser(null); searchUsers(e.target.value) }}
                  onFocus={() => { if (selectedUser) { setSelectedUser(null); setUserSearch('') }; searchUsers(''); }}
                  onBlur={() => setTimeout(() => { if (!selectedUser) setUserResults([]) }, 250)}
                  className="flex-1 text-sm font-bold text-slate-700 bg-transparent focus:outline-none" />
                {selectedUser && <button onClick={() => { setSelectedUser(null); setUserSearch(''); setUserResults([]); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>}
              </div>
              {userResults.length > 0 && !selectedUser && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-[250px] overflow-y-auto p-2">
                  {userResults.map(u => (
                    <button key={u.id} onClick={() => { setSelectedUser(u); setUserResults([]) }}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 rounded-xl text-left transition-colors">
                      {u.image && <img src={u.image} className="w-8 h-8 rounded-full shadow-sm" alt="" />}
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-black text-slate-900 block truncate">{u.name}</span>
                        <span className="text-xs font-medium text-slate-500 truncate block">{u.email}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded-lg shrink-0">{u.id.slice(-8)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <select value={grantModule} onChange={e => setGrantModule(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all">
                <option value="">Seleccionar Módulo...</option>
                {modules.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button onClick={grantSub} disabled={!selectedUser || !grantModule}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-[0.98]">
                <Plus className="w-4 h-4" /> Otorgar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Suscripciones Activas ({adminSubs.length})</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-2">
              {adminSubs.length === 0 && <div className="p-10 text-center"><p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin suscripciones</p></div>}
              {adminSubs.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-4 mb-2 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white">
                  <div className="min-w-0">
                    <span className="text-sm font-black text-slate-900 block truncate">{s.user_email || s.user_id?.slice(-12)}</span>
                    <span className="text-xs font-bold text-slate-500 mt-1 block">{s.module_id} <span className="text-slate-300 mx-1">•</span> <span className="font-mono text-[10px]">{s.payment_ref}</span></span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${new Date(s.expires_at) > new Date() ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {new Date(s.expires_at) > new Date() ? 'Activa' : 'Expirada'}
                    </span>
                    <button onClick={() => deleteRecord('subs', s.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TRIALS ─── */}
      {!adminLoading && adminTab === 'trials' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-5 flex items-center gap-2"><Gift className="w-5 h-5 text-amber-500" /> Otorgar Trial Manual (72h)</h3>
            <div className="relative mb-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-4 focus-within:ring-amber-500/10 focus-within:border-amber-500 transition-all">
                <Search className="w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Buscar por email o nombre..." value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : userSearch}
                  onChange={e => { setSelectedUser(null); searchUsers(e.target.value) }}
                  onFocus={() => { if (selectedUser) { setSelectedUser(null); setUserSearch('') }; searchUsers(''); }}
                  onBlur={() => setTimeout(() => { if (!selectedUser) setUserResults([]) }, 250)}
                  className="flex-1 text-sm font-bold text-slate-700 bg-transparent focus:outline-none" />
                {selectedUser && <button onClick={() => { setSelectedUser(null); setUserSearch(''); setUserResults([]); }} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>}
              </div>
              {userResults.length > 0 && !selectedUser && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-[250px] overflow-y-auto p-2">
                  {userResults.map(u => (
                    <button key={u.id} onClick={() => { setSelectedUser(u); setUserResults([]) }}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 rounded-xl text-left transition-colors">
                      {u.image && <img src={u.image} className="w-8 h-8 rounded-full shadow-sm" alt="" />}
                      <span className="text-sm font-black text-slate-900 block truncate">{u.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <select value={grantModule} onChange={e => setGrantModule(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 transition-all">
                <option value="">Seleccionar Módulo...</option>
                {modules.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button onClick={grantTrial} disabled={!selectedUser || !grantModule}
                className="px-6 py-3 bg-amber-500 text-white rounded-xl text-sm font-black hover:bg-amber-400 transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98]">
                <Gift className="w-4 h-4" /> 72 Horas
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Trials en Curso ({adminTrials.length})</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-2">
              {adminTrials.length === 0 && <div className="p-10 text-center"><p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin trials</p></div>}
              {adminTrials.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-4 mb-2 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all bg-white">
                  <div className="min-w-0">
                    <span className="text-sm font-black text-slate-900 block truncate">{t.user_email || t.user_id?.slice(-12)}</span>
                    <span className="text-xs font-bold text-slate-500 mt-1 block">{t.module_id}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1 ${new Date(t.expires_at) > new Date() ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Timer className="w-3 h-3"/> {new Date(t.expires_at) > new Date() ? `${Math.max(0, Math.floor((new Date(t.expires_at).getTime() - Date.now()) / 3600000))}h restan` : 'Expirado'}
                    </span>
                    <button onClick={() => deleteRecord('trials', t.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── LOGS & USERS (Simplified cleanly) ─── */}
      {!adminLoading && adminTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Registro de Accesos ({adminLogs.length})</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto p-2">
            {adminLogs.map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 mb-2 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors bg-white">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg shrink-0 border border-slate-200">{new Date(l.created_at).toLocaleTimeString('es-ES', { hour12: false })}</span>
                  <span className="font-black text-sm text-slate-700 truncate">{l.user_email || l.user_id?.slice(-12)}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-slate-500">{l.module_id}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${l.action?.includes('sub') ? 'bg-emerald-100 text-emerald-700' : l.action?.includes('trial') ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{l.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!adminLoading && adminTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Usuarios ({adminUsers.length})</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-2">
              {adminUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-4 mb-2 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all bg-white hover:shadow-sm">
                  <div className="flex items-center gap-4 min-w-0">
                    {u.image ? <img src={u.image} className="w-10 h-10 rounded-full shrink-0 shadow-sm" alt="" /> : <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0"></div>}
                    <div className="min-w-0">
                      <span className="text-sm font-black text-slate-900 block truncate">{u.name}</span>
                      <span className="text-xs font-medium text-slate-500 block truncate">{u.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{u.id.slice(-8)}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 hidden sm:block">{new Date(u.created).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  )

  // ════════════════════════════════
  // PANEL / DASHBOARD
  // ════════════════════════════════
  return (
    <div className="fixed inset-0 flex bg-slate-50/50 selection:bg-teal-500/30">

      <aside className={`fixed md:relative z-40 h-full w-[280px] bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-out shadow-2xl md:shadow-none ${sidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform"><Heart className="w-5 h-5 text-white" strokeWidth={2.5} /></div>
            <span className="text-lg font-black tracking-tight text-slate-900">Medi<span className="text-teal-600">Core</span></span>
          </div>
          <button onClick={() => setSidebar(false)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-hide">
          <button onClick={() => { setPanelView('home'); setActiveModule(null); setSidebar(false) }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${panelView === 'home' && !activeModule ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
            <Home className="w-5 h-5" /> Panel Principal
          </button>

          {/* Admin button */}
          {isAdmin && (
            <button onClick={() => { setPanelView('admin'); setActiveModule(null); setSidebar(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${panelView === 'admin' ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'}`}>
              <Settings className="w-5 h-5" /> Administración
              <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${panelView === 'admin' ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-600'}`}>Admin</span>
            </button>
          )}

          {accessibleModules.length > 0 && (
            <div className="pt-6 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Mis Herramientas</span></div>
          )}
          {accessibleModules.map(m => {
            const c = CL[m.color] || CL['#3b82f6']
            const trial = trialFor(m.id)
            const sub = subMods.includes(m.id)
            const isActive = activeModule === m.id

            return (
              <button key={m.id} onClick={() => { openModule(m.id); setPanelView('home') }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all group relative overflow-hidden ${isActive ? `bg-white shadow-md border border-slate-200/60 ring-1 ring-slate-900/5 ${c.text}` : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}>
                {/* Active left bar indicator */}
                {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${c.bg}`}></div>}
                
                <div className={`w-8 h-8 rounded-xl ${isActive ? c.bg : 'bg-slate-200/70'} flex items-center justify-center ${isActive ? 'text-white shadow-sm' : 'text-slate-500'} transition-all group-hover:scale-105`}>{ICON_MAP[m.icon]}</div>
                <div className="flex-1 text-left min-w-0">
                  <span className="block text-[13px] leading-tight truncate">{m.name}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isAdmin && <span className="text-[9px] font-bold text-violet-600 uppercase tracking-wider">Acceso total</span>}
                    {!isAdmin && trial && !sub && <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">{trial.hours_left}h trial</span>}
                    {!isAdmin && sub && <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Suscrito</span>}
                  </div>
                </div>
              </button>
            )
          })}

          {lockedModules.length > 0 && (
            <div className="pt-6 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Disponibles</span></div>
          )}
          {lockedModules.map(m => {
            const c = CL[m.color] || CL['#3b82f6']
            return (
              <button key={m.id} onClick={() => openModule(m.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all group border border-transparent">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-500 transition-colors">{ICON_MAP[m.icon]}</div>
                <div className="flex-1 text-left min-w-0">
                  <span className="block text-[13px] leading-tight truncate">{m.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{hasTried(m.id) ? 'Requiere suscripción' : '72h gratis'}</span>
                </div>
                <Lock className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <button onClick={() => router.push('/#pricing')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm active:scale-95"><CreditCard className="w-4 h-4" /> Planes y Precios</button>
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="ring-2 ring-white rounded-full shadow-sm">
               <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-black text-slate-900 truncate tracking-tight">{userName}</span>
              {isAdmin && <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Admin</span>}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 relative">
        <div className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebar(true)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 -ml-2 transition-colors"><PanelLeftOpen className="w-6 h-6" /></button>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              {panelView === 'admin' ? 'Administración' : activeModule ? modules.find(m => m.id === activeModule)?.name : 'Panel Principal'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && <span className="text-[10px] font-black text-violet-700 bg-violet-100 px-3 py-1.5 rounded-lg border border-violet-200/50 uppercase tracking-widest shadow-sm">Modo Admin</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {panelView === 'admin' && isAdmin ? AdminView() : !activeModule ? (
            <div className="p-4 sm:p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Premium Welcome Banner */}
              <div className="mb-10 relative overflow-hidden bg-white rounded-[2rem] p-8 sm:p-10 border border-slate-200/60 shadow-sm">
                <div className="relative z-10">
                   <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-3">
                     Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">{userName.split(' ')[0]}</span> {isAdmin ? '🛡️' : '👋'}
                   </h1>
                   <p className="text-slate-500 font-medium text-sm sm:text-base max-w-xl leading-relaxed">
                     {isAdmin 
                        ? 'Tienes acceso total al sistema. Monitorea métricas y gestiona las herramientas clínicas de la plataforma.' 
                        : 'Bienvenido a tu estación clínica. Selecciona un módulo inteligente para comenzar a registrar o aprender.'}
                   </p>
                </div>
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-full blur-3xl opacity-80 pointer-events-none"></div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 mb-10">
                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10 flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center ring-4 ring-white"><Crown className="w-5 h-5 text-teal-600" /></div>
                  </div>
                  <span className="relative z-10 block text-3xl font-black text-slate-900 tracking-tighter">{isAdmin ? '∞' : subMods.length}</span>
                  <span className="relative z-10 block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{isAdmin ? 'Acceso Ilimitado' : 'Módulos Pro'}</span>
                </div>
                
                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10 flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center ring-4 ring-white"><Timer className="w-5 h-5 text-amber-600" /></div>
                  </div>
                  <span className="relative z-10 block text-3xl font-black text-slate-900 tracking-tighter">{trials.length}</span>
                  <span className="relative z-10 block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Trials activos</span>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group hidden sm:block">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10 flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center ring-4 ring-white"><Activity className="w-5 h-5 text-blue-600" /></div>
                  </div>
                  <span className="relative z-10 block text-3xl font-black text-slate-900 tracking-tighter">{availableModules.length}</span>
                  <span className="relative z-10 block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Herramientas</span>
                </div>
              </div>

              {/* Active Modules Grid */}
              {accessibleModules.length > 0 && (
                <>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-slate-400" /> {isAdmin ? 'Catálogo Completo' : 'Mis Herramientas Clínicas'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10">
                    {accessibleModules.map(m => {
                      const c = CL[m.color] || CL['#3b82f6']
                      const trial = trialFor(m.id)
                      const sub = subMods.includes(m.id)
                      return (
                        <button key={m.id} onClick={() => openModule(m.id)}
                          className="relative bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 text-left group overflow-hidden">
                          {/* Ambient glow on hover */}
                          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${c.light} rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                          <div className="relative z-10 flex items-start justify-between mb-5">
                            <div className={`w-14 h-14 rounded-2xl ${c.light} flex items-center justify-center ${c.text} ring-4 ring-white shadow-sm transition-transform group-hover:scale-110 duration-300`}>
                              {ICON_MAP[m.icon]}
                            </div>
                            <div className="flex items-center gap-2">
                               {isAdmin && <span className="text-[10px] font-black text-violet-700 bg-violet-100 px-3 py-1.5 rounded-lg border border-violet-200 uppercase tracking-widest">ADMIN</span>}
                               {!isAdmin && sub && <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 uppercase tracking-widest">PRO</span>}
                               {!isAdmin && trial && !sub && <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1 uppercase tracking-widest"><Timer className="w-3 h-3" /> {trial.hours_left}h</span>}
                            </div>
                          </div>
                          <h4 className="relative z-10 text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-slate-800 transition-colors">{m.name}</h4>
                          <p className="relative z-10 text-sm text-slate-500 font-medium mb-6 line-clamp-2 leading-relaxed">{m.tagline}</p>
                          <div className="relative z-10">
                             <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${c.text} bg-white border border-slate-200 shadow-sm group-hover:shadow border-opacity-50 transition-all group-hover:gap-3`}>Abrir módulo <ArrowRight className="w-4 h-4" /></span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Empty State */}
              {accessibleModules.length === 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-12 text-center shadow-sm mb-10">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6 ring-8 ring-white shadow-sm border border-slate-100"><Lock className="w-8 h-8 text-slate-400" /></div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Tu estación está vacía</h3>
                  <p className="text-base text-slate-500 font-medium mb-8 max-w-md mx-auto leading-relaxed">Aún no cuentas con herramientas activas. Explora nuestro catálogo y activa un período de prueba gratuito de 72 horas para probar su potencial.</p>
                  <button onClick={() => router.push('/#modules')} className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-[0.97] shadow-lg shadow-slate-900/20 uppercase tracking-widest">Explorar Catálogo <ExternalLink className="w-4 h-4" /></button>
                </div>
              )}

              {/* Locked Modules Grid */}
              {lockedModules.length > 0 && (
                <>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Lock className="w-4 h-4 text-slate-400" /> Descubre más módulos
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {lockedModules.map(m => {
                      const c = CL[m.color] || CL['#3b82f6']
                      const tried = hasTried(m.id)
                      return (
                        <button key={m.id} onClick={() => openModule(m.id)}
                          className="bg-white rounded-[2rem] border border-slate-200/80 border-dashed p-5 sm:p-6 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group active:scale-[0.98]">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-2xl ${c.light} flex items-center justify-center ${c.text} opacity-70 group-hover:opacity-100 transition-opacity`}>{ICON_MAP[m.icon]}</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">{tried ? 'Bloqueado' : 'Trial Disponible'}</span>
                          </div>
                          <h4 className="text-lg font-black text-slate-800 tracking-tight mb-1">{m.name}</h4>
                          <p className="text-xs text-slate-400 font-medium mb-5 line-clamp-2 leading-relaxed">{m.tagline}</p>
                          <span className="text-xs font-black uppercase tracking-widest text-teal-600 flex items-center gap-1.5 group-hover:gap-2.5 transition-all">{tried ? 'Renovar acceso' : 'Probar gratis'} <ArrowRight className="w-4 h-4" /></span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Loader2 className="w-8 h-8 animate-spin mb-4 text-slate-300" />
               <span className="text-sm font-bold tracking-widest uppercase">Cargando entorno...</span>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODALS ─── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={e => e.target === e.currentTarget && setModal(null)}>
          
          {modal === 'trial' && (
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl ring-1 ring-slate-900/5 text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 rounded-[2rem] bg-teal-50 flex items-center justify-center mx-auto mb-6 shadow-inner border border-teal-100 relative">
                 <div className="absolute inset-0 bg-teal-400/20 rounded-[2rem] animate-ping opacity-20"></div>
                 <Zap className="w-10 h-10 text-teal-600 relative z-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Desbloquea el Potencial</h3>
              <p className="text-lg font-black text-teal-600 mb-2">{selMod?.name}</p>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">Disfruta de 72 horas de acceso clínico completo y sin restricciones. No solicitamos tarjeta de crédito.</p>
              <button onClick={startTrial} disabled={isLoading} className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 flex justify-center items-center mb-3">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activar Trial Gratis'}
              </button>
              <button onClick={() => setModal(null)} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
            </div>
          )}

          {modal === 'subscribe' && (
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl ring-1 ring-slate-900/5 text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 rounded-[2rem] bg-amber-50 flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100">
                 <Ban className="w-10 h-10 text-amber-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Período Concluido</h3>
              <p className="text-lg font-black text-amber-600 mb-2">{selMod?.name}</p>
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">Tu acceso de prueba ha finalizado. Esperamos que la herramienta haya sido de gran utilidad clínica.</p>
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-8">
                <p className="text-sm font-black text-slate-800 mb-1">Activa tu suscripción Pro</p>
                <p className="text-xs text-slate-500 mb-3">Contacta al administrador del sistema para obtener tu licencia completa.</p>
                <a href="mailto:jhrodriguez6832@gmail.com" className="inline-flex items-center justify-center bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-black text-slate-700 shadow-sm hover:shadow hover:text-slate-900 transition-all">jhrodriguez6832@gmail.com</a>
              </div>
              <button onClick={() => setModal(null)} className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20">Entendido</button>
            </div>
          )}

          {modal === 'no_access' && (
            <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 sm:p-10 shadow-2xl ring-1 ring-slate-900/5 text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 rounded-[2rem] bg-red-50 flex items-center justify-center mx-auto mb-6 shadow-inner border border-red-100">
                 <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Acceso Restringido</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">Se requiere una licencia activa o un período de prueba válido para acceder a este módulo clínico.</p>
              <button onClick={() => { setModal(null); router.push('/#pricing') }} className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 mb-3">Ver Planes Disponibles</button>
              <button onClick={() => setModal(null)} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Volver</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}