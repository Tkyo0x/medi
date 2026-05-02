import { Heart, Baby, Syringe, Activity, FileText, Timer, Scale } from 'lucide-react'
import type { TutorialSlide, TutorialStep } from './ModuleTutorial'

export const NALS_SLIDES: TutorialSlide[] = [
  {
    title: 'Bienvenido a NALS Monitor',
    description: 'Monitor de reanimación neonatal con cronómetro, metrónomo 3:1, dosis automáticas y epicrisis profesional. Todo funciona offline.',
    icon: <Heart className="w-7 h-7 text-white" />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Ingreso del Paciente',
    description: 'Ingresá el peso y la edad gestacional del neonato. El sistema calculará automáticamente todas las dosis de adrenalina y volúmenes.',
    icon: <Baby className="w-7 h-7 text-white" />,
    color: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Reanimación Paso a Paso',
    description: 'Seguí el algoritmo NRP: pasos iniciales → VPP → compresiones 3:1 → adrenalina. El metrónomo te guía con audio y vibración.',
    icon: <Activity className="w-7 h-7 text-white" />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Evolución Médica Automática',
    description: 'Al finalizar, el sistema genera la evolución médica narrativa y epicrisis completa. Exportá por WhatsApp, email o copiá directo a la historia clínica.',
    icon: <FileText className="w-7 h-7 text-white" />,
    color: 'from-amber-500 to-orange-500',
  },
]

export const NALS_STEPS: TutorialStep[] = [
  {
    target: 'nals-weight',
    title: 'Peso del paciente',
    description: 'Tocá aquí para ingresar el peso en kilogramos. Las dosis se calculan automáticamente.',
  },
  {
    target: 'nals-eg',
    title: 'Edad Gestacional',
    description: 'Ingresá las semanas de gestación. Determina los rangos de SpO2 esperados.',
  },
  {
    target: 'nals-ritmo',
    title: 'Ritmo Cardíaco',
    description: 'Seleccioná el ritmo del neonato: Bradicardia, Asistolia, AESP o Normal.',
  },
  {
    target: 'nals-triada',
    title: 'Tríada de Evaluación',
    description: 'Evaluá apariencia, esfuerzo respiratorio, circulación y simetría torácica.',
  },
  {
    target: 'nals-start',
    title: 'Iniciar Reanimación',
    description: 'Tocá para iniciar el cronómetro y el metrónomo 3:1 (100-120/min). Comenzá las maniobras.',
  },
  {
    target: 'nals-escalas',
    title: 'Escalas (APGAR / Sarnat)',
    description: 'Registrá el APGAR al minuto 1, 5 y 10. También podés clasificar Sarnat.',
  },
  {
    target: 'nals-gases',
    title: 'Gasimetría',
    description: 'Ingresá valores de gases arteriales: pH, pCO2, pO2, HCO3, EB, Lactato.',
  },
  {
    target: 'nals-drogas',
    title: 'Farmacología',
    description: 'Administrá adrenalina (IV/CVU, IO o ET) y líquidos. Las dosis están pre-calculadas por peso.',
  },
  {
    target: 'nals-causas',
    title: 'Causas y Accesos',
    description: 'Registrá causas reversibles, accesos vasculares (CVU, IO, periférico) y procedimientos.',
  },
]
