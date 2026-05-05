import type { Module } from '@/types'

export const MODULES: Module[] = [
  {
    id: 'nals-monitor',
    name: 'NALS Monitor Pro',
    tagline: 'Reanimación Neonatal en Tiempo Real',
    description: 'Monitor completo de reanimación neonatal con cronómetro automático, metrónomo 3:1, registro de drogas, escalas APGAR/Sarnat, gasimetría y epicrisis profesional.',
    category: 'Neonatología',
    color: '#3b82f6', // blue-500
    icon: '🫀',
    version: '19.5',
    status: 'active',
    features: [
      'Cronómetro y metrónomo 3:1 automático',
      'Registro de adrenalina con bloqueo de seguridad',
      'Escalas APGAR y Sarnat integradas',
      'Gasimetría arterial con historial',
      'Algoritmo NRP interactivo',
      'Epicrisis profesional exportable',
      'Guía vocal en español',
      'MR. SOPA y causas reversibles',
    ],
  },
  {
    id: 'pals-monitor',
    name: 'PALS Monitor',
    tagline: 'Soporte Vital Avanzado Pediátrico',
    description: 'Monitor de reanimación pediátrica con protocolos PALS actualizados, cálculo de dosis por peso y desfibrilación guiada.',
    category: 'Pediatría',
    color: '#8b5cf6', // violet-500
    icon: '🩺',
    version: '2.0',
    status: 'active',
    features: [
      'Protocolos PALS 2025', 
      'Calculadora de dosis pediátricas', 
      'Guía de desfibrilación', 
      'Timer de ciclos', 
      'Registro farmacológico', 
      'Informe post-evento'
    ],
  },
  {
    id: 'acls-monitor',
    name: 'ACLS Monitor',
    tagline: 'Soporte Vital Cardiovascular Avanzado',
    description: 'Monitor de reanimación cardiovascular avanzada con protocolos ACLS actualizados, ritmos desfibrilables y no desfibrilables, y registro completo de eventos.',
    category: 'Cardiología',
    color: '#ef4444', // red-500
    icon: '🫀',
    version: '1.0',
    status: 'active',
    features: [
      'Protocolos ACLS 2025', 
      'Ritmos desfibrilables/no desfibrilables', 
      'Cálculo de dosis adulto', 
      'Timer de ciclos 2 min', 
      'Registro de descargas', 
      'Epicrisis exportable'
    ],
  },
  {
    id: 'codigo-rojo',
    name: 'Código Rojo',
    tagline: 'Manejo de Hemorragia Posparto (HPP)',
    description: 'Monitor de asistencia obstétrica crítica con control avanzado de hemoderivados, índice de choque, protocolos de preeclampsia y bitácora narrativa de eventos.',
    category: 'Obstetricia',
    color: '#e11d48', // rose-600
    icon: '🩸',
    version: '2.0',
    status: 'active',
    features: [
      'Protocolos HPP escalonados', 
      'Gestión de hemoderivados y líquidos', 
      'Calculadora de Índice de Choque', 
      'Código Azul Obstétrico (RCP)', 
      'Protocolo Labetalol', 
      'Evolución médica narrativa automatizada'
    ],
  },
  {
    id: 'proximamente-1',
    name: 'Próximamente',
    tagline: 'Módulo en Desarrollo',
    description: 'Estamos trabajando en nuevas herramientas especializadas para expandir el ecosistema.',
    category: 'En Desarrollo',
    color: '#475569', // slate-600
    icon: '⏳',
    version: '--',
    status: 'coming_soon',
    features: [],
  },
  {
    id: 'proximamente-2',
    name: 'En Construcción',
    tagline: 'Nuevas funciones pronto',
    description: 'Pronto añadiremos más módulos para facilitar la asistencia clínica en tiempo real.',
    category: 'En Desarrollo',
    color: '#475569', // slate-600
    icon: '🚧',
    version: '--',
    status: 'coming_soon',
    features: [],
  },
]

export function getModule(id: string): Module | undefined {
  return MODULES.find(m => m.id === id)
}