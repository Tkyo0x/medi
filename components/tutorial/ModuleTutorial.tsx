'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react'

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
  closeModal?: boolean
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
  const rafRef = useRef<number>(0)

  const storageKey = `tutorial_${moduleId}`

  const markComplete = useCallback(() => {
    try { localStorage.setItem(storageKey, 'done') } catch {}
    setPhase('done')
  }, [storageKey])

  const advanceStep = useCallback(() => {
    if (stepIdx + 1 < steps.length) setStepIdx(stepIdx + 1)
    else markComplete()
  }, [stepIdx, steps.length, markComplete])

  // Close module modal via custom event (monitors listen for this)
  const requestModalClose = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tutorial-close-modal'))
  }, [])

  // Find target element and update highlight
  const updateHighlight = useCallback(() => {
    if (phase !== 'practice') { setHighlight(null); return }
    const step = steps[stepIdx]
    if (!step) return
    const el = document.querySelector(`[data-tutorial="${step.target}"]`) as HTMLElement
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setHighlight(rect)
        return
      }
    }
    setHighlight(null)
  }, [phase, stepIdx, steps])

  // On step change: close modal if needed, then find element
  useEffect(() => {
    if (phase !== 'practice') { setHighlight(null); return }
    const step = steps[stepIdx]
    if (!step) { markComplete(); return }

    if (step.closeModal !== false) requestModalClose()

    const t = setTimeout(updateHighlight, 450)
    return () => clearTimeout(t)
  }, [phase, stepIdx, steps, markComplete, requestModalClose, updateHighlight])

  // Continuously update highlight position (handles scroll, resize, layout shifts)
  useEffect(() => {
    if (phase !== 'practice') return
    let active = true
    const loop = () => {
      if (!active) return
      updateHighlight()
      rafRef.current = requestAnimationFrame(loop)
    }
    // Start after initial delay
    const t = setTimeout(() => { rafRef.current = requestAnimationFrame(loop) }, 500)
    return () => { active = false; cancelAnimationFrame(rafRef.current); clearTimeout(t) }
  }, [phase, stepIdx, updateHighlight])

  // Listen for click on target to advance
  useEffect(() => {
    if (phase !== 'practice') return
    const step = steps[stepIdx]
    if (!step) return

    const handler = (e: Event) => {
      const el = document.querySelector(`[data-tutorial="${step.target}"]`)
      if (el && (el === e.target || el.contains(e.target as Node))) {
        setTimeout(advanceStep, 500)
      }
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [phase, stepIdx, steps, advanceStep])

  // ─── DONE ───
  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-900 border border-white/10 rounded-[28px] p-7 max-w-sm w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className="text-lg font-black text-white mb-1.5">¡Listo!</h3>
          <p className="text-sm text-slate-400 font-medium mb-5">Ya conocés {moduleName}. Repetí el tutorial cuando quieras con el botón <span className="inline-flex items-center bg-cyan-500/10 text-cyan-400 px-1 py-0.5 rounded text-[9px] font-bold"><HelpCircle className="w-2.5 h-2.5 mr-0.5" />?</span></p>
          <button onClick={onClose} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-sm active:scale-[0.97]">Empezar</button>
        </div>
      </div>
    )
  }

  // ─── SLIDES ───
  if (phase === 'slides') {
    const slide = slides[slideIdx]
    const isLast = slideIdx === slides.length - 1
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-900 border border-white/10 rounded-[28px] p-6 max-w-sm w-full shadow-2xl">
          <div className="flex justify-between items-center mb-5">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{slideIdx + 1}/{slides.length}</span>
            <button onClick={onClose} className="text-slate-600 hover:text-white text-[11px] font-bold flex items-center gap-1">Omitir <X className="w-3 h-3" /></button>
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${slide.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>{slide.icon}</div>
          <h3 className="text-base font-black text-white text-center mb-1.5">{slide.title}</h3>
          <p className="text-[13px] text-slate-400 font-medium text-center leading-relaxed mb-6">{slide.description}</p>
          <div className="flex justify-center gap-1 mb-5">
            {slides.map((_, i) => (<div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === slideIdx ? 'w-5 bg-white' : 'w-1.5 bg-slate-700'}`} />))}
          </div>
          <div className="flex gap-2">
            {slideIdx > 0 && <button onClick={() => setSlideIdx(slideIdx - 1)} className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-xl font-bold text-sm flex items-center justify-center gap-1 active:scale-[0.97]"><ChevronLeft className="w-4 h-4" /></button>}
            <button onClick={() => isLast ? setPhase('practice') : setSlideIdx(slideIdx + 1)} className={`flex-1 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-1 active:scale-[0.97] ${isLast ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900'}`}>
              {isLast ? 'Iniciar práctica' : 'Siguiente'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── PRACTICE ───
  const step = steps[stepIdx]
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800

  const tooltipStyle = (() => {
    if (!highlight) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' } as React.CSSProperties
    const w = 260, m = 10
    let top = highlight.bottom + m
    let left = Math.max(m, Math.min(highlight.left, vw - w - m))
    // If below goes off screen, put above
    if (top + 150 > vh - 50) top = Math.max(m, highlight.top - 150 - m)
    // If still off, center
    if (top < m) top = vh / 2 - 75
    return { left: `${left}px`, top: `${top}px`, width: `${w}px` } as React.CSSProperties
  })()

  return (
    <>
      {/* Overlay with cutout */}
      <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: 'none' }}>
        <svg className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <mask id="spotlight">
              <rect width="100%" height="100%" fill="white" />
              {highlight && <rect x={highlight.left - 6} y={highlight.top - 6} width={highlight.width + 12} height={highlight.height + 12} rx="14" fill="black" />}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.78)" mask="url(#spotlight)" />
        </svg>
      </div>

      {/* Glow ring around target */}
      {highlight && (
        <div className="fixed z-[9999] pointer-events-none rounded-2xl" style={{
          left: highlight.left - 6, top: highlight.top - 6,
          width: highlight.width + 12, height: highlight.height + 12,
          border: '2px solid rgba(34,211,238,0.6)',
          boxShadow: '0 0 16px rgba(34,211,238,0.25), inset 0 0 16px rgba(34,211,238,0.08)',
        }} />
      )}

      {/* Tooltip */}
      <div className="fixed z-[9999]" style={{ ...tooltipStyle, pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="bg-[#0c1425] border border-cyan-500/20 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-[10px] font-black text-white flex items-center justify-center">{stepIdx + 1}</span>
              <span className="text-[9px] font-black text-cyan-400/70 uppercase tracking-wider">de {steps.length}</span>
            </div>
            <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
          </div>

          {/* Content */}
          <h4 className="text-[13px] font-black text-white mb-1 leading-tight">{step?.title}</h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-3">{step?.description}</p>

          {/* Tap indicator */}
          <div className="flex items-center gap-1.5 mb-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-2.5 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-bold text-cyan-400/80">Tocá el botón resaltado para continuar</span>
          </div>

          {/* Progress + nav */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} />
            </div>
            <div className="flex gap-1 shrink-0">
              {stepIdx > 0 && <button onClick={() => setStepIdx(stepIdx - 1)} className="text-[10px] text-slate-500 hover:text-white font-bold px-1.5 py-0.5 rounded transition-colors">←</button>}
              <button onClick={advanceStep} className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold px-1.5 py-0.5 rounded transition-colors">Saltar →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function useTutorial(moduleId: string) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try { if (!localStorage.getItem(`tutorial_${moduleId}`)) setShow(true) } catch {}
  }, [moduleId])
  return { showTutorial: show, setShowTutorial: setShow }
}