import { Heart, Syringe, Activity, FileText, ShieldAlert, Zap, Droplets } from 'lucide-react'
import type { TutorialSlide, TutorialStep } from './ModuleTutorial'

export const ACLS_SLIDES: TutorialSlide[] = [
  {
    title: 'Bienvenido a ACLS Monitor',
    description: 'Soporte Vital Cardiovascular Avanzado. Ritmos desfibrilables, compresiones 30:2, vasopresores, hemoderivados y evolución médica automática.',
    icon: <Heart className="w-7 h-7 text-white" />,
    color: 'from-red-500 to-rose-600',
  },
  {
    title: 'Código Azul',
    description: 'Se activa ante un paro cardíaco. Seleccioná el ritmo, iniciá compresiones y seguí el algoritmo ACLS con metrónomo guiado.',
    icon: <Zap className="w-7 h-7 text-white" />,
    color: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Farmacología Completa',
    description: 'Adrenalina, vasopresores, sedoanalgesia, hemoderivados en unidades, líquidos y causas reversibles con tratamientos específicos.',
    icon: <Syringe className="w-7 h-7 text-white" />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Evolución Médica',
    description: 'Al finalizar se genera una nota médica narrativa con nombre, identificación, todos los eventos y desenlace. Lista para la historia clínica.',
    icon: <FileText className="w-7 h-7 text-white" />,
    color: 'from-indigo-500 to-violet-500',
  },
]

export const ACLS_STEPS: TutorialStep[] = [
  // ═══ RITMO ═══
  {
    target: 'acls-ritmo',
    title: '1. Ritmo Cardíaco',
    description: 'Seleccioná el ritmo del paciente: FV, TV sin pulso, Asistolia, AESP, Bradicardia o Taquicardia. Define si es desfibrilable.',
  },
  // ═══ INICIO ═══
  {
    target: 'acls-start',
    title: '2. Iniciar RCP',
    description: 'Elegí modo: 30:2 (sin intubación) o Continua (100-120/min). Arranca cronómetro, metrónomo y ciclos de 2 minutos.',
  },
  // ═══ ADRENALINA ═══
  {
    target: 'acls-adrenalina',
    title: '3. Adrenalina',
    description: 'Tocá para administrar 1mg de adrenalina IV/IO. Tiene doble confirmación de seguridad. Se registra con hora exacta.',
  },
  // ═══ DESFIBRILACIÓN ═══
  {
    target: 'acls-shock',
    title: '4. Desfibrilación',
    description: 'Registrá cada descarga eléctrica. Solo habilitado en ritmos desfibrilables (FV/TV). Queda documentado en la evolución.',
  },
  // ═══ VÍA AÉREA ═══
  {
    target: 'acls-via-aerea',
    title: '5. Vía Aérea (TOT)',
    description: 'Seleccioná el tamaño de tubo. Al intubar, las compresiones cambian automáticamente a continuas 100-120/min.',
  },
  // ═══ SOPORTE ═══
  {
    target: 'acls-soporte',
    title: '6. Abrir Soporte Farmacológico',
    description: 'Vasopresores (Norepinefrina, Dopamina), Sedoanalgesia (Fentanilo, Midazolam) y Medicamentos RCP (Amiodarona, Lidocaína). Tocá para abrir.',
  },
  // ═══ FLUIDOS ═══
  {
    target: 'acls-fluidos',
    title: '7. Líquidos y Cristaloides',
    description: 'Administrá solución salina, Hartmann o coloides. Se registra el volumen total en la bitácora.',
    closeModal: true,
  },
  // ═══ HEMODERIVADOS ═══
  {
    target: 'acls-hemoderivados',
    title: '8. Hemoderivados',
    description: 'GRE, Plasma, Plaquetas y Crioprecipitados en UNIDADES. Un toque = 1 unidad. Se calcula el volumen automáticamente.',
    closeModal: true,
  },
  // ═══ ACCESO VENOSO ═══
  {
    target: 'acls-acceso',
    title: '9. Acceso Venoso',
    description: 'Registrá el acceso: periférico, central (yugular/subclavio/femoral) o intraóseo. Queda documentado en la evolución.',
    closeModal: true,
  },
  // ═══ CAUSAS ═══
  {
    target: 'acls-h5t',
    title: '10. Causas Reversibles (H\'s & T\'s)',
    description: 'Hipovolemia, Hipoxia, Acidosis, K+, Toxinas, Trombosis, Neumotórax, Taponamiento. Cada una tiene tratamientos específicos.',
    closeModal: true,
  },
  // ═══ GLUCEMIA ═══
  {
    target: 'acls-glucemia',
    title: '11. Glucemia',
    description: 'Registrá el valor de glucemia en mg/dL. Se documenta en la bitácora y evolución médica.',
    closeModal: true,
  },
  // ═══ FINALIZAR ═══
  {
    target: 'acls-finish',
    title: '12. Finalizar Reanimación',
    description: 'Tocá el botón rojo para abrir el panel de desenlace. Seleccioná RCE, No Retorno o Cese de maniobras.',
  },
  // ═══ EVOLUCIÓN ═══
  {
    target: 'acls-export',
    title: '13. Abrir Evolución',
    description: 'Tocá para abrir la epicrisis y evolución médica del evento.',
    closeModal: true,
  },
  {
    target: 'acls-tab-evolucion',
    title: '14. Ver Evolución Médica',
    description: 'Tocá "Evolución" para ver la nota narrativa generada automáticamente con todo lo registrado.',
    closeModal: false,
  },
  {
    target: 'acls-evolucion-content',
    title: '15. ¡Tu Evolución Médica!',
    description: 'Texto listo para copiar a la historia clínica. Envialo por WhatsApp, email o copiá directo. ¡Ese es el plus que ahorra tiempo!',
    closeModal: false,
  },
]
