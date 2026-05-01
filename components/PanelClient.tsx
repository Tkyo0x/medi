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
  Zap, Crown, Clock, AlertTriangle, ExternalLink,
  Settings, Users, BarChart3, Trash2, Plus, Search,
  RefreshCw, Eye, Ban, Gift, Database
} from 'lucide-react'
import NalsMonitor from '@/components/modules/NalsMonitor'
import PalsMonitor from '@/components/modules/PalsMonitor'
import AclsMonitor from '@/components/modules/AclsMonitor'

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
  const [adminTab, setAdminTab] = useState<'stats' | 'subs' | 'trials' | 'logs' | 'users'>('stats')
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

  const searchUsers = async (q: string) => {
    setUserSearch(q)
    if (q.length < 2) { setUserResults([]); return }
    const r = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`)
    if (r.ok) setUserResults(await r.json())
  }

  const loadAdminTab = (tab: typeof adminTab) => {
    setAdminTab(tab)
    if (tab === 'stats') loadAdminStats()
    else if (tab === 'subs') loadAdminSubs()
    else if (tab === 'trials') loadAdminTrials()
    else if (tab === 'logs') loadAdminLogs()
    else if (tab === 'users') loadAdminUsers()
  }

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
    const Comp = moduleId === 'nals-monitor' ? NalsMonitor : moduleId === 'pals-monitor' ? PalsMonitor : moduleId === 'acls-monitor' ? AclsMonitor : null
    if (!Comp || !mod) return null
    return (
      <div className="fixed inset-0 bg-[#040812]">
        <div className="pb-[44px] h-full"><Comp /></div>
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex items-center justify-between px-3 py-2 bg-black/70 backdrop-blur-xl border-t border-white/[0.06]">
          <button onClick={() => setActiveModule(null)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95"><ChevronLeft className="w-4 h-4" /> Panel</button>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{mod.name}</span>
          <div className="flex items-center gap-2">
            {isAdmin && <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20">Admin</span>}
            {!isAdmin && trial && !sub && <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1"><Timer className="w-3 h-3" />{trial.hours_left}h</span>}
            {!isAdmin && sub && <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1"><Crown className="w-3 h-3" /> Pro</span>}
          </div>
        </div>
      </div>
    )
  }

  if (activeModule && ['nals-monitor', 'pals-monitor', 'acls-monitor'].includes(activeModule)) return renderModule(activeModule)

  // ════════════════════════════════
  // ADMIN PANEL VIEW
  // ════════════════════════════════
  const AdminView = () => (
    <div className="p-4 sm:p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2"><Settings className="w-5 h-5 text-violet-600" /> Panel Administrativo</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Gestión de usuarios, suscripciones y trials</p>
        </div>
        <button onClick={() => loadAdminTab(adminTab)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Admin tabs */}
      <div className="flex gap-1 mb-5 sm:mb-6 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide -mx-1 px-1">
        {[
          { id: 'stats' as const, l: 'Resumen', i: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'users' as const, l: 'Usuarios', i: <Users className="w-3.5 h-3.5" /> },
          { id: 'subs' as const, l: 'Suscripciones', i: <Crown className="w-3.5 h-3.5" /> },
          { id: 'trials' as const, l: 'Trials', i: <Timer className="w-3.5 h-3.5" /> },
          { id: 'logs' as const, l: 'Logs', i: <Eye className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button key={t.id} onClick={() => loadAdminTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${adminTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.i} {t.l}
          </button>
        ))}
      </div>

      {adminLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}

      {/* STATS */}
      {!adminLoading && adminTab === 'stats' && adminStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {[
              { l: 'Suscripciones', v: adminStats.total_subscriptions, c: 'text-emerald-600', bg: 'bg-emerald-50' },
              { l: 'Trials Totales', v: adminStats.total_trials, c: 'text-amber-600', bg: 'bg-amber-50' },
              { l: 'Trials Activos', v: adminStats.active_trials, c: 'text-blue-600', bg: 'bg-blue-50' },
              { l: 'Accesos', v: adminStats.total_access_logs, c: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{s.v}</span>
                <span className={`block text-[10px] font-bold uppercase tracking-wide mt-1 ${s.c}`}>{s.l}</span>
              </div>
            ))}
          </div>

          {Object.keys(adminStats.subs_by_module).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-3">Suscripciones por Módulo</h3>
              <div className="space-y-2">
                {Object.entries(adminStats.subs_by_module).map(([mod, count]) => (
                  <div key={mod} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-sm font-bold text-slate-700">{mod}</span>
                    <span className="text-sm font-black text-slate-900">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminStats.recent_logs?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-3">Actividad Reciente</h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {adminStats.recent_logs.map((l: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 w-16 shrink-0">{new Date(l.created_at).toLocaleTimeString('es-ES', { hour12: false })}</span>
                      <span className="font-bold text-slate-700 truncate max-w-[120px]">{l.user_id?.slice(-8)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">{l.module_id}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${l.action?.includes('sub') ? 'bg-emerald-50 text-emerald-600' : l.action?.includes('trial') ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{l.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBSCRIPTIONS */}
      {!adminLoading && adminTab === 'subs' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-4">Otorgar Suscripción</h3>
            {/* User search */}
            <div className="relative mb-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
                <Search className="w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar por email..." value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : userSearch}
                  onChange={e => { setSelectedUser(null); searchUsers(e.target.value) }}
                  onFocus={() => { if (selectedUser) { setSelectedUser(null); setUserSearch('') } }}
                  className="flex-1 text-sm font-medium focus:outline-none" />
                {selectedUser && <button onClick={() => { setSelectedUser(null); setUserSearch('') }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
              </div>
              {userResults.length > 0 && !selectedUser && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-[200px] overflow-y-auto">
                  {userResults.map(u => (
                    <button key={u.id} onClick={() => { setSelectedUser(u); setUserResults([]) }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                      {u.image && <img src={u.image} className="w-7 h-7 rounded-full" alt="" />}
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-900 block truncate">{u.name}</span>
                        <span className="text-[11px] text-slate-500 truncate block">{u.email}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono ml-auto shrink-0">{u.id.slice(-8)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <select value={grantModule} onChange={e => setGrantModule(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none">
                <option value="">Módulo...</option>
                {modules.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button onClick={grantSub} disabled={!selectedUser || !grantModule}
                className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 transition-all disabled:opacity-40 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Otorgar
              </button>
            </div>
            {selectedUser && <p className="text-[10px] text-slate-400 mt-2">ID: {selectedUser.id}</p>}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Suscripciones ({adminSubs.length})</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {adminSubs.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">Sin suscripciones</p>}
              {adminSubs.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">{s.user_id?.slice(-12)}</span>
                    <span className="text-[10px] text-slate-500">{s.module_id} · {s.payment_ref}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${new Date(s.expires_at) > new Date() ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {new Date(s.expires_at) > new Date() ? 'Activa' : 'Expirada'}
                    </span>
                    <button onClick={() => deleteRecord('subs', s.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRIALS */}
      {!adminLoading && adminTab === 'trials' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-4">Otorgar Trial (72h)</h3>
            <div className="relative mb-3">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white">
                <Search className="w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar por email..." value={selectedUser ? `${selectedUser.name} (${selectedUser.email})` : userSearch}
                  onChange={e => { setSelectedUser(null); searchUsers(e.target.value) }}
                  onFocus={() => { if (selectedUser) { setSelectedUser(null); setUserSearch('') } }}
                  className="flex-1 text-sm font-medium focus:outline-none" />
                {selectedUser && <button onClick={() => { setSelectedUser(null); setUserSearch('') }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
              </div>
              {userResults.length > 0 && !selectedUser && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-[200px] overflow-y-auto">
                  {userResults.map(u => (
                    <button key={u.id} onClick={() => { setSelectedUser(u); setUserResults([]) }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                      {u.image && <img src={u.image} className="w-7 h-7 rounded-full" alt="" />}
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-900 block truncate">{u.name}</span>
                        <span className="text-[11px] text-slate-500 truncate block">{u.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <select value={grantModule} onChange={e => setGrantModule(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-none">
                <option value="">Módulo...</option>
                {modules.filter(m => m.status === 'active').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <button onClick={grantTrial} disabled={!selectedUser || !grantModule}
                className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-400 transition-all disabled:opacity-40 flex items-center gap-1.5">
                <Gift className="w-4 h-4" /> 72h
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Trials ({adminTrials.length})</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {adminTrials.length === 0 && <p className="text-sm text-slate-400 p-6 text-center">Sin trials</p>}
              {adminTrials.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">{t.user_id?.slice(-12)}</span>
                    <span className="text-[10px] text-slate-500">{t.module_id}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${new Date(t.expires_at) > new Date() ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                      {new Date(t.expires_at) > new Date() ? `${Math.max(0, Math.floor((new Date(t.expires_at).getTime() - Date.now()) / 3600000))}h` : 'Expirado'}
                    </span>
                    <button onClick={() => deleteRecord('trials', t.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOGS */}
      {!adminLoading && adminTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Registro de Accesos ({adminLogs.length})</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {adminLogs.map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-50 last:border-0 text-xs hover:bg-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 w-14 shrink-0">{new Date(l.created_at).toLocaleTimeString('es-ES', { hour12: false })}</span>
                  <span className="font-bold text-slate-700 truncate">{l.user_id?.slice(-12)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-500">{l.module_id}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${l.action?.includes('sub') ? 'bg-emerald-50 text-emerald-600' : l.action?.includes('trial') ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{l.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USERS */}
      {!adminLoading && adminTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Buscar usuario por email..." onChange={e => searchUsers(e.target.value)}
                className="flex-1 text-sm font-medium focus:outline-none" />
            </div>
            {userResults.length > 0 && (
              <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
                {userResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      {u.image && <img src={u.image} className="w-8 h-8 rounded-full" alt="" />}
                      <div>
                        <span className="text-sm font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-500">{u.email}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{u.id.slice(-12)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Usuarios Registrados ({adminUsers.length})</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {adminUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.image && <img src={u.image} className="w-8 h-8 rounded-full shrink-0" alt="" />}
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-900 block truncate">{u.name}</span>
                      <span className="text-[11px] text-slate-500 block truncate">{u.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-mono text-slate-400">{u.id.slice(-8)}</span>
                    <span className="text-[9px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{new Date(u.created).toLocaleDateString()}</span>
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
    <div className="fixed inset-0 flex bg-slate-50">

      <aside className={`fixed md:relative z-40 h-full w-[260px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-out ${sidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm shadow-teal-500/20"><Heart className="w-4 h-4 text-white" strokeWidth={2.5} /></div>
            <span className="text-base font-black tracking-tight text-slate-900">Medi<span className="text-teal-600">Core</span></span>
          </div>
          <button onClick={() => setSidebar(false)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button onClick={() => { setPanelView('home'); setActiveModule(null); setSidebar(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${panelView === 'home' && !activeModule ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <Home className="w-4 h-4" /> Panel Principal
          </button>

          {/* Admin button */}
          {isAdmin && (
            <button onClick={() => { setPanelView('admin'); setActiveModule(null); setSidebar(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${panelView === 'admin' ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <Settings className="w-4 h-4" /> Administración
              <span className="ml-auto text-[8px] font-black bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded">ADM</span>
            </button>
          )}

          {accessibleModules.length > 0 && (
            <div className="pt-4 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Mis Módulos</span></div>
          )}
          {accessibleModules.map(m => {
            const c = CL[m.color] || CL['#3b82f6']
            const trial = trialFor(m.id)
            const sub = subMods.includes(m.id)
            return (
              <button key={m.id} onClick={() => { openModule(m.id); setPanelView('home') }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${activeModule === m.id ? `${c.light} ${c.text}` : 'text-slate-600 hover:bg-slate-50'}`}>
                <div className={`w-7 h-7 rounded-lg ${activeModule === m.id ? c.bg : 'bg-slate-100'} flex items-center justify-center ${activeModule === m.id ? 'text-white' : c.text} transition-colors`}>{ICON_MAP[m.icon]}</div>
                <div className="flex-1 text-left">
                  <span className="block text-[13px] leading-tight">{m.name}</span>
                  {isAdmin && <span className="text-[9px] font-medium text-violet-500">Acceso total</span>}
                  {!isAdmin && trial && !sub && <span className="text-[9px] font-medium text-amber-500">{trial.hours_left}h trial</span>}
                  {!isAdmin && sub && <span className="text-[9px] font-medium text-emerald-500">Suscrito</span>}
                </div>
              </button>
            )
          })}

          {lockedModules.length > 0 && (
            <div className="pt-4 pb-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3">Disponibles</span></div>
          )}
          {lockedModules.map(m => {
            const c = CL[m.color] || CL['#3b82f6']
            return (
              <button key={m.id} onClick={() => openModule(m.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-500">{ICON_MAP[m.icon]}</div>
                <div className="flex-1 text-left">
                  <span className="block text-[13px] leading-tight">{m.name}</span>
                  <span className="text-[9px] font-medium text-slate-400">{hasTried(m.id) ? '$3/año' : '72h gratis'}</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-300" />
              </button>
            )
          })}
        </div>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <button onClick={() => router.push('/#pricing')} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"><CreditCard className="w-4 h-4" /> Precios</button>
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
            <div className="flex-1 min-w-0">
              <span className="block text-[13px] font-bold text-slate-700 truncate">{userName}</span>
              {isAdmin && <span className="text-[9px] font-bold text-violet-500">Administrador</span>}
            </div>
          </div>
        </div>
      </aside>

      {sidebar && <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setSidebar(false)} />}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebar(true)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 -ml-1"><PanelLeftOpen className="w-5 h-5" /></button>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              {panelView === 'admin' ? 'Administración' : activeModule ? modules.find(m => m.id === activeModule)?.name : 'Panel Principal'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-1 rounded-lg border border-violet-200">ADMIN</span>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {panelView === 'admin' && isAdmin ? <AdminView /> : !activeModule ? (
            <div className="p-4 sm:p-5 md:p-8 max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-900 mb-1">Hola, {userName.split(' ')[0]} {isAdmin ? '🛡️' : '👋'}</h1>
                <p className="text-sm text-slate-500 font-medium">{isAdmin ? 'Acceso total a todos los módulos.' : 'Accede a tus herramientas clínicas desde aquí.'}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center"><Crown className="w-4 h-4 text-teal-600" /></div></div>
                  <span className="text-2xl font-black text-slate-900">{isAdmin ? '∞' : subMods.length}</span>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">{isAdmin ? 'Acceso Total' : 'Suscritos'}</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><Timer className="w-4 h-4 text-amber-600" /></div></div>
                  <span className="text-2xl font-black text-slate-900">{trials.length}</span>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Trials activos</span>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hidden sm:block">
                  <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Activity className="w-4 h-4 text-blue-600" /></div></div>
                  <span className="text-2xl font-black text-slate-900">{availableModules.length}</span>
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide">Módulos</span>
                </div>
              </div>

              {accessibleModules.length > 0 && (
                <>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">{isAdmin ? 'Todos los Módulos' : 'Mis Herramientas'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3 mb-6 sm:mb-8">
                    {accessibleModules.map(m => {
                      const c = CL[m.color] || CL['#3b82f6']
                      const trial = trialFor(m.id)
                      const sub = subMods.includes(m.id)
                      return (
                        <button key={m.id} onClick={() => openModule(m.id)}
                          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all text-left group active:scale-[0.98]">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl ${c.light} flex items-center justify-center ${c.text}`}>{ICON_MAP[m.icon]}</div>
                            {isAdmin && <span className="text-[9px] font-black text-violet-600 bg-violet-50 px-2 py-1 rounded-lg border border-violet-200">ADMIN</span>}
                            {!isAdmin && sub && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">PRO</span>}
                            {!isAdmin && trial && !sub && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">{trial.hours_left}h</span>}
                          </div>
                          <h4 className="text-base font-black text-slate-900 mb-0.5">{m.name}</h4>
                          <p className="text-xs text-slate-500 font-medium mb-3">{m.tagline}</p>
                          <span className={`text-xs font-bold ${c.text} flex items-center gap-1 group-hover:gap-2 transition-all`}>Abrir módulo <ArrowRight className="w-3.5 h-3.5" /></span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {accessibleModules.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4"><Lock className="w-6 h-6 text-slate-400" /></div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Sin módulos activos</h3>
                  <p className="text-sm text-slate-500 font-medium mb-5 max-w-sm mx-auto">Aún no tenés módulos activos. Activá un trial gratuito de 72h.</p>
                  <button onClick={() => router.push('/#modules')} className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-500 transition-all active:scale-[0.97] shadow-sm">Ver catálogo <ExternalLink className="w-3.5 h-3.5" /></button>
                </div>
              )}

              {lockedModules.length > 0 && (
                <>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-3">Activar Módulos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lockedModules.map(m => {
                      const c = CL[m.color] || CL['#3b82f6']
                      const tried = hasTried(m.id)
                      return (
                        <button key={m.id} onClick={() => openModule(m.id)}
                          className="bg-white rounded-2xl border border-dashed border-slate-200 p-4 sm:p-5 hover:border-slate-300 transition-all text-left group active:scale-[0.98]">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl ${c.light} flex items-center justify-center ${c.text}`}>{ICON_MAP[m.icon]}</div>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{tried ? '$3/año' : '72h gratis'}</span>
                          </div>
                          <h4 className="text-base font-bold text-slate-700 mb-0.5">{m.name}</h4>
                          <p className="text-xs text-slate-400 font-medium mb-3">{m.tagline}</p>
                          <span className="text-xs font-bold text-teal-600 flex items-center gap-1 group-hover:gap-2 transition-all">{tried ? 'Contactar admin' : 'Activar trial'} <ArrowRight className="w-3.5 h-3.5" /></span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm font-bold">Módulo no disponible</div>
          )}
        </div>
      </main>

      {/* ─── MODALS ─── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && setModal(null)}>
          {modal === 'trial' && (
            <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-5 border border-teal-100 ring-4 ring-teal-50/50"><Zap className="w-7 h-7" /></div>
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
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 border border-amber-100"><Ban className="w-7 h-7" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Trial expirado</h3>
              <p className="text-base font-black text-teal-600 mb-1">{selMod?.name}</p>
              <p className="text-sm text-slate-500 font-medium mb-4">Tu período de prueba terminó. El sistema de pagos aún no está disponible.</p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
                <p className="text-sm font-bold text-slate-700">Contacta al administrador para activar tu suscripción</p>
                <p className="text-xs text-slate-400 mt-1">jhrodriguez6832@gmail.com</p>
              </div>
              <button onClick={() => setModal(null)} className="w-full py-3.5 rounded-xl text-sm font-black bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98] mb-2">Entendido</button>
            </div>
          )}

          {modal === 'no_access' && (
            <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5 border border-red-100"><AlertTriangle className="w-7 h-7" /></div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Sin acceso</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Necesitás una suscripción activa o trial para acceder.</p>
              <button onClick={() => { setModal(null); router.push('/#pricing') }} className="w-full py-3.5 rounded-xl text-sm font-black bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-[0.98] mb-2">Ver precios</button>
              <button onClick={() => setModal(null)} className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors">Cerrar</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}