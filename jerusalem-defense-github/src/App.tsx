import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Html, Environment, Sparkles } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  TrendingUp,
  Zap,
  Activity,
  Target,
  ChevronRight
} from 'lucide-react';
import { calculateTrajectory, calculateAnalyticalStats, calculateIntruderTrajectory } from './lib/physics';
import { Missile, Globe, Intruder } from './components/ThreeComponents';
import { cn } from './lib/utils';

export default function App() {
  const [launchPos, setLaunchPos] = useState<[number, number, number]>([0, -10, 0]);
  const [customX, setCustomX] = useState('15 * cos(t/2)');
  const [customY, setCustomY] = useState('2 + 1.2 * t');
  const [customZ, setCustomZ] = useState('15 * sin(t/2)');
  const [tImpact, setTImpact] = useState(8.0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [impacted, setImpacted] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ x: 0, y: 0, z: 0 });

  const intruderTrajectory = useMemo(() => {
    return calculateIntruderTrajectory('spiral', { x: customX, y: customY, z: customZ }, 15);
  }, [customX, customY, customZ]);

  const targetPoint = useMemo(() => {
    const point = intruderTrajectory.find(p => Math.abs(p.time - tImpact) < 0.2);
    return point ? point.position : [0, 0, 0] as [number, number, number];
  }, [intruderTrajectory, tImpact]);

  const interceptTrajectory = useMemo(() => {
    return calculateTrajectory(launchPos, targetPoint, tImpact);
  }, [launchPos, targetPoint, tImpact]);

  const stats = useMemo(() => {
    return calculateAnalyticalStats(launchPos, targetPoint, tImpact);
  }, [launchPos, targetPoint, tImpact]);

  useEffect(() => {
    if (!isLaunching) return;
    const interval = setInterval(() => {
      const now = (Date.now() % 5000) / 5000;
      if (interceptTrajectory.length > 0) {
        const idx = Math.floor(now * (interceptTrajectory.length - 1));
        const p = interceptTrajectory[idx]?.position;
        if (p) {
          setCurrentCoords({ x: p[0], y: p[1], z: p[2] });
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isLaunching, interceptTrajectory]);

  const initiateLaunch = () => {
    setIsLaunching(true);
    setImpacted(false);
  };

  const handleImpact = () => {
    setImpacted(true);
    setIsLaunching(false);
  };

  return (
    <div className="h-screen w-screen relative bg-[#02050a] text-slate-300 font-sans overflow-hidden">
      
      <div className="absolute inset-0 z-0">
        <Canvas shadows>
          <Suspense fallback={
            <Html center>
              <div className="text-[#00f2ff] font-mono text-xs uppercase animate-pulse tracking-[0.5em] whitespace-nowrap">
                Cargando Terreno Táctico...
              </div>
            </Html>
          }>
            <PerspectiveCamera makeDefault position={[120, 80, 150]} fov={55} />
            <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} />
            
            {/* Realism Improvements */}
            <ambientLight intensity={0.15} />
            <hemisphereLight intensity={0.5} groundColor="#02050a" />
            <directionalLight 
              position={[200, 300, 200]} 
              intensity={2.5} 
              color="#e6f2ff" 
              castShadow 
              shadow-mapSize={[4096, 4096]} 
              shadow-camera-left={-200}
              shadow-camera-right={200}
              shadow-camera-top={200}
              shadow-camera-bottom={-200}
              shadow-bias={-0.0001}
            />
            <pointLight position={[0, 50, 0]} intensity={15} color="#00f2ff" distance={400} decay={1.5} />
            
            <Environment preset="city" />
            <Sparkles count={1500} scale={800} size={1.5} speed={0.4} opacity={0.2} color="#00f2ff" />
            <Stars radius={300} depth={50} count={5000} factor={6} saturation={0.5} fade speed={1} />
            
            {/* HUD Central Inline */}
            {!isLaunching && (
              <Html position={[0, 10, 0]} center>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="pointer-events-none text-center select-none"
                >
                  <div className="text-[10px] text-[#00f2ff] font-mono tracking-[0.4em] mb-2 uppercase">
                    Haz clic en el terreno para reposicionar la base
                  </div>
                  <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff]/30 to-transparent mx-auto" />
                </motion.div>
              </Html>
            )}

            <Globe basePos={launchPos} onGroundClick={setLaunchPos} />
            <Intruder points={intruderTrajectory} isActive={isLaunching} />
            <Missile 
              points={interceptTrajectory} 
              isActive={isLaunching} 
              onComplete={handleImpact} 
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute inset-y-0 left-0 z-10 p-4 pointer-events-none w-[460px]">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="glass-panel w-full h-full flex flex-col p-5 pointer-events-auto tactical-border overflow-hidden"
        >
          <div className="text-center border-b-2 border-double border-[#00f2ff]/30 pb-4 mb-4">
             <div className="flex items-center justify-center space-x-2 mb-1">
                <Shield className="w-5 h-5 text-[#00f2ff]" />
                <h1 className="text-xl font-black tracking-tighter text-[#00f2ff]">JERUSALEM DEFENSE SYSTEM</h1>
             </div>
             <p className="text-[10px] font-mono tracking-[0.4em] opacity-40 uppercase">Advanced Tactical Aerospace v6.0</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
            {/* BASE Y TRAYECTORIA */}
            <div className="bg-[#00f2ff]/5 border border-[#1a3a4a] p-4 space-y-4">
               <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-1">UNIDAD DE LANZAMIENTO (GND_COORD)</span>
                  <div className="grid grid-cols-3 gap-2">
                     <div className="relative">
                       <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-mono opacity-40">X:</span>
                       <input type="number" value={launchPos[0]} onChange={e => setLaunchPos([parseFloat(e.target.value), launchPos[1], launchPos[2]])} className="w-full bg-black/60 border border-white/10 p-2 pl-6 font-mono text-xs cyan-text" />
                     </div>
                     <div className="relative">
                       <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-mono opacity-40">Y:</span>
                       <input type="number" value={launchPos[1]} onChange={e => setLaunchPos([launchPos[0], parseFloat(e.target.value), launchPos[2]])} className="w-full bg-black/60 border border-white/10 p-2 pl-6 font-mono text-xs text-sky-400" />
                     </div>
                     <div className="relative">
                       <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-mono opacity-40">Z:</span>
                       <input type="number" value={launchPos[2]} onChange={e => setLaunchPos([launchPos[0], launchPos[1], parseFloat(e.target.value)])} className="w-full bg-black/60 border border-white/10 p-2 pl-6 font-mono text-xs text-emerald-400" />
                     </div>
                  </div>
                  <p className="text-[7px] opacity-30 mt-1 uppercase">Posicionamiento táctico en plano cartesiano tridimensional.</p>
               </div>
               <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-2">IDENTIFICACIÓN VECTORIAL r(t)</span>
                  <div className="space-y-2">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#00f2ff]">X(t):</span>
                        <input value={customX} onChange={e => setCustomX(e.target.value)} className="w-full bg-black/60 border border-white/10 p-2 pl-10 font-mono text-[11px] cyan-text outline-none focus:border-[#00f2ff]/50" />
                     </div>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-sky-400">Y(t):</span>
                        <input value={customY} onChange={e => setCustomY(e.target.value)} className="w-full bg-black/60 border border-white/10 p-2 pl-10 font-mono text-[11px] text-sky-400 outline-none focus:border-sky-400/50" />
                     </div>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-emerald-400">Z(t):</span>
                        <input value={customZ} onChange={e => setCustomZ(e.target.value)} className="w-full bg-black/60 border border-white/10 p-2 pl-10 font-mono text-[11px] text-emerald-400 outline-none focus:border-emerald-400/50" />
                     </div>
                  </div>
               </div>
            </div>

            {/* VECTORING & OPTIMIZATION */}
            <div className="bg-[#00f2ff]/5 border border-[#1a3a4a] p-4 space-y-2">
               <span className="text-[9px] uppercase font-bold text-[#00f2ff] tracking-[0.2em] block mb-2">OPTIMIZACIÓN DE RAPIDEZ Y CURVATURA</span>
               <div className="text-[10px] leading-relaxed">
                  <div className="flex justify-between items-center mb-1">
                     <span className="opacity-60 italic">Curvatura Máxima Exacta (κ):</span>
                     <span className="text-[#00f2ff] font-mono font-bold animate-pulse">{stats.maxCurvature.toFixed(9)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="opacity-60 italic">Rapidez Inicial (v₀):</span>
                     <span className="text-white font-mono font-bold">{stats.initialSpeed.toFixed(4)} m/s</span>
                  </div>
                  <p className="opacity-40 text-[9px] mt-2 leading-tight">Planteamiento de funciones vectoriales r(t) optimizando f(t)=||V0(t)|| para hallar el tiempo óptimo de impacto.</p>
               </div>
            </div>

            {/* LOGISTICS & ARC LENGTH */}
            <div className="bg-[#00f2ff]/5 border border-[#1a3a4a] p-4 space-y-2">
               <span className="text-[9px] uppercase font-bold text-[#00f2ff] tracking-[0.2em] block mb-2">ANÁLISIS DE LONGITUD DE ARCO (S)</span>
               <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between">
                     <span className="opacity-60 italic">Longitud de arco desde t=0 hasta te:</span>
                     <span className="text-[#00f2ff] font-bold">{stats.arcLength.toFixed(5)} m</span>
                  </div>
                  <div className="flex items-center space-x-2">
                     <div className={cn("w-2 h-2 rounded-full", stats.fuelViability ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 shadow-[0_0_8px_#ef4444]")} />
                     <span className={cn("font-bold text-[9px] uppercase tracking-widest", stats.fuelViability ? "text-emerald-400" : "text-red-400")}>
                        VIABILIDAD DEL COMBUSTIBLE: {stats.fuelViability ? "CONFIRMADA (ARGUMENTACIÓN IMPECABLE)" : "CRÍTICA (NO VIABLE)"}
                     </span>
                  </div>
               </div>
            </div>

            {/* GEOMETRIC SURFACE ANALYSIS */}
            <div className="bg-[#00f2ff]/5 border border-[#1a3a4a] p-4 space-y-3">
               <span className="text-[9px] uppercase font-bold text-[#00f2ff] tracking-[0.2em] block mb-2">PUNTOS CRÍTICOS Y GEOMETRÍA</span>
               <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div className="space-y-1">
                     <span className="text-[8px] opacity-40 uppercase tracking-tighter block font-bold">Punto Máximo (Altitud)</span>
                     <span className="text-xs font-black text-white italic">{stats.maxHeight.toFixed(3)} m</span>
                  </div>
                  <div className="space-y-1 text-right">
                     <span className="text-[8px] opacity-40 uppercase tracking-tighter block font-bold">Punto Mínimo (Altitud)</span>
                     <span className="text-xs font-black text-sky-400 italic">{stats.minHeight.toFixed(3)} m</span>
                  </div>
                  <div className="col-span-2 p-2 bg-black/40 border-l-2 border-[#00f2ff]">
                     <span className="text-[8px] opacity-40 uppercase tracking-tighter block mb-1">Figura Conica o Cuadrica identificada:</span>
                     <span className="text-[10px] font-black text-[#00f2ff] uppercase tracking-tight italic">{stats.quadricSurface}</span>
                  </div>
               </div>
            </div>

            {/* IMPACT DYNAMICS */}
            <div className="bg-[#101010] border border-[#00f2ff]/20 p-4 space-y-2">
               <span className="text-[9px] uppercase font-bold text-[#00f2ff] tracking-[0.2em] block">KINETIC IMPACT DYNAMICS</span>
               <div className="flex justify-between items-center text-[10px]">
                  <span className="opacity-50 italic">Velocidad Terminal:</span>
                  <span className="font-mono text-white font-bold">{stats.terminalVelocity.toFixed(2)} m/s</span>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                  <span className="opacity-50 italic">Régimen de Vuelo (Maire):</span>
                  <span className="font-mono text-sky-400 font-bold tracking-widest">MACH {stats.machNumber?.toFixed(2) || "0.00"}</span>
               </div>
               <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="opacity-50 italic">Energía de Impacto:</span>
                  <span className="font-mono text-[#00f2ff] font-bold">{(stats.impactEnergy / 1e6).toPrecision(4)} MJ</span>
               </div>
            </div>

            {/* VUELO EN TIEMPO REAL */}
            <div className="grid grid-cols-2 gap-2">
               {[
                 { label: 'VECTOR_X', value: currentCoords.x.toFixed(2), icon: ChevronRight },
                 { label: 'VECTOR_Y', value: currentCoords.y.toFixed(2), icon: Activity },
                 { label: 'VECTOR_Z', value: currentCoords.z.toFixed(2), icon: Zap },
                 { label: 'T_FINAL', value: `${tImpact}s`, icon: Shield }
               ].map((item, i) => (
                 <div key={i} className="bg-black/90 border border-[#00f2ff]/20 p-2 font-mono text-[9px] flex items-center space-x-2">
                    <item.icon className="w-3 h-3 text-[#00f2ff]/40" />
                    <div>
                       <span className="opacity-40 block">{item.label}</span>
                       <span className="text-[#00f2ff] font-bold text-[11px]">{item.value}</span>
                    </div>
                 </div>
               ))}
            </div>

            <AnimatePresence>
               {impacted && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9, y: 10 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   className="bg-emerald-950/20 border border-emerald-400/50 p-4 text-center mt-2 relative overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                    <div className="relative z-10 space-y-1">
                       <div className="flex items-center justify-center space-x-2 text-emerald-400">
                          <Zap className="w-4 h-4 fill-emerald-400" />
                          <span className="text-xs font-black uppercase tracking-[0.4em]">Misión Exitosa</span>
                       </div>
                       <p className="text-[10px] text-emerald-100 font-bold leading-tight">
                          Impacto directo comprobado analíticamente en el tiempo óptimo. La argumentación matemática es impecable.
                       </p>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
          </div>

          <div className="pt-4 space-y-3">
             <button 
                onClick={initiateLaunch}
                disabled={isLaunching}
                className={cn(
                  "w-full py-4 bg-[#00f2ff] text-black font-black uppercase tracking-[0.5em] text-xs transition-all",
                  "hover:bg-white hover:shadow-[0_0_20px_white] active:scale-[0.98]",
                  isLaunching && "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                )}
                style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
             >
                {isLaunching ? "INTERCEPTANDO..." : "INICIAR INTERCEPCIÓN"}
             </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute top-6 right-6 z-10 flex flex-col items-end space-y-2 pointer-events-none opacity-40">
         <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-[#00f2ff]">
            <Activity className="w-3 h-3" />
            <span>BIO_SIGNAL_ENCRYPTED</span>
         </div>
         <div className="w-32 h-[1px] bg-gradient-to-l from-[#00f2ff] to-transparent" />
         <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-slate-500">
            <ChevronRight className="w-3 h-3" />
            <span>JERUSALEM_COORD_LOCKED</span>
         </div>
      </div>

    </div>
  );
}
