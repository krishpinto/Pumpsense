// Real feature values extracted from the pump vibration dataset (final_multiclass_dataset.csv)
// 9 spectral features per reading, 4 fault classes

export type FaultLabel = 0 | 1 | 2 | 3;
export type Severity = 'Healthy' | 'Watch' | 'Critical' | 'Severe';

export interface VibrationFeatures {
  max_amp: number;
  mean_mag: number;
  var_mag: number;
  spectral_energy: number;
  spectral_centroid: number;
  spectral_spread: number;
  peak_f1: number;
  peak_f2: number;
  peak_f3: number;
}

export interface SampleReading {
  id: string;
  file: string;
  label: FaultLabel;
  displayName: string;
  features: VibrationFeatures;
}

export const FAULT_LABELS: Record<FaultLabel, string> = {
  0: 'Healthy Operation',
  1: 'Inner Race Defect',
  2: 'Outer Race Defect',
  3: 'Combination Defect (Severe)',
};

export const SEVERITY_INFO: Record<
  FaultLabel,
  { severity: Severity; color: string; bg: string; border: string; healthScore: [number, number] }
> = {
  0: { severity: 'Healthy',  color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-300', healthScore: [82, 96] },
  1: { severity: 'Watch',    color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-300',   healthScore: [42, 62] },
  2: { severity: 'Critical', color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-300',     healthScore: [22, 44] },
  3: { severity: 'Severe',   color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-300',  healthScore: [4, 18]  },
};

// Curated samples from the real dataset covering all four fault classes
export const SAMPLE_READINGS: SampleReading[] = [
  // --- Healthy (label 0) ---
  {
    id: 'h1', file: 'healthy_3.xlsx', label: 0, displayName: 'Healthy — Reading H-03',
    features: { max_amp: 0.3217, mean_mag: 0.00482, var_mag: 0.000446, spectral_energy: 0.2111,
      spectral_centroid: 209.6, spectral_spread: 153.1, peak_f1: 49.0, peak_f2: 48.0, peak_f3: 441.0 },
  },
  {
    id: 'h2', file: 'healthy_10.xlsx', label: 0, displayName: 'Healthy — Reading H-10',
    features: { max_amp: 0.3512, mean_mag: 0.00505, var_mag: 0.000554, spectral_energy: 0.2607,
      spectral_centroid: 202.4, spectral_spread: 153.5, peak_f1: 49.0, peak_f2: 48.0, peak_f3: 50.0 },
  },
  {
    id: 'h3', file: 'healthy_20.xlsx', label: 0, displayName: 'Healthy — Reading H-20',
    features: { max_amp: 0.3619, mean_mag: 0.00552, var_mag: 0.000605, spectral_energy: 0.2860,
      spectral_centroid: 211.1, spectral_spread: 156.6, peak_f1: 49.0, peak_f2: 48.0, peak_f3: 50.0 },
  },

  // --- Inner Race Defect (label 1) ---
  {
    id: 'ir1', file: 'F150.xlsx', label: 1, displayName: 'Inner Race Defect — F-150 (Mild)',
    features: { max_amp: 308.72, mean_mag: 15.95, var_mag: 364.60, spectral_energy: 634445.2,
      spectral_centroid: 271.6, spectral_spread: 207.2, peak_f1: 97.4, peak_f2: 98.1, peak_f3: 195.6 },
  },
  {
    id: 'ir2', file: 'F250.xlsx', label: 1, displayName: 'Inner Race Defect — F-250 (Moderate)',
    features: { max_amp: 444.11, mean_mag: 10.87, var_mag: 497.14, spectral_energy: 630657.2,
      spectral_centroid: 275.0, spectral_spread: 205.5, peak_f1: 97.4, peak_f2: 98.1, peak_f3: 195.6 },
  },
  {
    id: 'ir3', file: 'F200.xlsx', label: 1, displayName: 'Inner Race Defect — F-200 (Significant)',
    features: { max_amp: 1119.05, mean_mag: 17.89, var_mag: 3141.5, spectral_energy: 3548250.0,
      spectral_centroid: 232.8, spectral_spread: 192.2, peak_f1: 97.4, peak_f2: 98.1, peak_f3: 195.6 },
  },

  // --- Outer Race Defect (label 2) ---
  {
    id: 'or1', file: 'F50.xlsx', label: 2, displayName: 'Outer Race Defect — F-050 (Moderate)',
    features: { max_amp: 459.91, mean_mag: 19.89, var_mag: 1322.4, spectral_energy: 1761174.5,
      spectral_centroid: 219.3, spectral_spread: 198.8, peak_f1: 0.0, peak_f2: 2.2, peak_f3: 49.1 },
  },
  {
    id: 'or2', file: 'F26.xlsx', label: 2, displayName: 'Outer Race Defect — F-026 (Significant)',
    features: { max_amp: 774.51, mean_mag: 23.97, var_mag: 2164.1, spectral_energy: 2807308.6,
      spectral_centroid: 240.6, spectral_spread: 210.5, peak_f1: 2.2, peak_f2: 0.0, peak_f3: 98.1 },
  },
  {
    id: 'or3', file: 'F100.xlsx', label: 2, displayName: 'Outer Race Defect — F-100 (Severe)',
    features: { max_amp: 1881.3, mean_mag: 40.13, var_mag: 9555.5, spectral_energy: 11445052.2,
      spectral_centroid: 221.3, spectral_spread: 210.4, peak_f1: 0.0, peak_f2: 97.4, peak_f3: 49.1 },
  },

  // --- Combination Defect (label 3) ---
  {
    id: 'cd1', file: 'F102.xlsx', label: 3, displayName: 'Combination Defect — F-102 (Critical)',
    features: { max_amp: 4414.9, mean_mag: 59.69, var_mag: 40135.3, spectral_energy: 44791245.6,
      spectral_centroid: 213.2, spectral_spread: 214.6, peak_f1: 0.0, peak_f2: 98.1, peak_f3: 97.4 },
  },
  {
    id: 'cd2', file: 'F34.xlsx', label: 3, displayName: 'Combination Defect — F-034 (Catastrophic)',
    features: { max_amp: 8277.5, mean_mag: 60.21, var_mag: 88822.0, spectral_energy: 94758682.6,
      spectral_centroid: 224.6, spectral_spread: 232.7, peak_f1: 0.0, peak_f2: 0.73, peak_f3: 1.46 },
  },
];

