import { Heart, Baby, Syringe, Activity, FileText, Timer, Scale, FlaskConical, ShieldAlert } from 'lucide-react'
import type { TutorialSlide, TutorialStep } from './ModuleTutorial'

export const NALS_SLIDES: TutorialSlide[] = [
  {
    title: 'Bienvenido a NALS Monitor',
    description: 'Este es tu monitor de reanimación neonatal. Cronómetro automático, metrónomo 3:1, cálculo de dosis y epicrisis profesional — todo offline.',
    icon: <Heart className="w-7 h-7 text-white" />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Paso 1: Datos del Paciente',
    description: 'Al iniciar, ingresá peso (kg) y edad gestacional (semanas). El sistema calculará todas las dosis automáticamente.',
    icon: <Baby className="w-7 h-7 text-white" />,
    color: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Paso 2: Evaluar y Reanimar',
    description: 'Seleccioná el ritmo cardíaco, evaluá la tríada neonatal, e iniciá la RCP. El metrónomo 3:1 te guiará con audio.',
    icon: <Activity className="w-7 h-7 text-white" />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Paso 3: Evolución Médica',
    description: 'Al finalizar, el sistema genera la evolución narrativa automática lista para copiar a la historia clínica. ¡Ese es el plus!',
    icon: <FileText className="w-7 h-7 text-white" />,
    color: 'from-amber-500 to-orange-500',
  },
]

export const NALS_STEPS: TutorialStep[] = [
  // === DATOS INICIALES ===
  {
    target: 'nals-weight',
    title: 'Peso del Neonato',
    description: 'Ingresá el peso en kg. Las dosis de adrenalina (0.01-0.03 mg/kg) y volúmenes de líquidos se calculan automáticamente según este valor.',
  },
  {
    target: 'nals-eg',
    title: 'Edad Gestacional',
    description: 'Ingresá las semanas de gestación. Esto determina si es prematuro o a término, y los rangos de SpO2 esperados por minuto.',
  },
  // === EVALUACIÓN ===
  {
    target: 'nals-ritmo',
    title: 'Selección de Ritmo',
    description: 'Seleccioná el ritmo cardíaco del neonato: BRAD (bradicardia), ASIS (asistolia), AESP o NOR (normal). Esto se registra en la bitácora.',
  },
  {
    target: 'nals-triada',
    title: 'Tríada de Evaluación',
    description: 'Evaluá 4 parámetros tocando cada uno: Término/Pretérmino, patrón respiratorio, tono muscular y simetría torácica. Se resaltan en rojo los hallazgos patológicos.',
  },
  // === INICIO RCP ===
  {
    target: 'nals-start',
    title: 'Iniciar Reanimación',
    description: 'Tocá para iniciar el cronómetro y el metrónomo 3:1 a 100-120/min. A partir de aquí se habilitan las drogas y se registra todo en la bitácora.',
  },
  // === ESCALAS (abre modal) ===
  {
    target: 'nals-escalas',
    title: 'Abrir: Escalas Neonatales',
    description: 'Aquí encontrás el APGAR y la clasificación Sarnat. Tocá para abrir el panel de escalas.',
    closeModal: false,
  },
  {
    target: 'nals-apgar-calc',
    title: 'Calculadora APGAR',
    description: 'Cada categoría (Apariencia, Pulso, Gesticulación, Actividad, Respiración) tiene 3 opciones. Seleccioná el valor para cada una y el puntaje se calcula solo. Registrá al minuto 1, 5 y 10.',
    closeModal: false,
  },
  {
    target: 'nals-apgar-save',
    title: 'Guardar APGAR',
    description: 'Tocá "Guardar" para registrar el puntaje con el minuto actual. Podés registrar varios APGAR durante la reanimación.',
    closeModal: false,
  },
  {
    target: 'nals-sarnat',
    title: 'Clasificación Sarnat',
    description: 'Si sospechás encefalopatía hipóxico-isquémica, clasificá según Sarnat: Leve (I), Moderada (II) o Severa (III). Queda registrado en la epicrisis.',
  },
  // === GASES (abre modal) ===
  {
    target: 'nals-gases',
    title: 'Abrir: Gasimetría Arterial',
    description: 'Ingresá valores de gases arteriales para documentar el estado ácido-base. Tocá para abrir.',
    closeModal: true,
  },
  // === DROGAS (abre modal) ===
  {
    target: 'nals-drogas',
    title: 'Abrir: Farmacología',
    description: 'Aquí administrás adrenalina, registrás glicemia y líquidos. Las dosis están pre-calculadas por peso. Tocá para abrir.',
    closeModal: true,
  },
  {
    target: 'nals-glicemia',
    title: 'Control de Glicemia',
    description: 'Ingresá el valor de glucemia en mg/dL. Se documenta en la bitácora y en la evolución médica final.',
    closeModal: false,
  },
  {
    target: 'nals-epi',
    title: 'Adrenalina 1:10,000',
    description: 'Tres vías disponibles: IV/CVU (preferida), Intraósea o Endotraqueal. La dosis se muestra en rango (0.01-0.03 mg/kg). Hay bloqueo de seguridad de 2 minutos entre dosis.',
    closeModal: false,
  },
  {
    target: 'nals-liquidos',
    title: 'Líquidos y Hemoderivados',
    description: 'Bolo salino (10 ml/kg) o Sangre O negativo. Cada administración queda registrada con hora y volumen.',
  },
  // === CAUSAS (abre modal) ===
  {
    target: 'nals-causas',
    title: 'Abrir: MR. SOPA + Causas',
    description: 'Correctivos ventilatorios (M-R-S-O-P-A), causas reversibles y accesos vasculares. Tocá para abrir.',
    closeModal: true,
  },
  {
    target: 'nals-sopa',
    title: 'Correctivos MR. SOPA',
    description: 'M (Máscara), R (Reposicionar), S (Succionar), O (Open boca), P (Presión), A (vía Aérea). Tocá cada paso aplicado — quedan documentados en la evolución.',
    closeModal: false,
  },
]
