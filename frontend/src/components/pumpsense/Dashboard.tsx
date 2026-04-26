'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, AlertCircle, AlertTriangle, CheckCircle2,
  Cpu, Database, Zap, Upload, BarChart2,
  Wifi, WifiOff,
} from 'lucide-react';

import { SAMPLE_READINGS, SampleReading, FaultLabel, FAULT_LABELS } from '@/lib/sampleData';
import { analyzeMock, analyzeWithApi, analyzeFromUpload, AnalysisResult, TrendPoint } from '@/lib/analysisEngine';

import { PumpAsset } from './PumpAsset';
import { SignalChart } from './SignalChart';
import { ConfidenceChart } from './ConfidenceChart';
import { TrendChart } from './TrendChart';
import { MaintenanceSupervisor } from './MaintenanceSupervisor';
import { EventLog } from './EventLog';

const SEVERITY_STYLES: Record<string, { headerBg: string; icon: React.ElementType; dotColor: string }> = {
  Healthy:  { headerBg: 'bg-emerald-500', icon: CheckCircle2,  dotColor: 'bg-emerald-400' },
  Watch:    { headerBg: 'bg-amber-500',   icon: AlertCircle,   dotColor: 'bg-amber-400'   },
  Critical: { headerBg: 'bg-red-600',     icon: AlertTriangle, dotColor: 'bg-red-500'      },
  Severe:   { headerBg: 'bg-purple-700',  icon: Zap,           dotColor: 'bg-purple-500'   },
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function Dashboard() {
  // ── State ──────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string>(SAMPLE_READINGS[0].id);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendHistory, setTrendHistory] = useState<TrendPoint[]>([]);
  const [eventLog, setEventLog] = useState<AnalysisResult[]>([]);
  const [apiMode, setApiMode] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ────────────────────────────────────────────────────────────
  const selectedReading = SAMPLE_READINGS.find(r => r.id === selectedId)!;

  const runAnalysis = useCallback(async (reading: SampleReading) => {
    setIsAnalyzing(true);
    // Brief artificial delay to feel like real inference
    await new Promise(r => setTimeout(r, 600));

    const res = apiMode ? await analyzeWithApi(reading) : analyzeMock(reading);
    setResult(res);
    setIsAnalyzing(false);

    setTrendHistory(prev => {
      const next: TrendPoint = {
        index: prev.length + 1,
        label: reading.file.replace('.xlsx', '').substring(0, 8),
        healthScore: res.healthScore,
        fault: res.primaryFault,
        severity: res.severity,
      };
      return [...prev.slice(-19), next]; // keep last 20
    });

    setEventLog(prev => [...prev, res]);
  }, [apiMode]);

  // ── API health check ───────────────────────────────────────────────────
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
    fetch(`${apiUrl}/`, { signal: AbortSignal.timeout(2000) })
      .then(() => setApiAvailable(true))
      .catch(() => setApiAvailable(false));
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploadError(null);
    setIsAnalyzing(true);
    try {
      const res = await analyzeFromUpload(file);
      setResult(res);
      setTrendHistory(prev => {
        const next: TrendPoint = {
          index: prev.length + 1,
          label: file.name.replace('.xlsx', '').substring(0, 8),
          healthScore: res.healthScore,
          fault: res.primaryFault,
          severity: res.severity,
        };
        return [...prev.slice(-19), next];
      });
      setEventLog(prev => [...prev, res]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Status display ─────────────────────────────────────────────────────
  const severity = result?.severity ?? 'Healthy';
  const statusStyle = SEVERITY_STYLES[severity];
  const StatusIcon = statusStyle.icon;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center gap-4 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">PumpSense</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Predictive Maintenance Platform</div>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-700 mx-1" />

        {/* Station/pump info */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-500">Station</span>
            <span className="ml-1.5 font-semibold text-slate-200">WTR-NORTH-04</span>
          </div>
          <div>
            <span className="text-slate-500">Pump</span>
            <span className="ml-1.5 font-semibold text-slate-200">P-Unit-07</span>
          </div>
          <div>
            <span className="text-slate-500">Asset</span>
            <span className="ml-1.5 font-semibold text-slate-200">Centrifugal Bearing #3</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* API toggle */}
          <button
            onClick={() => setApiMode(p => !p)}
            className={`flex items-center gap-1.5 text-xs rounded-full px-3 py-1 border transition-all ${
              apiMode
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
            }`}
          >
            {apiAvailable === false
              ? <WifiOff className="w-3 h-3" />
              : <Wifi className="w-3 h-3" />}
            {apiMode ? 'FastAPI Mode' : 'Mock Mode'}
          </button>

          {/* Timestamp */}
          {result && (
            <span className="text-[11px] text-slate-500 font-mono">
              Last: {formatTime(result.timestamp)}
            </span>
          )}
        </div>
      </header>

      {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
      <div className="flex-1 p-4 grid grid-cols-[260px_1fr_280px] gap-4 min-h-0">

        {/* ── LEFT PANEL — Controls ──────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Pump asset */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col items-center gap-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Asset Status</div>
            <PumpAsset classId={result?.classId ?? 0} isLive={false} />
            <div className={`mt-1 rounded-full px-4 py-1.5 text-sm font-bold ${result ? `${result.severityBg} ${result.severityColor} border ${result.severityBorder}` : 'bg-slate-100 text-slate-500'}`}>
              {severity}
            </div>
            {result && (
              <div className="text-center">
                <div className="text-3xl font-black text-slate-800 tabular-nums">{result.healthScore}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Health Score / 100</div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Select Sample Reading
              </label>
              {([0, 1, 2, 3] as FaultLabel[]).map(label => {
                const group = SAMPLE_READINGS.filter(r => r.label === label);
                return (
                  <div key={label} className="mb-2">
                    <div className="text-[10px] text-slate-400 font-medium mb-1 pl-1">
                      {FAULT_LABELS[label]}
                    </div>
                    {group.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className={`w-full text-left text-xs px-2.5 py-1.5 rounded-md mb-0.5 transition-all ${
                          selectedId === r.id
                            ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {r.displayName.split(' — ')[1] ?? r.file}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => runAnalysis(selectedReading)}
              disabled={isAnalyzing}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing…</>
                : <><BarChart2 className="w-4 h-4" />Analyze Reading</>}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              className={`w-full py-2 rounded-lg border border-dashed text-xs flex items-center justify-center gap-1.5 transition-colors ${
                isAnalyzing
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-300 text-slate-500 cursor-pointer hover:border-blue-400 hover:text-blue-500'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload .xlsx File
            </label>
            {uploadError && (
              <div className="text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">
                {uploadError}
              </div>
            )}
          </div>

          {/* Pipeline status */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Ingestion Pipeline
            </div>
            {[
              { label: 'Data Ingestion', active: isAnalyzing },
              { label: 'Feature Extraction', active: !!result || isAnalyzing },
              { label: 'ML Inference', active: !!result || isAnalyzing },
              { label: 'Risk Scoring', active: !!result },
              { label: 'Alert Engine', active: !!result && (result.classId ?? 0) > 0 },
            ].map(({ label, active }) => (
              <div key={label} className="flex items-center gap-2 py-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${active ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                <span className={`text-[11px] transition-colors ${active ? 'text-slate-700' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER PANEL — Analysis Results ───────────────────────────── */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* Status banner */}
          <div className={`rounded-xl p-4 flex items-center gap-4 text-white transition-all duration-500 shadow-sm ${
            result ? statusStyle.headerBg : 'bg-slate-200'
          }`}>
            <StatusIcon className="w-8 h-8 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xl font-black tracking-tight leading-tight">
                {result ? result.primaryFault : 'Awaiting Analysis'}
              </div>
              <div className="text-sm opacity-80">
                {result
                  ? `Source: ${result.reading.file} · ${formatTime(result.timestamp)}`
                  : 'Select a sample and run analysis to begin'}
              </div>
            </div>
            {result && (
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-black tabular-nums leading-none">{result.healthScore}</div>
                <div className="text-[10px] opacity-70 uppercase tracking-wider">Health</div>
              </div>
            )}
          </div>

          {/* Metric cards row */}
          {result ? (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Max Amplitude', val: result.reading.features.max_amp < 1
                    ? result.reading.features.max_amp.toFixed(4)
                    : result.reading.features.max_amp.toFixed(1),
                  unit: 'g', icon: Activity },
                { label: 'Spectral Energy', val: result.reading.features.spectral_energy < 1
                    ? result.reading.features.spectral_energy.toFixed(3)
                    : (result.reading.features.spectral_energy / 1000).toFixed(1) + 'k',
                  unit: '', icon: Zap },
                { label: 'Spectral Centroid', val: result.reading.features.spectral_centroid.toFixed(1), unit: 'Hz', icon: BarChart2 },
                { label: 'Dominant Freq', val: result.reading.features.peak_f1.toFixed(1), unit: 'Hz', icon: Cpu },
              ].map(({ label, val, unit, icon: Icon }) => (
                <div key={label} className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                  </div>
                  <div className="text-xl font-black text-slate-800 tabular-nums leading-none">{val}</div>
                  {unit && <div className="text-[10px] text-slate-400 mt-0.5">{unit}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 h-20 shimmer" />
              ))}
            </div>
          )}

          {/* Signal chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-slate-700">Frequency Spectrum (FFT)</div>
                <div className="text-[10px] text-slate-400">Vibration amplitude vs frequency</div>
              </div>
              {result && (
                <div className="text-[10px] text-slate-400 font-mono">
                  f₁={result.reading.features.peak_f1.toFixed(1)}Hz
                  · f₂={result.reading.features.peak_f2.toFixed(1)}Hz
                  · f₃={result.reading.features.peak_f3.toFixed(1)}Hz
                </div>
              )}
            </div>
            {result
              ? <SignalChart
                  data={result.fftData}
                  classId={result.classId}
                  peak_f1={result.reading.features.peak_f1}
                  peak_f2={result.reading.features.peak_f2}
                  peak_f3={result.reading.features.peak_f3}
                />
              : <div className="h-48 shimmer rounded-lg" />}
          </div>

          {/* Two-column: confidence + explanation */}
          <div className="grid grid-cols-2 gap-4">
            {/* Confidence chart */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-slate-700 mb-1">Model Confidence</div>
              <div className="text-[10px] text-slate-400 mb-3">Probability per fault class</div>
              {result
                ? <ConfidenceChart confidence={result.confidence} primaryClassId={result.classId} />
                : <div className="space-y-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-8 shimmer rounded-md" />)}</div>}
            </div>

            {/* Explanation + features */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-700 mb-1">AI Diagnosis</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {result?.explanation ?? 'Run analysis to generate a diagnosis.'}
                </p>
              </div>
              {result && (
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Extracted Features
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      ['mean_mag', result.reading.features.mean_mag.toFixed(5)],
                      ['var_mag', result.reading.features.var_mag.toExponential(2)],
                      ['spectral_spread', result.reading.features.spectral_spread.toFixed(1)],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-slate-50 rounded px-1.5 py-1">
                        <div className="text-[9px] text-slate-400 font-mono">{k}</div>
                        <div className="text-[11px] font-semibold text-slate-700 font-mono tabular-nums">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trend chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-semibold text-slate-700">Health Score Trend</div>
                <div className="text-[10px] text-slate-400">Session history · last 20 readings</div>
              </div>
              {trendHistory.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Database className="w-3 h-3" />
                  {trendHistory.length} readings
                </div>
              )}
            </div>
            <TrendChart data={trendHistory} />
          </div>
        </div>

        {/* ── RIGHT PANEL — Maintenance Supervisor ──────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-y-auto">
          <MaintenanceSupervisor result={result} isAnalyzing={isAnalyzing} />
        </div>
      </div>

      {/* ── EVENT LOG ───────────────────────────────────────────────────── */}
      <div className="mx-4 mb-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <div className="text-sm font-semibold text-slate-700">Event History</div>
            <div className="text-[10px] text-slate-400">All analyzed readings this session</div>
          </div>
          <div className="flex items-center gap-2">
            {eventLog.length > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-mono">
                {eventLog.length} events
              </span>
            )}
            <button
              onClick={() => { setEventLog([]); setTrendHistory([]); }}
              className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="px-2 py-1 max-h-52 overflow-y-auto">
          <EventLog events={eventLog} />
        </div>
      </div>

    </div>
  );
}
