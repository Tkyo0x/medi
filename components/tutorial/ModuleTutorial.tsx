'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, CheckCircle2, HelpCircle } from 'lucide-react'

export interface TutorialSlide {
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

export interface TutorialStep {
  target: string
  title: string
  description: string
  autoClose?: boolean
}

interface Props {
  moduleId: string
  moduleName: string
  moduleColor: string
  slides: TutorialSlide[]
  steps: TutorialStep[]
  onClose: () => void
}

export default function ModuleTutorial({ moduleId, moduleName, moduleColor, slides, steps, onClose }: Props) {
  const [phase, setPhase] = useState<'slides' | 'practice' | 'done'>('slides')
  const [slideIdx, setSlideIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [highlight, setHighlight] = useState<DOMRect | null>(null)
  const [pulseKey, setPulseKey] = useState(0)

  const storageKey = `tutorial_${moduleId}`

  const markComplete = useCallback(() => {
    try { localStorage.setItem(storageKey, 'done') } catch {}
    setPhase('done')
  }, [storageKey])

  const closeAllModals = useCallback(() => {
    document.querySelectorAll('[class*="fixed inset-0"]').forEach(el => {
      if (el.classList.contains('z-[9998]') || el.classList.contains('z-[9999]')) return
      const btn = el.querySelector('button')
      if (btn) { const rect = btn.getBoundingClientRect(); if (rect.width < 80) (btn as HTMLElement).click() }
    })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  }, [])

  useEffect(() => {
    if (phase !== 'practice') { setHighlight(null); return }
    const step = steps[stepIdx]
    if (!step) { markComplete(); return }
    if (step.autoClose !== false) closeAllModals()
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-tutorial="${step.target}"]`) as HTMLElement
      if (el) { setHighlight(el.getBoundingClientRect()); setPulseKey(k => k + 1); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }
      else setHighlight(null)
    }, 400)
    return () => clearTimeout(timer)
  }, [phase, stepIdx, steps, markComplete, closeAllModals])

  useEffect(() => {
    if (phase !== 'practice') return
    const step = steps[stepIdx]
    if (!step) return
    const handler = (e: Event) => {
      const el = document.querySelector(`[data-tutorial="${step.target}"]`)
      if (el && (el === e.target || el.contains(e.target as Node))) {
        setTimeout(() => { if (stepIdx + 1 < steps.length) setStepIdx(stepIdx + 1); else markComplete() }, 600)
      }
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [phase, stepIdx, steps, markComplete])

  useEffect(() => {
    if (phase !== 'practice') return
    const recalc = () => {
      const step = steps[stepIdx]
      if (!step) return
      const el = document.querySelector(`[data-tutorial="${step.target}"]`) as HTMLElement
      if (el) setHighlight(el.getBoundingClientRect())
    }
    window.addEventListener('scroll', recalc, true)
    window.addEventListener('resize', recalc)
    return () => { window.removeEventListener('scroll', recalc, true); window.removeEventListener('resize', recalc) }
  }, [phase, stepIdx, steps])

  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">¡Tutorial Completado!</h3>
          <p className="text-sm text-slate-400 font-medium mb-6">Ya conocés todas las herramientas de {moduleName}. Podés repetirlo desde el botón <span className="inline-flex items-center gap-0.5 bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded text-[10px] font-bold"><HelpCircle className="w-3 h-3" /></span> en la barra inferior.</p>
          <button onClick={onClose} className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-sm active:scale-[0.97] shadow-lg">Comenzar</button>
        </div>
      </div>
    )
  }

  if (phase === 'slides') {
    const slide = slides[slideIdx]
    const isLast = slideIdx === slides.length - 1
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-white/10 rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{slideIdx + 1} / {slides.length}</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xs font-bold flex items-center gap-1">Omitir <X className="w-3.5 h-3.5" /></button>
          </div>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}>{slide.icon}</div>
          <h3 className="text-lg font-black text-white text-center mb-2">{slide.title}</h3>
          <p className="text-sm text-slate-400 font-medium text-center leading-relaxed mb-8">{slide.description}</p>
          <div className="flex justify-center gap-1.5 mb-6">
            {slides.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIdx ? 'w-6 bg-white' : 'w-1.5 bg-slate-700'}`} />))}
          </div>
          <div className="flex gap-2">
            {slideIdx > 0 && <button onClick={() => setSlideIdx(slideIdx - 1)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold text-sm flex items-center justify-center gap-1 active:scale-[0.97]"><ChevronLeft className="w-4 h-4" /> Anterior</button>}
            <button onClick={() => isLast ? setPhase('practice') : setSlideIdx(slideIdx + 1)} className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-1 active:scale-[0.97] shadow-lg ${isLast ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900'}`}>
              {isLast ? '¡Vamos! Práctica guiada' : 'Siguiente'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const step = steps[stepIdx]
  const getPos = () => {
    if (!highlight) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
    const tw = 280, th = 160, m = 12, vw = window.innerWidth, vh = window.innerHeight
    let top = highlight.bottom + m, left = Math.max(m, Math.min(highlight.left, vw - tw - m))
    if (top + th > vh - 60) top = Math.max(m, highlight.top - th - m)
    return { left: `${left}px`, top: `${top}px`, maxWidth: `${tw}px` }
  }

  return (
    <>
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg className="w-full h-full"><defs><mask id="tut-mask"><rect width="100%" height="100%" fill="white" />{highlight && <rect x={highlight.left - 8} y={highlight.top - 8} width={highlight.width + 16} height={highlight.height + 16} rx="16" fill="black" />}</mask></defs><rect width="100%" height="100%" fill="rgba(0,0,0,0.8)" mask="url(#tut-mask)" /></svg>
      </div>
      {highlight && <div key={pulseKey} className="fixed z-[9999] pointer-events-none rounded-2xl border-2 border-cyan-400" style={{ left: highlight.left - 8, top: highlight.top - 8, width: highlight.width + 16, height: highlight.height + 16, boxShadow: '0 0 24px rgba(34,211,238,0.4)', animation: 'pulse 1.5s ease-in-out infinite' }} />}
      {highlight && <div className="fixed z-[9999] pointer-events-none text-xl" style={{ left: highlight.left + highlight.width / 2 - 10, top: highlight.top - 28, animation: 'tbounce 1s ease-in-out infinite' }}>👆</div>}
      <div className="fixed z-[9999] pointer-events-auto" style={getPos()}>
        <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[10px] font-black">{stepIdx + 1}</span>
              Paso {stepIdx + 1} de {steps.length}
            </span>
            <button onClick={onClose} className="text-slate-600 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
          <h4 className="text-sm font-black text-white mb-1">{step?.title}</h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-3">{step?.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden mr-3">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} />
            </div>
            <div className="flex gap-1 shrink-0">
              {stepIdx > 0 && <button onClick={() => setStepIdx(stepIdx - 1)} className="text-[10px] font-bold text-slate-500 hover:text-white px-2 py-1 rounded-lg">←</button>}
              <button onClick={() => { if (stepIdx + 1 < steps.length) setStepIdx(stepIdx + 1); else markComplete() }} className="text-[10px] font-bold text-cyan-400 px-2 py-1 rounded-lg hover:bg-cyan-500/20">Saltar →</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes tbounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }`}</style>
    </>
  )
}

export function useTutorial(moduleId: string) {
  const [show, setShow] = useState(false)
  useEffect(() => { try { if (!localStorage.getItem(`tutorial_${moduleId}`)) setShow(true) } catch {} }, [moduleId])
  return { showTutorial: show, setShowTutorial: setShow }
}
