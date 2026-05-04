'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Syringe, Clock, Volume2, VolumeX, Pause, Play, XCircle, ShieldAlert,
  Power, Droplets, Activity, Check, FileText, Copy, Wind, TestTube,
  Mail, MessageCircle, ClipboardList, Baby, RotateCcw, AlertTriangle,
  Flame, HeartPulse, Zap, Info, PlusCircle, AlertCircle, Heart
} from 'lucide-react'

// --- CONSTANTES MÉDICAS ---
const BLOOD_NAMES: Record<string, string> = {
  ugr: "Glóbulos Rojos (UGR)", pfc: "Plasma Fresco", plaquetas: "Plaquetas", 
  crio: "Crioprecipitados", almidones: "Almidones", gelatinas: "Gelatinas", cristaloides: "Cristaloides"
}

const STEPS_HPP = [
  { id: "A1", phase: "0-20", label: "Pedir ayuda y activar equipo" },
  { id: "A2", phase: "0-20", label: "Canalizar 2 venas (14G o 16G)" },
  { id: "A3", phase: "0-20", label: "Oxígeno por máscara 10-15 Litros" },
  { id: "A4", phase: "0-20", label: "Sonda vesical a permanencia" },
  { id: "A5", phase: "0-20", label: "Masaje uterino permanente" },
  { id: "A6", phase: "0-20", label: "Evacuación de coágulos" },
  { id: "A7", phase: "0-20", label: "Colocar traje antichoque" },
  { id: "B1", phase: "20-60", label: "Solicitar hemoderivados (Pruebas)" },
  { id: "B2", phase: "20-60", label: "Exploración canal del parto" },
  { id: "B3", phase: "20-60", label: "Taponamiento uterino (Bakri)" },
  { id: "B4", phase: "20-60", label: "Suturas de compresión B-Lynch" },
  { id: "C1", phase: "+60", label: "Tratamiento quirúrgico avanzado" },
  { id: "C2", phase: "+60", label: "Histerectomía obstétrica" },
  { id: "C3", phase: "+60", label: "Traslado a UCI" }
]

// Definimos la estructura base indicando que 'alert' y 'type' son opcionales
type MedItem = {
  id: string;
  label: string;
  alert?: string;
  type?: string;
};

// Aplicamos el tipado a la constante
const MEDS_HPP: Record<string, MedItem[]> = { 
  "UTEROTÓNICOS": [
    { id: 'oxi', label: "OXITOCINA 20-40 UI IV", alert: "INFUSIÓN LENTA. NO BOLOS." },
    { id: 'met', label: "METILERGONOVINA 0.2MG IM", alert: "CONTRAINDICADO EN HIPERTENSAS" },
    { id: 'miso', label: "MISOPROSTOL 800MCG SL/R", alert: "DOSIS ÚNICA" },
    { id: 'carb', label: "CARBETOCINA 100MCG IV/IM", alert: "ÚTIL EN CESÁREAS / ATONÍA" }
  ],
  "COAGULACIÓN": [
    { id: 'txa', label: "ÁCIDO TRANEXÁMICO 1G IV", alert: "ADMINISTRAR EN < 3 HORAS" }
  ],
  "CRISIS HIPERTENSIVA (PREECLAMPSIA)": [
    { id: 'mg', label: "SULFATO DE MAGNESIO 4G", alert: "CARGA INICIAL. LUEGO 1G/HORA" },
    { id: 'lab_protocol', type: "LABETALOL_PROTOCOL", label: "Protocolo Labetalol" }
  ]
}

export default function CodigoRojoMonitor() {
  // --- ESTADOS ---
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [modal, setModal] = useState<string | null>('setup')
  const [reportTab, setReportTab] = useState('resumen')
  
  // Datos Paciente
  const [pacienteNombre, setPacienteNombre] = useState('')
  const [pacienteId, setPacienteId] = useState('')
  const [isJehovah, setIsJehovah] = useState(false)
  
  // Signos Vitales
  const [fc, setFc] = useState<string>('')
  const [tas, setTas] = useState<string>('')
  const [sat, setSat] = useState<string>('')

  // Tiempos
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [realTime, setRealTime] = useState(new Date())

  // RCP (Código Azul Obstétrico)
  const [isParo, setIsParo] = useState(false)
  const [rcpSeconds, setRcpSeconds] = useState(120)
  const [adrCount, setAdrCount] = useState(0)
  const [adrTimer, setAdrTimer] = useState(0)

  // Registros y Bitácora
  const [logs, setLogs] = useState<{ time: string; elapsed: string; msg: string; type: string }[]>([])
  const [bloodLog, setBloodLog] = useState<Record<string, number>>({ ugr: 0, pfc: 0, plaquetas: 0, crio: 0, almidones: 0, gelatinas: 0, cristaloides: 0 })
  const [labetalolTotal, setLabetalolTotal] = useState(0)
  const [checklists, setChecklists] = useState<string[]>([])
  const [medsAdmin, setMedsAdmin] = useState<string[]>([])
  const [resultadoFinal, setResultadoFinal] = useState('')

  // Settings
  const [voiceOn, setVoiceOn] = useState(true)
  const [copied, setCopied] = useState(false)

  // --- EFECTOS ---
  useEffect(() => { const t = setInterval(() => setRealTime(new Date()), 1000); return () => clearInterval(t) }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isActive && !isPaused && !isFinished) {
      interval = setInterval(() => {
        setElapsedSeconds(s => s + 1)
        if (isParo) {
          setRcpSeconds(s => {
            if (s <= 1) { speak("Ciclo de RCP cumplido. Evaluar ritmo."); return 120 }
            return s - 1
          })
          if (adrTimer > 0) setAdrTimer(t => t - 1)
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isActive, isPaused, isFinished, isParo, adrTimer])

  // --- UTILIDADES ---
  const shockIndex = useMemo(() => {
    const fcv = parseFloat(fc); const tasv = parseFloat(tas)
    if (fcv > 0 && tasv > 0) return (fcv / tasv).toFixed(2)
    return '--'
  }, [fc, tas])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  const ts = () => ({ time: new Date().toLocaleTimeString('es-ES', { hour12: false }), elapsed: formatTime(elapsedSeconds) })

  const triggerHaptic = useCallback((pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
  }, [])

  const speak = useCallback((text: string) => {
    if (!voiceOn || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-ES'; u.rate = 1.1
    window.speechSynthesis.speak(u)
  }, [voiceOn])

  const addLog = useCallback((msg: string, type = 'EVENT') => {
    const { time, elapsed } = ts()
    setLogs(prev => [{ time, elapsed, msg, type }, ...prev])
  }, [elapsedSeconds])

  // --- HANDLERS ---
  const startEmergency = () => {
    setIsActive(true)
    setModal(null)
    speak(isJehovah ? "Código Rojo Especial activado." : "Código Rojo activado.")
    addLog(`CÓDIGO ROJO INICIADO ${isJehovah ? '(TESTIGO DE JEHOVÁ)' : ''}`, 'SYSTEM')
    triggerHaptic([200, 50, 200])
  }

  const triggerCodigoAzul = () => {
    setIsParo(true)
    setRcpSeconds(120)
    speak("Código azul obstétrico. Desplazar útero a la izquierda.")
    addLog("🚨 PARO CARDIORESPIRATORIO - INICIO RCP", "ALERT")
    triggerHaptic([500, 100, 500])
  }

  const adminAdrenalina = () => {
    if (adrTimer > 0) { speak("Espere, ventana de adrenalina no cumplida."); return }
    setAdrCount(c => c + 1)
    setAdrTimer(180)
    addLog(`ADRENALINA 1MG (#${adrCount + 1})`, "DRUG")
    speak("Adrenalina administrada.")
  }

  const adminVolumen = (tipo: string) => {
    setBloodLog(p => ({ ...p, [tipo]: p[tipo] + 1 }))
    const current = bloodLog[tipo] + 1
    const isCristal = tipo === 'cristaloides'
    const msg = isCristal ? `BOLO CRISTALOIDE 500ML (Total: ${current * 500}ml)` : `${BLOOD_NAMES[tipo].toUpperCase()} (Total: ${current}U)`
    addLog(`ADMIN: ${msg}`, "DRUG")
    speak(isCristal ? "Bolo de cristaloides administrado" : `Unidad de ${BLOOD_NAMES[tipo]} administrada`)
    triggerHaptic(50)
  }

  const adminLabetalol = (mg: number) => {
    setLabetalolTotal(t => t + mg)
    addLog(`ADMIN: LABETALOL ${mg}MG (Total acumulado: ${labetalolTotal + mg}mg)`, "DRUG")
    speak(`Labetalol ${mg} miligramos administrado.`)
  }

  const toggleChecklist = (id: string, label: string) => {
    setChecklists(p => {
      if (p.includes(id)) return p.filter(i => i !== id)
      addLog(`HITO: ${label.toUpperCase()}`, "TECH")
      speak("Completado.")
      triggerHaptic(50)
      return [...p, id]
    })
  }

  const toggleMed = (id: string, label: string) => {
    setMedsAdmin(p => {
      if (p.includes(id)) return p.filter(i => i !== id)
      addLog(`MEDICACIÓN: ${label.toUpperCase()}`, "DRUG")
      speak("Fármaco registrado.")
      triggerHaptic(50)
      return [...p, id]
    })
  }

  const handleFinishProtocol = (resultado: string) => {
    setIsActive(false)
    setIsFinished(true)
    setResultadoFinal(resultado)
    setModal('export')
    addLog(`FIN CÓDIGO ROJO: ${resultado}`, 'SYSTEM')
    speak(`Código desactivado. Resultado: ${resultado}`)
  }

  // --- REPORTES ---
  const generateReportText = () => {
    let r = `EVOLUCIÓN MÉDICA - CÓDIGO ROJO OBSTÉTRICO\n${'═'.repeat(50)}\n`
    r += `PACIENTE: ${pacienteNombre || 'S/D'} | ID: ${pacienteId || 'S/D'}\n`
    r += `FECHA: ${new Date().toLocaleDateString()} | DURACIÓN: ${formatTime(elapsedSeconds)}\n`
    r += `PROTOCOLO ESPECIAL: ${isJehovah ? 'SÍ (Testigo de Jehová)' : 'NO'}\n`
    r += `ÍNDICE CHOQUE FINAL: ${shockIndex} (FC: ${fc || '-'}, TAS: ${tas || '-'})\n`
    r += `${'═'.repeat(50)}\n\nLÍQUIDOS Y HEMODERIVADOS:\n`
    Object.entries(bloodLog).filter(([_, v]) => v > 0).forEach(([k, v]) => {
      r += `• ${k === 'cristaloides' ? `Cristaloides: ${v * 500} mL` : `${BLOOD_NAMES[k]}: ${v} Unidades`}\n`
    })
    r += `\nFÁRMACOS RELEVANTES:\n`
    medsAdmin.forEach(mId => {
      const med = Object.values(MEDS_HPP).flat().find(m => m.id === mId)
      if (med) r += `• ${med.label}\n`
    })
    if (labetalolTotal > 0) r += `• LABETALOL ACUMULADO: ${labetalolTotal} MG\n`
    if (isParo) r += `\nEVENTO DE PARO:\n• Adrenalinas: ${adrCount}\n`
    r += `\nCRONOLOGÍA DE EVENTOS:\n`
    logs.slice().reverse().forEach(l => { r += `[${l.time}] (+${l.elapsed}) ${l.msg}\n` })
    return r
  }

  const evolucionMedica = () => {
    let e = `Se atiende paciente obstétrica cursando con cuadro de hemorragia posparto (HPP). Se activa protocolo de Código Rojo Obstétrico institucional.`
    if (isJehovah) e += ` Paciente identificada bajo protocolo Testigo de Jehová; se omiten hemoderivados y se ajusta reanimación hídrica a expansores plasmáticos (almidones/gelatinas) y cristaloides.`
    if (fc && tas) e += ` Durante la reanimación se evidencia Índice de Choque de ${shockIndex} (FC: ${fc} lpm, TAS: ${tas} mmHg).`
    
    const checklistRealizados = checklists.map(id => STEPS_HPP.find(s => s.id === id)?.label).filter(Boolean)
    if (checklistRealizados.length > 0) e += ` Se realizan maniobras de estabilización y control del sangrado que incluyen: ${checklistRealizados.join(', ')}.`
    
    const medNombres = medsAdmin.map(id => Object.values(MEDS_HPP).flat().find(m => m.id === id)?.label.split(' ')[0]).filter(Boolean)
    if (medNombres.length > 0) e += ` Se administran agentes uterotónicos y/o coadyuvantes: ${medNombres.join(', ')}.`
    if (labetalolTotal > 0) e += ` Por cuadro hipertensivo concomitante se titula Labetalol hasta dosis total acumulada de ${labetalolTotal} mg.`
    
    const liquidos = Object.entries(bloodLog).filter(([_, v]) => v > 0)
    if (liquidos.length > 0) {
      e += ` Reanimación de control de daños con administración de: `
      e += liquidos.map(([k, v]) => k === 'cristaloides' ? `${v * 500} mL de cristaloides` : `${v} unidad(es) de ${BLOOD_NAMES[k]}`).join(', ') + `.`
    }

    if (isParo) e += ` Durante el evento la paciente presenta paro cardiorrespiratorio, activándose Código Azul obstétrico, realizando desplazamiento uterino a la izquierda, maniobras de RCP avanzada y administración de ${adrCount} dosis de adrenalina.`
    
    e += `\n\nTiempo total de intervención del Código Rojo: ${Math.floor(elapsedSeconds / 60)} minutos con ${elapsedSeconds % 60} segundos.`
    e += ` Desenlace: ${resultadoFinal || 'traslado a unidad de mayor complejidad para manejo interdisciplinario.'}`
    return e
  }

  const fullReport = () => generateReportText() + `\n\n${'═'.repeat(50)}\nEVOLUCIÓN MÉDICA NARRATIVA:\n${'─'.repeat(50)}\n${evolucionMedica()}\n`

  const B = 'active:scale-95 transition-all duration-150'

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-slate-100 flex flex-col items-center px-2 pt-2 pb-1 overflow-hidden select-none font-sans">
      
      {/* HEADER TOP */}
      <div className="w-full max-w-2xl bg-white/[0.03] backdrop-blur-md p-3 rounded-[24px] border border-white/[0.06] flex justify-between items-center mb-2 shrink-0 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-600/20">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[11px] font-black uppercase text-red-500 leading-none tracking-widest">Código Rojo <span className="text-rose-300">Pro</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 tabular-nums">{realTime.toLocaleTimeString('es-ES', { hour12: false })}</span>
              {isJehovah && <span className="text-[7px] font-black bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 ml-1">JEHOVÁ</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2 shadow-inner">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Tiempo</span>
            <span className="text-xl font-black text-white tabular-nums leading-none">{formatTime(elapsedSeconds)}</span>
          </div>
          <button onClick={() => setModal('finish')} disabled={!isActive} className={`w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 text-red-400 disabled:opacity-30 ${B}`}>
            <Power size={20} />
          </button>
        </div>
      </div>

      {/* VITAL SIGNS & SHOCK INDEX */}
      <div className="w-full max-w-2xl grid grid-cols-4 gap-2 mb-2 shrink-0">
         <div className="bg-slate-900/60 border border-white/5 p-2 rounded-[20px] flex flex-col items-center shadow-inner">
            <span className="text-[8px] font-black text-slate-500 uppercase mb-1">FC (lpm)</span>
            <input type="number" value={fc} onChange={e => setFc(e.target.value)} placeholder="--" className="bg-transparent w-full text-center text-xl font-black text-white focus:outline-none placeholder:text-slate-700" />
         </div>
         <div className="bg-slate-900/60 border border-white/5 p-2 rounded-[20px] flex flex-col items-center shadow-inner">
            <span className="text-[8px] font-black text-slate-500 uppercase mb-1">TAS (mmHg)</span>
            <input type="number" value={tas} onChange={e => setTas(e.target.value)} placeholder="--" className="bg-transparent w-full text-center text-xl font-black text-white focus:outline-none placeholder:text-slate-700" />
         </div>
         <div className="bg-slate-900/60 border border-white/5 p-2 rounded-[20px] flex flex-col items-center shadow-inner">
            <span className="text-[8px] font-black text-slate-500 uppercase mb-1">Sat O₂ %</span>
            <input type="number" value={sat} onChange={e => setSat(e.target.value)} placeholder="--" className="bg-transparent w-full text-center text-xl font-black text-white focus:outline-none placeholder:text-slate-700" />
         </div>
         <div className={`border p-2 rounded-[20px] flex flex-col items-center justify-center transition-all ${shockIndex !== '--' && parseFloat(shockIndex) >= 1.1 ? 'bg-red-600/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : shockIndex !== '--' && parseFloat(shockIndex) >= 0.9 ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-900/60 border-white/5'}`}>
            <span className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">I. Choque</span>
            <span className={`text-2xl font-black tabular-nums ${shockIndex !== '--' && parseFloat(shockIndex) >= 1.1 ? 'text-red-400 animate-pulse' : shockIndex !== '--' && parseFloat(shockIndex) >= 0.9 ? 'text-amber-400' : 'text-emerald-400'}`}>{shockIndex}</span>
         </div>
      </div>

      {/* CÓDIGO AZUL OVERRIDE */}
      {isParo && !isFinished && (
        <div className="w-full max-w-2xl bg-blue-600 p-4 rounded-[24px] border-b-4 border-blue-800 mb-2 shadow-2xl flex justify-between items-center animate-in slide-in-from-top-4">
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-center bg-blue-900/50 p-3 rounded-2xl border border-blue-400/30">
                 <span className="text-[9px] font-black text-blue-300 uppercase mb-1">Evaluar en</span>
                 <span className="text-3xl font-black tabular-nums text-white leading-none">{formatTime(rcpSeconds)}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-black text-white uppercase flex items-center gap-2"><Zap size={16}/> CÓDIGO AZUL OBSTÉTRICO</span>
                 <span className="text-[9px] font-bold text-blue-200 mt-1 uppercase tracking-widest bg-blue-900/40 px-2 py-0.5 rounded-md inline-block border border-blue-400/20">Desplazar útero a la izquierda</span>
              </div>
           </div>
           <button onClick={adminAdrenalina} className={`p-4 rounded-2xl border flex flex-col items-center gap-1 min-w-[100px] shadow-lg ${adrTimer > 0 ? 'bg-slate-800/80 border-slate-700 text-slate-500' : 'bg-emerald-500 border-emerald-400 text-white'}`}>
              <span className="text-[10px] font-black uppercase">Adrenalina</span>
              {adrTimer > 0 ? <span className="text-xl font-black tabular-nums">{formatTime(adrTimer)}</span> : <Syringe size={24}/>}
           </button>
        </div>
      )}

      {/* QUICK ACTIONS GRID */}
      {!isFinished && (
        <div className="w-full max-w-2xl grid grid-cols-4 gap-2 mb-2 shrink-0">
           <button onClick={() => setModal('protocolo')} className={`py-4 bg-slate-900 rounded-[24px] flex flex-col items-center gap-1 shadow-md border border-white/5 text-cyan-400 ${B}`}><ClipboardList size={22} /><span className="text-[9px] font-black uppercase tracking-tighter mt-1">Protocolo</span></button>
           <button onClick={() => setModal('farmacos')} className={`py-4 bg-slate-900 rounded-[24px] flex flex-col items-center gap-1 shadow-md border border-white/5 text-emerald-400 ${B}`}><Syringe size={22} /><span className="text-[9px] font-black uppercase tracking-tighter mt-1">Fármacos</span></button>
           <button onClick={() => setModal('liquidos')} className={`py-4 bg-slate-900 rounded-[24px] flex flex-col items-center gap-1 shadow-md border border-white/5 text-rose-400 ${B}`}><Droplets size={22} /><span className="text-[9px] font-black uppercase tracking-tighter mt-1">Líquidos</span></button>
           <button onClick={() => triggerCodigoAzul()} disabled={isParo} className={`py-4 bg-blue-600 rounded-[24px] flex flex-col items-center gap-1 shadow-md border-b-4 border-blue-800 text-white disabled:opacity-20 ${B}`}><Heart size={22} /><span className="text-[9px] font-black uppercase tracking-tighter mt-1">Paro (RCP)</span></button>
        </div>
      )}

      {/* CHRONOLOGICAL LOGS */}
      <div className="w-full max-w-2xl flex-1 bg-slate-900/40 rounded-[28px] border border-white/5 overflow-hidden flex flex-col mb-2 backdrop-blur-sm shadow-inner">
        <div className="p-3 border-b border-white/5 px-5 flex justify-between items-center bg-slate-900/60">
           <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Clock size={14}/> Bitácora de Eventos</span>
           {bloodLog.cristaloides > 0 && <span className="text-[9px] font-black text-rose-400">💧 {bloodLog.cristaloides * 500}ml</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px] scrollbar-hide">
           {logs.length === 0 && <div className="h-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-widest text-slate-500">Sin eventos registrados</div>}
           {logs.map((l, i) => (
             <div key={i} className="flex gap-4 border-b border-white/5 pb-2 animate-in slide-in-from-left-4 text-left">
                <span className="text-slate-500 font-bold shrink-0">{l.time}</span>
                <span className={`font-bold uppercase tracking-tight flex-1 ${l.type === 'ALERT' ? 'text-red-400' : l.type === 'DRUG' ? 'text-emerald-400' : l.type === 'TECH' ? 'text-cyan-400' : 'text-slate-300'}`}>{l.msg}</span>
             </div>
           ))}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* SETUP MODAL */}
      {modal === 'setup' && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 p-10 rounded-[40px] w-full max-w-sm border border-slate-700 shadow-2xl text-center">
             <div className="w-20 h-20 rounded-3xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                <AlertTriangle className="text-red-500 w-10 h-10" />
             </div>
             <h2 className="text-4xl font-black uppercase text-white tracking-tighter italic mb-1">CÓDIGO <span className="text-red-600">ROJO</span></h2>
             <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase mb-10">Asistencia Obstétrica Crítica</p>
             
             <div className="space-y-4 mb-10 text-left">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                   <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-2">Nombre Paciente</label>
                   <input type="text" value={pacienteNombre} onChange={e => setPacienteNombre(e.target.value)} placeholder="PACIENTE EN CURSO..." className="w-full bg-transparent text-white font-black uppercase focus:outline-none placeholder:text-slate-600" />
                </div>
                <button onClick={() => setIsJehovah(!isJehovah)} className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${isJehovah ? 'bg-red-600/10 border-red-500/50' : 'bg-slate-800/50 border-white/5'}`}>
                   <div className="flex flex-col text-left">
                      <span className={`text-[11px] font-black uppercase italic ${isJehovah ? 'text-red-400' : 'text-slate-300'}`}>Testigo de Jehová</span>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Manejo sin Hemoderivados</span>
                   </div>
                   <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${isJehovah ? 'bg-red-600 border-red-600 text-white' : 'border-slate-600'}`}>{isJehovah && <Check size={14}/>}</div>
                </button>
             </div>

             <button onClick={startEmergency} className="w-full py-6 bg-red-600 border-b-[8px] border-red-900 rounded-[32px] font-black text-2xl uppercase tracking-widest shadow-[0_0_40px_rgba(220,38,38,0.4)] active:translate-y-1 active:border-b-0 transition-all">ACTIVAR</button>
          </div>
        </div>
      )}

      {/* PROTOCOL MODAL */}
      {modal === 'protocolo' && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-[40px] border border-slate-700 shadow-2xl flex flex-col h-full max-h-[85vh] overflow-hidden">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 shrink-0">
                <h3 className="font-black text-cyan-400 uppercase text-sm tracking-widest flex items-center gap-3"><ClipboardList size={20}/> Pasos HPP</h3>
                <button onClick={() => setModal(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><XCircle size={24}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
                {STEPS_HPP.map(s => {
                  const done = checklists.includes(s.id)
                  return (
                    <button key={s.id} onClick={() => toggleChecklist(s.id, s.label)} className={`w-full p-5 rounded-3xl border flex items-center justify-between transition-all text-left active:scale-[0.98] ${done ? 'bg-cyan-600/10 border-cyan-500/40' : 'bg-slate-800/40 border-white/5'}`}>
                       <div className="flex flex-col">
                          <span className={`text-[12px] font-black uppercase ${done ? 'text-cyan-300' : 'text-slate-200'}`}>{s.label}</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Fase {s.phase} min</span>
                       </div>
                       <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? 'bg-cyan-500 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'border-slate-600'}`}>{done && <Check size={16}/>}</div>
                    </button>
                  )
                })}
             </div>
          </div>
        </div>
      )}

      {/* FARMACOS MODAL */}
      {modal === 'farmacos' && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-[40px] border border-slate-700 shadow-2xl flex flex-col h-full max-h-[85vh] overflow-hidden">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 shrink-0">
                <h3 className="font-black text-emerald-400 uppercase text-sm tracking-widest flex items-center gap-3"><Syringe size={20}/> Farmacología</h3>
                <button onClick={() => setModal(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><XCircle size={24}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {Object.entries(MEDS_HPP).map(([category, meds]) => (
                  <div key={category} className="mb-8">
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 border-l-2 border-slate-600 pl-3">{category}</h4>
                     <div className="space-y-3">
                        {meds.map(m => {
                          if (m.type === 'LABETALOL_PROTOCOL') {
                             return (
                               <div key={m.id} className="bg-slate-800/40 border border-slate-700 p-5 rounded-3xl shadow-inner">
                                  <div className="flex justify-between items-center mb-4">
                                     <span className="text-[11px] font-black text-white uppercase italic">Esquema Labetalol</span>
                                     <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-[10px] font-black border border-emerald-500/30">Tot: {labetalolTotal}mg</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                     {[20, 40, 80].map(d => (
                                       <button key={d} onClick={() => adminLabetalol(d)} className="bg-slate-700 hover:bg-slate-600 py-3 rounded-2xl text-[10px] font-black text-white border border-slate-600 active:scale-95 transition-all">{d} MG</button>
                                     ))}
                                  </div>
                               </div>
                             )
                          }
                          const done = medsAdmin.includes(m.id)
                          return (
                            <button key={m.id} onClick={() => toggleMed(m.id, m.label)} className={`w-full p-5 rounded-3xl border flex items-center justify-between transition-all text-left active:scale-[0.98] ${done ? 'bg-emerald-600/10 border-emerald-500/40' : 'bg-slate-800/40 border-white/5'}`}>
                               <div className="flex flex-col">
                                  <span className={`text-[11px] font-black uppercase ${done ? 'text-emerald-300' : 'text-white'}`}>{m.label}</span>
                                  <span className="text-[8px] font-bold text-red-400/80 uppercase tracking-widest mt-1">{m.alert}</span>
                               </div>
                               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'}`}>{done && <Check size={14}/>}</div>
                            </button>
                          )
                        })}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* LIQUIDOS MODAL */}
      {modal === 'liquidos' && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-[40px] border border-slate-700 shadow-2xl flex flex-col h-full max-h-[85vh] overflow-hidden">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 shrink-0">
                <h3 className="font-black text-rose-400 uppercase text-sm tracking-widest flex items-center gap-3"><Droplets size={20}/> Líquidos / Sangre</h3>
                <button onClick={() => setModal(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white"><XCircle size={24}/></button>
             </div>
             
             {isJehovah && (
               <div className="bg-red-600/20 border-b border-red-500/30 p-4 text-center">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center justify-center gap-2"><Info size={14}/> Protocolo Testigo de Jehová Activo</span>
               </div>
             )}

             <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <button onClick={() => adminVolumen('cristaloides')} className="w-full bg-blue-600/10 border border-blue-500/30 p-6 rounded-3xl flex justify-between items-center active:scale-[0.98] transition-all mb-6">
                   <div className="text-left">
                      <span className="text-sm font-black text-blue-400 uppercase block mb-1">Cristaloides</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bolo de 500ml</span>
                   </div>
                   <div className="text-right">
                      <span className="text-3xl font-black tabular-nums text-white">{bloodLog.cristaloides * 500}</span>
                      <span className="text-[9px] font-bold text-blue-500 uppercase ml-1">ML</span>
                   </div>
                </button>

                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 border-l-2 border-slate-600 pl-3">Hemoderivados / Expansores</h4>
                <div className="grid grid-cols-2 gap-3">
                   {(isJehovah ? ['almidones', 'gelatinas'] : ['ugr', 'pfc', 'plaquetas', 'crio']).map(t => (
                     <button key={t} onClick={() => adminVolumen(t)} className="bg-slate-800/40 border border-rose-500/20 p-6 rounded-3xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-inner">
                        <span className="text-4xl font-black tabular-nums text-white mb-2">{bloodLog[t]}</span>
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-wider text-center">{BLOOD_NAMES[t]}</span>
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* FINISH MODAL */}
      {modal === 'finish' && (
        <div className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 p-10 rounded-[40px] w-full max-w-sm border border-slate-700 shadow-2xl text-center">
             <h3 className="text-2xl font-black uppercase mb-8 tracking-tighter text-white">Desactivar Código</h3>
             <div className="space-y-4">
                <button onClick={() => handleFinishProtocol("ESTABILIZACIÓN Y TRASLADO")} className="w-full py-5 bg-emerald-600 border-b-4 border-emerald-800 rounded-[24px] font-black uppercase text-[11px] shadow-xl active:translate-y-1 transition-all text-white tracking-widest">Estabilización Lograda</button>
                <button onClick={() => handleFinishProtocol("HISTERECTOMÍA OBSTÉTRICA")} className="w-full py-5 bg-rose-600 border-b-4 border-rose-800 rounded-[24px] font-black uppercase text-[11px] shadow-xl active:translate-y-1 transition-all text-white tracking-widest">Paso a Cirugía</button>
                <button onClick={() => handleFinishProtocol("FALLECIMIENTO MATERNO")} className="w-full py-5 bg-slate-800 border-b-4 border-slate-950 rounded-[24px] font-black uppercase text-[11px] shadow-xl active:translate-y-1 transition-all text-slate-300 border border-slate-700 tracking-widest">Fallecimiento</button>
                <button onClick={() => setModal(null)} className="text-slate-500 text-[10px] font-black uppercase pt-6 block mx-auto tracking-widest hover:text-slate-300">Cancelar</button>
             </div>
          </div>
        </div>
      )}

      {/* EXPORT / EPICRISIS MODAL */}
      {modal === 'export' && (
        <div className="fixed inset-0 z-[2000] bg-black/95 flex flex-col items-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-[40px] p-6 flex flex-col h-full max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-12 overflow-hidden">
            <div className="flex justify-between items-center mb-5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600/10 border border-red-500/30 rounded-2xl text-red-500"><FileText size={22}/></div>
                <h2 className="text-sm font-black uppercase tracking-tight text-white">Reporte Código Rojo</h2>
              </div>
              <button onClick={() => window.location.reload()} className="bg-slate-800 p-2.5 rounded-2xl text-slate-400 active:scale-90"><RotateCcw size={20} /></button>
            </div>

            <div className="flex gap-1.5 mb-4 shrink-0">
              {['resumen', 'evolucion', 'bitacora'].map(t => (
                <button key={t} onClick={() => setReportTab(t)} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${reportTab === t ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>
                  {t === 'resumen' ? 'Resumen' : t === 'evolucion' ? 'Evolución' : 'Bitácora'}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-950 border border-white/5 rounded-[24px] p-6 mb-5 shadow-inner scrollbar-hide text-left">
              {reportTab === 'resumen' && <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">{generateReportText()}</pre>}
              {reportTab === 'evolucion' && (
                <div>
                  <div className="flex items-center gap-2 mb-4"><FileText className="w-4 h-4 text-red-400" /><span className="text-[11px] font-black text-red-400 uppercase tracking-widest">Evolución Médica Narrativa</span></div>
                  <p className="text-[11px] text-slate-300/90 leading-[1.8] font-medium">{evolucionMedica()}</p>
                  <button onClick={() => { navigator.clipboard.writeText(evolucionMedica()); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="mt-6 w-full py-3 bg-red-600/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95">{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? '¡Copiado!' : 'Copiar evolución'}</button>
                </div>
              )}
              {reportTab === 'bitacora' && (
                <div className="space-y-2">{[...logs].reverse().map((l, i) => (
                  <div key={i} className="flex items-start gap-3 border-l-2 border-white/10 pl-3 py-1 text-left">
                    <span className="text-[9px] font-bold text-slate-500 tabular-nums shrink-0 w-[45px]">{l.time}</span>
                    <span className={`uppercase font-bold text-[10px] ${l.type === 'DRUG' ? 'text-emerald-400' : l.type === 'ALERT' ? 'text-red-400' : l.type === 'TECH' ? 'text-cyan-400' : 'text-slate-300'}`}>{l.msg}</span>
                  </div>
                ))}</div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2.5 shrink-0">
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(fullReport())}`, '_blank')} className="py-4 bg-emerald-600 rounded-2xl text-white flex flex-col items-center gap-1.5 active:scale-95 shadow-lg"><MessageCircle size={18}/><span className="text-[8px] font-black uppercase tracking-widest">WhatsApp</span></button>
                <button onClick={() => window.open(`mailto:?subject=CodigoRojo%20Evolucion&body=${encodeURIComponent(fullReport())}`, '_blank')} className="py-4 bg-slate-800 border border-white/5 rounded-2xl text-white flex flex-col items-center gap-1.5 active:scale-95 shadow-lg"><Mail size={18}/><span className="text-[8px] font-black uppercase tracking-widest">Email</span></button>
                <button onClick={() => { navigator.clipboard.writeText(fullReport()); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="py-4 bg-slate-800 border border-white/5 rounded-2xl text-slate-300 flex flex-col items-center gap-1.5 active:scale-95 shadow-lg">{copied ? <Check size={18}/> : <Copy size={18}/>}<span className="text-[8px] font-black uppercase tracking-widest">{copied ? '¡Copiado!' : 'Copiar'}</span></button>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLES DE AUDIO INFERIORES */}
      <div className="w-full max-w-2xl px-4 py-3 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest shrink-0 border-t border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
         <span>Obstetricia Pro v2</span>
         <button onClick={() => setVoiceOn(!voiceOn)} className={`p-2 rounded-xl transition-all shadow-lg ${voiceOn ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-500"}`}>{voiceOn ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

    </div>
  )
}