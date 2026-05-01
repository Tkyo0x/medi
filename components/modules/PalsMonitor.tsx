import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Zap, Syringe, Clock, Volume2, VolumeX, Heart,
  Pause, Play, XCircle, ShieldAlert,
  Power, Droplets, RefreshCcw, Activity,
  Check, Send, Share2, FileText, Copy,
  Stethoscope, Thermometer, Wind, FlaskConical,
  Mail, MessageCircle, UserCheck, Beaker, ChevronRight,
  TrendingUp, ClipboardList, LayoutList, Droplet,
  Biohazard, CircleDot, Baby, Scale, RotateCcw,
  CheckSquare, Square, Pill, AlertCircle, Trash2,
  ChevronUp, ChevronDown, Settings, Wrench, GlassWater,
  User as UserIcon, Layers, ChevronLeft, Scissors, AlertTriangle,
  LifeBuoy, Users, Search, ThermometerSnowflake, Skull, Waves, Eye, 
  Hand, Timer, Gauge, ListOrdered, Calendar, FileCheck, Ghost, Flame, Bell, Clipboard,
  FlaskConical as Flask, ZapOff, TrendingDown, Zap as Bolt,
  Anchor, Crosshair, Target, Triangle, MousePointer2, HandMetal, Sparkles,
  UserPlus, Calculator, UserCog
} from 'lucide-react';

/**
 * PALS MONITOR PRO - Soporte Vital Avanzado Pediátrico
 * Versión v23.12 Platinum: Age in Months Support & Pediatrics Logic
 */

const CICLO_DURACION = 120; 

const RITMOS = {
  VF: { nombre: 'Fibrilación Ventricular', corto: 'FV', desfibrilable: true, color: 'text-red-500' },
  PVT: { nombre: 'Taquicardia Ventricular Sin Pulso', corto: 'TVSP', desfibrilable: true, color: 'text-orange-500' },
  ASYSTOLE: { nombre: 'Asistolia', corto: 'Asistolia', desfibrilable: false, color: 'text-slate-500' },
  PEA: { nombre: 'Actividad Eléctrica Sin Pulso', corto: 'AESP', desfibrilable: false, color: 'text-emerald-500' },
  BRADY: { nombre: 'Bradicardia Grave', corto: 'Bradicardia', desfibrilable: false, color: 'text-blue-500' }
};

const TECNICAS_RCP = [
  { id: 'lactante', nombre: 'Lactante', desc: '2 Pulgares', icon: <Users size={16}/> },
  { id: 'talon', nombre: 'Niño', desc: 'Talón / 1 Mano', icon: <Hand size={16}/> },
  { id: 'dos_manos', nombre: 'Adulto', desc: '2 Manos', icon: <HandMetal size={16}/> }
];

const INFUSIONES_DATA = [
  { id: 'adre_inf', nombre: 'Adrenalina', dosis: '0.1-1.0', unidad: 'µg/kg/min', factor: 0.6 },
  { id: 'noradre', nombre: 'Noradrenalina', dosis: '0.1-2.0', unidad: 'µg/kg/min', factor: 0.6 },
  { id: 'dopa', nombre: 'Dopamina', dosis: '5-20', unidad: 'µg/kg/min', factor: 6 },
  { id: 'dobuta', nombre: 'Dobutamina', dosis: '2-20', unidad: 'µg/kg/min', factor: 6 },
  { id: 'milri', nombre: 'Milrinona', dosis: '0.25-0.75', unidad: 'µg/kg/min', factor: 0.6 }
];

const VASCULAR_DATA = [
  { id: 'perif', nombre: 'Vía Periférica', tipos: ['MSI', 'MSD', 'MII', 'MID'] },
  { id: 'io', nombre: 'Vía Intraósea', tipos: ['Pre-tibial I', 'Pre-tibial D', 'Humeral I', 'Humeral D'] },
  { id: 'cvc', nombre: 'Acceso Central', tipos: ['Yugular', 'Subclavia', 'Femoral'] }
];

const MANIOBRAS_MANUALES = [
  { id: 'm_asp', label: 'Aspiración', icon: <Waves size={14}/> },
  { id: 'm_cp', label: 'Chequeo de Pulso', icon: <Activity size={14}/> }
];

const CAUSAS_PALS_DATA = [
  { id: 'hypoxia', tipo: 'H', nombre: 'Hipoxia', icon: <Wind size={14}/>, manejos: [{ id: 'h_o2', label: 'O2 al 100%' }, { id: 'h_bvm', label: 'Ventilación BVM' }, { id: 'h_tot', label: 'Vía Aérea Avanzada' }] },
  { id: 'hypovolemia', tipo: 'H', nombre: 'Hypovolemia', icon: <Droplets size={14}/>, manejos: [{ id: 'v_bolus', label: 'Bolo Cristaloides' }, { id: 'v_hem', label: 'Control Hemorragia' }, { id: 'v_sangre', label: 'Transfusión Sanguínea' }] },
  { id: 'hydrogen', tipo: 'H', nombre: 'Acidosis (H+)', icon: <FlaskConical size={14}/>, manejos: [{ id: 'a_vent', label: 'Ajustar Ventilación' }, { id: 'a_bicarb', label: 'Bicarbonato Sódico' }] },
  { id: 'potassium', tipo: 'H', nombre: 'Hipo/HiperK', icon: <Activity size={14}/>, manejos: [{ id: 'k_gluc', label: 'Gluconato Calcio' }, { id: 'k_ins', label: 'Insulina + Glucosa' }] },
  { id: 'hypoglycemia', tipo: 'H', nombre: 'Hipoglucemia', icon: <Droplet size={14}/>, manejos: [{ id: 'g_d10', label: 'Bolo Dextrosa 10%' }] },
  { id: 'hypothermia', tipo: 'H', nombre: 'Hipotermia', icon: <ThermometerSnowflake size={14}/>, manejos: [{ id: 't_recal', label: 'Recalentamiento Activo' }] },
  { id: 'tension', tipo: 'T', nombre: 'Neumotórax', icon: <Wind size={14}/>, manejos: [{ id: 'n_des', label: 'Descompresión Aguja' }, { id: 'n_tubo', label: 'Tubo de Tórax' }] },
  { id: 'tamponade', tipo: 'T', nombre: 'Taponamiento', icon: <Heart size={14}/>, manejos: [{ id: 'tp_pun', label: 'Pericardiocentesis' }] },
  { id: 'toxins', tipo: 'T', nombre: 'Toxinas', icon: <Skull size={14}/>, manejos: [{ id: 'tx_ant', label: 'Antídoto Específico' }] },
  { id: 'thrombosis_p', tipo: 'T', nombre: 'TEP', icon: <Waves size={14}/>, manejos: [{ id: 'p_fib', label: 'Fibrinolíticos' }] },
  { id: 'thrombosis_c', tipo: 'T', nombre: 'Trombosis Cor.', icon: <Bolt size={14}/>, manejos: [{ id: 'c_angio', label: 'Angioplastia' }] }
];

const EcgMonitor = ({ isActive, ritmo, isPaused, isFinished, isShockZone }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const xRef = useRef(0);
  const lastYRef = useRef(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    const resize = () => {
      if (canvas && canvas.parentElement) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.parentElement.clientWidth * dpr;
        canvas.height = canvas.parentElement.clientHeight * dpr;
        ctx.scale(dpr, dpr);
        lastYRef.current = (canvas.height / dpr) / 2;
        ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    window.addEventListener('resize', resize); 
    resize();

    const getEcgPoint = (p: number, type: string) => {
      const h = canvas.height / (window.devicePixelRatio || 1);
      const mid = h / 2;
      const s = h / 5; 
      const baselineNoise = (Math.sin(p * 0.5) * 1.5) + (Math.random() - 0.5) * 1.2;
      
      if (type === 'ASYSTOLE') return mid + baselineNoise;
      if (type === 'VF') {
        const chaos = Math.sin(p * 10) * 0.6 + Math.sin(p * 21) * 0.3 + Math.sin(p * 35) * 0.2;
        return mid + (chaos * s * 1.8) + baselineNoise;
      }
      if (type === 'PVT') return mid + (Math.sin(p * 3.5) + 0.3 * Math.sin(p * 7)) * s * 1.8;
      
      const cycleLength = (type === 'BRADY' ? 15 : 7);
      const beatPhase = p % cycleLength;
      let y = 0;
      if (beatPhase >= 0 && beatPhase < 0.8) y = Math.sin((beatPhase / 0.8) * Math.PI) * (-s * 0.25);
      else if (beatPhase >= 1.2 && beatPhase < 1.35) y = (s * 0.3) - ((beatPhase - 1.2) / 0.15) * (s * 3.2);
      else if (beatPhase >= 1.35 && beatPhase < 1.5) y = (-s * 2.9) + ((beatPhase - 1.35) / 0.15) * (s * 3.5);
      else if (beatPhase >= 2.5 && beatPhase < 3.8) y = Math.sin(((beatPhase - 2.5) / 1.3) * Math.PI) * (-s * 0.5);
      return mid + y + baselineNoise;
    };

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.fillStyle = '#020617'; ctx.globalAlpha = 0.18; ctx.fillRect(xRef.current, 0, 55, h); ctx.globalAlpha = 1.0;
      const color = isFinished ? '#475569' : isPaused ? '#334155' : '#22d3ee';
      ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      
      if (!isPaused && !isFinished) { 
        ctx.shadowBlur = 15; 
        ctx.shadowColor = color; 
      }
      
      ctx.beginPath(); 
      ctx.moveTo(xRef.current, lastYRef.current);
      let nextY = h / 2;
      
      if (isActive && !isFinished && !isPaused) { 
        phaseRef.current += 0.11; 
        nextY = getEcgPoint(phaseRef.current, ritmo); 
      }
      
      xRef.current += 4.5; 
      if (xRef.current >= w) { 
        xRef.current = 0; 
        ctx.fillStyle = '#020617'; 
        ctx.fillRect(0, 0, w, h); 
      }
      
      ctx.lineTo(xRef.current, nextY); 
      ctx.stroke(); 
      lastYRef.current = nextY;
      requestAnimationFrame(draw);
    };
    const animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isActive, ritmo, isPaused, isFinished]);

  return (
    <div className="w-full h-full bg-slate-950 overflow-hidden relative border-y border-cyan-500/20 shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {isShockZone && (
        <div className="absolute inset-0 bg-red-600/30 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-pulse text-center px-6">
           <Triangle size={64} className="text-red-500 mb-2 fill-red-500/20" />
           <span className="text-white font-black uppercase text-2xl tracking-[0.2em] shadow-xl">¡ FUERA TODOS !</span>
        </div>
      )}
    </div>
  );
};

export default function PalsMonitor() {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isVentilating, setIsVentilating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isShockZone, setIsShockZone] = useState(false);
  const [mode, setMode] = useState('15:2');
  const [weight, setWeight] = useState(10);
  const [pacienteNombre, setPacienteNombre] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [realTime, setRealTime] = useState(new Date());
  const [edad, setEdad] = useState('5');
  const [edadUnidad, setEdadUnidad] = useState('años');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cycleSeconds, setCycleSeconds] = useState(0);
  const [epiSeconds, setEpiSeconds] = useState(0); 
  const [adrenalinas, setAdrenalinas] = useState(0);
  const [desfibrilaciones, setDesfibrilaciones] = useState(0);
  const [ritmoActual, setRitmoActual] = useState('ASYSTOLE');
  const [logs, setLogs] = useState<any[]>([]);
  const [modal, setModal] = useState<string | null>(null); 
  const [reportTab, setReportTab] = useState('resumen');
  const [compresionCount, setCompresionCount] = useState(0);
  const [ventilacionCount, setVentilacionCount] = useState(0);
  const [bpmTarget, setBpmTarget] = useState(110);
  const [totInfo, setTotInfo] = useState({ size: null as any, depth: null as any });
  const [causasRealizadas, setCausasRealizadas] = useState<any[]>([]); 
  const [selectedCausaId, setSelectedCausaId] = useState<any>(null); 
  const [selectedVascularId, setSelectedVascularId] = useState<any>(null);
  const [accesosObtenidos, setAccesosObtenidos] = useState<any[]>([]);
  const [glucemia, setGlucemia] = useState<number | null>(null);
  const [tempGlucemia, setTempGlucemia] = useState('');
  const [tempEdad, setTempEdad] = useState('');
  const [tempUnidad, setTempUnidad] = useState('años');
  const [voiceOn, setVoiceOn] = useState(true);
  const [tecnicaRCP, setTecnicaRCP] = useState('talon');
  const [manualOverride, setManualOverride] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState('MANIOBRAS EN CURSO');
  const [hapticTick, setHapticTick] = useState(false); 

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const metronomeRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const doses = useMemo(() => {
    const w = parseFloat(weight.toString()) || 1;
    const mgVal = Math.min(w * 0.01, 1);
    const mlVal = mgVal * 10;
    return { 
      epi: mgVal.toFixed(3), 
      shock: Math.round(4 * w),
      epiVol: mlVal.toFixed(1),
      bolus: Math.round(w * 20),
      dx10: (w * 5).toFixed(1),
    };
  }, [weight]);

  const triggerHaptic = useCallback((pattern: number | number[] = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES'; u.rate = 1.2;
    window.speechSynthesis.speak(u);
  }, [voiceOn]);

  const playBeep = useCallback((freq = 1000, duration = 0.06, type: OscillatorType = 'sine') => {
    if (!voiceOn) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(type === 'sine' ? 0.15 : 0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + duration + 0.01);
      
      if (type === 'sine') {
        setHapticTick(true);
        triggerHaptic(40); 
        setTimeout(() => setHapticTick(false), 50);
      }
    } catch (e) {}
  }, [voiceOn, triggerHaptic]);

  const addLog = useCallback((msg: string, type = 'EVENT') => {
    const min = Math.floor(elapsedSeconds / 60);
    const sec = elapsedSeconds % 60;
    const elapsed = `${min}:${sec.toString().padStart(2, '0')}`;
    setLogs(prev => [{ id: Date.now() + Math.random(), time: new Date().toLocaleTimeString('es-ES', { hour12: false }), elapsed, msg, type }, ...prev]);
  }, [elapsedSeconds]);

  const calculateLogicalWeight = useCallback((ageString: string, unit: string) => {
    const age = parseInt(ageString);
    if (isNaN(age)) return weight;

    if (unit === 'meses') {
      return (age / 2) + 4;
    } else {
      if (age === 0) return 4;
      if (age <= 5) return (age * 2) + 8;
      if (age <= 12) return (age * 3) + 7;
      return 60;
    }
  }, [weight]);

  const updatePatientData = useCallback((newAge: string, unit: string) => {
    const newWeight = calculateLogicalWeight(newAge, unit);
    setEdad(newAge);
    setEdadUnidad(unit);
    setWeight(newWeight);
    setManualOverride(false);
    speak(`Peso ajustado a ${newWeight} kilos para un paciente de ${newAge} ${unit}.`);
    addLog(`DATO PACIENTE: ${newAge} ${unit.toUpperCase()} / ${newWeight}KG`, 'SYSTEM');
  }, [calculateLogicalWeight, speak, addLog]);

  const sugerenciaPALS = useMemo(() => {
    const ageVal = parseFloat(edad) || 0;
    const weightVal = parseFloat(weight.toString()) || 0;
    
    if (edadUnidad === 'meses' && ageVal < 12) return 'lactante';
    if (edadUnidad === 'años' && ageVal < 1) return 'lactante';
    
    if (ageVal > 8 || weightVal > 25) return 'dos_manos';
    return 'talon';
  }, [edad, edadUnidad, weight]);

  useEffect(() => {
    if (manualOverride) return;
    if (sugerenciaPALS !== tecnicaRCP) {
      setTecnicaRCP(sugerenciaPALS);
      const techObj = TECNICAS_RCP.find(t => t.id === sugerenciaPALS);
      if(isActive && techObj) {
        speak(`Ajuste PALS: Técnica para ${techObj.nombre}.`);
        addLog(`AUTO-AJUSTE: ${techObj.nombre}`, 'SYSTEM');
      }
    }
  }, [sugerenciaPALS, manualOverride, tecnicaRCP, isActive, addLog, speak]);

  useEffect(() => { const t = setInterval(() => setRealTime(new Date()), 1000); return () => clearInterval(t) }, [])

  const handleStartRCP = (m: string) => {
    setMode(m); 
    setIsActive(true); 
    setIsCompressing(true);
    triggerHaptic([200, 50, 200]); 
    addLog(`INICIO RCP (${m})`, 'SYSTEM'); 
    speak(`Iniciando soporte vital pediátrico.`);
    setModal(null);
  };

  const handleShock = () => {
    if(!isActive) return;
    setIsCompressing(false); 
    setIsShockZone(true);
    speak("Preparando descarga. ¡Fuera todos!");
    triggerHaptic([500, 100, 500]);
    setTimeout(() => { 
        setDesfibrilaciones(d => d + 1);
        addLog(`SHOCK #${desfibrilaciones + 1}: ${doses.shock}J`, "SHOCK"); 
        setIsChecking(true); 
        setIsShockZone(false);
    }, 2500);
  };

  const handleSetAcceso = (nombre: string, tipo: string) => {
    const nuevoAcceso = { nombre, tipo, time: new Date().toLocaleTimeString('es-ES', { hour12: false }) };
    setAccesosObtenidos(prev => [...prev, nuevoAcceso]);
    addLog(`ACCESO VASCULAR: ${nombre} (${tipo})`, 'TECH');
    speak(`${nombre} obtenida en ${tipo}.`);
    triggerHaptic(100);
    setModal(null);
  };

  const handleManejoCausaMultiple = (manejo: any) => {
    setCausasRealizadas(prev => {
        if (prev.includes(manejo.id)) {
            return prev.filter(id => id !== manejo.id);
        } else {
            addLog(`TRATAMIENTO: ${manejo.label}`, 'TECH');
            speak(`Realizando ${manejo.label}`);
            return [...prev, manejo.id];
        }
    });
  };

  const generateReportText = () => {
    const totalMin = Math.floor(elapsedSeconds / 60);
    const totalSec = elapsedSeconds % 60;
    let report = `EVOLUCIÓN MÉDICA PALS - SOPORTE VITAL PEDIÁTRICO (v23.12)\n`;
    report += `======================================================================\n`;
    report += `PACIENTE: ${pacienteNombre || 'S/D'} | ID: ${pacienteId || 'S/D'}\n`;
    report += `EDAD: ${edad} ${edadUnidad.toUpperCase()} | PESO: ${weight}KG\n`;
    report += `FECHA: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString('es-ES', { hour12: false })}\n`;
    report += `ZONA HORARIA: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n`;
    report += `----------------------------------------------------------------------\n\n`;
    
    report += `1. INTERVENCIONES Y TÉCNICA:\n`;
    report += `- Técnica RCP Utilizada: ${TECNICAS_RCP.find(t => t.id === tecnicaRCP)?.nombre}\n`;
    report += `- Tiempo Total: ${totalMin} min ${totalSec} seg\n`;
    report += `- Shocks: ${desfibrilaciones} | Adrenalinas: ${adrenalinas}\n`;
    report += `- Glicemia Registrada: ${glucemia !== null ? `${glucemia} mg/dL` : 'No evaluada'}\n`;
    report += `- Vía Aérea: ${totInfo.size ? `TET #${totInfo.size}` : 'BVM'}\n`;
    if (accesosObtenidos.length > 0) report += `- Accesos Vasculares: ${accesosObtenidos.map(a => `${a.nombre} (${a.tipo})`).join(', ')}\n`;
    
    report += `\n2. CAUSAS REVERSIBLES TRATADAS (6H/5T):\n`;
    const tratadas = CAUSAS_PALS_DATA.flatMap(c => c.manejos).filter(m => causasRealizadas.includes(m.id));
    if (tratadas.length > 0) {
      tratadas.forEach(m => report += `  * ${m.label}\n`);
    } else {
      report += `  * Ninguna registrada.\n`;
    }
    
    report += `\n3. BITÁCORA CRONOLÓGICA:\n`;
    logs.slice().reverse().forEach(l => { report += `[${l.time}] (+${l.elapsed}) ${l.msg}\n`; });
    report += `\nRESULTADO FINAL: ${resultadoFinal}\n`;
    return report;
  };

  const evolucionPals = () => {
    const totalMin = Math.floor(elapsedSeconds / 60), totalSec = elapsedSeconds % 60
    const techObj = TECNICAS_RCP.find(t => t.id === tecnicaRCP)
    let e = `Se atiende código azul pediátrico. Paciente de ${edad} ${edadUnidad}, peso ${weight} kg.`
    e += ` Ritmo cardíaco inicial identificado: ${(RITMOS as any)[ritmoActual]?.nombre || ritmoActual}.`
    e += ` Se inician maniobras de reanimación cardiopulmonar avanzada con técnica ${techObj?.nombre || mode}`
    e += mode === 'CONTINUA' ? `, compresiones continuas a 100-120/minuto (vía aérea avanzada asegurada).` : ` en modalidad ${mode} (compresiones:ventilaciones).`
    if (desfibrilaciones > 0) e += ` Se realizan ${desfibrilaciones} descarga${desfibrilaciones > 1 ? 's' : ''} eléctrica${desfibrilaciones > 1 ? 's' : ''} a ${doses.shock}J (${doses.jkg} J/kg).`
    if (adrenalinas > 0) e += ` Se administra${adrenalinas > 1 ? 'n' : ''} ${adrenalinas} dosis de adrenalina (${doses.epiIV} mg IV).`
    if (totInfo.size) e += ` Se asegura vía aérea avanzada con tubo endotraqueal #${totInfo.size} ${totInfo.tipo === 'CUFFED' ? 'con balón' : 'sin balón'}.`
    if (accesosObtenidos.length > 0) e += ` Accesos vasculares obtenidos: ${accesosObtenidos.map(a => `${a.nombre} (${a.tipo})`).join(', ')}.`
    if (glucemia !== null) e += ` Control de glicemia: ${glucemia} mg/dL${glucemia < 60 ? ' (hipoglicemia — se indica corrección)' : ''}.`
    const tratadas = CAUSAS_PALS_DATA.flatMap(c => c.manejos).filter(m => causasRealizadas.includes(m.id))
    if (tratadas.length > 0) e += ` Causas reversibles identificadas y tratadas: ${tratadas.map(m => m.label).join(', ')}.`
    const drogasAdmin = logs.filter(l => l.type === 'DRUG' || l.type === 'DOSIS').map(l => l.msg)
    if (drogasAdmin.length > 0) e += ` Registro farmacológico: ${drogasAdmin.join('; ')}.`
    e += `\n\nTiempo total de intervención: ${totalMin} minutos con ${totalSec} segundos.`
    e += ` Desenlace: ${resultadoFinal || 'en curso'}.`
    if (resultadoFinal.includes('ROSC') || resultadoFinal.includes('RCE')) e += ` Se logra retorno a circulación espontánea (ROSC). Se indica monitoreo hemodinámico continuo, vigilancia neurológica y cuidados post-paro según protocolo institucional.`
    else if (resultadoFinal.includes('CESE') || resultadoFinal.includes('FALLECIMIENTO')) e += ` A pesar de maniobras de reanimación avanzada sostenidas, no se logra retorno a circulación espontánea. Se comunica desenlace a familia y se procede según protocolo institucional.`
    return e
  }

  const fullReportPals = () => generateReportText() + `\n======================================================================\nEVOLUCIÓN MÉDICA NARRATIVA:\n----------------------------------------------------------------------\n${evolucionPals()}\n`

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1); 
        setEpiSeconds(s => s + 1); 
        if (!isChecking) {
          setCycleSeconds(prev => {
            if (prev === 110) { speak("Diez segundos para chequeo de ritmo."); triggerHaptic([50, 50, 50, 50]); }
            if (prev >= CICLO_DURACION) { setIsChecking(true); setIsCompressing(false); speak("Chequeo de ritmo. Evalúe pulso."); return 0; }
            return prev + 1;
          });
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, isPaused, isChecking, speak, triggerHaptic]);

  useEffect(() => {
    if (isActive && isCompressing && !isPaused && !isChecking) {
      const interval = (60 / bpmTarget) * 1000;
      metronomeRef.current = setInterval(() => {
        const limit = mode === '30:2' ? 30 : 30; // 30:2 ratio or continuous
        if (mode === 'CONTINUA') {
          setCompresionCount(c => c + 1); 
          playBeep(1000, 0.06, 'sine'); 
        } else {
          setCompresionCount(c => {
            const next = (c % limit) + 1; 
            playBeep(next === limit ? 1400 : 1000, 0.08, 'sine'); 
            if (next === limit) {
              setIsVentilating(true); 
              setIsCompressing(false);
              setVentilacionCount(v => v + 2); 
              setTimeout(() => { 
                setIsVentilating(false); 
                setIsCompressing(true); 
              }, 3800);
              return 0;
            }
            return next;
          });
        }
      }, interval);
      return () => { if (metronomeRef.current) clearInterval(metronomeRef.current); };
    }
  }, [isActive, isCompressing, isPaused, isChecking, mode, bpmTarget, playBeep]);

  return (
    <div className="fixed inset-0 bg-slate-950 text-cyan-50 flex flex-col items-center p-2 font-sans overflow-hidden select-none">
      
      {/* HEADER */}
      <div className="w-full max-w-2xl bg-slate-900/60 p-3 rounded-[28px] border border-cyan-500/10 flex justify-between items-center mb-2 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2 rounded-2xl border border-cyan-500/20"><Baby className="text-cyan-400" size={20}/></div>
          <div className="flex flex-col text-left">
            <h1 className="text-[10px] font-black uppercase text-cyan-500 leading-none tracking-widest">PALS MONITOR PRO</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-bold text-slate-400 tabular-nums">{realTime.toLocaleTimeString('es-ES', { hour12: false })}</span>
              <span className="text-[7px] font-bold text-slate-600">({Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()})</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setTempEdad(edad); setTempUnidad(edadUnidad); setModal('edad_panel'); speak("Ajustar edad."); }} 
                  className={`px-3 py-1.5 rounded-2xl border flex items-center gap-2 shadow-inner transition-all active:scale-95 bg-slate-800/80 border-slate-700`}>
            <span className="text-sm font-black text-white">{edad}</span>
            <span className="text-[8px] text-slate-500 font-black uppercase">{edadUnidad}</span>
          </button>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-700 flex items-center gap-2 shadow-inner">
            <input type="number" value={weight || ''} onChange={(e) => { setWeight(parseInt(e.target.value) || 0); setManualOverride(true); }} className="bg-transparent border-none w-7 text-[12px] font-black text-white focus:outline-none text-center" />
            <span className="text-[8px] text-slate-500 font-black uppercase">KG</span>
          </div>
          <button onClick={() => setModal('finish')} className="p-2 bg-red-600 rounded-2xl active:scale-90 shadow-lg text-white ml-2 transition-transform"><Power size={18} /></button>
        </div>
      </div>

      {/* MONITOR ECG */}
      <div className="w-full max-w-2xl h-44 relative bg-slate-950 rounded-[32px] border border-slate-800/50 overflow-hidden mb-2 shadow-2xl">
        <EcgMonitor isActive={isActive} ritmo={ritmoActual} isPaused={isPaused} isFinished={modal === 'export'} isShockZone={isShockZone} />
        <div className="absolute top-4 left-4 grid gap-2 text-left">
          <div className={`bg-slate-900/80 backdrop-blur-md border px-3 py-2 rounded-2xl min-w-[100px] transition-all ${epiSeconds >= 180 ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/5'}`}>
            <span className="text-[8px] font-black uppercase text-slate-500 block mb-1 leading-none text-left">Adrenalina</span>
            <span className={`text-xl font-black tabular-nums leading-none text-left ${epiSeconds >= 180 ? 'text-amber-400' : 'text-white'}`}>{Math.floor(epiSeconds / 60)}:{(epiSeconds % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md border border-white/5 px-3 py-2 rounded-2xl flex items-center gap-2 text-left">
            <span className="text-[9px] font-black uppercase block leading-none text-cyan-400">TÉCNICA:</span>
            <span className="text-[10px] font-black uppercase text-white">{TECNICAS_RCP.find(t=>t.id===tecnicaRCP)?.nombre}</span>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 text-right">
          <div className={`bg-slate-900/80 backdrop-blur-md border p-3 rounded-2xl min-w-[100px] transition-all ${cycleSeconds > 105 || isChecking ? 'border-red-500 animate-pulse' : 'border-white/5'}`}>
            <span className="text-[8px] font-black text-slate-500 uppercase block mb-1 leading-none text-right">SIG. RITMO</span>
            <span className="text-2xl font-black tabular-nums text-white leading-none text-right">{Math.floor((120 - cycleSeconds) / 60)}:{((120 - cycleSeconds) % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* RITMOS */}
      <div className="w-full max-w-2xl grid grid-cols-5 gap-1.5 mb-2 shrink-0">
        {Object.entries(RITMOS).map(([key, info]) => (
          <button key={key} onClick={() => { setRitmoActual(key); speak(info.nombre); addLog(`CAMBIO RITMO: ${info.corto}`, 'PULSE'); }} className={`py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all border ${ritmoActual === key ? 'bg-cyan-600 border-cyan-400 text-white shadow-xl' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>{info.corto}</button>
        ))}
      </div>

      {/* TÉCNICA RCP */}
      <div className="w-full max-w-2xl bg-slate-900/40 border border-white/5 p-2 rounded-[28px] mb-2 shadow-inner">
         <div className="flex gap-2">
            {TECNICAS_RCP.map(t => (
              <button key={t.id} onClick={() => { setManualOverride(true); setTecnicaRCP(t.id); speak(t.nombre); }} className={`flex-1 py-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 relative ${tecnicaRCP === t.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg z-10' : 'bg-slate-800/40 border-white/5 text-slate-500'}`}>
                 {sugerenciaPALS === t.id && <div className="absolute -top-1 right-2 bg-cyan-500 text-[6px] px-1.5 py-0.5 rounded-full font-black text-white shadow-lg flex items-center gap-1"><Sparkles size={6}/> PALS</div>}
                 <div className="flex items-center gap-2">{t.icon} <span className="text-[9px] font-black uppercase">{t.nombre}</span></div>
                 <span className="text-[7px] font-bold opacity-60 uppercase">{t.desc}</span>
              </button>
            ))}
         </div>
      </div>

      {/* ACCIÓN RCP */}
      <div className="w-full max-w-2xl h-20 mb-2 shrink-0">
        {!isActive ? (
          <button onClick={() => setModal('start_choice')} className="w-full h-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] flex items-center justify-center gap-5 shadow-2xl active:scale-95 transition-all">
            <UserPlus size={32} /><div className="flex flex-col items-start text-left"><span className="text-xl font-black uppercase tracking-tighter">Preparar Reanimación</span><span className="text-[10px] font-bold opacity-80 uppercase leading-none text-left">Protocolo AHA PALS Pediátrico</span></div>
          </button>
        ) : isChecking ? (
          <div className="bg-indigo-600 h-full p-2 rounded-[32px] flex items-center justify-between px-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col text-left"><span className="text-[10px] font-black text-white/60 uppercase leading-none">Evaluación</span><span className="text-sm font-black text-white uppercase tracking-wider">¿Existe Pulso?</span></div>
            <div className="flex gap-3">
              <button onClick={() => { setIsActive(false); setResultadoFinal('RCE LOGRADO (ROSC)'); setModal('export'); speak("Retorno de circulación espontánea."); }} className="bg-white text-indigo-700 rounded-2xl px-6 py-2.5 font-black text-[11px] shadow-xl uppercase active:scale-90">SÍ (ROSC)</button>
              <button onClick={() => { setIsChecking(false); setIsCompressing(true); speak("Continúe compresiones."); }} className="bg-indigo-900/50 text-white border border-indigo-400/30 rounded-2xl px-6 py-2.5 font-black text-[11px] uppercase active:scale-90">NO</button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 h-full p-4 rounded-[32px] border border-white/5 flex justify-between items-center relative shadow-2xl">
            <div className="flex items-center gap-8 px-2">
                <div className="flex flex-col text-left"><span className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Comp</span><span className={`text-3xl font-black tabular-nums leading-none tracking-tighter text-cyan-500 transition-all ${hapticTick ? 'scale-110 text-cyan-300' : ''}`}>{compresionCount}</span></div>
                <div className="flex flex-col text-left"><span className="text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest">Vent</span><span className="text-2xl font-black text-blue-400 tabular-nums leading-none tracking-tighter">{ventilacionCount}</span></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center text-center"><span className="text-[7px] font-black text-slate-600 uppercase mb-1">Ratio</span><span className="text-sm font-black text-slate-300 tabular-nums uppercase">{mode}</span></div>
              <button onClick={() => { setIsPaused(!isPaused); triggerHaptic(100); }} className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10 text-white active:scale-90 transition-all shadow-xl">{isPaused ? <Play size={24} className="text-emerald-400" /> : <Pause size={24} className="text-amber-400" />}</button>
            </div>
            {isVentilating && <div className="absolute inset-0 bg-blue-600 rounded-[32px] flex items-center justify-center z-50 animate-pulse text-white font-black uppercase text-2xl shadow-inner border-4 border-blue-400">¡ VENTILAR !</div>}
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="w-full max-w-2xl grid grid-cols-4 gap-2 mb-2 shrink-0">
          <button onClick={handleShock} disabled={!isActive} className="py-4 bg-red-600 rounded-[24px] flex flex-col items-center gap-1 shadow-xl text-white active:scale-95 disabled:opacity-20 transition-all border-b-4 border-red-800"><Bolt size={18} /><span className="text-[9px] font-black uppercase">Choque</span></button>
          <button onClick={() => setModal('farmacos')} disabled={!isActive} className="py-4 bg-emerald-600 rounded-[24px] flex flex-col items-center gap-1 shadow-xl text-white active:scale-95 transition-all border-b-4 border-emerald-800"><Syringe size={18} /><span className="text-[9px] font-black uppercase tracking-tighter">Dosis</span></button>
          <button onClick={() => setModal('mezclas')} className="py-4 bg-purple-600 rounded-[24px] flex flex-col items-center gap-1 shadow-xl text-white active:scale-95 transition-all border-b-4 border-purple-800"><Flask size={18} /><span className="text-[9px] font-black uppercase tracking-tighter">Mezclas</span></button>
          <button onClick={() => setModal('h5t')} className="py-4 bg-slate-800 border border-white/5 rounded-[24px] flex flex-col items-center gap-1 text-white active:scale-95 border-b-4 border-slate-950 transition-all shadow-lg"><ShieldAlert size={18} className="text-cyan-400" /><span className="text-[9px] font-black uppercase tracking-tighter">H's & T's</span></button>
      </div>

      {/* EXTRA MANEUVERS */}
      <div className="w-full max-w-2xl bg-slate-900/40 p-2 px-3 rounded-[24px] border border-white/5 flex gap-2 overflow-x-auto scrollbar-hide mb-2 shadow-inner">
          <div className="bg-slate-800/20 px-3 flex items-center border-r border-white/5 mr-1"><span className="text-[7px] font-black text-slate-600 uppercase vertical-text">Extras</span></div>
          {MANIOBRAS_MANUALES.map(m => (
            <button key={m.id} onClick={() => { addLog(`MANIOBRA: ${m.label}`, 'TECH'); speak(m.label); triggerHaptic(60); }} className="flex flex-col items-center gap-1 bg-slate-800/60 border border-white/5 p-2 rounded-2xl min-w-[75px] active:scale-90 transition-all group shrink-0 shadow-sm">
               <div className="text-cyan-500 group-active:text-white transition-colors">{m.icon}</div>
               <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">{m.label}</span>
            </button>
          ))}
          <button onClick={() => setModal('vía_aerea')} className="flex flex-col items-center gap-1 bg-indigo-600/30 border border-indigo-500/20 p-2 rounded-2xl min-w-[75px] active:scale-90 transition-all shrink-0 shadow-sm text-center"><div className="text-indigo-400"><CircleDot size={14}/></div><span className="text-[7px] font-black text-indigo-200 uppercase tracking-tighter whitespace-nowrap">Vía TOT</span></button>
          <button onClick={() => setModal('vascular')} className="flex flex-col items-center gap-1 bg-blue-600/30 border border-blue-500/20 p-2 rounded-2xl min-w-[75px] active:scale-90 transition-all shrink-0 shadow-sm text-center"><div className="text-blue-400"><Target size={14}/></div><span className="text-[7px] font-black text-blue-200 uppercase tracking-tighter whitespace-nowrap">Acceso Vasc.</span></button>
      </div>

      {/* LOGS */}
      <div className="w-full max-w-2xl flex-1 bg-slate-900/20 rounded-[32px] border border-white/5 overflow-hidden flex flex-col mb-2 shadow-inner">
        <div className="p-2 px-6 border-b border-white/5 bg-slate-900/40 flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
          <div className="flex items-center gap-2 italic"><ClipboardList size={14}/> <span>Eventos Consolidados</span></div>
          <div className="flex gap-3">
             <span className="text-cyan-400 font-black">{edad} {edadUnidad.toUpperCase()}</span>
             <span className="text-indigo-400 font-black">{weight}KG</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] scrollbar-hide">
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-3 animate-in slide-in-from-left duration-200 text-left">
                <div className="flex flex-col tabular-nums shrink-0 min-w-[52px]">
                  <span className="text-[9px] font-bold text-slate-500">{l.time}</span>
                  <span className="text-[10px] font-black text-cyan-500">+{l.elapsed}</span>
                </div>
                <span className={`uppercase font-bold tracking-tight ${l.type === 'SYSTEM' ? 'text-cyan-400' : l.type === 'TECH' ? 'text-blue-400' : l.type === 'DRUG' ? 'text-emerald-400' : l.type === 'SHOCK' ? 'text-red-400' : 'text-slate-200'}`}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODALS */}
      {modal && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 text-left">
          
          {modal === 'edad_panel' && (
             <div className="bg-slate-900 border border-white/10 w-full max-w-xs rounded-[40px] p-8 shadow-2xl">
                <h3 className="font-black uppercase mb-4 text-sm text-cyan-400 tracking-widest flex items-center justify-center gap-2"><UserCog size={16}/> Configurar Edad</h3>
                
                {/* Selector de Unidades */}
                <div className="flex bg-slate-800 p-1 rounded-2xl mb-4">
                  <button onClick={() => setTempUnidad('años')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${tempUnidad === 'años' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500'}`}>Años</button>
                  <button onClick={() => setTempUnidad('meses')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${tempUnidad === 'meses' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500'}`}>Meses</button>
                </div>

                <div className="bg-black/40 p-6 rounded-3xl mb-6 text-5xl font-black text-white border border-white/5 flex items-center justify-center h-20 tabular-nums shadow-inner">
                  {tempEdad || '0'}
                  <span className="text-xs font-black text-slate-600 ml-2 uppercase">{tempUnidad}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 font-black">
                   {[1,2,3,4,5,6,7,8,9, 'DEL', 0, 'OK'].map(n => (
                     <button key={n} onClick={() => {
                        if (n === 'DEL') setTempEdad(v => v.length > 0 ? v.slice(0, -1) : '');
                        else if (n === 'OK') { updatePatientData(tempEdad || '0', tempUnidad); setModal(null); }
                        else if (typeof n === 'number') setTempEdad(v => v.length < 2 ? v + n : v);
                     }} className={`h-14 rounded-2xl text-lg active:scale-90 shadow-md ${n === 'OK' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-white'}`}>{n}</button>
                   ))}
                </div>
             </div>
          )}

          {modal === 'start_choice' && (
            <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[40px] p-8 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95">
               <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-500/20 p-4 rounded-full text-emerald-400 mb-4 shadow-xl"><UserPlus size={40}/></div>
                  <h3 className="font-black text-white uppercase tracking-widest text-lg leading-none">Setup Inicial PALS</h3>
               </div>
               <div className="grid grid-cols-2 gap-4 bg-slate-800/40 p-6 rounded-3xl border border-white/5">
                  <button onClick={() => { setTempEdad(edad); setTempUnidad(edadUnidad); setModal('edad_panel'); }} className="flex flex-col gap-2 group text-left">
                     <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Edad</label>
                     <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 flex items-center justify-center group-active:scale-95 shadow-md">
                       <span className="text-2xl font-black text-white">{edad}</span>
                       <span className="text-xs font-black text-slate-600 ml-1 uppercase">{edadUnidad === 'años' ? 'A' : 'M'}</span>
                     </div>
                  </button>
                  <div className="flex flex-col gap-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Peso</label>
                     <div className="bg-slate-900 p-4 rounded-2xl border border-white/5 flex items-center shadow-md"><input type="number" value={weight} onChange={(e) => { setWeight(parseInt(e.target.value) || 0); setManualOverride(true); }} className="bg-transparent w-full text-2xl font-black text-white text-center focus:outline-none" /><span className="text-xs font-black text-slate-600 ml-1">KG</span></div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 mt-2">
                  <button onClick={() => handleStartRCP('30:2')} className="p-6 bg-emerald-600 text-white rounded-[28px] font-black text-xl shadow-xl active:scale-95 flex flex-col items-center gap-1 border-b-4 border-emerald-800"><span>30:2</span><span className="text-[8px] opacity-70">Soporte PALS</span></button>
                  <button onClick={() => handleStartRCP('CONTINUA')} className="p-6 bg-slate-800 text-white rounded-[28px] font-black text-xl shadow-xl active:scale-95 flex flex-col items-center gap-1 border-b-4 border-slate-950 border border-white/10"><span>100-120/min</span><span className="text-[8px] opacity-70">Post-Intubación</span></button>
               </div>
            </div>
          )}

          {modal === 'farmacos' && (
            <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[40px] p-8 shadow-2xl flex flex-col">
              <div className="flex justify-between items-center mb-6"><h3 className="font-black text-emerald-400 uppercase text-sm leading-none">Dosis de Paro</h3><button onClick={() => setModal(null)} className="p-2 bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-colors"><XCircle size={24}/></button></div>
              <div className="space-y-4">
                 <button onClick={() => { 
                   setAdrenalinas(a => a + 1); setEpiSeconds(0); 
                   addLog(`ADRENALINA ${doses.epi}mg IV/IO`, 'DRUG'); 
                   speak(`Adrenalina. Dosis: ${doses.epi.replace('.', ' coma ')} miligramos.`);
                   triggerHaptic(100); setModal(null); 
                 }} className="w-full p-6 bg-red-600 text-white rounded-[32px] flex justify-between items-center active:scale-95 shadow-xl transition-all border-b-4 border-red-800">
                   <div className="flex flex-col items-start font-black uppercase"><span className="text-sm">Adrenalina</span><span className="text-[8px] opacity-70">0.01 mg/kg</span></div>
                   <div className="flex flex-col items-end text-right">
                      <span className="text-3xl font-black tabular-nums">{doses.epi} <span className="text-xs">MG</span></span>
                      <span className="text-xs font-bold opacity-60 uppercase">{doses.epiVol} ML</span>
                   </div>
                 </button>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => { speak(`Bolo de cristaloides.`); addLog(`BOLO CRISTALOIDES ${doses.bolus}ml`, 'DRUG'); triggerHaptic(80); setModal(null); }} className="p-5 bg-blue-600 text-white rounded-[28px] flex flex-col items-center gap-1 shadow-lg active:scale-95"><Droplets size={22}/><span className="text-[10px] font-black uppercase tracking-tighter">Bolo {doses.bolus}ml</span></button>
                    <button onClick={() => { speak("Glicemia."); setModal('glucose'); }} className="p-5 bg-amber-600 text-white rounded-[28px] flex flex-col items-center gap-1 shadow-lg active:scale-95"><Activity size={22}/><span className="text-[10px] font-black uppercase tracking-tighter">Glicemia</span></button>
                 </div>
              </div>
            </div>
          )}

          {modal === 'mezclas' && (
            <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[85vh]">
               <div className="flex justify-between items-center mb-6 px-2">
                  <div className="flex flex-col text-left">
                    <h3 className="font-black text-purple-400 uppercase tracking-widest text-sm leading-none">Mezclas Vasoactivas</h3>
                    <span className="text-[9px] text-slate-500 font-bold uppercase mt-2 leading-none">Dosis {weight}kg • PALS Stnd.</span>
                  </div>
                  <button onClick={() => setModal(null)} className="p-2 bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-colors"><XCircle size={24}/></button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-2">
                  {INFUSIONES_DATA.map(inf => {
                    const mgVal = (inf.factor * weight).toFixed(1);
                    return (
                      <button key={inf.id} onClick={() => { speak(`${inf.nombre}, ${mgVal.replace('.', ' coma ')} miligramos en cien mililitros`); triggerHaptic(80); }} className="w-full p-5 bg-slate-800/50 border border-white/5 rounded-3xl flex justify-between items-center group active:scale-[0.98] transition-all hover:bg-purple-600/10 shadow-md">
                         <div className="flex flex-col items-start text-left"><span className="text-[13px] font-black text-white uppercase leading-none mb-1">{inf.nombre}</span><span className="text-[9px] text-purple-400 font-black uppercase tracking-tighter">{inf.dosis} {inf.unidad}</span></div>
                         <div className="flex flex-col items-end text-right"><span className="text-[16px] font-black text-white tabular-nums">{mgVal} mg</span><span className="text-[8px] text-slate-500 font-bold uppercase">En 100ml Sol.</span></div>
                      </button>
                    );
                  })}
               </div>
            </div>
          )}

          {modal === 'glucose' && (
             <div className="bg-slate-900 border border-white/10 w-full max-w-xs rounded-[40px] p-8 shadow-2xl text-center">
                <h3 className="font-black uppercase mb-6 text-sm text-amber-400 leading-none">Glicemia (mg/dL)</h3>
                <div className="bg-black/40 p-8 rounded-3xl mb-6 text-5xl font-black text-amber-500 border border-white/5 flex items-center justify-center h-24 tabular-nums shadow-inner">{tempGlucemia || '---'}</div>
                <div className="grid grid-cols-3 gap-2 font-black">
                   {[1,2,3,4,5,6,7,8,9, 'DEL', 0, 'OK'].map(n => (
                     <button key={n} onClick={() => {
                        if (n === 'DEL') setTempGlucemia(v => v.length > 0 ? v.slice(0, -1) : '');
                        else if (n === 'OK') { 
                          const val = parseInt(tempGlucemia); 
                          if (isNaN(val)) return;
                          setGlucemia(val); addLog(`GLUCEMIA: ${val} mg/dL`, 'SYSTEM'); 
                          speak(`Glicemia: ${val} miligramos.`);
                          setModal(null); setTempGlucemia(''); 
                        }
                        else if (typeof n === 'number') setTempGlucemia(v => v.length < 3 ? v + n : v);
                     }} className={`h-14 rounded-2xl text-lg active:scale-90 shadow-md ${n === 'OK' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}>{n}</button>
                   ))}
                </div>
             </div>
          )}

          {modal === 'vía_aerea' && (
            <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[40px] p-8 shadow-2xl flex flex-col text-center">
              <h3 className="font-black text-indigo-400 uppercase mb-8 text-sm tracking-widest leading-none">Vía Orotraqueal ({edad} {edadUnidad})</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                 <button onClick={() => { 
                   const ageInYrs = edadUnidad === 'meses' ? (parseFloat(edad)/12) : parseFloat(edad);
                   setTotInfo({size: ((ageInYrs/4) + 3.5).toFixed(1), depth: (((ageInYrs/4) + 3.5) * 3).toFixed(1)}); 
                   setMode('CONTINUA'); setModal(null); addLog(`TET CUFFED ADM`, 'AIRWAY'); speak("Tubo con balón posicionado."); 
                 }} className="bg-indigo-600/20 border border-indigo-500/50 p-6 rounded-3xl flex flex-col items-center gap-2 active:scale-95 shadow-lg">
                   <span className="text-[10px] font-black uppercase text-indigo-300">Con Balón</span>
                   <span className="text-4xl font-black text-white">
                     {edadUnidad === 'meses' && parseFloat(edad) < 12 ? '3.0' : ((parseFloat(edadUnidad === 'meses' ? (parseInt(edad)/12).toString() : edad)/4) + 3.5).toFixed(1)}
                   </span>
                 </button>
                 <button onClick={() => { 
                   const ageInYrs = edadUnidad === 'meses' ? (parseFloat(edad)/12) : parseFloat(edad);
                   setTotInfo({size: ((ageInYrs/4) + 4).toFixed(1), depth: (((ageInYrs/4) + 4) * 3).toFixed(1)}); 
                   setMode('CONTINUA'); setModal(null); addLog(`TET UNCUFFED ADM`, 'AIRWAY'); speak("Tubo sin balón posicionado."); 
                 }} className="bg-slate-800/50 border border-white/5 p-6 rounded-3xl flex flex-col items-center gap-2 active:scale-95 shadow-lg">
                   <span className="text-[10px] font-black uppercase text-slate-500">Sin Balón</span>
                   <span className="text-4xl font-black text-white">
                     {edadUnidad === 'meses' && parseFloat(edad) < 12 ? '3.5' : ((parseFloat(edadUnidad === 'meses' ? (parseInt(edad)/12).toString() : edad)/4) + 4.0).toFixed(1)}
                   </span>
                 </button>
              </div>
            </div>
          )}

          {modal === 'vascular' && (
            <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[85vh]">
               <div className="flex justify-between items-center mb-6">
                 <div className="flex flex-col text-left"><h3 className="font-black text-blue-400 uppercase tracking-widest text-sm leading-none">Accesos Vasculares</h3><span className="text-[9px] text-slate-500 font-bold uppercase mt-1">Registrar Vía</span></div>
                 <button onClick={() => setModal(null)} className="p-2 bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-colors"><XCircle size={24}/></button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-2">
                  {VASCULAR_DATA.map(v => (
                    <button key={v.id} onClick={() => { speak(`Ubicación de ${v.nombre}`); setSelectedVascularId(v.id); setModal('vascular_detalle'); }} className="w-full p-5 bg-slate-800/50 border border-white/5 rounded-3xl flex justify-between items-center group active:scale-[0.98] transition-all"><div className="flex items-center gap-4 text-left"><div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400"><Target size={20}/></div><span className="text-[13px] font-black text-white uppercase tracking-tight leading-none">{v.nombre}</span></div><ChevronRight size={18} className="text-slate-700"/></button>
                  ))}
               </div>
            </div>
          )}

          {modal === 'vascular_detalle' && selectedVascularId && (
            <div className="bg-slate-900 border border-white/10 w-full max-w-xs rounded-[40px] p-8 shadow-2xl">
               <div className="flex items-center gap-4 mb-6"><button onClick={() => setModal('vascular')} className="p-2 bg-slate-800 rounded-2xl text-slate-500"><ChevronLeft size={20}/></button><h3 className="font-black text-white uppercase text-xs tracking-widest leading-none">Ubicación</h3></div>
               <div className="grid grid-cols-1 gap-2">
                  {VASCULAR_DATA.find(x => x.id === selectedVascularId)?.tipos.map(tipo => (
                    <button key={tipo} onClick={() => handleSetAcceso(VASCULAR_DATA.find(x => x.id === selectedVascularId)!.nombre, tipo)} className="p-4 bg-slate-800/50 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm text-left">
                       {tipo}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {modal === 'h5t' && (
            <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6 px-2 text-left"><div className="flex flex-col"><h3 className="font-black text-cyan-400 uppercase tracking-widest text-sm">Causas Reversibles</h3><span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Múltiple Selección</span></div><button onClick={() => setModal(null)} className="p-2 bg-slate-800 rounded-2xl text-slate-500 hover:text-white transition-colors"><XCircle size={24}/></button></div>
              <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-hide pr-1">
                 {CAUSAS_PALS_DATA.map(c => {
                   const hechos = c.manejos.filter(m => causasRealizadas.includes(m.id)).length;
                   return (
                     <button key={c.id} onClick={() => { speak(`Causa: ${c.nombre}.`); setSelectedCausaId(c.id); setModal('causa_detalle'); }} className={`w-full p-4 rounded-3xl border flex items-center justify-between transition-all active:scale-[0.98] shadow-md ${hechos > 0 ? 'bg-cyan-600/10 border-cyan-500/50 shadow-lg' : 'bg-slate-800/50 border-white/5'}`}><div className="flex items-center gap-4 text-left"><div className={`p-3 rounded-2xl ${hechos > 0 ? 'bg-cyan-500 text-white' : 'bg-slate-900 text-slate-700'}`}>{c.icon}</div><div><p className="text-[12px] font-black text-white uppercase leading-none">{c.nombre}</p><span className={`text-[8px] uppercase font-bold mt-1 block ${hechos > 0 ? 'text-cyan-400' : 'text-slate-600'}`}>{hechos > 0 ? `${hechos} Hechos` : 'Seleccionar'}</span></div></div><ChevronRight size={18} className="text-slate-700"/></button>
                   );
                 })}
              </div>
            </div>
          )}

          {modal === 'causa_detalle' && selectedCausaId && (
            <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[85vh]">
               <div className="flex items-center gap-4 mb-6"><button onClick={() => setModal('h5t')} className="p-2 bg-slate-800 rounded-2xl text-slate-500 hover:text-white"><ChevronLeft size={20}/></button><h3 className="font-black text-white uppercase text-xs tracking-widest">{CAUSAS_PALS_DATA.find(x => x.id === selectedCausaId)?.nombre}</h3></div>
               <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {CAUSAS_PALS_DATA.find(x => x.id === selectedCausaId)?.manejos.map(m => (
                    <button key={m.id} onClick={() => handleManejoCausaMultiple(m)} className={`w-full p-6 rounded-3xl border flex items-center justify-between transition-all active:scale-95 shadow-md ${causasRealizadas.includes(m.id) ? 'bg-cyan-600 border-cyan-400 text-white shadow-xl' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}>
                       <span className="text-[11px] font-black uppercase tracking-tight text-left">{m.label}</span>
                       {causasRealizadas.includes(m.id) ? <CheckSquare size={20} className="text-white"/> : <Square size={20} className="text-slate-700"/>}
                    </button>
                  ))}
               </div>
               <button onClick={() => setModal('h5t')} className="w-full mt-6 py-4 bg-cyan-600 text-white rounded-[24px] font-black uppercase text-[11px] shadow-xl border-b-4 border-cyan-800 text-center">Confirmar</button>
            </div>
          )}

          {modal === 'export' && (
            <div className="bg-slate-900 border border-white/10 w-full max-w-3xl rounded-[40px] p-6 sm:p-8 shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-center mb-5 shrink-0"><div className="flex items-center gap-4"><div className="bg-cyan-500 p-2.5 rounded-2xl shadow-lg shadow-cyan-500/20"><FileText className="text-white" size={22}/></div><h3 className="font-black text-white uppercase text-base leading-none">Evolución Médica PALS</h3></div><button onClick={() => window.location.reload()} className="p-2.5 bg-slate-800 rounded-2xl text-slate-400 active:scale-90"><RotateCcw size={20}/></button></div>
              <div className="grid grid-cols-2 gap-2 mb-4 shrink-0">
                <div className="bg-slate-800/40 p-3 rounded-xl border border-white/5 text-left"><label className="block text-[8px] font-black text-slate-500 uppercase mb-1">Paciente</label><input type="text" value={pacienteNombre} onChange={(e) => setPacienteNombre(e.target.value)} placeholder="NOMBRE..." className="w-full bg-transparent border-none text-white font-black text-sm p-0 focus:outline-none uppercase placeholder:text-slate-700" /></div>
                <div className="bg-slate-800/40 p-3 rounded-xl border border-white/5 text-left"><label className="block text-[8px] font-black text-slate-500 uppercase mb-1">ID / HC</label><input type="text" value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} placeholder="CC / HC..." className="w-full bg-transparent border-none text-white font-black text-sm p-0 focus:outline-none uppercase placeholder:text-slate-700" /></div>
              </div>
              <div className="flex gap-1.5 mb-4 shrink-0">
                {['resumen', 'evolucion', 'bitacora'].map(t => (
                  <button key={t} onClick={() => setReportTab(t)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${reportTab === t ? 'bg-cyan-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>
                    {t === 'resumen' ? 'Resumen' : t === 'evolucion' ? 'Evolución' : 'Bitácora'}
                  </button>
                ))}
              </div>
              <div className="bg-slate-950 p-5 rounded-[20px] border border-white/5 flex-1 overflow-y-auto mb-5 shadow-inner text-left scrollbar-hide">
                {reportTab === 'resumen' && <pre className="text-[10px] font-mono text-cyan-200/70 whitespace-pre-wrap leading-relaxed">{generateReportText()}</pre>}
                {reportTab === 'evolucion' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-cyan-400" /><span className="text-xs font-black text-cyan-400 uppercase">Evolución Médica Narrativa</span></div>
                    <p className="text-[11px] text-cyan-100/80 leading-[1.8] font-medium">{evolucionPals()}</p>
                    <button onClick={() => { const el = document.createElement('textarea'); el.value = evolucionPals(); document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); triggerHaptic(100); }} className="mt-4 w-full py-2.5 bg-cyan-600/20 border border-cyan-500/20 text-cyan-400 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95"><Copy size={14} /> Copiar evolución</button>
                  </div>
                )}
                {reportTab === 'bitacora' && (
                  <div className="space-y-1.5">{logs.map((l) => (
                    <div key={l.id} className="flex items-start gap-3 text-left">
                      <div className="flex flex-col tabular-nums shrink-0 min-w-[52px]"><span className="text-[9px] font-bold text-slate-500">{l.time}</span><span className="text-[10px] font-black text-cyan-500">+{l.elapsed}</span></div>
                      <span className={`uppercase font-bold tracking-tight text-[10px] ${l.type === 'SYSTEM' ? 'text-cyan-400' : l.type === 'DRUG' ? 'text-emerald-400' : l.type === 'SHOCK' ? 'text-red-400' : 'text-slate-300'}`}>{l.msg}</span>
                    </div>
                  ))}</div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2.5 shrink-0">
                 <button onClick={() => window.open(`whatsapp://send?text=${encodeURIComponent(fullReportPals())}`, '_blank')} className="py-3.5 bg-emerald-600 rounded-2xl text-white flex flex-col items-center gap-1 active:scale-95 shadow-xl"><MessageCircle size={18}/><span className="text-[9px] font-black uppercase">WhatsApp</span></button>
                 <button onClick={() => window.open(`mailto:?subject=PALS-${pacienteNombre}&body=${encodeURIComponent(fullReportPals())}`, '_blank')} className="py-3.5 bg-indigo-600 rounded-2xl text-white flex flex-col items-center gap-1 active:scale-95 shadow-xl"><Mail size={18}/><span className="text-[9px] font-black uppercase">Email</span></button>
                 <button onClick={() => { const el = document.createElement('textarea'); el.value = fullReportPals(); document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); triggerHaptic(100); }} className="py-3.5 bg-slate-800 rounded-2xl text-slate-300 flex flex-col items-center gap-1 active:scale-95 border border-white/5 shadow-xl"><Copy size={18}/><span className="text-[9px] font-black uppercase">Copiar</span></button>
              </div>
            </div>
          )}

          {modal === 'finish' && (
            <div className="bg-slate-900 border border-red-500/20 w-full max-w-xs rounded-[40px] p-8 shadow-2xl text-center">
               <AlertTriangle size={48} className="text-red-500 animate-pulse mx-auto mb-6" /><h3 className="text-white font-black uppercase text-sm mb-3 leading-tight text-center">¿Finalizar Reanimación?</h3><p className="text-slate-500 text-[10px] font-bold uppercase mb-8 leading-relaxed text-center">Se consolidará la Epicrisis Médica PALS final.</p>
               <div className="grid grid-cols-2 gap-4"><button onClick={() => setModal(null)} className="py-4 bg-slate-800 text-slate-400 rounded-3xl text-[10px] uppercase font-black active:scale-90 shadow-sm border border-white/5">No</button><button onClick={() => { setIsActive(false); setResultadoFinal('MANIOBRAS FINALIZADAS'); setModal('export'); speak("Sesión terminada."); }} className="py-4 bg-red-600 text-white rounded-3xl text-[10px] uppercase font-black shadow-xl active:scale-90 transition-all border-b-4 border-red-900">Finalizar</button></div>
            </div>
          )}
          
        </div>
      )}

      {/* FOOTER */}
      <div className="w-full max-w-2xl px-4 py-3 flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] shrink-0 border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
          <div className="flex gap-8 text-left items-center">
            <span className={totInfo.size ? "text-cyan-500 font-black" : ""}>{totInfo.size ? `TET #${totInfo.size}` : "BVM"}</span>
            <span className="text-slate-500">V: {ventilacionCount}</span>
            <span className={adrenalinas > 0 ? "text-red-500/80 font-black" : ""}>EPI: {adrenalinas}</span>
            <div className={`flex items-center gap-1 ${glucemia && glucemia < 60 && glucemia !== null ? 'text-amber-500 animate-pulse font-black scale-110' : 'text-slate-600'}`}>
              <Droplet size={10}/>
              <span>GLU: {glucemia !== null ? glucemia : '--'}</span>
            </div>
          </div>
          <button onClick={() => { setVoiceOn(!voiceOn); triggerHaptic(50); }} className={`p-2 rounded-xl transition-all shadow-lg ${voiceOn ? "bg-cyan-500/10 text-cyan-400" : "bg-red-500/10 text-red-900"}`}>{voiceOn ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
      `}} />
    </div>
  );
}