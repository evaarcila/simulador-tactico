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
import { calculateIntruderTrajectory, calculateCollision, calculateAnalyticalStats } from './lib/physics';
import { Missile, Globe, Intruder } from './components/ThreeComponents';
import { cn } from './lib/utils';

export default function App() {
  const [m1X, setM1X] = useState('15 * cos(t/2)');
  const [m1Y, setM1Y] = useState('2 + 1.2 * t');
  const [m1Z, setM1Z] = useState('15 * sin(t/2)');

  const [m2X, setM2X] = useState('-15 * cos(t/2) + 10');
  const [m2Y, setM2Y] = useState('2 + 1.2 * t');
  const [m2Z, setM2Z] = useState('-15 * sin(t/2) + 10');

  const [tMax, setTMax] = useState(10.0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [impacted, setImpacted] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ x: 0, y: 0, z: 0 });

  const m1Trajectory = useMemo(() => {
    return calculateIntruderTrajectory('spiral', { x: m1X, y: m1Y, z: m1Z }, tMax);
  }, [m1X, m1Y, m1Z, tMax]);

  const m2Trajectory = useMemo(() => {
    return calculateIntruderTrajectory('spiral', { x: m2X, y: m2Y, z: m2Z }, tMax);
  }, [m2X, m2Y, m2Z, tMax]);

  const collision = useMemo(() => {
    return calculateCollision(m1Trajectory, m2Trajectory);
  }, [m1Trajectory, m2Trajectory]);

  // Using M1 stats just for UI filling
  const stats = useMemo(() => {
    return calculateAnalyticalStats([0,0,0], [10,10,10], 10);
  }, []);

  useEffect(() => {
    if (!isLaunching) return;
    const interval = setInterval(() => {
      const now = (Date.now() % 5000) / 5000;
      if (m1Trajectory.length > 0) {
        const idx = Math.floor(now * (m1Trajectory.length - 1));
        const p = m1Trajectory[idx]?.position;
        if (p) {
          setCurrentCoords({ x: p[0], y: p[1], z: p[2] });
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isLaunching, m1Trajectory]);

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

            <Globe />
            <Intruder points={m1Trajectory} isActive={isLaunching} />
            <Missile 
              points={m2Trajectory} 
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
            
            <div className="bg-[#00f2ff]/5 border border-[#1a3a4a] p-4 space-y-4">
               <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-2">MISIL 1: IDENTIFICACIÓN VECTORIAL r1(t)</span>
                  <div className="space-y-2">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#ff2200]">X1(t):</span>
                        <input value={m1X} onChange={e => setM1X(e.target.value)} className="w-full bg-black/60 border border-white/10 p-2 pl-12 font-mono text-[11px] text-[#ff2200] outline-none focus:border-[#ff2200]/50" />
                     </div>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#ff2200]">Y1(t):</span>
                        <input value={m1Y} onChange={e => setM1Y(e.target.value)} className="w-full bg-black/60 border border-white/10 p-2 pl-12 font-mono text-[11px] text-[#ff2200] outline-none focus:border-[#ff2200]/50" />
                     </div>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#ff2200]">Z1(t):</span>
                        <input value={m1Z} onChange={e => setM1Z(e.target.value)} className="w-full bg-black/60 border border-white/10 p-2 pl-12 font-mono text-[11px] text-[#ff2200] outline-none focus:border-[#ff2200]/50" />
                     </div>
                  </div>
               </div>
               
               <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest block mb-2">MISIL 2: IDENTIFICACIÓN VECTORIAL r2(t)</span>
                  <div className="space-y-2">
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#00f2ff]">X2(t):</span>
                        <input value={m2X} onChange={e => setM2X(e.target.value)} className="w-full bg-black/60 border border-white/10 p-2 pl-12 font-mono text-[11px] cyan-text outline-none focus:border-[#00f2ff]/50" />
                     </div>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#00f2ff]">Y2(t):</span>
                        <input value={m2Y} onChange={e => setM2Y(e.target.value)} className="w-full bg-black/60 border border-white/10 p-2 pl-12 font-mono text-[11px] cyan-text outline-none focus:border-[#00f2ff]/50" />
                     </div>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#00f2ff]">Z2(t):</span>
                        <input value={m2Z} onChange={e => setM2Z(e.target.value)} className="w-full bg-black/60 border border-white/10 p-2 pl-12 font-mono text-[11px] cyan-text outline-none focus:border-[#00f2ff]/50" />
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-[#00f2ff]/5 border border-[#1a3a4a] p-4 space-y-2">
               <span className="text-[9px] uppercase font-bold text-[#00f2ff] tracking-[0.2em] block mb-2">ANÁLISIS DE INTERCEPCIÓN</span>
               <div className="text-[10px] leading-relaxed">
                  <div className="flex justify-between items-center mb-1">
                     <span className="opacity-60 italic">Distancia Mínima Esperada:</span>
                     <span className="text-[#00f2ff] font-mono font-bold">{collision.distance.toFixed(4)} m</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="opacity-60 italic">Tiempo de Colisión Estimado (tc):</span>
                     <span className="text-white font-mono font-bold">{collision.time.toFixed(2)} s</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                     <span className="opacity-60 italic">Punto de Intercepción:</span>
                     <span className="text-emerald-400 font-mono font-bold">
                       {collision.position[0].toFixed(1)}, {collision.position[1].toFixed(1)}, {collision.position[2].toFixed(1)}
                     </span>
                  </div>
               </div>
            </div>

            {/* VUELO EN TIEMPO REAL */}
            <div className="grid grid-cols-2 gap-2">
               {[
                 { label: 'VECTOR_X', value: currentCoords.x.toFixed(2), icon: ChevronRight },
                 { label: 'VECTOR_Y', value: currentCoords.y.toFixed(2), icon: Activity },
                 { label: 'VECTOR_Z', value: currentCoords.z.toFixed(2), icon: Zap },
                 { label: 'T_FINAL', value: `${tMax}s`, icon: Shield }
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
                   className="bg-emerald-950/20 border border-emerald-400/50 p-4 mt-2 relative overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                    <div className="relative z-10 space-y-3">
                       <div className="flex items-center justify-center space-x-2 text-emerald-400 border-b border-emerald-500/30 pb-2">
                          <Zap className="w-4 h-4 fill-emerald-400" />
                          <span className="text-xs font-black uppercase tracking-[0.4em]">Evento de Intercepción</span>
                       </div>
                       
                       <div>
                          <span className="text-[9px] text-emerald-300 font-bold tracking-widest block mb-2 uppercase">Función Resultante r_f(t):</span>
                          <div className="space-y-1 font-mono text-[10px] bg-black/40 p-2 border border-emerald-500/20 rounded">
                             <div className="text-[#00f2ff]">X(t) = {collision.resultingFunction.x}</div>
                             <div className="text-sky-400">Y(t) = {collision.resultingFunction.y}</div>
                             <div className="text-emerald-400">Z(t) = {collision.resultingFunction.z}</div>
                          </div>
                          <p className="text-[8px] text-emerald-100/60 mt-2 leading-tight uppercase">
                            Conservación de momento lineal asumiendo masas iguales. Colisión perfectamente inelástica.
                          </p>
                       </div>
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
                {isLaunching ? "SIMULANDO TRAYECTORIAS..." : "INICIAR SIMULACIÓN"}
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
