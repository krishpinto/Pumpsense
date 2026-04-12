// Analysis engine — mock mode (always available) + optional FastAPI mode

import { SampleReading, FaultLabel, FAULT_LABELS, SEVERITY_INFO, VibrationFeatures } from './sampleData';

export interface ConfidenceEntry {
  label: string;
  classId: FaultLabel;
  value: number; // 0–100
}

export interface FftDataPoint {
  freq: number;
  amplitude: number;
}

export interface AnalysisResult {
  reading: SampleReading;
  timestamp: string;
  healthScore: number;         // 0–100
  primaryFault: string;
  classId: FaultLabel;
  severity: string;
  severityColor: string;
  severityBg: string;
  severityBorder: string;
  confidence: ConfidenceEntry[];
  fftData: FftDataPoint[];
  explanation: string;
  recommendedAction: string;
  urgency: 'Routine' | 'Monitor' | 'Urgent' | 'Immediate';
  assignedTeam: string;
  riskIfDelayed: string;
  workflowState: string;
  nextAction: string;
  apiMode: boolean;
}

// Base confidence profiles per class (realistic RF model outputs)
const BASE_CONFIDENCE: Record<FaultLabel, number[]> = {
  0: [91, 5, 3, 1],     // Healthy
  1: [6, 87, 5, 2],     // Inner Race
  2: [4, 9, 82, 5],     // Outer Race
  3: [1, 6, 11, 82],    // Combination
};

// Maintenance supervisor outputs per severity
const SUPERVISOR_CONFIG: Record<FaultLabel, {
  action: string; urgency: 'Routine' | 'Monitor' | 'Urgent' | 'Immediate';
  team: string; risk: string; workflow: string; next: string;
}> = {
  0: {
    action: 'Continue normal operation. Schedule next inspection per standard cycle.',
    urgency: 'Routine',
    team: 'Ops Team A — Routine Monitoring',
    risk: 'No elevated risk. Pump operating within normal parameters.',
    workflow: 'NOMINAL — No action required',
    next: 'Log reading. Next scheduled inspection in 30 days.',
  },
  1: {
    action: 'Inspect bearing assembly within 48 hours. Monitor vibration trend closely.',
    urgency: 'Monitor',
    team: 'Maintenance Crew B — Bearing Specialist',
    risk: 'Risk of bearing failure within 2–4 weeks if unaddressed. Potential pump seizure.',
    workflow: 'WATCH — Inspection ticket #MX-2841 created',
    next: 'Schedule bearing inspection. Increase monitoring interval to 6h.',
  },
  2: {
    action: 'Assign maintenance crew immediately. Prepare replacement bearing kit.',
    urgency: 'Urgent',
    team: 'Maintenance Crew C — Pump Overhaul',
    risk: 'High risk of unplanned downtime within 72h. Potential water service interruption.',
    workflow: 'CRITICAL — Work order #WO-7193 escalated to supervisor',
    next: 'Deploy Crew C on-site within 4h. Activate standby pump.',
  },
  3: {
    action: 'Immediate shutdown recommended. Deploy emergency response team.',
    urgency: 'Immediate',
    team: 'Emergency Response Team — Priority Override',
    risk: 'Catastrophic failure imminent. Risk of complete pump loss and infrastructure damage.',
    workflow: 'EMERGENCY — Incident #INC-0042 opened. Supervisor notified.',
    next: 'Isolate pump. Switch to backup system. Begin emergency bearing replacement.',
  },
};

const EXPLANATIONS: Record<FaultLabel, (f: VibrationFeatures) => string> = {
  0: (f) => `Vibration signature is within normal operational parameters. Spectral energy is low (${f.spectral_energy.toFixed(3)}) with a stable centroid at ${f.spectral_centroid.toFixed(1)} Hz. No fault harmonics detected.`,
  1: (f) => `Elevated inner-race fault harmonics detected at ${f.peak_f1.toFixed(1)} Hz and ${f.peak_f2.toFixed(1)} Hz. Spectral energy has increased significantly (${(f.spectral_energy / 1000).toFixed(1)}k). Consistent with early-stage inner race bearing wear.`,
  2: (f) => `Outer-race defect signature present. Peak energy concentrated at sub-synchronous frequencies (${f.peak_f3.toFixed(1)} Hz). Spectral energy at ${(f.spectral_energy / 1000).toFixed(1)}k — well above baseline. Characteristic of progressive outer race spalling.`,
  3: (f) => `Multiple simultaneous fault signatures detected across the full frequency spectrum. Max amplitude (${f.max_amp.toFixed(0)}) is critically elevated. Both inner and outer race harmonics present. Immediate intervention required.`,
};

// Generate synthetic FFT spectrum from feature values
function generateFftData(features: VibrationFeatures, label: FaultLabel): FftDataPoint[] {
  const points: FftDataPoint[] = [];
  const { max_amp, mean_mag, peak_f1, peak_f2, peak_f3 } = features;

  // Normalize amplitude for display (log scale for large values)
  const ampScale = label === 0 ? 1 : Math.log10(max_amp + 1) * 0.15;
  const noiseFloor = Math.max(0.002, mean_mag * 0.05);

  for (let freq = 0; freq <= 500; freq += 5) {
    // Background noise
    let amp = noiseFloor * (0.5 + Math.random() * 0.5);

    // Add Gaussian peaks at each dominant frequency
    const peaks = [peak_f1, peak_f2, peak_f3].filter(f => f > 0);
    for (const pf of peaks) {
      const dist = Math.abs(freq - pf);
      if (dist < 60) {
        amp += ampScale * Math.exp(-(dist * dist) / (2 * 20 * 20));
      }
    }

    // For healthy, add a smooth low-frequency hump
    if (label === 0 && freq < 100) {
      amp += 0.08 * Math.exp(-((freq - 50) ** 2) / (2 * 25 * 25));
    }

    points.push({ freq, amplitude: parseFloat(amp.toFixed(5)) });
  }
  return points;
}

// Generate health score with slight variation per reading
function generateHealthScore(label: FaultLabel, seed: number): number {
  const [lo, hi] = SEVERITY_INFO[label].healthScore;
  const range = hi - lo;
  const variation = (seed % 10) / 10;
  return Math.round(lo + range * variation);
}

// Add variation to confidence to avoid identical outputs
function varyConfidence(base: number[], label: FaultLabel): ConfidenceEntry[] {
  const noise = base.map(v => v + (Math.random() - 0.5) * 4);
  const total = noise.reduce((a, b) => a + b, 0);
  const normalized = noise.map(v => Math.max(0, Math.min(100, (v / total) * 100)));

  return (Object.keys(FAULT_LABELS) as unknown as FaultLabel[]).map((cid, i) => ({
    label: FAULT_LABELS[cid],
    classId: cid,
    value: parseFloat(normalized[i].toFixed(1)),
  }));
}

// --- Public API ---

export function analyzeMock(reading: SampleReading): AnalysisResult {
  const label = reading.label;
  const si = SEVERITY_INFO[label];
  const sup = SUPERVISOR_CONFIG[label];
  const seed = reading.id.charCodeAt(reading.id.length - 1);

  return {
    reading,
    timestamp: new Date().toISOString(),
    healthScore: generateHealthScore(label, seed),
    primaryFault: FAULT_LABELS[label],
    classId: label,
    severity: si.severity,
    severityColor: si.color,
    severityBg: si.bg,
    severityBorder: si.border,
    confidence: varyConfidence(BASE_CONFIDENCE[label], label),
    fftData: generateFftData(reading.features, label),
    explanation: EXPLANATIONS[label](reading.features),
    recommendedAction: sup.action,
    urgency: sup.urgency,
    assignedTeam: sup.team,
    riskIfDelayed: sup.risk,
    workflowState: sup.workflow,
    nextAction: sup.next,
    apiMode: false,
  };
}

// Call real FastAPI backend — falls back to mock on failure
export async function analyzeWithApi(reading: SampleReading): Promise<AnalysisResult> {
  try {
    const res = await fetch('http://127.0.0.1:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading.features),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) throw new Error('API error');
    const data = await res.json();

    const classId = data.class_id as FaultLabel;
    const si = SEVERITY_INFO[classId];
    const sup = SUPERVISOR_CONFIG[classId];

    // Map API confidence_matrix to our format
    const confidence: ConfidenceEntry[] = (
      Object.keys(FAULT_LABELS) as unknown as FaultLabel[]
    ).map(cid => ({
      label: FAULT_LABELS[cid],
      classId: cid,
      value: parseFloat(data.confidence_matrix[FAULT_LABELS[cid]]?.replace('%', '') ?? '0'),
    }));

    const seed = reading.id.charCodeAt(reading.id.length - 1);

    return {
      reading,
      timestamp: new Date().toISOString(),
      healthScore: generateHealthScore(classId, seed),
      primaryFault: data.primary_classification,
      classId,
      severity: si.severity,
      severityColor: si.color,
      severityBg: si.bg,
      severityBorder: si.border,
      confidence,
      fftData: generateFftData(reading.features, classId),
      explanation: EXPLANATIONS[classId](reading.features),
      recommendedAction: sup.action,
      urgency: sup.urgency,
      assignedTeam: sup.team,
      riskIfDelayed: sup.risk,
      workflowState: sup.workflow,
      nextAction: sup.next,
      apiMode: true,
    };
  } catch {
    // Fallback to mock if API is unavailable
    const result = analyzeMock(reading);
    return { ...result, apiMode: false };
  }
}

export interface TrendPoint {
  index: number;
  label: string;
  healthScore: number;
  fault: string;
  severity: string;
}
