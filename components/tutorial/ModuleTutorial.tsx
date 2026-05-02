'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, ChevronLeft, Heart, Sparkles, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react'

export interface TutorialSlide {
  title: string
  description: string
  icon: React.ReactNode
  color: string // tailwind gradient
}

export interface TutorialStep {
  target: string // data-tutorial attribute value on the real button
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
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

  const storageKey = `tutorial_${moduleId}`

  const markComplete = useCallback(() => {
    try { localStorage.setItem(storageKey, 'done') } catch {}
    setPhase('done')
  }, [storageKey])

  // Find and highlight target element
  useEffect(() => {
    if (phase !== 'practice') { setHighlight(null); return }
    const step = steps[stepIdx]
    if (!step) { markComplete(); return }

    const el = document.querySelector(`[data-tutorial="${step.target}"]`) as HTMLElement
    if (el) {
      const rect = el.getBoundingClientRect()
      setHighlight(rect)
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else {
      setHighlight(null)
    }
  }, [phase, stepIdx, steps, markComplete])

  // Listen for click on highlighted element to advance
  useEffect(() => {
    if (phase !== 'practice') return
    const step = steps[stepIdx]
    if (!step) return

    const handler = (e: Event) => {
      const el = document.querySelector(`[data-tutorial="${step.target}"]`)
      if (el && (el === e.target || el.contains(e.target as Node))) {
        setTimeout(() => {
          if (stepIdx + 1 < steps.length) setStepIdx(stepIdx + 1)
          else markComplete()
        }, 300)
      }
    }

    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [phase, stepIdx, steps, markComplete])

  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-white/10 rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-5 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">¡Tutorial Completado!</h3>
          <p className="text-sm text-slate-400 font-medium mb-6">Ya conocés las herramientas de {moduleName}. Podés acceder al tutorial cuando quieras desde el botón <HelpCircle className="w-3.5 h-3.5 inline" />.</p>
          <button onClick={onClose} className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-sm active:scale-[0.97] shadow-lg shadow-emerald-600/20">
            Comenzar a usar {moduleName}
          </button>
        </div>
      </div>
    )
  }

  // ─── SLIDES PHASE ───
  if (phase === 'slides') {
    const slide = slides[slideIdx]
    const isLast = slideIdx === slides.length - 1

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <div className="bg-slate-900 border border-white/10 rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl">
          {/* Skip */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{slideIdx + 1} / {slides.length}</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors">Omitir <X className="w-3.5 h-3.5" /></button>
          </div>

          {/* Content */}
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
            {slide.icon}
          </div>
          <h3 className="text-lg font-black text-white text-center mb-2">{slide.title}</h3>
          <p className="text-sm text-slate-400 font-medium text-center leading-relaxed mb-8">{slide.description}</p>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {slides.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === slideIdx ? 'w-6 bg-white' : 'w-1.5 bg-slate-700'}`} />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {slideIdx > 0 && (
              <button onClick={() => setSlideIdx(slideIdx - 1)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold text-sm flex items-center justify-center gap-1 active:scale-[0.97]">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
            )}
            <button onClick={() => isLast ? setPhase('practice') : setSlideIdx(slideIdx + 1)}
              className={`flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-1 active:scale-[0.97] shadow-lg ${isLast ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-white text-slate-900'}`}>
              {isLast ? 'Iniciar práctica' : 'Siguiente'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── PRACTICE PHASE ───
  const step = steps[stepIdx]

  return (
    <>
      {/* Overlay with hole */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="tutorial-mask">
              <rect width="100%" height="100%" fill="white" />
              {highlight && (
                <rect x={highlight.left - 6} y={highlight.top - 6} width={highlight.width + 12} height={highlight.height + 12} rx="16" fill="black" />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#tutorial-mask)" />
        </svg>
      </div>

      {/* Highlight border */}
      {highlight && (
        <div className="fixed z-[9999] pointer-events-none rounded-2xl border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse"
          style={{ left: highlight.left - 6, top: highlight.top - 6, width: highlight.width + 12, height: highlight.height + 12 }} />
      )}

      {/* Tooltip */}
      <div className="fixed z-[9999] pointer-events-auto" style={{
        left: highlight ? Math.min(highlight.left, window.innerWidth - 300) : '50%',
        top: highlight ? (highlight.bottom + 16) : '50%',
        transform: highlight ? 'none' : 'translate(-50%, -50%)',
        maxWidth: '280px',
      }}>
        <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Paso {stepIdx + 1}/{steps.length}</span>
            <button onClick={onClose} className="text-slate-600 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
          <h4 className="text-sm font-black text-white mb-1">{step?.title}</h4>
          <p className="text-xs text-slate-400 font-medium leading-relaxed mb-3">{step?.description}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} />
            </div>
            <button onClick={() => { if (stepIdx + 1 < steps.length) setStepIdx(stepIdx + 1); else markComplete() }}
              className="text-[10px] font-bold text-cyan-400 hover:text-white shrink-0">Saltar →</button>
          </div>
        </div>
      </div>
    </>
  )
}

export function useTutorial(moduleId: string) {
  const [show, setShow] = useState(false)
  const [firstTime, setFirstTime] = useState(false)

  useEffect(() => {
    try {
      const done = localStorage.getItem(`tutorial_${moduleId}`)
      if (!done) { setShow(true); setFirstTime(true) }
    } catch {}
  }, [moduleId])

  return { showTutorial: show, setShowTutorial: setShow, isFirstTime: firstTime }
}
