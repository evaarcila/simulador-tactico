import React, { useState, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Play, Pause, RotateCcw, Square, Box, Layers, ArrowUp, Activity } from 'lucide-react';
import { calculateCustomTrajectory, calculateCollision } from './lib/physics';
import { Missile, RealisticTerrain, HtmlLabels } from './components/ThreeComponents';

const parseVec = (s: string) => s.split(',').map(n => parseFloat(n) || 0) as [number, number, number];
const formatVec = (v: [number, number, number]) => v.map(n => n.toFixed(2)).join(', ');

export default function App() {
  // Missile 1 (Red) State
  const [m1P, setM1P] = useState("0.00, 0.00, 0.00");
  const [m1V, setM1V] = useState("1.20, 0.80, 0.90");
  const [m1A, setM1A] = useState("-0.015, -0.020, -0.018");

  // Missile 2 (Blue) State
  const [m2P, setM2P] = useState("150.00, -20.00, 0.00");
  const [m2V, setM2V] = useState("-1.10, 0.70, 0.85");
  const [m2A, setM2A] = useState("0.012, -0.018, -0.017");

  const [tMax, setTMax] = useState(38.45);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  // Compute trajectories
  const m1Traj = useMemo(() => calculateCustomTrajectory(parseVec(m1P), parseVec(m1V), parseVec(m1A), tMax), [m1P, m1V, m1A, tMax]);
  const m2Traj = useMemo(() => calculateCustomTrajectory(parseVec(m2P), parseVec(m2V), parseVec(m2A), tMax), [m2P, m2V, m2A, tMax]);

  const collision = useMemo(() => calculateCollision(m1Traj, m2Traj), [m1Traj, m2Traj]);

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

  return (
    <div className="app-grid bg-[#020610] text-[#e2e8f0] font-sans selection:bg-[#00f2ff]/30">
      {/* HEADER */}
      <header className="expert-header flex items-center justify-between px-6">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-white">SIMULADOR EXPERTO - INTERCEPCIÓN DE MISILES</h1>
          <span className="text-emerald-400 text-xs font-bold tracking-widest">MODO: SIMULACIÓN 3D</span>
        </div>
        <div className="flex flex-col items-center justify-center border border-emerald-500/30 rounded px-8 py-1 bg-emerald-500/10">
          <span className="text-[10px] text-emerald-400 font-bold tracking-widest">SIMULACIÓN EN CURSO</span>
          <span className="text-white font-mono text-sm">TIEMPO: 00:00:{time.toFixed(3).padStart(6, '0')}</span>
        </div>
        <div className="flex space-x-4 text-slate-400">
           <Pause size={18} className="cursor-pointer hover:text-white" onClick={() => setIsRunning(!isRunning)} />
           <RotateCcw size={18} className="cursor-pointer hover:text-white" onClick={() => { setTime(0); setIsRunning(true); }} />
        </div>
      </header>

      {/* VIEWPORT */}
      <main className="expert-viewport bg-sky-900/20">
        <div className="absolute top-4 left-4 z-10 bg-[#020610]/80 border border-[#1a3a4a] p-4 rounded text-xs w-64 shadow-xl backdrop-blur-md">
           <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-3 border-b border-[#1a3a4a] pb-2">LEYENDA</h3>
           <div className="space-y-3">
              <div className="flex items-center space-x-3"><div className="w-6 h-[2px] bg-[#ff2200]"></div><span>MISIL 1 (ROJO)</span></div>
              <div className="flex items-center space-x-3"><div className="w-6 h-[2px] bg-[#0077ff]"></div><span>MISIL 2 (AZUL)</span></div>
              <div className="flex items-center space-x-3"><div className="w-6 h-[2px] border-b-2 border-dashed border-slate-400"></div><span>TRAYECTORIA</span></div>
              <div className="flex items-center space-x-3"><div className="w-3 h-3 rounded-full bg-yellow-400 ml-1.5"></div><span className="ml-1.5">PUNTO DE INTERCEPCIÓN</span></div>
           </div>
        </div>

        <Canvas camera={{ position: [0, 40, 180], fov: 45 }}>
          <color attach="background" args={['#4a7b9d']} />
          <Environment preset="sunset" />
          <ambientLight intensity={1.5} />
          <directionalLight position={[100, 100, 50]} intensity={2} castShadow />
          
          <RealisticTerrain />
          <HtmlLabels p1={parseVec(m1P)} p2={parseVec(m2P)} target={collision.position} time={time} tMax={tMax} />

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
               <div className="flex items-center text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-400 mr-3"></div> GUÍA: ACTIVA</div>
               <div className="flex items-center text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-400 mr-3"></div> INTERCEPCIÓN: EXITOSA</div>
            </div>
         </div>

         <div>
            <h3 className="text-[10px] uppercase font-bold text-[#00aaff] tracking-widest mb-4">VISTA</h3>
            <div className="grid grid-cols-4 gap-2">
               <button className="flex flex-col items-center justify-center border border-[#00f2ff]/50 bg-[#00f2ff]/10 p-2 rounded text-[#00f2ff]"><Box size={16} className="mb-1"/><span className="text-[9px]">3D</span></button>
               <button className="flex flex-col items-center justify-center border border-[#1a3a4a] p-2 rounded text-slate-400 hover:border-slate-500"><Activity size={16} className="mb-1"/><span className="text-[9px]">2D</span></button>
               <button className="flex flex-col items-center justify-center border border-[#1a3a4a] p-2 rounded text-slate-400 hover:border-slate-500"><ArrowUp size={16} className="mb-1"/><span className="text-[9px]">TOP</span></button>
               <button className="flex flex-col items-center justify-center border border-[#1a3a4a] p-2 rounded text-slate-400 hover:border-slate-500"><RotateCcw size={16} className="mb-1"/><span className="text-[9px]">ÓRBITA</span></button>
            </div>
         </div>

         <div>
            <h3 className="text-[10px] uppercase font-bold text-[#00aaff] tracking-widest mb-4">PARÁMETROS DE VISUALIZACIÓN</h3>
            <div className="space-y-3 text-slate-300">
               <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" defaultChecked className="accent-[#00f2ff]" /> <span>TRAYECTORIAS</span></label>
               <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" defaultChecked className="accent-[#00f2ff]" /> <span>POSICIONES INICIALES</span></label>
               <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" defaultChecked className="accent-[#00f2ff]" /> <span>PUNTO DE INTERCEPCIÓN</span></label>
               <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" className="accent-[#00f2ff]" /> <span>CUADRÍCULA</span></label>
            </div>
         </div>

         <div>
            <h3 className="text-[10px] uppercase font-bold text-[#00aaff] tracking-widest mb-4">CONTROLES DE SIMULACIÓN</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
               <button onClick={() => setIsRunning(!isRunning)} className="flex items-center justify-center border border-[#1a3a4a] p-2 rounded hover:bg-white/5"><Pause size={14} className="mr-2"/> PAUSAR</button>
               <button onClick={() => { setTime(0); setIsRunning(true); }} className="flex items-center justify-center border border-[#1a3a4a] p-2 rounded hover:bg-white/5"><RotateCcw size={14} className="mr-2"/> REINICIAR</button>
            </div>
            <button onClick={() => { setTime(tMax); setIsRunning(false); }} className="w-full flex items-center justify-center border border-red-500/50 bg-red-500/10 text-red-400 p-2 rounded hover:bg-red-500/20">
               <Square size={14} className="mr-2" fill="currentColor"/> DETENER SIMULACIÓN
            </button>
         </div>
      </aside>

      {/* FOOTER DATA TABLE */}
      <footer className="expert-footer flex flex-col font-mono text-[10px]">
        <div className="px-4 py-2 border-b border-[#1a3a4a] text-[#8da4b8] uppercase tracking-widest text-[9px] font-sans font-bold">BARRA DE TAREAS - DATOS DE TRAYECTORIAS</div>
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
              <th className="bg-red-950/10 text-red-400/70">FUNCIÓN FINAL</th>
              <th className="bg-blue-950/20 text-[#0077ff]/70">FUNCIÓN INICIAL</th>
              <th className="bg-blue-950/10 text-[#0077ff]/70">FUNCIÓN FINAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-left pl-4">POSICIÓN (x, y, z) km</td>
              <td>(<input value={m1P} onChange={e=>setM1P(e.target.value)} className="editable-input w-24"/>)</td>
              <td>({formatVec(m1Traj[m1Traj.length-1]?.position || [0,0,0])})</td>
              <td>r⃗(t) = r⃗₀ + v⃗₀t + ½a⃗t²</td>
              <td>(<input value={m2P} onChange={e=>setM2P(e.target.value)} className="editable-input w-24"/>)</td>
              <td>({formatVec(m2Traj[m2Traj.length-1]?.position || [0,0,0])})</td>
            </tr>
            <tr>
              <td className="text-left pl-4">VELOCIDAD (vx, vy, vz) km/s</td>
              <td>(<input value={m1V} onChange={e=>setM1V(e.target.value)} className="editable-input w-24"/>)</td>
              <td>({formatVec(m1Traj[m1Traj.length-1]?.velocityVector || [0,0,0])})</td>
              <td>v⃗(t) = v⃗₀ + a⃗t</td>
              <td>(<input value={m2V} onChange={e=>setM2V(e.target.value)} className="editable-input w-24"/>)</td>
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
              <td className="text-left pl-4">POSICIÓN FINAL (INTERCEPCIÓN)</td>
              <td className="text-slate-500">—</td>
              <td className="bg-red-950/40 text-red-400">({formatVec(m1Traj[m1Traj.length-1]?.position || [0,0,0])}) km</td>
              <td>Intersección: r⃗₁(t) = r⃗₂(t)</td>
              <td className="text-slate-500">—</td>
              <td className="bg-blue-950/40 text-[#0077ff]">({formatVec(m2Traj[m2Traj.length-1]?.position || [0,0,0])}) km</td>
            </tr>
          </tbody>
        </table>
      </footer>
    </div>
  );
}
