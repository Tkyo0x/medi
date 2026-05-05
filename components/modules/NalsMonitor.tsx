'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Syringe, Clock, Volume2, VolumeX, Pause, Play, XCircle, ShieldAlert,
  Power, Droplets, Activity, Check, FileText, Copy, Wind, FlaskConical,
  Mail, MessageCircle, ClipboardList, ListOrdered, Biohazard, CircleDot,
  Baby, Scale, RotateCcw, AlertCircle, Trash2, ChevronUp, Waves, Hand,
  Flame, Bell, Eraser, GitGraph, HeartPulse, PlusCircle, AlertTriangle,
  TestTube, X, Zap, HelpCircle
} from 'lucide-react'
import ModuleTutorial, { useTutorial } from '@/components/tutorial/ModuleTutorial'
import { NALS_SLIDES, NALS_STEPS } from '@/components/tutorial/nalsTutorial'

const CICLO = 60

const RITMOS: Record<string, { nombre: string; corto: string }> = {
  BRADY: { nombre: 'Bradicardia < 60 lpm', corto: 'BRAD' },
  ASYSTOLE: { nombre: 'Asistolia', corto: 'ASIS' },
  PEA: { nombre: 'AESP', corto: 'AESP' },
  NORMAL: { nombre: 'FC > 100 lpm', corto: 'NOR' },
}

const APGAR: Record<string, { label: string; options: string[] }> = {
  appearance: { label: 'Apariencia (Color)', options: ['Cianosis/Palidez (0)', 'Acrocianosis (1)', 'Rosado (2)'] },
  pulse: { label: 'Pulso (FC)', options: ['Ausente (0)', '< 100 lpm (1)', '> 100 lpm (2)'] },
  grimace: { label: 'Reflejos', options: ['Sin respuesta (0)', 'Muecas (1)', 'Llanto/Tos (2)'] },
  activity: { label: 'Tono Muscular', options: ['Flácido (0)', 'Cierta flexión (1)', 'Activo (2)'] },
  respiration: { label: 'Respiración', options: ['Ausente (0)', 'Débil (1)', 'Llanto fuerte (2)'] },
}

const SARNAT = [
  { stage: 'Grado I (Leve)', desc: 'Hiperalerta, midriasis, taquicardia, sin convulsiones.', color: 'text-emerald-400', border: 'border-emerald-500/20 hover:border-emerald-500/40' },
  { stage: 'Grado II (Moderada)', desc: 'Letargo, miosis, bradicardia, posibles convulsiones.', color: 'text-amber-400', border: 'border-amber-500/20 hover:border-amber-500/40' },
  { stage: 'Grado III (Severa)', desc: 'Estupor/Coma, pupilas variables, convulsiones frecuentes.', color: 'text-red-400', border: 'border-red-500/20 hover:border-red-500/40' },
]

const SPO2 = [
  { min: 1, range: '60-65%' }, { min: 2, range: '65-70%' }, { min: 3, range: '70-75%' },
  { min: 4, range: '75-80%' }, { min: 5, range: '80-85%' }, { min: 10, range: '85-95%' },
]

const CAUSAS = [
  { id: 'hypoxia', nombre: 'Hipoxia / Ventilación', acciones: [
    { id: 'fio2', label: 'FiO2 100%', msg: 'Oxígeno al cien por ciento' },
    { id: 'tet', label: 'Verificar TET', msg: 'Verificando tubo endotraqueal' },
    { id: 'ml', label: 'Máscara Laríngea', msg: 'Colocación de máscara laríngea' },
  ]},
  { id: 'hypovolemia', nombre: 'Hipovolemia', acciones: [
    { id: 'bolo', label: 'Bolo Salino 10ml/kg', msg: 'Administrando bolo salino' },
    { id: 'sangre', label: 'Sangre O Neg', msg: 'Transfusión sangre O negativo' },
  ]},
  { id: 'pneumothorax', nombre: 'Neumotórax', acciones: [
    { id: 'aguja', label: 'Aspiración Aguja', msg: 'Aspiración con aguja' },
    { id: 'tubo', label: 'Tubo de Tórax', msg: 'Tubo pleural' },
  ]},
  { id: 'infectious', nombre: 'Riesgo Infeccioso', acciones: [
    { id: 'sarna', label: 'Escabiosis', msg: 'Sarna detectada' },
    { id: 'aislamiento', label: 'Aislamiento', msg: 'Aislamiento activo' },
  ]},
  { id: 'acceso', nombre: 'Acceso Vascular', acciones: [
    { id: 'cvu', label: 'CVU (Umbilical)', msg: 'Acceso venoso umbilical' },
    { id: 'io', label: 'Intraóseo', msg: 'Acceso intraóseo establecido' },
    { id: 'periferico', label: 'Periférico', msg: 'Acceso periférico establecido' },
  ]},
]

const SOPA = [
  { id: 'M', desc: 'Máscara' }, { id: 'R', desc: 'Reubicación' },
  { id: 'S', desc: 'Succión' }, { id: 'O', desc: 'Open' },
  { id: 'P', desc: 'Presión ↑' }, { id: 'A', desc: 'Alternativa' },
]

function Ecg({ isActive, ritmo, isPaused, isFinished }: { isActive: boolean; ritmo: string; isPaused: boolean; isFinished: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const xR = useRef(0), yR = useRef(0), pR = useRef(0)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d', { alpha: false })!
    const resize = () => { if (c.parentElement) { c.width = c.parentElement.clientWidth; c.height = c.parentElement.clientHeight; yR.current = c.height / 2; ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, c.width, c.height) } }
    window.addEventListener('resize', resize); resize()
    let id: number
    const draw = () => {
      if (!c || !ctx) return
      ctx.fillStyle = '#020617'; ctx.globalAlpha = 0.12; ctx.fillRect(xR.current, 0, 50, c.height); ctx.globalAlpha = 1
      ctx.strokeStyle = isFinished ? '#334155' : isPaused ? '#475569' : '#22d3ee'
      ctx.lineWidth = 2.5; ctx.shadowBlur = (!isPaused && !isFinished) ? 12 : 0; ctx.shadowColor = '#22d3ee'
      ctx.beginPath(); ctx.moveTo(xR.current, yR.current)
      let ny = c.height / 2
      if (isActive && !isFinished && !isPaused) {
        pR.current += 0.12
        const cl = ritmo === 'BRADY' ? 14 : 5.5, bp = pR.current % cl, h = c.height, s = h / 4.5
        let y = 0
        if (bp < 0.6) y = Math.sin((bp / 0.6) * Math.PI) * (-s * 0.22)
        else if (bp >= 0.8 && bp < 1.0) y = (s * 0.25) - ((bp - 0.8) / 0.2) * (s * 2.8)
        else if (bp >= 1.0 && bp < 1.2) y = (-s * 2.15) + ((bp - 1.0) / 0.2) * (s * 3.1)
        else if (bp >= 2.0 && bp < 3.0) y = Math.sin(((bp - 2.0)) * Math.PI) * (-s * 0.45)
        ny = (h / 2) + y + (Math.random() - 0.5) * 1.2
      }
      xR.current += 4.5
      if (xR.current >= c.width) { xR.current = 0; ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, c.width, c.height) }
      ctx.lineTo(xR.current, ny); ctx.stroke(); yR.current = ny
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize) }
  }, [isActive, ritmo, isPaused, isFinished])

  return <div className="w-full h-full overflow-hidden"><canvas ref={ref} className="w-full h-full block" /></div>
}

type Log = { time: string; elapsed: string; msg: string; type: string }
type Drug = { nombre: string; dosis: string; via: string; time: string; elapsed: string }
type Fluid = { nombre: string; volumen: string; time: string; elapsed: string }
type Gas = { ph: string; pco2: string; po2: string; hco3: string; eb: string; lac: string; time: string; elapsed: string }

export default function NalsMonitor() {
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isVentilating, setIsVentilating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [weightStr, setWeightStr] = useState('3.00')
  const [egStr, setEgStr] = useState('39.0')
  const [nombre, setNombre] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [epiSec, setEpiSec] = useState(0)
  const [logs, setLogs] = useState<Log[]>([])
  const [modal, setModal] = useState<string | null>(null)
  const [compCount, setCompCount] = useState(0)
  const [ventCount, setVentCount] = useState(0)
  const [sopa, setSopa] = useState<string[]>([])
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [fluids, setFluids] = useState<Fluid[]>([])
  const [glicemia, setGlicemia] = useState<number | null>(null)
  const [glicInput, setGlicInput] = useState('')
  const [voice, setVoice] = useState(true)
  const [result, setResult] = useState('EN CURSO')
  const [noRetorno, setNoRetorno] = useState(false)
  const [alerts, setAlerts] = useState<{ id: number; msg: string; color: string }[]>([])
  const [tep, setTep] = useState({ apariencia: 'TÉRMINO', resp: 'ESFUERZO (+)', circ: 'TONO (+)', sim: 'SIMÉTRICO' })
  const [ritmo, setRitmo] = useState('BRADY')
  const [now, setNow] = useState(new Date())
  const [tab, setTab] = useState('report')
  const [apgar, setApgar] = useState<Record<string, number>>({ appearance: 0, pulse: 0, grimace: 0, activity: 0, respiration: 0 })
  const [apgarHist, setApgarHist] = useState<{ time: string; score: number }[]>([])
  const [sarnat, setSarnat] = useState<typeof SARNAT[0] | null>(null)
  const [gases, setGases] = useState({ ph: '', pco2: '', po2: '', hco3: '', eb: '', lac: '' })
  const [gasHist, setGasHist] = useState<Gas[]>([])

  const tRef = useRef<NodeJS.Timeout | null>(null)
  const mRef = useRef<NodeJS.Timeout | null>(null)
  const { showTutorial, setShowTutorial } = useTutorial('nals-monitor')
  const tutorialActive = useRef(false)
  useEffect(() => { tutorialActive.current = showTutorial }, [showTutorial])

  useEffect(() => {
    const h = () => setShowTutorial(true)
    window.addEventListener('open-tutorial', h)
    return () => window.removeEventListener('open-tutorial', h)
  }, [setShowTutorial])

  useEffect(() => {
    const h = () => setModal(null) // only tutorial can close modals via this event
    window.addEventListener('tutorial-close-modal', h)
    return () => window.removeEventListener('tutorial-close-modal', h)
  }, [])

  // Block manual modal close (X buttons) during tutorial
  const closeModal = () => { if (!tutorialActive.current) setModal(null) }

  const w = useMemo(() => parseFloat(weightStr) || 0, [weightStr])
  const dose = useMemo(() => { const x = Math.max(0.01, w); return { epiLow: (x * 0.1).toFixed(2), epiHigh: (x * 0.3).toFixed(2), epiET: (x * 1.0).toFixed(2), bolus: (x * 10).toFixed(1) } }, [w])
  const min = useMemo(() => Math.floor(elapsed / 60) + 1, [elapsed])
  const spo2 = useMemo(() => (SPO2.find(t => t.min === Math.min(min, 10)) || SPO2[5]).range, [min])
  const epiLock = useMemo(() => drugs.some(d => d.nombre.includes('Adrenalina')) && epiSec < 120, [drugs, epiSec])
  const apgarTotal = useMemo(() => Object.values(apgar).reduce((a, b) => a + b, 0), [apgar])
  const steps = useMemo(() => {
    const s: string[] = []
    if (logs.some(l => l.msg.includes('PASO INICIAL'))) s.push('A')
    if (ventCount > 0) s.push('VPP')
    if (sopa.length > 0) s.push('SOPA')
    if (compCount > 0) s.push('C')
    if (drugs.some(d => d.nombre.includes('Adrenalina'))) s.push('EPI')
    return s
  }, [logs, ventCount, sopa, compCount, drugs])

  const say = useCallback((t: string) => { if (!voice || typeof window === 'undefined' || !window.speechSynthesis) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'es-ES'; u.rate = 1.05; window.speechSynthesis.speak(u) }, [voice])
  const log = useCallback((msg: string, type = 'EVENT') => { const e = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`; const t = new Date().toLocaleTimeString('es-ES', { hour12: false }); setLogs(p => [{ time: t, elapsed: e, msg, type }, ...p]) }, [elapsed])
  const alert = useCallback((msg: string, color = 'bg-blue-600') => { const id = Date.now(); setAlerts(p => [{ id, msg, color }, ...p]); setTimeout(() => setAlerts(p => p.filter(a => a.id !== id)), 3500) }, [])
  const ts = () => ({ time: new Date().toLocaleTimeString('es-ES', { hour12: false }), elapsed: `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}` })

  const start = () => { setIsActive(true); setIsCompressing(true); log('INICIO REANIMACIÓN (3:1)', 'SYSTEM'); say('Iniciando reanimación. Relación tres uno.') }
  const step = (n: string, v: string) => { if (!logs.some(l => l.msg.includes(n))) { log(`PASO INICIAL: ${n}`, 'SYSTEM'); say(v); alert(`${n}`, 'bg-blue-500') } }

  const giveDrug = (nombre: string, dosis: string, via: string) => {
    if (nombre.includes('Adrenalina') && epiLock) { alert('ESPERE 2 MIN', 'bg-red-600'); say('Espere dos minutos.'); return }
    const { time, elapsed } = ts()
    setDrugs(p => [...p, { nombre, dosis, via, time, elapsed }])
    if (nombre.includes('Adrenalina')) { setEpiSec(0); say(`Adrenalina ${dosis} administrada.`); alert('Adrenalina OK', 'bg-emerald-600') }
    log(`ADMIN: ${nombre} ${dosis}`, 'DRUG'); if (!tutorialActive.current) setModal(null)
  }

  const giveFluid = (nombre: string, vol: string) => {
    const { time, elapsed } = ts()
    setFluids(p => [...p, { nombre, volumen: vol, time, elapsed }])
    log(`ADMIN: ${nombre} ${vol}ml`, 'DRUG'); say(`${nombre} administrado.`); alert(`${nombre} OK`, 'bg-blue-600'); if (!tutorialActive.current) setModal(null)
  }

  const rce = () => { setIsActive(false); setIsChecking(false); setResult('RCE / ESTABLE'); log('RCE LOGRADO', 'SYSTEM'); say('Retorno a la circulación espontánea logrado.'); setModal('export') }
  const noReturn = () => { setIsActive(false); setIsChecking(false); setResult('NO RETORNO / FALLECIMIENTO'); setNoRetorno(true); log('NO RETORNO - FALLECIMIENTO', 'SYSTEM'); say('No retorno a circulación espontánea. Fallecimiento.'); setModal('export') }

  const saveApgar = () => { const t = `${Math.floor(elapsed / 60)}'`; setApgarHist(p => [...p, { time: t, score: apgarTotal }]); log(`APGAR [${t}]: ${apgarTotal}/10`, 'TECH'); say(`Apgar: ${apgarTotal}.`); if (!tutorialActive.current) setModal(null) }
  const saveSarnat = (s: typeof SARNAT[0]) => { setSarnat(s); log(`SARNAT: ${s.stage}`, 'TECH'); say(`Sarnat: ${s.stage}.`); if (!tutorialActive.current) setModal(null) }
  const saveGases = () => { if (!gases.ph) return; const { time, elapsed } = ts(); setGasHist(p => [{ ...gases, time, elapsed }, ...p]); log(`GASIMETRÍA: pH ${gases.ph}`, 'TECH'); say(`Gases pH ${gases.ph}.`); alert('GASES OK', 'bg-indigo-600'); if (!tutorialActive.current) setModal(null) }
  const causa = (c: string, a: { label: string; msg: string }) => { log(`MANEJO [${c}]: ${a.label}`, 'TECH'); say(a.msg); alert(a.label, 'bg-indigo-600') }

  const toggleResp = () => { const c = ['ESFUERZO (+)', 'GASPING', 'APNEA']; const n = c[(c.indexOf(tep.resp) + 1) % c.length]; setTep(t => ({ ...t, resp: n })); if (n !== 'ESFUERZO (+)') say(`Alerta. ${n}.`); log(`RESPIRATORIO: ${n}`, 'SYSTEM') }
  const toggleSim = () => { const n = tep.sim === 'SIMÉTRICO' ? 'ASIMÉTRICO' : 'SIMÉTRICO'; setTep(t => ({ ...t, sim: n })); if (n === 'ASIMÉTRICO') { say('Asimetría torácica.'); alert('ASIMETRÍA', 'bg-red-600') }; log(`SIMETRÍA: ${n}`, 'SYSTEM') }
  const saveGlic = () => { const v = parseInt(glicInput); if (isNaN(v)) return; setGlicemia(v); log(`GLICEMIA: ${v} mg/dL`, 'TECH'); say(`Glicemia ${v}.`); setGlicInput('') }

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])

  useEffect(() => {
    if (isActive && !isPaused) {
      tRef.current = setInterval(() => {
        setElapsed(s => s + 1); setEpiSec(s => s + 1)
        if (!isChecking) setCycle(p => { if (p === 50) say('Evaluación en diez segundos.'); if (p >= CICLO) { setIsChecking(true); setIsCompressing(false); say('Evalúe frecuencia cardíaca.'); return 0 }; return p + 1 })
      }, 1000)
    }
    return () => { if (tRef.current) clearInterval(tRef.current) }
  }, [isActive, isPaused, isChecking, say])

  useEffect(() => {
    if (isActive && isCompressing && !isPaused && !isChecking) {
      mRef.current = setInterval(() => { setCompCount(c => { if (c % 4 === 3) { setIsVentilating(true); setVentCount(v => v + 1); setTimeout(() => setIsVentilating(false), 300) }; return c + 1 }) }, 500)
      return () => { if (mRef.current) clearInterval(mRef.current) }
    }
  }, [isActive, isCompressing, isPaused, isChecking])

  const report = () => {
    const n = new Date(); let r = `EVOLUCIÓN MÉDICA NEONATAL — EPICRISIS\n${'═'.repeat(56)}\n`
    r += `FECHA: ${n.toLocaleDateString()} ${n.toLocaleTimeString()}\nPACIENTE: ${nombre || 'N/R'}\nPESO: ${w.toFixed(2)} KG | EG: ${egStr || 'N/R'} SEM\nRESULTADO: ${result}\nDURACIÓN: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s\n${'═'.repeat(56)}\n\n`
    r += `TRIADA: ${tep.apariencia} | ${tep.resp} | ${tep.circ}\nSIMETRÍA: ${tep.sim}\nGLICEMIA: ${glicemia ? glicemia + ' mg/dL' : 'N/R'}\n\n`
    r += `ALGORITMO NRP:\n· Pasos iniciales: ${steps.includes('A') ? 'Sí' : 'No'}\n· VPP: ${ventCount > 0 ? ventCount + ' vent.' : 'No'}\n`
      if (sopa.length) r += `· MR. SOPA: ${sopa.join(', ')}\n`
      
      const accesos = logs.filter(l => l.msg.includes('ACCESO:')).map(l => l.msg.replace('ACCESO: ', ''));
      if (accesos.length) r += `· Accesos: ${accesos.join(', ')}\n`
      const viasAereas = logs.filter(l => l.msg.includes('VÍA AÉREA: TET')).map(l => l.msg.replace('VÍA AÉREA: ', ''));
      if (viasAereas.length) r += `· Vía Aérea: ${viasAereas.join(', ')}\n`
      
      r += `· Compresiones: ${compCount > 0 ? 'Sí (3:1)' : 'No'}\n\n`
    if (drugs.length || fluids.length) { r += `FARMACOLOGÍA:\n`; drugs.forEach(d => r += `  [${d.time}] ${d.nombre} ${d.dosis} (${d.via})\n`); fluids.forEach(l => r += `  [${l.time}] ${l.nombre} ${l.volumen}ml\n`); r += '\n' }
    if (gasHist.length) { r += `GASIMETRÍA:\n`; gasHist.forEach(g => r += `  [${g.time}] pH:${g.ph} EB:${g.eb} Lac:${g.lac}\n`); r += '\n' }
    if (apgarHist.length) r += `APGAR: ${apgarHist.map(h => `${h.time}→${h.score}/10`).join(' | ')}\n`
    if (sarnat) r += `SARNAT: ${sarnat.stage}\n`
    r += `\nCRONOLOGÍA:\n`; logs.slice().reverse().forEach(l => r += `  [${l.time}] (+${l.elapsed}) ${l.msg}\n`)
    return r
  }

  const copy = () => { navigator.clipboard.writeText(fullReport()).then(() => alert('Copiado', 'bg-emerald-600')).catch(() => {}) }

  const evolucion = () => {
    const totalMin = Math.floor(elapsed / 60), totalSec = elapsed % 60
    let e = `Se atiende código azul neonatal.`
    e += ` ${tep.apariencia === 'PRETERMO' ? 'Recién nacido pretérmino' : 'Recién nacido a término'}`
    e += ` de ${egStr || 'N/R'} semanas de edad gestacional, peso ${w.toFixed(2)} kg.`
    if (tep.resp !== 'ESFUERZO (+)') e += ` Patrón respiratorio: ${tep.resp.toLowerCase()}.`
    if (tep.circ === 'FLÁCIDO') e += ` Tono muscular: flácido al nacer.`
    if (tep.sim === 'ASIMÉTRICO') e += ` Se evidencia asimetría torácica.`
    if (steps.includes('A')) e += ` Se realizan pasos iniciales de reanimación neonatal (calentamiento, secado, estimulación táctil, posicionamiento de vía aérea).`
    if (ventCount > 0) e += ` Se inicia ventilación a presión positiva (VPP), administrándose ${ventCount} ventilaciones.`
      if (sopa.length > 0) e += ` Se aplican correctivos ventilatorios MR. SOPA (${sopa.join(', ')}).`
      
      const accesos = logs.filter(l => l.msg.includes('ACCESO:')).map(l => l.msg.replace('ACCESO: ', ''));
      if (accesos.length > 0) e += ` Accesos vasculares establecidos: ${accesos.join(', ')}.`
      const viasAereas = logs.filter(l => l.msg.includes('VÍA AÉREA: TET')).map(l => l.msg.replace('VÍA AÉREA: ', ''));
      if (viasAereas.length > 0) e += ` Se asegura vía aérea con ${viasAereas.join(', ')}.`

      if (compCount > 0) e += ` Ante persistencia de bradicardia (FC < 60 lpm), se inician compresiones torácicas coordinadas con ventilación en relación 3:1 (100-120 compresiones/minuto según guías AHA 2025), completándose ${Math.floor(compCount / 4)} ciclos.`
    if (drugs.length > 0) { e += ` Farmacología administrada:`; drugs.forEach(d => { e += ` ${d.nombre} ${d.dosis} vía ${d.via} (${d.time}).` }) }
    if (fluids.length > 0) { e += ` Líquidos administrados:`; fluids.forEach(f => { e += ` ${f.nombre} ${f.volumen}ml (${f.time}).` }) }
    if (gasHist.length > 0) { e += ` Control gasimétrico:`; gasHist.forEach(g => { e += ` pH ${g.ph}, pCO2 ${g.pco2}, pO2 ${g.po2}, HCO3 ${g.hco3}, EB ${g.eb}, Lactato ${g.lac} (${g.time}).` }) }
    if (apgarHist.length > 0) e += ` Puntuación APGAR: ${apgarHist.map(h => `${h.score}/10 al minuto ${h.time}`).join(', ')}.`
    if (sarnat) e += ` Clasificación de encefalopatía hipóxico-isquémica según Sarnat: ${sarnat.stage}.`
    if (glicemia !== null) e += ` Glicemia capilar: ${glicemia} mg/dL.`
    e += `\n\nTiempo total de intervención: ${totalMin} minutos con ${totalSec} segundos.`
    e += ` Desenlace: ${result}.`
    if (result.includes('RCE')) e += ` Se logra retorno a la circulación espontánea. Se indica monitoreo continuo, vigilancia hemodinámica y neurológica. Plan: ingreso a unidad neonatal para cuidados post-reanimación.`
    else if (result.includes('FALLECIMIENTO') || noRetorno) e += ` A pesar de maniobras de reanimación avanzada sostenidas, no se logra retorno a circulación espontánea. Se declara fallecimiento.`
    else if (result.includes('Cese')) e += ` Se decide cese de maniobras de reanimación tras intervención sostenida sin respuesta.`
    return e
  }

  const fullReport = () => report() + `\n${'═'.repeat(56)}\nEVOLUCIÓN MÉDICA NARRATIVA:\n${'─'.repeat(56)}\n${evolucion()}\n`
  const B = 'active:scale-[0.96] transition-all duration-150'
  const elapsed_fmt = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 bg-[#040812] text-slate-100 flex flex-col items-center px-2 pt-2 pb-1 overflow-hidden select-none text-[11px]" style={{ fontFamily: "'Satoshi', system-ui, sans-serif" }}>

      {/* TOAST ALERTS */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 w-full max-w-sm z-[2000] flex flex-col gap-1.5 pointer-events-none px-4">
        {alerts.map(a => (
          <div key={a.id} className={`${a.color} text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-sm`}>
            <Zap size={13} /><span className="font-black uppercase tracking-wide text-[11px]">{a.msg}</span>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div className="w-full max-w-2xl bg-white/[0.03] backdrop-blur-sm p-2 rounded-xl border border-white/[0.06] flex justify-between items-center mb-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Baby className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-[10px] font-black uppercase text-white leading-none tracking-tight">NALS <span className="text-blue-400">Pro</span></h1>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-bold text-slate-400 tabular-nums">{now.toLocaleTimeString('es-ES', { hour12: false })}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-white/[0.04] px-2 py-1.5 rounded-lg border border-white/[0.06] flex items-center gap-1">
            <span className="text-[7px] font-bold text-slate-500">EG</span>
            <input data-tutorial="nals-eg" type="text" inputMode="decimal" value={egStr} onChange={e => setEgStr(e.target.value)} className="bg-transparent border-none w-6 font-black text-white focus:outline-none text-center p-0 text-[11px]" />
          </div>
          <div className="bg-white/[0.04] px-2 py-1.5 rounded-lg border border-white/[0.06] flex items-center gap-1">
            <span className="text-[7px] font-bold text-slate-500">Kg</span>
            <input data-tutorial="nals-weight" type="text" inputMode="decimal" value={weightStr} onChange={e => setWeightStr(e.target.value)} className="bg-transparent border-none w-6 font-black text-white focus:outline-none text-center p-0 text-[11px]" />
          </div>
          <button data-tutorial="nals-finish" onClick={() => setModal('finish')} className={`p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 ml-0.5 ${B}`}><Power size={14} /></button>
        </div>
      </div>

      {/* ECG MONITOR */}
      <div className="w-full max-w-2xl h-[110px] sm:h-[140px] relative bg-[#040812] rounded-xl border border-white/[0.06] overflow-hidden mb-1 shrink-0">
        <Ecg isActive={isActive} ritmo={ritmo} isPaused={isPaused} isFinished={modal === 'export'} />
        {/* Left overlays */}
        <div className="absolute top-1.5 left-2 flex flex-col gap-1">
          <div className="bg-black/60 backdrop-blur-md border border-white/[0.06] rounded-lg px-2 py-1.5">
            <span className="text-[5px] font-bold uppercase text-cyan-400/50 block leading-none">Tiempo</span>
            <span className="text-[13px] sm:text-[15px] font-black text-white tabular-nums leading-tight">{elapsed_fmt}</span>
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-indigo-500/20 rounded-lg px-2 py-1">
            <span className="text-[5px] font-bold uppercase text-indigo-400/50 block leading-none">SpO2 {min}&apos;</span>
            <span className="text-[9px] font-black text-indigo-300 tabular-nums">{spo2}</span>
          </div>
        </div>
        {/* Right overlays */}
        <div className="absolute top-1.5 right-2 flex flex-col items-end gap-1">
          <div className={`bg-black/60 backdrop-blur-md border px-2 py-1.5 rounded-lg text-right transition-colors ${cycle > 50 || isChecking ? 'border-red-500/50' : 'border-white/[0.06]'}`}>
            <span className="text-[5px] font-bold text-slate-500 uppercase block leading-none">Evaluar</span>
            <span className={`text-[18px] sm:text-[22px] font-black tabular-nums leading-none ${cycle > 50 ? 'text-red-400' : 'text-white'}`}>{60 - cycle}<span className="text-[8px] text-slate-500">s</span></span>
          </div>
          <div className="bg-black/60 backdrop-blur-md border border-white/[0.06] px-1.5 py-0.5 rounded">
            <span className="text-[7px] font-black text-cyan-300 uppercase">{RITMOS[ritmo].nombre}</span>
          </div>
        </div>
      </div>

      {/* RHYTHM & TRIAD */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-1 mb-1 shrink-0">
        <div data-tutorial="nals-ritmo" className="grid grid-cols-4 gap-1">
          {Object.entries(RITMOS).map(([k, v]) => (
            <button key={k} onClick={() => { setRitmo(k); say(`Ritmo: ${v.corto}`); log(`RITMO: ${v.corto}`) }}
              className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${B} ${ritmo === k ? 'bg-blue-600 border-blue-400/50 text-white shadow-lg shadow-blue-600/20' : 'bg-white/[0.03] border-white/[0.06] text-slate-500'}`}>
              {v.corto}
            </button>
          ))}
        </div>
        <div data-tutorial="nals-triada" className="grid grid-cols-4 gap-1">
          <button onClick={() => { const v = tep.apariencia === 'TÉRMINO' ? 'PRETERMO' : 'TÉRMINO'; setTep(t => ({ ...t, apariencia: v })); say(`Neonato ${v}`) }}
            className={`py-3 rounded-xl border text-[7px] font-black ${B} ${tep.apariencia === 'PRETERMO' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'}`}>{tep.apariencia}</button>
          <button onClick={toggleResp}
            className={`py-3 rounded-xl border text-[6.5px] font-black ${B} ${tep.resp !== 'ESFUERZO (+)' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'}`}>{tep.resp}</button>
          <button onClick={() => { const v = tep.circ === 'TONO (+)' ? 'FLÁCIDO' : 'TONO (+)'; setTep(t => ({ ...t, circ: v })); say(`Tono ${v}`) }}
            className={`py-3 rounded-xl border text-[7px] font-black ${B} ${tep.circ === 'FLÁCIDO' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'}`}>{tep.circ}</button>
          <button onClick={toggleSim}
            className={`py-3 rounded-xl border text-[6.5px] font-black ${B} ${tep.sim !== 'SIMÉTRICO' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30 animate-pulse' : 'bg-white/[0.03] text-slate-500 border-white/[0.06]'}`}>{tep.sim}</button>
        </div>
      </div>

      {/* MAIN ACTION BAR */}
      <div className="w-full max-w-2xl h-[56px] mb-1 shrink-0">
        {!isActive ? (
          <div className="grid grid-cols-4 gap-1.5 h-full font-black">
            <button data-tutorial="nals-start" onClick={start} className={`bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl text-xs shadow-xl shadow-blue-600/25 uppercase ${B}`}>Iniciar RCP</button>
            {[
              { n: 'CALENTAR', v: 'Calentando.', i: <Flame size={15} />, active: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
              { n: 'SECAR', v: 'Secando.', i: <Waves size={15} />, active: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' },
              { n: 'ESTIMULAR', v: 'Estimulando.', i: <Hand size={15} />, active: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' },
            ].map(s => (
              <button key={s.n} onClick={() => step(s.n, s.v)}
                className={`rounded-2xl text-[8px] uppercase flex flex-col items-center justify-center gap-1 border ${B} ${logs.some(l => l.msg.includes(s.n)) ? s.active : 'bg-white/[0.03] border-white/[0.06] text-slate-500'}`}>
                {s.i}<span>{s.n.charAt(0) + s.n.slice(1).toLowerCase()}</span>
              </button>
            ))}
          </div>
        ) : isChecking ? (
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 h-full rounded-2xl flex items-center justify-between px-5 shadow-xl shadow-indigo-600/20">
            <div><span className="text-[8px] font-bold text-indigo-200 uppercase block">Evaluación</span><span className="text-xs font-black text-white uppercase">¿RCE logrado?</span></div>
            <div className="flex gap-2">
              <button onClick={rce} className={`bg-white text-indigo-700 rounded-xl px-4 py-2 font-black text-[9px] uppercase flex items-center gap-1.5 ${B}`}><HeartPulse size={13} /> Confirmar RCE</button>
              <button onClick={() => { setIsChecking(false); setIsCompressing(true); setCycle(0); log('CONTINÚAN MANIOBRAS', 'SYSTEM'); say('Continúe RCP.') }} className={`bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 font-black text-[9px] uppercase ${B}`}>FC &lt; 60</button>
            </div>
          </div>
        ) : (
          <div className="bg-white/[0.03] h-full rounded-2xl border border-white/[0.06] flex justify-between items-center px-4 relative overflow-hidden">
            <div className="flex items-center gap-5 z-10">
              <div><span className="text-[7px] font-bold text-slate-500 uppercase block">Compresiones</span><span className="text-xl font-black text-blue-400 tabular-nums">#{Math.floor(compCount / 4)}</span></div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div><span className="text-[7px] font-bold text-slate-500 uppercase block">Ventilaciones</span><span className="text-xl font-black text-white tabular-nums">{ventCount}</span></div>
            </div>
            <button onClick={() => { setIsPaused(!isPaused); say(isPaused ? 'Reanudado.' : 'Pausado.') }} className={`w-12 h-12 bg-white/[0.05] hover:bg-white/[0.08] rounded-xl flex items-center justify-center border border-white/[0.06] text-white ${B}`}>
              {isPaused ? <Play size={18} className="text-emerald-400" /> : <Pause size={18} className="text-amber-400" />}
            </button>
            {isVentilating && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center z-50 text-white font-black uppercase text-lg rounded-2xl">¡VENTILA!</div>}
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="w-full max-w-2xl grid grid-cols-4 gap-1 mb-1 shrink-0">
        {[
          { m: 'apgar', i: <Scale size={16} />, l: 'Escalas', c: 'from-indigo-600 to-indigo-500', shadow: 'shadow-indigo-600/15', tut: 'nals-escalas' },
          { m: 'gases', i: <FlaskConical size={16} />, l: 'Gases', c: 'from-blue-600 to-blue-500', shadow: 'shadow-blue-600/15', tut: 'nals-gases' },
          { m: 'farmacos', i: <Syringe size={16} />, l: 'Drogas', c: epiLock ? 'from-slate-700 to-slate-600' : 'from-emerald-600 to-emerald-500', shadow: epiLock ? '' : 'shadow-emerald-600/15', disabled: !isActive, tut: 'nals-drogas' },
          { m: 'causas', i: <ShieldAlert size={16} className={epiLock ? 'text-slate-400' : 'text-amber-400'} />, l: 'Causas', c: 'from-slate-700/80 to-slate-600/80', shadow: '', tut: 'nals-causas' },
        ].map(a => (
          <button key={a.m} data-tutorial={a.tut} onClick={() => setModal(a.m)} disabled={a.disabled}
            className={`py-3.5 bg-gradient-to-b ${a.c} rounded-xl flex flex-col items-center gap-0.5 text-white ${a.shadow ? `shadow-lg ${a.shadow}` : ''} ${B} disabled:opacity-40`}>
            {a.i}<span className="text-[8px] uppercase font-black tracking-wide">{a.l}</span>
          </button>
        ))}
      </div>

      {/* LOG */}
      <div className="w-full max-w-2xl flex-1 bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden flex flex-col mb-1">
        <div className="px-4 py-2 border-b border-white/[0.04] flex justify-between items-center">
          <div className="flex items-center gap-2.5"><ListOrdered size={12} className="text-blue-400" /><span className="text-[9px] font-black uppercase text-slate-500 tracking-wide">Bitácora</span></div>
          <button onClick={() => { setLogs([]); say('Limpia.') }} className="text-slate-600 hover:text-red-400 transition-colors p-1"><Eraser size={13} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
          {logs.map((l, i) => (
            <div key={i} className="flex items-start gap-3 pl-3 border-l-2 border-white/[0.04] ml-1 py-0.5">
              <div className="flex flex-col tabular-nums min-w-[42px] shrink-0">
                <span className="text-slate-600 text-[7px] font-bold">{l.time}</span>
                <span className="text-blue-400/80 text-[8px] font-bold">+{l.elapsed}</span>
              </div>
              <span className={`uppercase font-bold tracking-tight text-[10px] ${l.type === 'DRUG' ? 'text-emerald-400' : l.type === 'TECH' ? 'text-indigo-300' : l.type === 'SYSTEM' ? 'text-amber-400' : 'text-slate-300'}`}>{l.msg}</span>
            </div>
          ))}
          {!logs.length && <div className="flex flex-col items-center justify-center py-10 opacity-15"><ClipboardList size={28} /><span className="text-[8px] font-black uppercase mt-2">Sin eventos</span></div>}
        </div>
      </div>

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">

          {modal === 'gases' && (
            <div className="bg-[#0c1220] border border-white/[0.06] w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-5"><h3 className="text-white font-black uppercase text-sm tracking-tight">Gasimetría</h3><button onClick={closeModal} className="p-1.5 text-slate-500 hover:text-white transition-colors"><X size={18} /></button></div>
              <div data-tutorial="nals-gases-inputs" className="grid grid-cols-2 gap-2.5 mb-5">
                {Object.keys(gases).map(k => (
                  <div key={k} className="bg-white/[0.03] border border-white/[0.06] p-3 rounded-2xl">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1.5">{k.toUpperCase()}</span>
                    <input type="number" step="0.01" value={(gases as any)[k]} onChange={e => setGases({ ...gases, [k]: e.target.value })} className="bg-transparent w-full font-black text-white focus:outline-none text-base p-0 placeholder:text-slate-700" placeholder="—" />
                  </div>
                ))}
              </div>
              <button data-tutorial="nals-gases-save" onClick={saveGases} className={`w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-black text-[11px] uppercase shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 ${B}`}><Check size={15} /> Registrar Analítica</button>
            </div>
          )}

          {modal === 'apgar' && (
            <div className="bg-[#0c1220] border border-white/[0.06] w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-4"><h3 className="text-white font-black uppercase text-sm tracking-tight">Escalas Neonatales</h3><button onClick={closeModal} className="p-1.5 text-slate-500 hover:text-white transition-colors"><X size={18} /></button></div>
              <div className="space-y-4 overflow-y-auto scrollbar-hide">
                <div data-tutorial="nals-apgar-calc" className="bg-indigo-500/[0.06] border border-indigo-500/15 p-5 rounded-2xl">
                  <h4 className="text-indigo-400 font-black uppercase text-[9px] mb-3 tracking-wider">Calculadora APGAR</h4>
                  {Object.entries(APGAR).map(([k, c]) => (
                    <div key={k} className="mb-3">
                      <span className="text-[7px] font-bold text-slate-500 uppercase block mb-1.5">{c.label}</span>
                      <div className="grid grid-cols-3 gap-1">
                        {c.options.map((o, v) => (
                          <button key={v} onClick={() => setApgar(p => ({ ...p, [k]: v }))}
                            className={`p-2 rounded-xl text-[7px] font-bold transition-all ${B} ${apgar[k] === v ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:text-slate-300'}`}>{o}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/[0.06]">
                    <div><span className="text-2xl font-black text-white">{apgarTotal}</span><span className="text-sm font-bold text-slate-500">/10</span></div>
                    <button data-tutorial="nals-apgar-save" onClick={saveApgar} className={`bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase shadow-lg shadow-indigo-600/20 ${B}`}>Guardar</button>
                  </div>
                </div>
                <div data-tutorial="nals-sarnat" className="space-y-2">
                  <h4 className="text-blue-400 font-black uppercase text-[9px] tracking-wider mb-2">Clasificación Sarnat</h4>
                  {SARNAT.map((s, i) => (
                    <button key={i} onClick={() => saveSarnat(s)} className={`w-full bg-white/[0.02] border ${s.border} p-4 rounded-2xl text-left transition-all ${B}`}>
                      <span className={`block font-black text-[10px] uppercase ${s.color}`}>{s.stage}</span>
                      <p className="text-[8px] text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {modal === 'farmacos' && (
            <div className="bg-[#0c1220] border border-white/[0.06] w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-5 shrink-0"><h3 className="text-white font-black uppercase text-sm tracking-tight">Farmacología</h3><button onClick={closeModal} className="p-1.5 text-slate-500 hover:text-white transition-colors"><X size={18} /></button></div>
              <div className="space-y-4 overflow-y-auto scrollbar-hide flex-1">
                <div className="bg-white/[0.03] p-4 rounded-2xl border border-cyan-500/15">
                  <div className="flex items-center gap-2 mb-3"><Activity className="text-cyan-400" size={15} /><span className="text-[10px] font-black text-white uppercase tracking-wide">Accesos & Vía Aérea</span></div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                     <button onClick={() => { log('ACCESO: Catéter Umbilical', 'SUCCESS'); say('Catéter umbilical.'); alert('CVU OK', 'bg-cyan-600'); if (!tutorialActive.current) setModal(null); }} className={`p-3 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-300 ${B}`}><span className="block text-[9px] font-black uppercase">Catéter Umbilical</span></button>
                     <button onClick={() => { log('ACCESO: Vía Periférica', 'SUCCESS'); say('Acceso periférico.'); alert('Periférico OK', 'bg-cyan-600'); if (!tutorialActive.current) setModal(null); }} className={`p-3 bg-cyan-600/20 border border-cyan-500/30 rounded-xl text-cyan-300 ${B}`}><span className="block text-[9px] font-black uppercase">Vía Periférica</span></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[3.0, 3.5, 4.0].map(size => (
                      <button key={size} onClick={() => { log(`VÍA AÉREA: TET #${size.toFixed(1)}`, 'TECH'); say(`Tubo endotraqueal ${size.toFixed(1)}`); alert(`TET #${size.toFixed(1)}`, 'bg-indigo-600'); if (!tutorialActive.current) setModal(null); }} className={`p-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-300 hover:bg-white/[0.08] ${B}`}><span className="block text-[9px] font-black uppercase">TET #{size.toFixed(1)}</span></button>
                    ))}
                  </div>
                </div>

                <div data-tutorial="nals-glicemia" className="bg-white/[0.03] p-4 rounded-2xl border border-blue-500/15">
                  <div className="flex items-center gap-2 mb-3"><TestTube className="text-blue-400" size={15} /><span className="text-[10px] font-black text-white uppercase tracking-wide">Glicemia</span></div>
                  <div className="flex gap-2">
                    <input type="number" value={glicInput} onChange={e => setGlicInput(e.target.value)} placeholder="mg/dL" className="flex-1 bg-black/30 border border-white/[0.06] rounded-xl px-4 py-3 text-white font-black focus:outline-none focus:border-blue-500/50 text-sm placeholder:text-slate-600" />
                    <button onClick={saveGlic} className={`p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 ${B}`}><Check size={16} /></button>
                  </div>
                </div>
                <div data-tutorial="nals-epi" className="bg-white/[0.03] p-4 rounded-2xl border border-emerald-500/15">
                  <div className="flex items-center gap-2 mb-3"><Syringe className="text-emerald-400" size={15} /><span className="text-[10px] font-black text-white uppercase tracking-wide">Adrenalina 1:10,000 (0.01-0.03 mg/kg)</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => giveDrug('Adrenalina IV/CVU', dose.epiLow + '-' + dose.epiHigh + ' ml', 'IV/CVU')} className={`p-3.5 bg-gradient-to-b from-emerald-600 to-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-600/15 ${B}`}><span className="block text-[9px] font-black uppercase mb-0.5">IV / CVU</span><span className="block text-[8px] text-emerald-100">{dose.epiLow}-{dose.epiHigh} ml</span></button>
                    <button onClick={() => giveDrug('Adrenalina IO', dose.epiLow + '-' + dose.epiHigh + ' ml', 'IO')} className={`p-3.5 bg-gradient-to-b from-blue-600 to-blue-500 rounded-xl text-white shadow-lg shadow-blue-600/15 ${B}`}><span className="block text-[9px] font-black uppercase mb-0.5">Intraóseo</span><span className="block text-[8px] text-blue-100">{dose.epiLow}-{dose.epiHigh} ml</span></button>
                    <button onClick={() => giveDrug('Adrenalina ET', dose.epiET + ' ml', 'ET')} className={`p-3.5 bg-white/[0.04] border border-white/[0.06] rounded-xl text-white hover:bg-white/[0.06] ${B}`}><span className="block text-[9px] font-black uppercase mb-0.5">Vía ET</span><span className="block text-[8px] text-slate-400">{dose.epiET} ml</span></button>
                  </div>
                </div>
                <div data-tutorial="nals-liquidos" className="bg-white/[0.03] p-4 rounded-2xl border border-blue-500/15">
                  <div className="flex items-center gap-2 mb-3"><Droplets className="text-blue-400" size={15} /><span className="text-[10px] font-black text-white uppercase tracking-wide">Líquidos</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => giveFluid('Bolo Salino', dose.bolus)} className={`p-3.5 bg-gradient-to-b from-blue-600 to-blue-500 rounded-xl text-white shadow-lg shadow-blue-600/15 ${B}`}><span className="block text-[10px] font-black uppercase mb-0.5">Bolo Salino</span><span className="block text-[9px] text-blue-100">{dose.bolus} ml</span></button>
                    <button onClick={() => giveFluid('Sangre O-', dose.bolus)} className={`p-3.5 bg-gradient-to-b from-red-600 to-red-500 rounded-xl text-white shadow-lg shadow-red-600/15 ${B}`}><span className="block text-[10px] font-black uppercase mb-0.5">Sangre O-</span><span className="block text-[9px] text-red-100">{dose.bolus} ml</span></button>
                  </div>
                </div>

                <div className="bg-white/[0.03] p-4 rounded-2xl border border-purple-500/15">
                  <div className="flex items-center gap-2 mb-3"><Syringe className="text-purple-400" size={15} /><span className="text-[10px] font-black text-white uppercase tracking-wide">Sedoanalgesia & Reversión</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => giveDrug('Morfina', '0.05 mg/kg', 'IV/IM')} className={`p-3.5 bg-gradient-to-b from-purple-600 to-purple-500 rounded-xl text-white shadow-lg shadow-purple-600/15 ${B}`}><span className="block text-[10px] font-black uppercase mb-0.5">Morfina</span><span className="block text-[8px] text-purple-200">0.05 mg/kg</span></button>
                    <button onClick={() => giveDrug('Naloxona', '0.1 mg/kg', 'IV/IM')} className={`p-3.5 bg-gradient-to-b from-rose-600 to-rose-500 rounded-xl text-white shadow-lg shadow-rose-600/15 ${B}`}><span className="block text-[10px] font-black uppercase mb-0.5">Naloxona</span><span className="block text-[8px] text-rose-200">0.1 mg/kg</span></button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {modal === 'causas' && (
            <div className="bg-[#0c1220] border border-white/[0.06] w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-5"><h3 className="text-white font-black uppercase text-sm tracking-tight">MR. SOPA + Causas</h3><button onClick={closeModal} className="p-1.5 text-slate-500 hover:text-white transition-colors"><X size={18} /></button></div>
              <div className="space-y-4 overflow-y-auto max-h-[70vh] scrollbar-hide">
                <div data-tutorial="nals-sopa" className="grid grid-cols-3 gap-2">
                  {SOPA.map(s => (
                    <button key={s.id} onClick={() => { if (!sopa.includes(s.id)) { setSopa(p => [...p, s.id]); log(`SOPA: [${s.id}]`, 'TECH'); say(`Paso ${s.id}`) } }}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1 ${B} ${sopa.includes(s.id) ? 'bg-indigo-600/20 border-indigo-400/30 text-indigo-300' : 'bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300'}`}>
                      <span className="font-black text-sm">{s.id}</span><span className="text-[7px] uppercase font-bold">{s.desc}</span>
                    </button>
                  ))}
                </div>
                {CAUSAS.map(c => (
                  <div key={c.id} className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
                    <span className="text-[10px] font-black text-white uppercase block mb-3 tracking-wide">{c.nombre}</span>
                    <div className="space-y-1.5">
                      {c.acciones.map(a => (
                        <button key={a.id} onClick={() => causa(c.nombre, a)} className={`flex items-center justify-between w-full px-3.5 py-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl text-left hover:bg-white/[0.04] ${B}`}>
                          <span className="text-[9px] font-bold text-slate-300 uppercase">{a.label}</span>
                          <PlusCircle size={14} className="text-slate-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {modal === 'finish' && (
            <div className="bg-[#0c1220] border border-white/[0.06] w-full max-w-xs rounded-3xl p-7 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              <h3 className="text-white font-black uppercase text-sm mb-1 tracking-tight">Finalizar Monitor</h3>
              <p className="text-slate-500 text-[10px] font-medium mb-6">Se detendrá el registro de eventos</p>
              <div className="flex flex-col gap-2.5">
                <button data-tutorial="nals-rce" onClick={rce} className={`w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl text-[11px] uppercase font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 ${B}`}><HeartPulse size={15} /> RCE Logrado</button>
                <button onClick={noReturn} className={`w-full py-3.5 bg-white/[0.04] text-slate-300 border border-white/[0.08] rounded-2xl text-[11px] uppercase font-black flex items-center justify-center gap-2 hover:bg-white/[0.06] ${B}`}><X size={15} className="text-slate-400" /> No Retorno / Fallecimiento</button>
                <button onClick={() => { setIsActive(false); setResult('Cese de Maniobras'); setModal('export'); say('RCP finalizada.') }} className={`w-full py-3.5 bg-white/[0.04] text-red-400 border border-red-500/20 rounded-2xl text-[11px] uppercase font-black flex items-center justify-center gap-2 hover:bg-red-500/10 ${B}`}><AlertCircle size={15} /> Cese de RCP</button>
                <button onClick={() => setModal(null)} className="text-[10px] font-bold text-slate-600 py-2 hover:text-slate-400 transition-colors">Cancelar</button>
              </div>
            </div>
          )}

          {modal === 'export' && (
            <div className="bg-[#0c1220] border border-white/[0.06] w-full max-w-2xl h-[85vh] rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><FileText className="text-blue-400" size={20} /></div>
                  <div><h3 className="font-black text-white uppercase text-sm leading-none tracking-tight">Evolución Médica</h3><span className="text-[9px] text-slate-500 font-bold">Epicrisis Neonatal</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className={`px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-400 text-[9px] font-black uppercase hover:text-white ${B}`}>Monitor</button>
                  <button onClick={() => window.location.reload()} className={`p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 ${B}`}><RotateCcw size={16} /></button>
                </div>
              </div>
              <input data-tutorial="nals-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="NOMBRE / ID RECIÉN NACIDO..." className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl text-white font-black text-xs p-3 mb-4 uppercase shrink-0 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600" />
              <div className="flex gap-1.5 mb-4 shrink-0">
                {['report', 'evolucion', 'log'].map(t => (
                  <button key={t} data-tutorial={t === 'evolucion' ? 'nals-tab-evolucion' : undefined} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${tab === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06]'}`}>
                    {t === 'report' ? 'Resumen' : t === 'evolucion' ? 'Evolución' : 'Bitácora'}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto mb-5 bg-black/20 rounded-2xl border border-white/[0.04] p-4 scrollbar-hide">
                {tab === 'report' ? (
                  <pre className="text-[10px] text-blue-100/80 whitespace-pre-wrap leading-relaxed tabular-nums font-mono">{report()}</pre>
                ) : tab === 'evolucion' ? (
                  <div data-tutorial="nals-evolucion-content">
                    <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-teal-400" /><span className="text-xs font-black text-teal-400 uppercase">Evolución Médica Narrativa</span></div>
                    <p className="text-[11px] text-blue-100/90 leading-[1.7] font-medium">{evolucion()}</p>
                    <button onClick={() => { navigator.clipboard.writeText(evolucion()); alert('Evolución copiada', 'bg-teal-600') }} className={`mt-4 w-full py-2.5 bg-teal-600/20 border border-teal-500/20 text-teal-400 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 ${B}`}><Copy size={14} /> Copiar evolución</button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {logs.map((l, i) => (
                      <div key={i} className="flex items-start gap-3 border-l-2 border-indigo-500/15 pl-3 py-1">
                        <div className="flex flex-col tabular-nums min-w-[48px] shrink-0">
                          <span className="text-slate-600 text-[7px] font-bold">{l.time}</span>
                          <span className="text-blue-500/70 text-[8px] font-bold">+{l.elapsed}</span>
                        </div>
                        <div className={`px-3 py-2 rounded-xl border flex-1 ${l.type === 'DRUG' ? 'bg-emerald-950/20 border-emerald-500/15' : l.type === 'TECH' ? 'bg-blue-950/20 border-blue-500/15' : l.type === 'SYSTEM' ? 'bg-amber-950/20 border-amber-500/15' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                          <span className={`uppercase font-black text-[9px] ${l.type === 'DRUG' ? 'text-emerald-400' : l.type === 'TECH' ? 'text-blue-400' : l.type === 'SYSTEM' ? 'text-amber-400' : 'text-slate-300'}`}>{l.msg}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2.5 shrink-0">
                <button onClick={() => window.open(`whatsapp://send?text=${encodeURIComponent(fullReport())}`, '_blank')} className={`py-3.5 bg-gradient-to-b from-emerald-600 to-emerald-500 rounded-2xl text-white flex flex-col items-center gap-1 shadow-lg shadow-emerald-600/15 ${B}`}><MessageCircle size={18} /><span className="text-[8px] font-black uppercase">WhatsApp</span></button>
                <button onClick={() => window.open(`mailto:?subject=Evolucion%20Neonatal&body=${encodeURIComponent(fullReport())}`, '_blank')} className={`py-3.5 bg-gradient-to-b from-blue-600 to-blue-500 rounded-2xl text-white flex flex-col items-center gap-1 shadow-lg shadow-blue-600/15 ${B}`}><Mail size={18} /><span className="text-[8px] font-black uppercase">Email</span></button>
                <button onClick={copy} className={`py-3.5 bg-white/[0.04] border border-white/[0.06] rounded-2xl text-slate-300 flex flex-col items-center gap-1 hover:bg-white/[0.06] ${B}`}><Copy size={18} /><span className="text-[8px] font-black uppercase">Copiar</span></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <div className="w-full max-w-2xl py-1 flex justify-between items-center px-2 shrink-0 border-t border-white/[0.04]">
        <span className="text-[7px] font-bold text-slate-600 tracking-widest uppercase">NALS</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setVoice(!voice)} className={`p-1.5 rounded-lg transition-colors ${voice ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-700 hover:text-slate-500'}`}>
            {voice ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>

      {showTutorial && (
        <ModuleTutorial
          moduleId="nals-monitor"
          moduleName="NALS Monitor"
          moduleColor="from-blue-500 to-cyan-500"
          slides={NALS_SLIDES}
          steps={NALS_STEPS}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  )
}
