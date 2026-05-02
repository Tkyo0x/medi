import { Heart, Baby, Syringe, Activity, FileText, Timer, Scale, FlaskConical, ShieldAlert, Power } from 'lucide-react'
import type { TutorialSlide, TutorialStep } from './ModuleTutorial'

export const NALS_SLIDES: TutorialSlide[] = [
  {
    title: 'Bienvenido a NALS Monitor',
    description: 'Este es tu monitor de reanimación neonatal. Cronómetro automático, metrónomo 3:1, cálculo de dosis y epicrisis profesional — todo offline.',
    icon: <Heart className="w-7 h-7 text-white" />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Datos del Paciente',
    description: 'Ingresá peso y edad gestacional. El sistema calcula automáticamente todas las dosis de adrenalina, volúmenes y parámetros.',
    icon: <Baby className="w-7 h-7 text-white" />,
    color: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Evaluar y Reanimar',
    description: 'Seleccioná ritmo, evaluá la tríada neonatal e iniciá RCP. El metrónomo 3:1 te guía con audio. Todo queda registrado.',
    icon: <Activity className="w-7 h-7 text-white" />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Evolución Médica Automática',
    description: 'Al finalizar, se genera una evolución médica narrativa lista para copiar a la historia clínica. Ese es el plus que ahorra tiempo.',
    icon: <FileText className="w-7 h-7 text-white" />,
    color: 'from-amber-500 to-orange-500',
  },
]

export const NALS_STEPS: TutorialStep[] = [
  // ═══ 1. DATOS INICIALES ═══
  {
    target: 'nals-weight',
    title: '1. Ingresá el peso',
    description: 'Escribí el peso en kg del neonato. Ejemplo: 3.2 — todas las dosis se recalculan automáticamente.',
  },
  {
    target: 'nals-eg',
    title: '2. Edad Gestacional',
    description: 'Escribí las semanas de gestación. Ejemplo: 38. Determina si es prematuro y los rangos de SpO2 esperados.',
  },

  // ═══ 2. EVALUACIÓN ═══
  {
    target: 'nals-ritmo',
    title: '3. Ritmo Cardíaco',
    description: 'Tocá el ritmo actual: BRAD (bradicardia <100), ASIS (asistolia), AESP (sin pulso) o NOR (normal). Queda en la bitácora.',
  },
  {
    target: 'nals-triada',
    title: '4. Tríada Neonatal',
    description: 'Tocá cada parámetro para evaluarlo: Término/Pretérmino, respiración (Gasping/Apnea), tono (Flácido) y simetría. Los patológicos se marcan en rojo.',
  },

  // ═══ 3. INICIO RCP ═══
  {
    target: 'nals-start',
    title: '5. ¡Iniciar RCP!',
    description: 'Tocá para arrancar el cronómetro y el metrónomo 3:1 a 100-120/min. Se habilitan drogas y se registra todo automáticamente.',
  },

  // ═══ 4. ESCALAS ═══
  {
    target: 'nals-escalas',
    title: '6. Abrir Escalas',
    description: 'Acá están APGAR y Sarnat. Tocá para abrir.',
    closeModal: false,
  },
  {
    target: 'nals-apgar-calc',
    title: '7. Calculadora APGAR',
    description: 'Seleccioná un valor para CADA categoría: Apariencia, Pulso, Gesticulación, Actividad y Respiración. El puntaje se suma automáticamente abajo.',
    closeModal: false,
  },
  {
    target: 'nals-apgar-save',
    title: '8. Guardar APGAR',
    description: 'Tocá Guardar para registrar este APGAR con el minuto actual. Hacelo al minuto 1, 5 y 10 de vida.',
    closeModal: false,
  },
  {
    target: 'nals-sarnat',
    title: '9. Sarnat (si aplica)',
    description: 'Si sospechás encefalopatía, tocá el grado correspondiente: I (leve), II (moderada) o III (severa). Si no aplica, saltá este paso.',
    closeModal: false,
  },

  // ═══ 5. GASIMETRÍA ═══
  {
    target: 'nals-gases',
    title: '10. Abrir Gasimetría',
    description: 'Documentá el estado ácido-base. Tocá para abrir el panel de gases arteriales.',
    closeModal: true,
  },
  {
    target: 'nals-gases-inputs',
    title: '11. Completá los 6 valores',
    description: 'Ingresá cada uno: pH, pCO2, pO2, HCO3, Exceso de Base (EB) y Lactato. Escribí el número en cada casilla.',
    closeModal: false,
  },
  {
    target: 'nals-gases-save',
    title: '12. Registrar Analítica',
    description: 'Cuando hayas completado los valores, tocá para guardar. Podés registrar varias muestras — cada una queda con su hora.',
    closeModal: false,
  },

  // ═══ 6. FARMACOLOGÍA ═══
  {
    target: 'nals-drogas',
    title: '13. Abrir Farmacología',
    description: 'Acá administrás adrenalina, controlás glicemia y dás líquidos. Tocá para abrir.',
    closeModal: true,
  },
  {
    target: 'nals-glicemia',
    title: '14. Control de Glicemia',
    description: 'Escribí el valor de glucemia en mg/dL y tocá ✓ para registrar. Se documenta en la evolución médica.',
    closeModal: false,
  },
  {
    target: 'nals-epi',
    title: '15. Adrenalina 1:10,000',
    description: 'Tocá la vía de administración: IV/CVU (preferida), Intraósea o ET. La dosis ya está calculada (0.01-0.03 mg/kg). Hay bloqueo de 2 min entre dosis.',
    closeModal: false,
  },
  {
    target: 'nals-liquidos',
    title: '16. Líquidos',
    description: 'Bolo Salino (10 ml/kg) o Sangre O negativo. Tocá para administrar. Queda registrado con hora y volumen.',
    closeModal: false,
  },

  // ═══ 7. CAUSAS ═══
  {
    target: 'nals-causas',
    title: '17. Abrir MR. SOPA + Causas',
    description: 'Correctivos ventilatorios y causas reversibles. Tocá para abrir.',
    closeModal: true,
  },
  {
    target: 'nals-sopa',
    title: '18. Correctivos MR. SOPA',
    description: 'Tocá cada paso aplicado: M (Máscara), R (Reposicionar), S (Succionar), O (Open), P (Presión), A (vía Aérea). Quedan documentados.',
    closeModal: false,
  },

  // ═══ 8. FINALIZAR ═══
  {
    target: 'nals-finish',
    title: '19. Finalizar Reanimación',
    description: 'Cuando la reanimación termina, tocá el botón rojo de apagado para seleccionar el desenlace.',
    closeModal: true,
  },
  {
    target: 'nals-rce',
    title: '20. Seleccionar Desenlace',
    description: 'Tocá "RCE Logrado" si hubo retorno a circulación. También podés elegir "No Retorno" o "Cese de RCP". Se genera la epicrisis automáticamente.',
    closeModal: false,
  },

  // ═══ 9. EVOLUCIÓN MÉDICA ═══
  {
    target: 'nals-nombre',
    title: '21. Nombre del Paciente',
    description: 'Escribí el nombre o identificación del recién nacido. Aparecerá en la evolución médica y epicrisis.',
    closeModal: false,
  },
  {
    target: 'nals-tab-evolucion',
    title: '22. Ver Evolución Médica',
    description: 'Tocá la pestaña "Evolución" para ver la nota médica narrativa generada automáticamente con todo lo registrado.',
    closeModal: false,
  },
  {
    target: 'nals-evolucion-content',
    title: '23. ¡Tu Evolución Médica!',
    description: 'Este texto se genera automáticamente. Podés copiarlo directo a la historia clínica, enviarlo por WhatsApp o email. ¡Este es el plus que ahorra tiempo!',
    closeModal: false,
  },
]
