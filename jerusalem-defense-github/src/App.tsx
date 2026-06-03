import React, { useState, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Play, Pause, RotateCcw, Square, Box, Activity, ArrowUp, MapPin, Target, Crosshair, Rocket } from 'lucide-react';
import { calculateCustomTrajectory, calculateCollision, calculateInitialVelocity, formatVector } from './lib/physics';
import { Missile, RealisticTerrain, HtmlLabels } from './components/ThreeComponents';

const parseVec = (s: string) => s.split(',').map(n => parseFloat(n) || 0) as [number, number, number];

export default function App() {
  const [mode, setMode] = useState<'NONE' | 'M1' | 'M2' | 'TARGET'>('NONE');
  
  const [targetP, setTargetP] = useState("48.72, 36.15, 15.23");
  
  const [m1P, setM1P] = useState("0.00, 0.00, 0.00");
  const [m1A, setM1A] = useState("-0.015, -0.020, -0.018");

  const [m2P, setM2P] = useState("150.00, -20.00, 0.00");
  const [m2A, setM2A] = useState("0.012, -0.018, -0.017");

  const [tMax, setTMax] = useState(38.45);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Auto-calculated Initial Velocities based on target intersection
  const m1V = useMemo(() => formatVector(calculateInitialVelocity(parseVec(m1P), parseVec(targetP), parseVec(m1A), tMax)).replace(/[⟨⟩]/g, ''), [m1P, targetP, m1A, tMax]);
  const m2V = useMemo(() => formatVector(calculateInitialVelocity(parseVec(m2P), parseVec(targetP), parseVec(m2A), tMax)).replace(/[⟨⟩]/g, ''), [m2P, targetP, m2A, tMax]);

  const m1Traj = useMemo(() => calculateCustomTrajectory(parseVec(m1P), parseVec(m1V), parseVec(m1A), tMax), [m1P, m1V, m1A, tMax]);
  const m2Traj = useMemo(() => calculateCustomTrajectory(parseVec(m2P), parseVec(m2V), parseVec(m2A), tMax), [m2P, m2V, m2A, tMax]);

  const collision = useMemo(() => calculateCollision(m1Traj, m2Traj), [m1Traj, m2Traj]);

  const handleMapClick = (pos: [number, number, number]) => {
    const formatted = `${pos[0].toFixed(2)}, ${pos[1].toFixed(2)}, ${pos[2].toFixed(2)}`;
    if (mode === 'M1') setM1P(formatted);
    if (mode === 'M2') setM2P(formatted);
    if (mode === 'TARGET') setTargetP(formatted);
    setMode('NONE');
  };

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTime(t => {
        if (t >= tMax) {
          setIsRunning(false);
          return tMax;
        }
        return t + 0.1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isRunning, tMax]);

  // Formatter for vector equation
  const getEq = (p: string, v: string, a: string) => {
     const pos = parseVec(p);
     const vel = parseVec(v);
     const acc = parseVec(a);
     return `⟨ ${pos[0].toFixed(1)}${vel[0]>=0?'+':''}${vel[0].toFixed(2)}t${acc[0]>=0?'+':''}${(0.5*acc[0]).toFixed(3)}t², ${pos[1].toFixed(1)}${vel[1]>=0?'+':''}${vel[1].toFixed(2)}t${acc[1]>=0?'+':''}${(0.5*acc[1]).toFixed(3)}t², ${pos[2].toFixed(1)}${vel[2]>=0?'+':''}${vel[2].toFixed(2)}t${acc[2]>=0?'+':''}${(0.5*acc[2]).toFixed(3)}t² ⟩`;
  };

  const getFinalEq = (traj: any) => {
     if(!traj || traj.length === 0) return '';
     const last = traj[traj.length-1];
     const p = last.position;
     const v = last.velocityVector;
     return `⟨ ${p[0].toFixed(2)}${v[0]>=0?'+':''}${v[0].toFixed(2)}(t-tc), ${p[1].toFixed(2)}${v[1]>=0?'+':''}${v[1].toFixed(2)}(t-tc), ${p[2].toFixed(2)}${v[2]>=0?'+':''}${v[2].toFixed(2)}(t-tc) ⟩`;
  };

  const currentM1Pos = m1Traj[Math.min(Math.floor((time/tMax)*(m1Traj.length-1)), m1Traj.length-1)]?.position || [0,0,0];
  const currentM2Pos = m2Traj[Math.min(Math.floor((time/tMax)*(m2Traj.length-1)), m2Traj.length-1)]?.position || [0,0,0];

  return (
    <div className="app-grid bg-[#020610] text-[#e2e8f0] font-sans selection:bg-[#00f2ff]/30">
      {/* HEADER */}
      <header className="expert-header flex items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white">SIMULADOR EXPERTO - INTERCEPCIÓN DE MISILES</h1>
          <span className="text-emerald-400 text-xs font-bold tracking-widest">MODO: SIMULACIÓN 3D</span>
        </div>
        <div className="flex flex-col items-center justify-center border border-emerald-500/30 rounded px-8 py-1 bg-emerald-500/10">
          <span className="text-[10px] text-emerald-400 font-bold tracking-widest">{isRunning ? "SIMULACIÓN EN CURSO" : time >= tMax ? "INTERCEPCIÓN COMPLETADA" : "SISTEMA EN ESPERA"}</span>
          <span className="text-white font-mono text-sm">TIEMPO: 00:00:{time.toFixed(3).padStart(6, '0')}</span>
        </div>
        <div className="flex space-x-4 text-slate-400">
           <Pause size={18} className="cursor-pointer hover:text-white" onClick={() => setIsRunning(!isRunning)} />
           <RotateCcw size={18} className="cursor-pointer hover:text-white" onClick={() => { setTime(0); setIsRunning(false); }} />
        </div>
      </header>

      {/* VIEWPORT */}
      <main className="expert-viewport bg-sky-900/20">
        <div className="absolute top-4 left-4 z-10 space-y-4">
          <div className="bg-[#020610]/80 border border-[#1a3a4a] p-4 rounded text-xs w-64 shadow-xl backdrop-blur-md">
             <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3 border-b border-[#1a3a4a] pb-2">LEYENDA</h3>
             <div className="space-y-3">
                <div className="flex items-center space-x-3"><div className="w-6 h-[2px] bg-[#ff2200]"></div><span>MISIL 1 (ROJO)</span></div>
                <div className="flex items-center space-x-3"><div className="w-6 h-[2px] bg-[#0077ff]"></div><span>MISIL 2 (AZUL)</span></div>
                <div className="flex items-center space-x-3"><div className="w-6 h-[2px] border-b-2 border-dashed border-slate-400"></div><span>TRAYECTORIA</span></div>
                <div className="flex items-center space-x-3"><div className="w-3 h-3 rounded-full bg-yellow-400 ml-1.5"></div><span className="ml-1.5">PUNTO DE INTERCEPCIÓN</span></div>
             </div>
          </div>
          
          {/* MATH VECTOR PANEL */}
          <div className="bg-[#020610]/80 border border-[#1a3a4a] p-4 rounded text-xs w-[340px] shadow-xl backdrop-blur-md">
             <h3 className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest mb-3 border-b border-[#1a3a4a] pb-2">ANÁLISIS VECTORIAL EN TIEMPO REAL</h3>
             <div className="space-y-4">
                <div>
                   <span className="text-[9px] text-[#ff2200] font-bold block mb-1">r₁(t) - MISIL 1</span>
                   <div className="font-mono text-[9px] text-slate-300 break-all">{getEq(m1P, m1V, m1A)}</div>
                   <div className="font-mono text-[9px] text-white mt-1 border-t border-white/10 pt-1">
                      P(t={time.toFixed(1)}): ⟨{currentM1Pos.map(n=>n.toFixed(1)).join(', ')}⟩
                   </div>
                </div>
                <div>
                   <span className="text-[9px] text-[#0077ff] font-bold block mb-1">r₂(t) - MISIL 2</span>
                   <div className="font-mono text-[9px] text-slate-300 break-all">{getEq(m2P, m2V, m2A)}</div>
                   <div className="font-mono text-[9px] text-white mt-1 border-t border-white/10 pt-1">
                      P(t={time.toFixed(1)}): ⟨{currentM2Pos.map(n=>n.toFixed(1)).join(', ')}⟩
                   </div>
                </div>
             </div>
          </div>
        </div>

        {mode !== 'NONE' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-emerald-500 text-white font-bold px-6 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse flex items-center">
            <MapPin size={16} className="mr-2" /> HAZ CLIC EN EL TERRENO PARA FIJAR LA POSICIÓN
          </div>
        )}

        <Canvas camera={{ position: [0, 40, 180], fov: 45 }} style={{ cursor: mode !== 'NONE' ? 'crosshair' : 'default' }}>
          <color attach="background" args={['#4a7b9d']} />
          <Environment preset="sunset" />
          <ambientLight intensity={1.5} />
          <directionalLight position={[100, 100, 50]} intensity={2} castShadow />
          
          <RealisticTerrain onGroundClick={handleMapClick} />
          <HtmlLabels p1={parseVec(m1P)} p2={parseVec(m2P)} target={parseVec(targetP)} time={time} tMax={tMax} />

          <Missile points={m1Traj} currentTime={time} tMax={tMax} color="#ff2200" isDashed />
          <Missile points={m2Traj} currentTime={time} tMax={tMax} color="#0077ff" isDashed />

          <OrbitControls 
            enableDamping 
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={20}
            maxDistance={500}
            target={[50, 20, 0]}
          />
        </Canvas>
      </main>

      {/* SIDEBAR */}
      <aside className="expert-sidebar p-5 space-y-8 overflow-y-auto custom-scrollbar text-xs">
         <div>
            <h3 className="text-[10px] uppercase font-bold text-[#00aaff] tracking-widest mb-4">ESTADO DE LA SIMULACIÓN</h3>
            <div className="space-y-3 font-mono">
               <div className="flex items-center text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-400 mr-3"></div> SISTEMA: ACTIVO</div>
               <div className="flex items-center text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-400 mr-3"></div> SENSORES: OPERATIVOS</div>
               <div className="flex items-center text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-400 mr-3"></div> GUÍA: AUTOCALCULADA</div>
               <div className="flex items-center text-emerald-400"><div className={`w-2 h-2 rounded-full mr-3 ${time >= tMax ? 'bg-emerald-400' : 'bg-slate-600'}`}></div> {time >= tMax ? 'INTERCEPCIÓN: EXITOSA' : 'INTERCEPCIÓN: PENDIENTE'}</div>
            </div>
         </div>

         <div>
            <h3 className="text-[10px] uppercase font-bold text-[#00aaff] tracking-widest mb-4">VISTA Y MAPA</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
               <button className="flex flex-col items-center justify-center border border-[#00f2ff]/50 bg-[#00f2ff]/10 p-2 rounded text-[#00f2ff]"><Box size={16} className="mb-1"/><span className="text-[9px]">3D</span></button>
               <button className="flex flex-col items-center justify-center border border-[#1a3a4a] p-2 rounded text-slate-400 hover:border-slate-500"><Activity size={16} className="mb-1"/><span className="text-[9px]">2D</span></button>
               <button className="flex flex-col items-center justify-center border border-[#1a3a4a] p-2 rounded text-slate-400 hover:border-slate-500"><ArrowUp size={16} className="mb-1"/><span className="text-[9px]">TOP</span></button>
               <button className="flex flex-col items-center justify-center border border-[#1a3a4a] p-2 rounded text-slate-400 hover:border-slate-500"><RotateCcw size={16} className="mb-1"/><span className="text-[9px]">ÓRBITA</span></button>
            </div>
            
            <div className="space-y-2 mt-4">
               <button onClick={() => setMode('M1')} className={`w-full flex items-center justify-start border p-2 rounded text-[10px] transition-colors ${mode === 'M1' ? 'bg-[#ff2200] border-[#ff2200] text-white' : 'border-[#1a3a4a] text-[#ff2200] hover:bg-[#ff2200]/10'}`}><MapPin size={12} className="mr-2"/> FIJAR POSICIÓN M1</button>
               <button onClick={() => setMode('M2')} className={`w-full flex items-center justify-start border p-2 rounded text-[10px] transition-colors ${mode === 'M2' ? 'bg-[#0077ff] border-[#0077ff] text-white' : 'border-[#1a3a4a] text-[#0077ff] hover:bg-[#0077ff]/10'}`}><MapPin size={12} className="mr-2"/> FIJAR POSICIÓN M2</button>
               <button onClick={() => setMode('TARGET')} className={`w-full flex items-center justify-start border p-2 rounded text-[10px] transition-colors ${mode === 'TARGET' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#1a3a4a] text-emerald-400 hover:bg-emerald-500/10'}`}><Target size={12} className="mr-2"/> FIJAR OBJETIVO (TARGET)</button>
            </div>
         </div>

         <div>
            <h3 className="text-[10px] uppercase font-bold text-[#00aaff] tracking-widest mb-4">CONTROLES DE SIMULACIÓN</h3>
            <button onClick={() => { setTime(0); setIsRunning(true); setMode('NONE'); }} className="w-full flex items-center justify-center bg-red-600 text-white font-bold tracking-widest p-3 rounded hover:bg-red-500 mb-2 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
               <Rocket size={16} className="mr-2"/> LANZAR MISILES
            </button>
            <div className="grid grid-cols-2 gap-2 mb-2">
               <button onClick={() => setIsRunning(!isRunning)} className="flex items-center justify-center border border-[#1a3a4a] p-2 rounded hover:bg-white/5"><Pause size={14} className="mr-2"/> PAUSAR</button>
               <button onClick={() => { setTime(0); setIsRunning(false); }} className="flex items-center justify-center border border-[#1a3a4a] p-2 rounded hover:bg-white/5"><RotateCcw size={14} className="mr-2"/> REINICIAR</button>
            </div>
         </div>
      </aside>

      {/* FOOTER DATA TABLE */}
      <footer className="expert-footer flex flex-col font-mono text-[10px]">
        <div className="px-4 py-2 border-b border-[#1a3a4a] text-[#8da4b8] uppercase tracking-widest text-[9px] font-sans font-bold flex justify-between">
           <span>BARRA DE TAREAS - DATOS DE TRAYECTORIAS</span>
           <span className="text-emerald-400">*VELOCIDADES AUTOCALCULADAS POR EL SISTEMA AUTOGUÍA</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th rowSpan={2} className="w-48 text-left pl-4 border-r border-[#1a3a4a]">PARÁMETRO</th>
              <th colSpan={2} className="border-b border-[#1a3a4a] bg-red-950/30 text-red-400">MISIL 1 (ROJO)</th>
              <th rowSpan={2} className="border-l border-r border-[#1a3a4a]">FUNCIÓN DE TRAYECTORIA</th>
              <th colSpan={2} className="border-b border-[#1a3a4a] bg-blue-950/30 text-[#0077ff]">MISIL 2 (AZUL)</th>
            </tr>
            <tr>
              <th className="bg-red-950/20 text-red-400/70">FUNCIÓN INICIAL</th>
              <th className="bg-red-950/10 text-red-400/70">FUNCIÓN FINAL (INTERCEPTO)</th>
              <th className="bg-blue-950/20 text-[#0077ff]/70">FUNCIÓN INICIAL</th>
              <th className="bg-blue-950/10 text-[#0077ff]/70">FUNCIÓN FINAL (INTERCEPTO)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-left pl-4">POSICIÓN (x, y, z) km</td>
              <td>(<input value={m1P} onChange={e=>setM1P(e.target.value)} className="editable-input w-24"/>)</td>
              <td className="text-slate-400 text-[9px] px-2">{getFinalEq(m1Traj)}</td>
              <td>r⃗(t) = r⃗₀ + v⃗₀t + ½a⃗t²</td>
              <td>(<input value={m2P} onChange={e=>setM2P(e.target.value)} className="editable-input w-24"/>)</td>
              <td className="text-slate-400 text-[9px] px-2">{getFinalEq(m2Traj)}</td>
            </tr>
            <tr>
              <td className="text-left pl-4">VELOCIDAD (vx, vy, vz) km/s</td>
              <td className="text-slate-400">({m1V})</td>
              <td>({formatVec(m1Traj[m1Traj.length-1]?.velocityVector || [0,0,0])})</td>
              <td>v⃗(t) = v⃗₀ + a⃗t</td>
              <td className="text-slate-400">({m2V})</td>
              <td>({formatVec(m2Traj[m2Traj.length-1]?.velocityVector || [0,0,0])})</td>
            </tr>
            <tr>
              <td className="text-left pl-4">ACELERACIÓN (ax, ay, az) km/s²</td>
              <td>(<input value={m1A} onChange={e=>setM1A(e.target.value)} className="editable-input w-32"/>)</td>
              <td>({formatVec(parseVec(m1A))})</td>
              <td>a⃗(t) = (aₓ, aᵧ, aₖ) (cte.)</td>
              <td>(<input value={m2A} onChange={e=>setM2A(e.target.value)} className="editable-input w-32"/>)</td>
              <td>({formatVec(parseVec(m2A))})</td>
            </tr>
            <tr>
              <td className="text-left pl-4">TIEMPO DE VUELO (s)</td>
              <td>0.00</td>
              <td><input type="number" value={tMax} onChange={e=>setTMax(Number(e.target.value))} className="editable-input w-16"/></td>
              <td></td>
              <td>0.00</td>
              <td>{tMax.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="text-left pl-4">POSICIÓN FINAL / OBJETIVO</td>
              <td className="text-slate-500">—</td>
              <td className="bg-red-950/40 text-red-400">({targetP}) km</td>
              <td>Intersección: r⃗₁(tc) = r⃗₂(tc)</td>
              <td className="text-slate-500">—</td>
              <td className="bg-blue-950/40 text-[#0077ff]">({targetP}) km</td>
            </tr>
          </tbody>
        </table>
      </footer>
    </div>
  );
}
