/**
 * Professional Physics and Vector Math utilities
 * Implements r(t), v(t), a(t), curvature κ(t), and analytical arc length S.
 */
import { evaluate } from 'mathjs';

export interface TrajectoryPoint {
  position: [number, number, number];
  velocity: number;
  curvature: number;
  time: number;
}

export interface MissionStats {
  maxCurvature: number;
  maxCurvatureTime: number;
  arcLength: number;
  maxSpeed: number;
  minSpeed: number;
  terminalVelocity: number;
  impactEnergy: number;
  machNumber: number;
  initialSpeed: number;
  fuelViability: boolean;
  optimalTime: number;
  minHeight: number;
  maxHeight: number;
  quadricSurface: string;
}

/**
 * Calculates intruder trajectory based on a selected pattern or custom functions
 */
export const calculateIntruderTrajectory = (
  type: 'ref' | 'spiral' | 'low' | 'parabolic',
  customFuncs?: { x: string; y: string; z: string },
  t_max: number = 10
): TrajectoryPoint[] => {
  const points: TrajectoryPoint[] = [];
  const steps = 100;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * t_max;
    let x, y, z;

        if (customFuncs) {
      try {
        x = evaluate(customFuncs.x, { t });
        y = evaluate(customFuncs.y, { t });
        z = evaluate(customFuncs.z, { t });
      } catch (e) {
        // Fallback to a controlled spiral if custom equation fails
        x = 15 * Math.cos(t / 2);
        y = 2 + 1.2 * t;
        z = 15 * Math.sin(t / 2);
      }
    } else {
      switch (type) {
        case 'spiral':
          x = 15 * Math.cos(t * 0.5);
          y = 2 + 1.2 * t;
          z = 15 * Math.sin(t * 0.5);
          break;
        case 'low':
          x = -30 + 10 * t;
          y = 5 + Math.sin(t) * 2;
          z = 15;
          break;
        case 'parabolic':
          x = -40 + 8 * t;
          y = 30 - 1.2 * Math.pow(t - 5, 2);
          z = -40 + 8 * t;
          break;
        case 'ref':
        default:
          // Default matching the user's requested formula
          x = 15 * Math.cos(t / 2);
          y = 2 + 1.2 * t;
          z = 15 * Math.sin(t / 2);
          break;
      }
    }

    points.push({
      position: [x, y, z],
      velocity: 0,
      curvature: 0,
      time: t
    });
  }
  return points;
};

/**
 * Detects if the current trajectory fits a standard quadric surface
 */
export const analyzeTrajectoryQuadric = (points: TrajectoryPoint[]): string => {
  if (points.length < 5) return "ANALIZANDO...";
  
  // Check Cylinder x^2 + z^2 = R^2
  const sampleIndices = [0, points.length / 2 | 0, points.length - 1];
  const radiusChecks = sampleIndices.map(idx => {
    const [x, , z] = points[idx].position;
    return Math.sqrt(x*x + z*z);
  });
  const avgR = radiusChecks.reduce((a, b) => a + b, 0) / radiusChecks.length;
  const isCylinder = radiusChecks.every(r => Math.abs(r - avgR) < 1.0);
  
  if (isCylinder && avgR > 5) return `CILINDRO ELÍPTICO (R=${avgR.toFixed(2)}m)`;
  
  // Check Conical x^2 + z^2 = y^2
  const coneChecks = sampleIndices.map(idx => {
    const [x, y, z] = points[idx].position;
    return Math.abs(Math.sqrt(x*x + z*z) - Math.abs(y));
  });
  const isCone = coneChecks.every(diff => diff < 2.0);
  if (isCone) return "CONICIDAD CIRCULAR (SUPERFICIE REGLADA)";

  // Check for Parabolic nature (y = ax^2 + bx + c)
  const isParabolic = points.length > 10 && Math.abs(points[points.length - 1].position[1] - points[0].position[1]) < 50;
  if (isParabolic) return "PARABOLOIDE TÁCTICO DE REVOLUCIÓN";

  return "CUÁDRICA HIPERBÓLICA / ESPACIAL";
};

/**
 * Calculates trajectory using vector analysis.
 * r(t) = P0 + V0t + 0.5at^2
 */
export const calculateTrajectory = (
  start: [number, number, number],
  target: [number, number, number],
  t_intercept: number = 5
): TrajectoryPoint[] => {
  const points: TrajectoryPoint[] = [];
  const steps = 100;
  const g = -9.81;
  const a = [0, g, 0];

  // Optimization: Solve for V0 to intercept target at t_intercept
  const v0 = [
    (target[0] - start[0]) / t_intercept,
    (target[1] - start[1] - 0.5 * g * Math.pow(t_intercept, 2)) / t_intercept,
    (target[2] - start[2]) / t_intercept
  ];

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * t_intercept;
    
    // Position r(t)
    const r = [
      start[0] + v0[0] * t + 0.5 * a[0] * t * t,
      start[1] + v0[1] * t + 0.5 * a[1] * t * t,
      start[2] + v0[2] * t + 0.5 * a[2] * t * t
    ];
    
    // Velocity v(t) = r'(t)
    const v = [
      v0[0] + a[0] * t,
      v0[1] + a[1] * t,
      v0[2] + a[2] * t
    ];
    const speed = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
    
    // Curvature κ(t) = ||v x a|| / ||v||^3
    const v_cross_a = [
       (v[1] * a[2] - v[2] * a[1]),
       (v[2] * a[0] - v[0] * a[2]),
       (v[0] * a[1] - v[1] * a[0])
    ];
    const v_cross_a_mag = Math.sqrt(v_cross_a[0]**2 + v_cross_a[1]**2 + v_cross_a[2]**2);
    const curvature = v_cross_a_mag / Math.pow(speed, 3);
    
    points.push({
      position: [r[0], r[1], r[2]],
      velocity: speed,
      curvature,
      time: t
    });
  }
  
  return points;
};

/**
 * Analytical Arc Length Calculation
 */
export const calculateAnalyticalStats = (
    start: [number, number, number],
    target: [number, number, number],
    t_max: number
): MissionStats => {
    const g = -9.81;
    const v0 = [
        (target[0] - start[0]) / t_max,
        (target[1] - start[1] - 0.5 * g * Math.pow(t_max, 2)) / t_max,
        (target[2] - start[2]) / t_max
    ];

    const A = g * g;
    const B = 2 * v0[1] * g;
    const C = v0[0]**2 + v0[1]**2 + v0[2]**2;

    const steps = 1000;
    let arcLength = 0;
    const getSpeed = (t: number) => Math.sqrt(A*t*t + B*t + C);
    
    for(let i=0; i<steps; i++) {
        const t1 = (i/steps)*t_max;
        const t2 = ((i+1)/steps)*t_max;
        arcLength += (getSpeed(t1) + getSpeed(t2)) * (t_max/steps) / 2;
    }

    const vStart = getSpeed(0);
    const vEnd = getSpeed(t_max);
    
    const t_min_speed = Math.max(0, Math.min(t_max, -B / (2 * A)));
    const minSpeed = getSpeed(t_min_speed);
    
    const v_cross_a_mag = Math.sqrt((v0[2]*0)**2 + (v0[2]*g)**2 + (v0[0]*g)**2); 
    const maxCurvature = v_cross_a_mag / Math.pow(minSpeed, 3);

    // Get min/max height from a sample of the trajectory
    let minH = Infinity;
    let maxH = -Infinity;
    const samplePoints: TrajectoryPoint[] = [];

    for(let i=0; i<=20; i++) {
        const t = (i/20) * t_max;
        const y = start[1] + v0[1] * t + 0.5 * g * t * t;
        const x = start[0] + v0[0] * t;
        const z = start[2] + v0[2] * t;
        if (y < minH) minH = y;
        if (y > maxH) maxH = y;
        samplePoints.push({ position: [x, y, z], velocity: 0, curvature: 0, time: t });
    }

    return {
        maxCurvature,
        maxCurvatureTime: t_min_speed,
        arcLength,
        maxSpeed: Math.max(vStart, vEnd),
        minSpeed,
        terminalVelocity: vEnd,
        machNumber: vEnd / 340,
        initialSpeed: vStart,
        impactEnergy: 0.5 * 1200 * vEnd**2,
        fuelViability: arcLength < 400, 
        optimalTime: t_max,
        minHeight: minH,
        maxHeight: maxH,
        quadricSurface: analyzeTrajectoryQuadric(samplePoints)
    };
};

export const formatVector = (v: number[]) => `⟨${v.map(n => n.toFixed(2)).join(', ')}⟩`;
