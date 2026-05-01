import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Zap, Syringe, Clock, Volume2, VolumeX, Heart,
  Pause, Play, XCircle, ShieldAlert,
  Power, Droplets, RefreshCcw, Activity,
  Check, Mail, MessageCircle, ChevronRight,
  TrendingUp, ClipboardList, Droplet,
  Biohazard, CircleDot, ArrowDownToLine, 
  Wind, FlaskConical, Stethoscope, Thermometer,
  Pill, Copy, RotateCcw, AlertTriangle
} from 'lucide-react';

/**
 * ACLS MONITOR PRO - Clinical Decision Support System
 * Premium Edition with Double Confirmation & Full Airway Management
 */

const METRONOME_BPM = 110;
const CICLO_DURACION = 120; // 2 minutes
const ADR_WINDOW_MIN = 180; // 3 minutes
const ADR_WINDOW_MAX = 300; // 5 minutes
const UMBRAL_HIPOGLUCEMIA = 70;

const RITMOS = {
  VF: { nombre: 'Fibrilación Ventricular', corto: 'FV', desfibrilable: true },
  PVT: { nombre: 'TV Sin Pulso', corto: 'TVSP', desfibrilable: true },
  ASYSTOLE: { nombre: 'Asistolia', corto: 'Asistolia', desfibrilable: false },
  PEA: { nombre: 'AESP', corto: 'AESP', desfibrilable: false },
  BRADY: { nombre: 'Bradicardia', corto: 'BRADI', desfibrilable: false }
};

const TIPOS_LIQUIDOS = [
  { id: 'ssn', nombre: 'Solución Salina 0.9%', corto: 'SSN 0.9%', volDefault: 500 },
  { id: 'lr', nombre: 'Lactato de Ringer', corto: 'Lactato', volDefault: 500 },
  { id: 'dx5', nombre: 'Dextrosa 5%', corto: 'DX 5%', volDefault: 250 },
  { id: 'dx10', nombre: 'Dextrosa 10%', corto: 'DX 10%', volDefault: 100 },
  { id: 'dx50', nombre: 'Dextrosa 50%', corto: 'DX 50%', volDefault: 50 },
  { id: 'kcl', nombre: 'Cloruro de Potasio', corto: 'KCl', volDefault: 100 }
];

const AGENTES_HEMODERIVADOS = [
  { id: 'gre', nombre: 'Glóbulos Rojos', corto: 'GRE', unidad: 'U', volPorUnidad: 300, volDefault: 1 },
  { id: 'pfc', nombre: 'Plasma Fresco', corto: 'PFC', unidad: 'U', volPorUnidad: 200, volDefault: 1 },
  { id: 'plaquetas', nombre: 'Plaquetas', corto: 'PLT', unidad: 'U', volPorUnidad: 50, volDefault: 1 },
  { id: 'crio', nombre: 'Crioprecipitados', corto: 'CRIO', unidad: 'U', volPorUnidad: 20, volDefault: 1 }
];

const ANTIDOTOS_DATA = [
  { id: 'naloxona', nombre: 'Naloxona', indicacion: 'Opiáceos', dosis: '0.4 - 2 mg' },
  { id: 'nac', nombre: 'Acetilcisteína', indicacion: 'Paracetamol', dosis: '150 mg/kg' },
  { id: 'flumazenil', nombre: 'Flumazenil', indicacion: 'Benzodiacepinas', dosis: '0.2 mg' },
  { id: 'bicarb_tox', nombre: 'Bicarbonato', indicacion: 'Tricíclicos', dosis: '1-2 mEq/kg' }
];

// --- Subcomponent: ECG Monitor ---
const EcgMonitor = ({ isActive, ritmo, isPaused, isFinished }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const xRef = useRef(0);
  const lastYRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        lastYRef.current = canvas.height / 2;
        ctx.fillStyle = '#0a0f1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const draw = () => {
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      const midY = height / 2;
      
      ctx.fillStyle = '#0a0f1e';
      ctx.globalAlpha = 0.15;
      ctx.fillRect(xRef.current, 0, 25, height);
      ctx.globalAlpha = 1.0;
      
      ctx.strokeStyle = isFinished ? '#334155' : isPaused ? '#475569' : '#22c55e';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = isFinished ? 0 : 8;
      ctx.shadowColor = '#22c55e';
      
      ctx.beginPath();
      ctx.moveTo(xRef.current, lastYRef.current);

      let nextY = midY;
      if (isActive && ritmo && !isFinished && !isPaused) {
        const t = Date.now() / 1000;
        if (ritmo === 'VF') nextY = midY + (Math.sin(t * 35) * 15) + (Math.random() * 35);
        else if (ritmo === 'PVT') nextY = midY + (Math.sin(t * 22) * 55);
        else if (ritmo === 'ASYSTOLE') nextY = midY + (Math.random() * 3 - 1.5);
        else if (ritmo === 'PEA' || ritmo === 'BRADY') {
          const bDur = ritmo === 'BRADY' ? 2000 : 850;
          const beat = Date.now() % bDur;
          if (beat < 40) nextY = midY - 10;
          else if (beat < 60) nextY = midY;
          else if (beat < 80) nextY = midY + 10;
          else if (beat < 110) nextY = midY - 70;
          else if (beat < 140) nextY = midY + 20;
          else if (beat < 250) nextY = midY;
          else if (beat < 350) nextY = midY - 15;
          else nextY = midY;
        }
      } else {
        nextY = midY + (Math.random() * 2 - 1);
      }

      xRef.current += 3.8;
      if (xRef.current >= width) {
        xRef.current = 0;
        ctx.fillStyle = '#0a0f1e';
        ctx.fillRect(0, 0, width, height);
      }
      
      ctx.lineTo(xRef.current, nextY);
      ctx.stroke();
      lastYRef.current = nextY;
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive, ritmo, isPaused, isFinished]);

  return (
    <div className="w-full h-full bg-[#0a0f1e] overflow-hidden relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default function AclsMonitor() {
  // --- STATES ---
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isVentilating, setIsVentilating] = useState(false);
  const [mode, setMode] = useState('30:2');
  const [pacienteNombre, setPacienteNombre] = useState('');
  const [pacienteCedula, setPacienteCedula] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cycleSeconds, setCycleSeconds] = useState(0);
  const [adrSeconds, setAdrSeconds] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [pulseCheckMode, setPulseCheckMode] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [adrenalinas, setAdrenalinas] = useState(0);
  const [bicarbonatos, setBicarbonatos] = useState(0);
  const [desfibrilaciones, setDesfibrilaciones] = useState(0);
  const [liquidosTotales, setLiquidosTotales] = useState<any[]>([]);
  const [antidotosAdmin, setAntidotosAdmin] = useState<any[]>([]);
  const [vasopresores, setVasopresores] = useState<any[]>([]);
  const [glucemia, setGlucemia] = useState<number | null>(null);
  const [totSize, setTotSize] = useState<number | null>(null);
  const [ritmoActual, setRitmoActual] = useState('ASYSTOLE');
  const [logs, setLogs] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState('');
  const [horaInicio, setHoraInicio] = useState<string | null>(null);
  const [isShocking, setIsShocking] = useState(false);
  const [compresionCount, setCompresionCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Modals Visibility
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showH5TModal, setShowH5TModal] = useState(false);
  const [showGlucemiaModal, setShowGlucemiaModal] = useState(false);
  const [showLiquidosModal, setShowLiquidosModal] = useState(false);
  const [showVasoModal, setShowVasoModal] = useState(false);
  const [showHemoderivadosModal, setShowHemoderivadosModal] = useState(false);
  const [showTOTModal, setShowTOTModal] = useState(false);
  const [showToxinsModal, setShowToxinsModal] = useState(false);
  const [showVolumeInputModal, setShowVolumeInputModal] = useState(false);
  const [showBicarbModal, setShowBicarbModal] = useState(false);
  const [showPotassiumModal, setShowPotassiumModal] = useState(false);
  const [showTrombolisisModal, setShowTrombolisisModal] = useState(false);

  const [tempGlucemia, setTempGlucemia] = useState('');
  const [tempVolume, setTempVolume] = useState('');
  const [selectedLiquidForVol, setSelectedLiquidForVol] = useState<any>(null);

  // --- DOUBLE CONFIRMATION LOGIC ---
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const requestConfirmation = (actionId: string, executeFn: () => void, voiceMsg?: string) => {
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    if (pendingConfirm === actionId) {
      executeFn();
      setPendingConfirm(null);
      vibrate(100);
    } else {
      setPendingConfirm(actionId);
      if (voiceMsg) speak(`¿Confirma ${voiceMsg}?`);
      vibrate(50);
      confirmTimeoutRef.current = setTimeout(() => setPendingConfirm(null), 3000);
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const metronomeRef = useRef<NodeJS.Timeout | null>(null);
  const countRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- HANDLERS ---
  const speak = useCallback((text: string) => {
    if (!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES'; u.rate = 1.0;
    window.speechSynthesis.speak(u);
  }, [voiceOn]);

  const addLog = useCallback((msg: string, type = 'EVENT') => {
    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setLogs(prev => [{ time, msg, type }, ...prev]);
  }, []);

  const handleShock = () => {
    if (isShocking || !(RITMOS as any)[ritmoActual].desfibrilable) return;
    setIsShocking(true);
    speak("Cargando desfibrilador. ¡Aléjense!");
    setTimeout(() => {
      setDesfibrilaciones(d => d + 1);
      addLog(`DESCARGA #${desfibrilaciones + 1} ADMINISTRADA`, 'SHOCK');
      setIsShocking(false);
      speak("Descarga administrada. Reanude RCP.");
      setPulseCheckMode(true);
    }, 1200);
  };

  const handleAdrenalina = () => {
    setAdrenalinas(prev => prev + 1);
    setAdrSeconds(0);
    addLog(`ADRENALINA 1mg (#${adrenalinas + 1})`, "DOSIS");
    speak("Adrenalina administrada.");
  };

  const handleConfirmGlucemia = () => {
    const val = parseInt(tempGlucemia);
    if (!isNaN(val)) {
      setGlucemia(val);
      addLog(`GLUCEMIA: ${val} mg/dL`);
      if (val <= UMBRAL_HIPOGLUCEMIA) {
        speak("Alerta: Hipoglucemia detectada.");
        addLog("ALERTA: HIPOGLUCEMIA", "ALERT");
      } else speak("Glucemia registrada.");
    }
    setTempGlucemia('');
    setShowGlucemiaModal(false);
  };

  const triggerVolumeInput = (item: any) => {
    setSelectedLiquidForVol(item);
    setTempVolume(item.volDefault.toString());
    setShowVolumeInputModal(true);
  };

  const handleAdminVolume = () => {
    const vol = parseInt(tempVolume);
    if (!isNaN(vol) && selectedLiquidForVol) {
      const isHemo = selectedLiquidForVol.unidad === 'U';
      const entry = { ...selectedLiquidForVol, volumen: isHemo ? vol * (selectedLiquidForVol.volPorUnidad || 1) : vol, unidades: isHemo ? vol : null, timestamp: new Date() };
      setLiquidosTotales(prev => [...prev, entry]);
      const label = isHemo ? `${selectedLiquidForVol.corto} x${vol}U (${vol * (selectedLiquidForVol.volPorUnidad || 1)}mL)` : `${selectedLiquidForVol.corto} ${vol}mL`;
      addLog(`ADMIN: ${label}`, "DOSIS");
      speak(`${selectedLiquidForVol.corto} administrado.`);
    }
    setTempVolume('');
    setSelectedLiquidForVol(null);
    setShowVolumeInputModal(false);
    setShowLiquidosModal(false);
    setShowHemoderivadosModal(false);
  };

  const handleVasoSelect = (vaso: string) => {
    setVasopresores(prev => [...prev, vaso]);
    addLog(`INFUSIÓN: ${vaso.toUpperCase()} INICIADA`, "DOSIS");
    speak(`Infusión de ${vaso} iniciada.`);
    setShowVasoModal(false);
  };

  const handleProcedimiento = (name: string) => {
    addLog(`PROCEDIMIENTO: ${name.toUpperCase()}`, "SUCCESS");
    speak(`${name} realizado correctamente`);
    setShowH5TModal(false);
  };

  const handleAdminBicarb = (cant: number, desc: string) => {
    setBicarbonatos(prev => prev + cant);
    addLog(`BICARBONATO: ${desc}`, "DOSIS");
    speak("Bicarbonato administrado.");
    setShowBicarbModal(false);
  };

  const handleAdminPotassium = (mEq: number, vol: number) => {
    const entry = { id: 'kcl', nombre: `KCl ${mEq}mEq`, corto: `KCl`, volumen: vol };
    setLiquidosTotales(prev => [...prev, entry]);
    addLog(`POTASIO: ${mEq}mEq ADMINISTRADO`, "DOSIS");
    speak("Potasio administrado.");
    setShowPotassiumModal(false);
  };

  const handleAdminAntidote = (ant: any) => {
    setAntidotosAdmin(prev => [...prev, ant.nombre]);
    addLog(`ANTIDOTO: ${ant.nombre.toUpperCase()}`, "DOSIS");
    speak(`${ant.nombre} administrado.`);
    setShowToxinsModal(false);
  };

  const handleTOTSelect = (size: number) => {
    setTotSize(size);
    addLog(`VÍA AÉREA: TOT #${size} CONFIRMADO`, "SUCCESS");
    speak(`Tubo endotraqueal número ${size} posicionado.`);
    setShowTOTModal(false);
  };

  const handleStartRCPMode = (m: string) => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    
    const timeStart = new Date().toLocaleTimeString('es-ES', { hour12: false });
    setHoraInicio(timeStart);
    setMode(m);
    setIsActive(true);
    setIsCompressing(true);
    addLog(`INICIO PROTOCOLO ACLS (${m})`, 'START');
    speak(`Iniciando reanimación modo ${m}.`);
  };

  const handleFinishProtocol = (resultado: string) => {
    setIsActive(false);
    setIsFinished(true);
    setResultadoFinal(resultado);
    setShowFinishModal(false);
    setShowExportModal(true);
    addLog(`FIN PROTOCOLO: ${resultado}`, 'STOP');
    speak(`Protocolo finalizado. Resultado: ${resultado}`);
  };

  const resetApp = () => {
    setIsActive(false); setIsPaused(false); setIsCompressing(false); setIsVentilating(false);
    setElapsedSeconds(0); setCycleSeconds(0); setAdrSeconds(0); setAdrenalinas(0); setBicarbonatos(0); setDesfibrilaciones(0);
    setLiquidosTotales([]); setAntidotosAdmin([]); setGlucemia(null); setTotSize(null); setVasopresores([]);
    setLogs([]); setIsFinished(false); setShowExportModal(false); setPendingConfirm(null);
    setCompresionCount(0);
  };

  // --- UTILS ---
  const totalVolumen = useMemo(() => liquidosTotales.reduce((acc, curr) => acc + (curr.volumen || 0), 0), [liquidosTotales]);
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${((s % 60).toString().padStart(2, '0'))}`;
  const vibrate = (pattern: number | number[]) => { if (vibrationOn && navigator.vibrate) navigator.vibrate(pattern); };

  const handlePulseResult = (hasPulse: boolean) => {
    if (hasPulse) handleFinishProtocol("ROSC / RCE (Retorno de Circulación Espontánea)");
    else {
      setPulseCheckMode(false);
      addLog("PULSO NEGATIVO POST-CHEQUEO", "EVENT");
      speak("Pulso negativo. Reanude compresiones inmediatamente.");
      setIsCompressing(true);
    }
  };

  const generateReport = () => {
    return `EVOLUCIÓN MÉDICA — ACLS / SOPORTE VITAL CARDIOVASCULAR\n` +
           `═══════════════════════════════════════════════════════\n` +
           `PACIENTE: ${pacienteNombre || 'N/I'}\n` +
           `FECHA: ${new Date().toLocaleDateString()} | INICIO: ${horaInicio}\n` +
           `DURACIÓN: ${formatTime(elapsedSeconds)}\n` +
           `RITMO FINAL: ${(RITMOS as any)[ritmoActual].nombre}\n` +
           `RESULTADO: ${resultadoFinal || 'EN CURSO'}\n` +
           `───────────────────────────────────────────────────────\n\n` +
           `INTERVENCIONES:\n` +
           `• Choques Eléctricos: ${desfibrilaciones}\n` +
           `• Adrenalina: x${adrenalinas}\n` +
           `• Volumen Total: ${totalVolumen}mL\n` +
           `• Vía Aérea: ${totSize ? `TOT #${totSize}` : 'No avanzada'}\n` +
           `${vasopresores.length > 0 ? `• Vasopresores: ${vasopresores.join(', ')}\n` : ''}` +
           `\nBITÁCORA CRONOLÓGICA:\n` +
           `${[...logs].reverse().map(l => `[${l.time}] ${l.msg}`).join('\n')}`;
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (isActive && !isFinished && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        setAdrSeconds(prev => {
          const next = prev + 1;
          if (next === ADR_WINDOW_MIN) {
            speak("Evaluar adrenalina");
          }
          return next;
        });
        
        if (!pulseCheckMode && !isChecking) {
          setCycleSeconds(prev => {
            if (prev === 105) speak("Verificación de ritmo en 15 segundos");
            if (prev >= CICLO_DURACION) { 
              setIsChecking(true); 
              setIsCompressing(false); 
              speak("Alto a las compresiones. Verifique ritmo."); 
              return 0; 
            }
            return prev + 1;
          });
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, isFinished, isPaused, pulseCheckMode, isChecking, speak]);

  useEffect(() => {
    if (isActive && isCompressing && !isPaused && !isShocking && !isChecking && !isVentilating && !pulseCheckMode) {
      metronomeRef.current = setInterval(() => {
        countRef.current++;
        const currentCount = (mode === '30:2') ? ((countRef.current - 1) % 30) + 1 : countRef.current;
        setCompresionCount(currentCount); 
        
        if (voiceOn && audioCtxRef.current) {
          const ctx = audioCtxRef.current;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine'; 
          osc.frequency.setValueAtTime(currentCount === 30 && mode === '30:2' ? 1000 : 800, ctx.currentTime);
          g.gain.setValueAtTime(0.1, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(); osc.stop(ctx.currentTime + 0.06);
        }

        if (mode === '30:2' && currentCount === 30) {
          setIsVentilating(true); 
          setIsCompressing(false); 
          speak("Ventile.");
          setTimeout(() => { 
            setIsVentilating(false); 
            setIsCompressing(true); 
            countRef.current = 0; 
          }, 3500);
        }
      }, 60000 / METRONOME_BPM);
    }
    return () => { if (metronomeRef.current) clearInterval(metronomeRef.current); };
  }, [isActive, isCompressing, isPaused, isShocking, isChecking, isVentilating, mode, voiceOn, speak, pulseCheckMode]);

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center font-sans overflow-hidden p-2">
      
      {/* HEADER */}
      <header className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center mb-2 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-xl">
             <Heart size={20} className="text-red-500 animate-pulse" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-[10px] font-black uppercase text-red-500 tracking-widest leading-none">ACLS MONITOR PRO</h1>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-1 truncate max-w-[150px]">
                {pacienteNombre || 'EMERGENCIA MÉDICA'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setVoiceOn(!voiceOn)} className={`p-2 rounded-xl border transition-all ${voiceOn ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
            {voiceOn ? <Volume2 size={18}/> : <VolumeX size={18}/>}
          </button>
          <button onClick={() => setVibrationOn(!vibrationOn)} className={`p-2 rounded-xl border transition-all ${vibrationOn ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
            <RefreshCcw size={18} className={vibrationOn ? "animate-spin-slow" : ""}/>
          </button>
          {(isActive || isFinished) && (
            <button onClick={() => requestConfirmation('OFF', () => setShowFinishModal(true), "finalizar")} className={`p-2 rounded-xl border transition-all shadow-lg ${pendingConfirm === 'OFF' ? 'bg-amber-500 text-black border-amber-400 animate-pulse' : 'bg-red-600 text-white border-red-500'}`}>
              <Power size={18} />
            </button>
          )}
        </div>
      </header>

      {/* MONITOR DISPLAY */}
      <div className="w-full max-w-2xl h-48 bg-black rounded-[40px] border border-slate-800 overflow-hidden relative mb-2 shadow-inner group">
        <EcgMonitor isActive={isActive} ritmo={ritmoActual} isPaused={isPaused} isFinished={isFinished} />
        
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
           <div className="bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-2xl backdrop-blur-md shadow-lg min-w-[90px]">
              <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest block mb-0.5">Líquidos</span>
              <p className="text-lg font-black tabular-nums">{totalVolumen} <span className="text-[10px] font-medium opacity-60">mL</span></p>
           </div>
           {glucemia && (
             <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-2xl backdrop-blur-md animate-in slide-in-from-left-4 shadow-lg min-w-[90px]">
                <span className="text-[7px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">Glucemia</span>
                <p className="text-lg font-black tabular-nums">{glucemia} <span className="text-[10px] font-medium opacity-60">mg/dL</span></p>
             </div>
           )}
        </div>

        {isActive && !isFinished && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            <div className="bg-black/60 border border-slate-800 p-2.5 rounded-2xl text-right min-w-[100px] backdrop-blur-md shadow-xl border-t-slate-700">
               <p className="text-[7px] font-black text-slate-500 uppercase tracking-tight">CHEQUEO RITMO</p>
               <p className={`text-xl font-black tabular-nums ${cycleSeconds > 105 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{formatTime(120 - cycleSeconds)}</p>
            </div>
            <div className={`bg-black/60 border p-2.5 rounded-2xl text-right min-w-[100px] backdrop-blur-md transition-all shadow-xl ${adrSeconds >= ADR_WINDOW_MIN ? 'border-amber-500 border-t-amber-400' : 'border-slate-800 border-t-slate-700'}`}>
               <p className="text-[7px] font-black text-slate-500 uppercase tracking-tight">ADRENALINA</p>
               <p className={`text-xl font-black tabular-nums ${adrSeconds >= ADR_WINDOW_MAX ? 'text-red-500' : adrSeconds >= ADR_WINDOW_MIN ? 'text-amber-500' : 'text-emerald-400'}`}>{formatTime(adrSeconds)}</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 flex gap-2">
          <div className="bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-700/50 backdrop-blur-md flex items-center gap-2 shadow-xl">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">{(RITMOS as any)[ritmoActual].nombre}</span>
          </div>
          {totSize && (
            <div className="bg-indigo-600 px-3 py-2 rounded-2xl text-white text-[9px] font-black uppercase flex items-center gap-1.5 shadow-xl border border-indigo-400/30">
              <Wind size={12}/> TOT #{totSize}
            </div>
          )}
        </div>
      </div>

      {/* ACTION TABS */}
      {!isFinished && (
        <div className="w-full max-w-2xl grid grid-cols-5 gap-1.5 mb-2">
          {Object.entries(RITMOS).map(([key, info]) => (
            <button
              key={key}
              onClick={() => requestConfirmation(`R_${key}`, () => { setRitmoActual(key); addLog(`RITMO: ${info.corto}`); speak(info.nombre); }, info.corto)}
              className={`py-3 rounded-2xl text-[9px] font-black uppercase border transition-all active:scale-95 ${
                pendingConfirm === `R_${key}` ? 'bg-amber-500 border-amber-400 text-black animate-pulse' : 
                ritmoActual === key ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              {pendingConfirm === `R_${key}` ? '¿CONFIRMAR?' : info.corto}
            </button>
          ))}
        </div>
      )}

      {/* CORE ACTIONS GRID */}
      {isActive && !isChecking && !pulseCheckMode && (
        <div className="w-full max-w-2xl grid grid-cols-4 gap-2.5 mb-2">
          <button 
            onClick={() => requestConfirmation('SHOCK', handleShock, "descarga")} 
            disabled={!(RITMOS as any)[ritmoActual].desfibrilable || isShocking} 
            className={`h-16 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all shadow-xl relative overflow-hidden active:scale-95 border-b-4 ${
              pendingConfirm === 'SHOCK' ? 'bg-amber-500 border-amber-600 text-black animate-pulse' : 'bg-red-600 border-red-800 text-white disabled:opacity-20'
            }`}
          >
            {pendingConfirm === 'SHOCK' ? <span className="text-[10px] font-black uppercase">CHOQUE</span> : <><Zap size={20}/><span className="text-[9px] font-black uppercase">Descarga</span></>}
            {pendingConfirm === 'SHOCK' && <div className="absolute bottom-0 left-0 h-1.5 bg-black/40 animate-shrink-width" />}
          </button>

          <button 
            onClick={() => requestConfirmation('ADR', handleAdrenalina, "adrenalina")} 
            className={`h-16 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all shadow-xl relative overflow-hidden active:scale-95 border-b-4 ${
              pendingConfirm === 'ADR' ? 'bg-amber-500 border-amber-600 text-black animate-pulse' : 'bg-emerald-600 border-emerald-800 text-white'
            }`}
          >
            {pendingConfirm === 'ADR' ? <span className="text-[10px] font-black uppercase">ADMIN.</span> : <><Syringe size={20}/><span className="text-[9px] font-black uppercase">Adrenalina</span></>}
            {pendingConfirm === 'ADR' && <div className="absolute bottom-0 left-0 h-1.5 bg-black/40 animate-shrink-width" />}
          </button>

          <button onClick={() => setShowLiquidosModal(true)} className="h-16 bg-blue-600 border-b-4 border-blue-800 rounded-3xl flex flex-col items-center justify-center gap-1 active:scale-95 shadow-xl transition-all">
            <Droplets size={20}/> <span className="text-[9px] font-black uppercase">Fluidos</span>
          </button>

          <button onClick={() => setShowHemoderivadosModal(true)} className="h-16 bg-rose-700 border-b-4 border-rose-900 rounded-3xl flex flex-col items-center justify-center gap-1 active:scale-95 shadow-xl transition-all">
            <Biohazard size={20}/> <span className="text-[9px] font-black uppercase">Sangre</span>
          </button>
          
          <button onClick={() => setShowGlucemiaModal(true)} className="h-14 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-1 text-amber-500 active:bg-amber-500/10 active:scale-95 shadow-md">
            <Activity size={18}/> <span className="text-[8px] font-black uppercase">Glucemia</span>
          </button>

          <button onClick={() => setShowTOTModal(true)} className={`h-14 border rounded-3xl flex flex-col items-center justify-center gap-1 active:scale-95 shadow-md transition-all ${totSize ? 'bg-indigo-600 border-indigo-400 text-white border-b-4 border-indigo-800' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
            <CircleDot size={18}/> <span className="text-[8px] font-black uppercase">Vía Aérea</span>
          </button>

          <button onClick={() => setShowVasoModal(true)} className="h-14 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-1 text-purple-400 active:bg-purple-500/10 active:scale-95 shadow-md">
            <TrendingUp size={18}/> <span className="text-[8px] font-black uppercase">Soporte</span>
          </button>

          <button onClick={() => setShowH5TModal(true)} className="h-14 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-1 text-indigo-400 active:bg-indigo-500/10 active:scale-95 shadow-md">
            <ShieldAlert size={18}/> <span className="text-[8px] font-black uppercase">H's & T's</span>
          </button>
        </div>
      )}

      {/* RCP CONTROLS */}
      <div className="w-full max-w-2xl h-24 mb-2">
        {pulseCheckMode ? (
          <div className="bg-slate-900 h-full rounded-[40px] border-2 border-indigo-500 flex flex-col items-center justify-center gap-3 animate-in zoom-in-95 shadow-2xl p-4">
            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">¿RECUPERACIÓN DE PULSO?</p>
            <div className="flex gap-4 w-full h-12">
              <button onClick={() => handlePulseResult(true)} className="flex-1 bg-emerald-600 border-b-4 border-emerald-800 rounded-2xl font-black text-sm active:scale-95 transition-all">SÍ (ROSC)</button>
              <button onClick={() => handlePulseResult(false)} className="flex-1 bg-red-600 border-b-4 border-red-800 rounded-2xl font-black text-sm active:scale-95 transition-all">NO PULSO</button>
            </div>
          </div>
        ) : !isActive && !isFinished ? (
          <div className="grid grid-cols-2 gap-4 h-full">
            <button onClick={() => handleStartRCPMode('30:2')} className="bg-indigo-600 border-b-8 border-indigo-800 rounded-[40px] font-black uppercase text-2xl shadow-2xl active:translate-y-1 active:border-b-4 transition-all">MODO 30:2</button>
            <button onClick={() => handleStartRCPMode('CONTINUA')} className="bg-slate-800 border-b-8 border-slate-950 rounded-[40px] font-black uppercase text-2xl shadow-2xl active:translate-y-1 active:border-b-4 transition-all border border-slate-700">CONTINUA</button>
          </div>
        ) : isChecking ? (
          <button onClick={() => { setIsChecking(false); setIsCompressing(true); }} className="w-full h-full bg-emerald-600 border-b-8 border-emerald-800 rounded-[40px] font-black text-3xl uppercase animate-pulse shadow-2xl transition-all">REANUDAR RCP</button>
        ) : isFinished ? (
          <div className="flex gap-3 h-full">
            <button onClick={() => setShowExportModal(true)} className="flex-1 bg-indigo-600 border-b-8 border-indigo-800 rounded-[40px] font-black text-xl uppercase flex items-center justify-center gap-3 active:scale-95 shadow-2xl transition-all"><ClipboardList size={28}/> REPORTE FINAL</button>
            <button onClick={() => requestConfirmation('RESET', resetApp, "reiniciar")} className={`w-24 rounded-[40px] flex items-center justify-center shadow-2xl border-2 transition-all ${pendingConfirm === 'RESET' ? 'bg-amber-500 border-amber-400 text-black animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}><RotateCcw size={32}/></button>
          </div>
        ) : (
          <div className="bg-slate-900 h-full p-6 rounded-[40px] border border-slate-800 flex justify-between items-center relative overflow-hidden shadow-inner">
            <div className="flex items-center gap-10 pl-4">
               <div className="flex flex-col items-center">
                  <p className="text-6xl font-black tabular-nums text-indigo-400 drop-shadow-[0_0_15px_rgba(79,70,229,0.4)]">{compresionCount}</p>
                  <span className="text-[8px] font-black text-indigo-600 uppercase tracking-tighter">Compresiones</span>
               </div>
               <div className="flex flex-col border-l border-slate-800 pl-8 h-12 justify-center">
                  <span className="px-3 py-1 bg-indigo-500/10 rounded-xl text-[10px] font-black uppercase text-indigo-400 border border-indigo-500/20">{mode}</span>
                  <span className="text-sm font-black text-slate-500 mt-1 tabular-nums">{formatTime(elapsedSeconds)}</span>
               </div>
            </div>
            <button onClick={() => setIsPaused(!isPaused)} className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center border border-slate-700 active:scale-90 transition-all shadow-xl">
              {isPaused ? <Play size={32} className="text-emerald-400" /> : <Pause size={32} className="text-amber-400" />}
            </button>
            {isVentilating && (
              <div className="absolute inset-0 bg-blue-600 flex items-center justify-center animate-in fade-in z-50">
                <span className="text-3xl font-black text-white tracking-widest uppercase animate-pulse italic">¡VENTILE AHORA!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LOGS */}
      <div className="w-full max-w-2xl flex-1 bg-slate-900/50 rounded-[40px] border border-slate-800/50 overflow-hidden flex flex-col mb-2 backdrop-blur-md">
        <div className="p-4 border-b border-slate-800/80 px-8 flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
          <span className="flex items-center gap-2 tracking-widest"><Clock size={14} className="text-indigo-400"/> Historial de Eventos</span>
          <div className="flex gap-4">
            <span className="text-blue-400">💧 {totalVolumen}ml</span>
            <span className="text-red-400">⚡ {desfibrilaciones} Choques</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono text-[11px]">
          {logs.length === 0 && <div className="h-full flex items-center justify-center text-slate-700 uppercase italic font-bold tracking-widest opacity-30">Monitor Activo - Esperando Eventos</div>}
          {logs.map((l, i) => (
            <div key={i} className={`flex gap-5 border-b border-white/5 pb-3 animate-in slide-in-from-left-4 ${l.type === 'SUCCESS' ? 'bg-emerald-500/5 -mx-6 px-10' : l.type === 'ALERT' ? 'bg-amber-500/5 -mx-6 px-10' : l.type === 'SHOCK' ? 'bg-red-500/10 -mx-6 px-10 border-red-500/20' : ''}`}>
               <span className="text-indigo-400/80 font-black shrink-0">{l.time}</span>
               <span className={`font-bold uppercase tracking-tight flex-1 ${l.type === 'SUCCESS' ? 'text-emerald-400' : l.type === 'ALERT' ? 'text-amber-500' : l.type === 'SHOCK' ? 'text-red-500' : l.type === 'DOSIS' ? 'text-blue-400' : 'text-slate-300'}`}>{l.msg}</span>
               {l.type === 'SHOCK' && <Zap size={10} className="text-red-500 mt-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* GENERIC ACTION MODAL (Used for TOT, Toxins, etc) */}
      {showTOTModal && (
        <div className="fixed inset-0 z-[1500] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-700 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
                <h3 className="font-black uppercase text-sm text-emerald-400 tracking-widest flex items-center gap-3"><CircleDot size={20}/> Tubo Oro-Traqueal</h3>
                <button onClick={() => setShowTOTModal(false)} className="bg-slate-800 p-3 rounded-full hover:bg-slate-700 transition-colors"><XCircle size={24}/></button>
             </div>
             <div className="grid grid-cols-2 gap-4">
               {[6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(size => (
                 <button 
                   key={size} 
                   onClick={() => requestConfirmation(`TOT_${size}`, () => handleTOTSelect(size), `tubo número ${size}`)} 
                   className={`py-5 rounded-3xl font-black text-xl border transition-all relative overflow-hidden ${
                     pendingConfirm === `TOT_${size}` ? 'bg-amber-500 border-amber-400 text-black animate-pulse' : 
                     totSize === size ? 'bg-emerald-600 border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
                   }`}
                 >
                    {pendingConfirm === `TOT_${size}` ? '¿SÍ?' : `#${size}`}
                    {pendingConfirm === `TOT_${size}` && <div className="absolute bottom-0 left-0 h-1.5 bg-black/30 animate-shrink-width" />}
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* H5T MODAL */}
      {showH5TModal && (
        <div className="fixed inset-0 z-[1500] bg-black/95 flex flex-col items-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-950 rounded-[50px] border border-slate-800 flex flex-col h-full max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-4 font-black text-lg uppercase text-indigo-400 tracking-widest"><ShieldAlert size={24}/> Causas Reversibles</div>
              <button onClick={() => setShowH5TModal(false)} className="bg-slate-800 p-3 rounded-full hover:bg-slate-700 transition-colors"><XCircle size={28}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-16">
              <section>
                <h3 className="text-xs font-black uppercase text-emerald-400 border-l-4 border-emerald-500 pl-5 mb-6 tracking-widest">Protocolo de las "H"</h3>
                <div className="grid gap-4">
                  {[
                    { id: 'h_v', title: 'Hipovolemia', action: () => { setShowLiquidosModal(true); setShowH5TModal(false); }, icon: <Droplet size={18}/> },
                    { id: 'h_x', title: 'Hipoxia', action: () => { setShowTOTModal(true); setShowH5TModal(false); }, icon: <Wind size={18}/> },
                    { id: 'h_a', title: 'Acidosis (H+)', action: () => { setShowBicarbModal(true); setShowH5TModal(false); }, icon: <FlaskConical size={18}/> },
                    { id: 'h_k', title: 'Hipo/Hiper K+', action: () => { setShowPotassiumModal(true); setShowH5TModal(false); }, icon: <Activity size={18}/> },
                    { id: 'h_g', title: 'Hipoglucemia', action: () => { setShowGlucemiaModal(true); setShowH5TModal(false); }, icon: <Activity size={18}/> }
                  ].map(item => (
                    <button key={item.id} onClick={item.action} className="flex items-center justify-between p-6 rounded-[32px] border bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-500 transition-all active:scale-[0.98]">
                      <div className="flex items-center gap-5"><div className="p-3 rounded-2xl bg-slate-800 text-slate-400">{item.icon}</div><span className="font-black uppercase text-xs tracking-wider">{item.title}</span></div>
                      <ChevronRight size={20} className="text-slate-600" />
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-xs font-black uppercase text-rose-400 border-l-4 border-rose-500 pl-5 mb-6 tracking-widest">Protocolo de las "T"</h3>
                <div className="grid gap-4">
                  {[
                    { id: 't_n', title: 'Neumotórax a Tensión', action: () => requestConfirmation('T_N', () => handleProcedimiento("Toracocentesis"), "toracocentesis"), icon: <ArrowDownToLine size={18}/> },
                    { id: 't_p', title: 'Taponamiento Card.', action: () => requestConfirmation('T_P', () => handleProcedimiento("Pericardiocentesis"), "pericardiocentesis"), icon: <Stethoscope size={18}/> },
                    { id: 't_x', title: 'Toxinas (T.O.D)', action: () => { setShowToxinsModal(true); setShowH5TModal(false); }, icon: <Pill size={18}/> },
                    { id: 't_l', title: 'Trombosis Pulmonar', action: () => { setShowTrombolisisModal(true); setShowH5TModal(false); }, icon: <AlertTriangle size={18}/> }
                  ].map(item => (
                    <button key={item.id} onClick={item.action} className={`flex items-center justify-between p-6 rounded-[32px] border transition-all relative overflow-hidden active:scale-[0.98] ${pendingConfirm === item.id ? 'bg-amber-500 border-amber-400 text-black animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                      <div className="flex items-center gap-5"><div className="p-3 rounded-2xl bg-slate-800 text-slate-400">{item.icon}</div><span className="font-black uppercase text-xs tracking-wider">{pendingConfirm === item.id ? '¿CONFIRMAR?' : item.title}</span></div>
                      <ChevronRight size={20} className={pendingConfirm === item.id ? 'text-black' : 'text-slate-600'} />
                      {pendingConfirm === item.id && <div className="absolute bottom-0 left-0 h-1.5 bg-black/30 animate-shrink-width" />}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* NUMPAD MODAL (GLUCEMIA / VOLUMEN) */}
      {(showVolumeInputModal || showGlucemiaModal) && (
        <div className="fixed inset-0 z-[1600] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-700 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
            <h3 className={`text-center font-black uppercase mb-6 text-xs tracking-widest flex items-center justify-center gap-3 ${showGlucemiaModal ? 'text-amber-400' : 'text-blue-400'}`}>
               {showGlucemiaModal ? <Activity size={20}/> : <Droplets size={20}/>}
               {showGlucemiaModal ? 'Glucemia (mg/dL)' : `${selectedLiquidForVol?.corto} (${selectedLiquidForVol?.unidad === 'U' ? 'Unidades' : 'mL'})`}
            </h3>
            <div className={`bg-black/50 p-8 rounded-[40px] mb-8 text-center text-6xl font-black h-28 flex items-center justify-center border border-slate-800 shadow-inner ${showGlucemiaModal ? 'text-amber-500' : 'text-blue-500'}`}>
              {(showGlucemiaModal ? tempGlucemia : tempVolume) || '0'}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => showGlucemiaModal ? setTempGlucemia(v => v.length < 3 ? v + n : v) : setTempVolume(v => v.length < 4 ? v + n : v)} className="h-16 bg-slate-800 rounded-2xl font-black text-2xl active:bg-slate-700 active:scale-90 transition-all shadow-md">{n}</button>
              ))}
              <button onClick={() => showGlucemiaModal ? setTempGlucemia('') : setTempVolume('')} className="h-16 bg-red-900/20 text-red-500 rounded-2xl font-black text-xs">CLR</button>
              <button onClick={() => showGlucemiaModal ? setTempGlucemia(v => v.length < 3 ? v + '0' : v) : setTempVolume(v => v.length < 4 ? v + '0' : v)} className="h-16 bg-slate-800 rounded-2xl font-black text-2xl">0</button>
              <button 
                onClick={() => requestConfirmation('ENTRY', showGlucemiaModal ? handleConfirmGlucemia : handleAdminVolume, "dato")} 
                className={`h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all relative overflow-hidden ${pendingConfirm === 'ENTRY' ? 'bg-amber-500 text-black animate-pulse' : (showGlucemiaModal ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white')}`}
              >
                <Check size={32}/>
                {pendingConfirm === 'ENTRY' && <div className="absolute bottom-0 left-0 h-1.5 bg-black/30 animate-shrink-width" />}
              </button>
            </div>
            <button onClick={() => { setShowGlucemiaModal(false); setShowVolumeInputModal(false); }} className="w-full mt-8 text-slate-600 font-black uppercase text-[10px] tracking-widest">Cerrar</button>
          </div>
        </div>
      )}

      {/* LIQUIDS SELECTOR */}
      {showLiquidosModal && (
        <div className="fixed inset-0 z-[1500] bg-black/95 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-700 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
              <h3 className="font-black uppercase text-sm text-blue-400 tracking-widest flex items-center gap-3"><Droplets size={20}/> Cristaloides</h3>
              <button onClick={() => setShowLiquidosModal(false)} className="bg-slate-800 p-3 rounded-full"><XCircle size={24}/></button>
            </div>
            <div className="grid gap-4 max-h-[50vh] overflow-y-auto pr-2">
              {TIPOS_LIQUIDOS.map(liq => (
                <button key={liq.id} onClick={() => triggerVolumeInput(liq)} className="flex items-center justify-between p-6 rounded-[32px] border border-slate-800 bg-slate-900 hover:border-blue-500/50 transition-all active:scale-[0.98]">
                  <span className="font-black text-xs uppercase text-slate-300">{liq.nombre}</span>
                  <ChevronRight size={18} className="text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BICARBONATO MODAL (Acidosis H+) */}
      {showBicarbModal && (
        <div className="fixed inset-0 z-[1500] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-700 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="font-black uppercase text-sm text-emerald-400 tracking-widest flex items-center gap-3"><FlaskConical size={20}/> Acidosis (H+)</h3>
              <button onClick={() => setShowBicarbModal(false)} className="bg-slate-800 p-2 rounded-full"><XCircle size={22}/></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'NaHCO₃ 1 mEq/kg', desc: 'Bicarbonato de Sodio — bolo IV', cant: 1 },
                { label: 'NaHCO₃ 2 mEq/kg', desc: 'Acidosis severa (pH < 7.1)', cant: 2 },
                { label: 'NaHCO₃ Infusión', desc: '150 mEq en 1L D5W', cant: 0.5 },
              ].map(b => (
                <button key={b.label} onClick={() => { handleAdminBicarb(b.cant, b.label); }} 
                  className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-800 bg-slate-800/50 hover:border-emerald-500/30 transition-all active:scale-[0.98] text-left">
                  <div><span className="block text-xs font-black text-white">{b.label}</span><span className="block text-[10px] text-slate-400 mt-0.5">{b.desc}</span></div>
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* POTASIO MODAL (Hipo/Hiper K+) */}
      {showPotassiumModal && (
        <div className="fixed inset-0 z-[1500] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-700 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="font-black uppercase text-sm text-amber-400 tracking-widest flex items-center gap-3"><Activity size={20}/> Hipo/Hiper K+</h3>
              <button onClick={() => setShowPotassiumModal(false)} className="bg-slate-800 p-2 rounded-full"><XCircle size={22}/></button>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-4">Hipercalemia</p>
            <div className="space-y-2 mb-5">
              {[
                { label: 'Gluconato de Calcio 10%', desc: '10-20 mL IV en 2-5 min (estabiliza membrana)', id: 'ca_gluc' },
                { label: 'Insulina + Dextrosa', desc: '10U insulina + 25g dextrosa IV (shift K+)', id: 'ins_dex' },
                { label: 'NaHCO₃ 50 mEq', desc: 'Bicarbonato IV (shift K+)', id: 'bicarb_k' },
                { label: 'Salbutamol nebulizado', desc: '10-20 mg nebulizado (shift K+)', id: 'salb' },
              ].map(d => (
                <button key={d.id} onClick={() => { addLog(`K+ MANEJO: ${d.label}`, "DOSIS"); speak(`${d.label} administrado.`); setShowPotassiumModal(false); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-800/50 hover:border-amber-500/30 transition-all active:scale-[0.98] text-left">
                  <div><span className="block text-xs font-black text-white">{d.label}</span><span className="block text-[9px] text-slate-400 mt-0.5">{d.desc}</span></div>
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-3">Hipocalemia</p>
            <div className="space-y-2">
              {[
                { label: 'KCl 10 mEq/h IV', desc: 'Infusión lenta por vía central', id: 'kcl_10' },
                { label: 'KCl 20 mEq/h IV', desc: 'Hipocalemia severa (K+ < 2.5)', id: 'kcl_20' },
                { label: 'MgSO₄ 2g IV', desc: 'Sulfato de Magnesio (co-factor)', id: 'mg_k' },
              ].map(d => (
                <button key={d.id} onClick={() => { addLog(`K+ MANEJO: ${d.label}`, "DOSIS"); speak(`${d.label} administrado.`); setShowPotassiumModal(false); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-800/50 hover:border-amber-500/30 transition-all active:scale-[0.98] text-left">
                  <div><span className="block text-xs font-black text-white">{d.label}</span><span className="block text-[9px] text-slate-400 mt-0.5">{d.desc}</span></div>
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TROMBOLISIS MODAL (Trombosis Pulmonar) */}
      {showTrombolisisModal && (
        <div className="fixed inset-0 z-[1500] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-700 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="font-black uppercase text-sm text-rose-400 tracking-widest flex items-center gap-3"><AlertTriangle size={20}/> Trombosis Pulmonar</h3>
              <button onClick={() => setShowTrombolisisModal(false)} className="bg-slate-800 p-2 rounded-full"><XCircle size={22}/></button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mb-4">Trombolíticos — administrar durante RCP si se sospecha TEP masivo</p>
            <div className="space-y-3">
              {[
                { label: 'Tenecteplase (TNK)', desc: 'Bolo IV único según peso (30-50 mg)', id: 'tnk' },
                { label: 'Alteplase (tPA / Actilyse)', desc: '50 mg bolo IV + 50 mg en 60 min', id: 'tpa' },
                { label: 'Alteplase 100 mg', desc: '100 mg IV en 2 horas (protocolo estándar)', id: 'tpa100' },
                { label: 'Heparina bolo', desc: '80 UI/kg bolo IV (anticoagulación)', id: 'hep' },
              ].map(d => (
                <button key={d.id} onClick={() => { addLog(`TROMBOLISIS: ${d.label}`, "DOSIS"); speak(`${d.label} administrado.`); setShowTrombolisisModal(false); }}
                  className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-800 bg-slate-800/50 hover:border-rose-500/30 transition-all active:scale-[0.98] text-left">
                  <div><span className="block text-xs font-black text-white">{d.label}</span><span className="block text-[9px] text-slate-400 mt-0.5">{d.desc}</span></div>
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOXINAS MODAL */}
      {showToxinsModal && (
        <div className="fixed inset-0 z-[1500] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-700 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
              <h3 className="font-black uppercase text-sm text-purple-400 tracking-widest flex items-center gap-3"><Pill size={20}/> Toxinas — Antídotos</h3>
              <button onClick={() => setShowToxinsModal(false)} className="bg-slate-800 p-2 rounded-full"><XCircle size={22}/></button>
            </div>
            <div className="space-y-3">
              {ANTIDOTOS_DATA.map(a => (
                <button key={a.id} onClick={() => { addLog(`ANTÍDOTO: ${a.nombre} (${a.indicacion}) — ${a.dosis}`, "DOSIS"); speak(`${a.nombre} administrado.`); setShowToxinsModal(false); }}
                  className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-800 bg-slate-800/50 hover:border-purple-500/30 transition-all active:scale-[0.98] text-left">
                  <div><span className="block text-xs font-black text-white">{a.nombre}</span><span className="block text-[9px] text-slate-400 mt-0.5">{a.indicacion} — {a.dosis}</span></div>
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HEMODERIVADOS MODAL */}
      {showHemoderivadosModal && (
        <div className="fixed inset-0 z-[1500] bg-black/95 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-700 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
              <h3 className="font-black uppercase text-sm text-rose-400 tracking-widest flex items-center gap-3"><Droplets size={20}/> Hemoderivados</h3>
              <button onClick={() => setShowHemoderivadosModal(false)} className="bg-slate-800 p-2 rounded-full"><XCircle size={22}/></button>
            </div>
            <p className="text-[10px] text-slate-500 font-bold mb-4">Cada toque = 1 unidad administrada</p>
            <div className="space-y-3">
              {AGENTES_HEMODERIVADOS.map(h => {
                const count = liquidosTotales.filter(l => l.id === h.id).length;
                return (
                  <button key={h.id} onClick={() => {
                    const entry = { ...h, volumen: h.volPorUnidad, unidades: 1, timestamp: new Date() };
                    setLiquidosTotales(prev => [...prev, entry]);
                    addLog(`HEMO: ${h.corto} x1U (${h.volPorUnidad}mL)`, "DOSIS");
                    speak(`${h.corto}, una unidad.`);
                  }}
                    className="w-full flex items-center justify-between p-5 rounded-2xl border border-slate-800 bg-slate-800/50 hover:border-rose-500/30 transition-all active:scale-95 text-left">
                    <div>
                      <span className="block text-xs font-black text-white">{h.nombre}</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">1U = {h.volPorUnidad} mL</span>
                    </div>
                    {count > 0 ? (
                      <span className="text-sm font-black text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20">x{count}U</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600">Tocar = 1U</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FINISH MODAL */}
      {showFinishModal && (
        <div className="fixed inset-0 z-[1200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 p-10 rounded-[50px] border border-slate-800 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black uppercase mb-8 tracking-tighter">Finalizar Intervención</h3>
            <div className="space-y-4">
              <button onClick={() => handleFinishProtocol("ROSC / RCE (SUPERVIVENCIA)")} className="w-full py-6 bg-emerald-600 border-b-4 border-emerald-800 rounded-3xl font-black uppercase text-sm shadow-xl active:translate-y-1 transition-all">RETORNO A CIRCULACIÓN (ROSC)</button>
              <button onClick={() => handleFinishProtocol("CESE DE MANIOBRAS (FALLECIMIENTO)")} className="w-full py-6 bg-slate-800 border-b-4 border-slate-950 rounded-3xl font-black uppercase text-sm border border-slate-700 shadow-xl active:translate-y-1 transition-all">CESE DE MANIOBRAS</button>
              <button onClick={() => setShowFinishModal(false)} className="text-slate-500 text-[11px] font-black uppercase pt-8 block mx-auto tracking-widest hover:text-slate-300">Regresar al monitor</button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[1200] bg-black/95 flex flex-col items-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-[50px] p-8 flex flex-col h-full text-black shadow-2xl animate-in slide-in-from-bottom-12 overflow-hidden">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600"><ClipboardList size={28}/></div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Bitácora Médica</h2>
              </div>
              <button onClick={() => setShowExportModal(false)} className="bg-slate-100 p-3 rounded-full text-slate-400 hover:text-black transition-colors"><XCircle size={28} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50 border-2 border-slate-100 rounded-[40px] p-8 font-mono text-xs mb-8 shadow-inner whitespace-pre-wrap leading-relaxed text-slate-800">
              {generateReport()}
            </div>
            
            <div className="grid grid-cols-2 gap-4 shrink-0">
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generateReport())}`, '_blank')} className="h-16 bg-emerald-600 border-b-4 border-emerald-800 text-white rounded-[32px] font-black uppercase text-[12px] flex items-center justify-center gap-2 active:scale-95 shadow-lg"><MessageCircle size={20}/> WhatsApp</button>
                <button onClick={() => window.open(`https://mail.google.com/mail/?view=cm&fs=1&body=${encodeURIComponent(generateReport())}`, '_blank')} className="h-16 bg-slate-900 border-b-4 border-black text-white rounded-[32px] font-black uppercase text-[12px] flex items-center justify-center gap-2 active:scale-95 shadow-lg"><Mail size={20}/> Email</button>
            </div>
            <button onClick={() => {
                const el = document.createElement('textarea'); el.value = generateReport(); document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
                setCopied(true); setTimeout(() => setCopied(false), 2000);
            }} className="w-full mt-6 flex items-center justify-center gap-2 text-indigo-600 font-black uppercase text-[11px]">
              {copied ? <Check size={18}/> : <Copy size={18}/>} {copied ? '¡Copiado!' : 'Copiar Reporte'}
            </button>
          </div>
        </div>
      )}

      {/* DROGAS MODAL - Vasopresores & Sedoanalgesia */}
      {showVasoModal && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[32px] p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black uppercase text-sm">Soporte Farmacológico</h3>
              <button onClick={() => setShowVasoModal(false)} className="bg-slate-800 p-2 rounded-full"><XCircle size={22} className="text-slate-400" /></button>
            </div>
            
            <div className="mb-5">
              <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3">Vasopresores</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'norepinefrina', label: 'Norepinefrina', dose: '0.1-0.5 µg/kg/min' },
                  { id: 'dopamina', label: 'Dopamina', dose: '5-20 µg/kg/min' },
                  { id: 'dobutamina', label: 'Dobutamina', dose: '5-20 µg/kg/min' },
                  { id: 'vasopresina', label: 'Vasopresina', dose: '40 U bolo' },
                ].map(d => (
                  <button key={d.id} onClick={() => handleVasoSelect(d.label)}
                    className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-left active:scale-95 hover:bg-purple-500/20 transition-all">
                    <span className="block text-xs font-black text-white">{d.label}</span>
                    <span className="block text-[9px] text-purple-300 mt-0.5">{d.dose}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3">Sedoanalgesia</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'fentanilo', label: 'Fentanilo', dose: '1-2 µg/kg IV' },
                  { id: 'midazolam', label: 'Midazolam', dose: '0.05-0.1 mg/kg IV' },
                  { id: 'propofol', label: 'Propofol', dose: '1-2 mg/kg IV' },
                  { id: 'ketamina', label: 'Ketamina', dose: '1-2 mg/kg IV' },
                ].map(d => (
                  <button key={d.id} onClick={() => { addLog(`SEDO: ${d.label.toUpperCase()} - ${d.dose}`, "DOSIS"); speak(`${d.label} administrado.`); setShowVasoModal(false); }}
                    className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-left active:scale-95 hover:bg-cyan-500/20 transition-all">
                    <span className="block text-xs font-black text-white">{d.label}</span>
                    <span className="block text-[9px] text-cyan-300 mt-0.5">{d.dose}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">Medicamentos RCP</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'amiodarona', label: 'Amiodarona', dose: '300mg bolo → 150mg' },
                  { id: 'lidocaina', label: 'Lidocaína', dose: '1-1.5 mg/kg IV' },
                  { id: 'atropina', label: 'Atropina', dose: '1 mg IV c/3-5 min' },
                  { id: 'magnesio', label: 'Sulfato Mg', dose: '1-2g IV en 15 min' },
                ].map(d => (
                  <button key={d.id} onClick={() => { addLog(`MED RCP: ${d.label.toUpperCase()} - ${d.dose}`, "DOSIS"); speak(`${d.label} administrado.`); setShowVasoModal(false); }}
                    className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left active:scale-95 hover:bg-amber-500/20 transition-all">
                    <span className="block text-xs font-black text-white">{d.label}</span>
                    <span className="block text-[9px] text-amber-300 mt-0.5">{d.dose}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANIMATION STYLES */}
      <style>{`
        @keyframes shrink-width { from { width: 100%; } to { width: 0%; } }
        .animate-shrink-width { animation: shrink-width 3s linear forwards; }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>

    </div>
  );
}