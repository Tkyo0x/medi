import { Heart, Baby, Syringe, Activity, FileText, ShieldAlert, Stethoscope, Zap } from 'lucide-react'
import type { TutorialSlide, TutorialStep } from './ModuleTutorial'

export const PALS_SLIDES: TutorialSlide[] = [
  {
    title: 'Bienvenido a PALS Monitor',
    description: 'Monitor de soporte vital avanzado pediátrico. Compresiones 30:2, desfibrilación guiada, dosis por peso y evolución médica automática.',
    icon: <Stethoscope className="w-7 h-7 text-white" />,
    color: 'from-violet-500 to-purple-500',
  },
  {
    title: 'Configurar Paciente',
    description: 'Ingresá edad (años o meses) y peso. El sistema calcula dosis de adrenalina, energía de desfibrilación y tamaño de tubo endotraqueal.',
    icon: <Baby className="w-7 h-7 text-white" />,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Reanimación Guiada',
    description: 'Elegí modo 30:2 o compresiones continuas post-intubación. Metrónomo, drogas, accesos vasculares y causas reversibles todo integrado.',
    icon: <Activity className="w-7 h-7 text-white" />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Evolución Médica',
    description: 'Al finalizar se genera la nota médica narrativa automática con nombre, ID, todos los eventos y desenlace. Lista para la historia clínica.',
    icon: <FileText className="w-7 h-7 text-white" />,
    color: 'from-amber-500 to-orange-500',
  },
]

export const PALS_STEPS: TutorialStep[] = [
  // ═══ DATOS ═══
  {
    target: 'pals-weight',
    title: '1. Peso del paciente',
    description: 'Ajustá el peso en kg. Las dosis de adrenalina, energía de desfibrilación y bolo de cristaloides se calculan automáticamente.',
    waitForInput: true,
  },
  {
    target: 'pals-edad',
    title: '2. Edad del paciente',
    description: 'Tocá para ajustar la edad en años o meses. Determina la técnica de compresión y tamaño de tubo.',
  },
  // ═══ RITMO ═══
  {
    target: 'pals-ritmo',
    title: '3. Ritmo Cardíaco',
    description: 'Seleccioná el ritmo: FV (fibrilación), TV (taquicardia), Asistolia, AESP, Bradicardia o Normal. Define si es desfibrilable o no.',
  },
  // ═══ INICIO ═══
  {
    target: 'pals-start',
    title: '4. Iniciar RCP',
    description: 'Elegí el modo: 30:2 (compresiones:ventilaciones) o 100-120/min continuas (post-intubación). Arranca el cronómetro y metrónomo.',
  },
  // ═══ DOSIS ═══
  {
    target: 'pals-farmacos',
    title: '5. Abrir Dosis',
    description: 'Administrá adrenalina, desfibrilación, bolo de cristaloides y controlá glicemia. Tocá para abrir.',
    closeModal: false,
  },
  {
    target: 'pals-epi-btn',
    title: '6. Adrenalina',
    description: 'Tocá para administrar adrenalina. La dosis está pre-calculada por peso. Se registra con hora en la bitácora.',
    closeModal: false,
  },
  {
    target: 'pals-shock-btn',
    title: '7. Desfibrilación',
    description: 'Tocá para registrar una descarga eléctrica. La energía se calcula a 2 J/kg. Solo habilitado en ritmos desfibrilables.',
    closeModal: false,
  },
  // ═══ VÍA AÉREA ═══
  {
    target: 'pals-via-aerea',
    title: '8. Vía Aérea (TOT)',
    description: 'Seleccioná el tamaño de tubo endotraqueal. Al intubar, las compresiones cambian automáticamente a continuas 100-120/min.',
    closeModal: true,
  },
  // ═══ ACCESO VASCULAR ═══
  {
    target: 'pals-acceso-vasc',
    title: '9. Acceso Vascular',
    description: 'Registrá el tipo de acceso: periférico, central o intraóseo. Queda documentado en la evolución médica.',
    closeModal: true,
  },
  // ═══ CAUSAS ═══
  {
    target: 'pals-h5t',
    title: '10. Causas Reversibles (H\'s & T\'s)',
    description: 'Revisá y registrá las causas reversibles del paro: 5H y 5T. Tocá cada causa para ver los manejos disponibles.',
    closeModal: true,
  },
  // ═══ FINALIZAR ═══
  {
    target: 'pals-finish',
    title: '11. Finalizar',
    description: 'Cuando la reanimación termina, tocá el botón rojo de Power para seleccionar el desenlace.',
    closeModal: true,
  },
  {
    target: 'pals-rosc',
    title: '12. Desenlace',
    description: 'Seleccioná ROSC (retorno a circulación) si fue exitoso, o Finalizar si no. Se genera la epicrisis automáticamente.',
    closeModal: false,
  },
  // ═══ EVOLUCIÓN ═══
  {
    target: 'pals-nombre',
    title: '13. Nombre del Paciente',
    description: 'Escribí el nombre completo del paciente para la evolución médica.',
    closeModal: false,
    waitForInput: true,
  },
  {
    target: 'pals-id',
    title: '14. Identificación',
    description: 'Escribí la cédula, historia clínica o ID del paciente.',
    closeModal: false,
    waitForInput: true,
  },
  {
    target: 'pals-tab-evolucion',
    title: '15. Ver Evolución Médica',
    description: 'Tocá la pestaña "Evolución" para ver la nota médica narrativa generada automáticamente.',
    closeModal: false,
  },
  {
    target: 'pals-evolucion-content',
    title: '16. ¡Tu Evolución Médica!',
    description: 'Este texto se genera solo con todo lo registrado. Copialo directo a la historia clínica, envialo por WhatsApp o email.',
    closeModal: false,
  },
]
