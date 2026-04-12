'use client';
// PumpSense AI Maintenance Supervisor — agentic decision panel

import { AnalysisResult } from '@/lib/analysisEngine';
import { AlertTriangle, CheckCircle, Clock, Users, Zap, Shield, ChevronRight } from 'lucide-react';

const URGENCY_CONFIG = {
  Routine:   { icon: CheckCircle,    color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
  Monitor:   { icon: Clock,          color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700'     },
  Urgent:    { icon: AlertTriangle,  color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     badge: 'bg-red-100 text-red-700'         },
  Immediate: { icon: Zap,            color: 'text-purple-700',  bg: 'bg-purple-50',   border: 'border-purple-300',  badge: 'bg-purple-100 text-purple-700'   },
};

interface Props {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
}

export function MaintenanceSupervisor({ result, isAnalyzing }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-800 leading-tight">AI Maintenance Supervisor</div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">PumpSense Agentic Layer</div>
        </div>
      </div>

      {/* Loading state */}
      {isAnalyzing && (
        <div className="flex-1 flex flex-col gap-3">
          {['w-3/4', 'w-full', 'w-2/3', 'w-full', 'w-3/4'].map((w, i) => (
            <div key={i} className={`h-8 rounded-md shimmer ${w}`} />
          ))}
          <div className="mt-2 text-xs text-blue-500 animate-pulse flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
            Analyzing telemetry data…
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !isAnalyzing && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-slate-300" />
          </div>
          <div className="text-sm text-slate-400">
            Select a reading and click<br />
            <span className="font-medium text-slate-500">Analyze Reading</span> to activate
          </div>
        </div>
      )}

      {/* Result state */}
      {result && !isAnalyzing && (() => {
        const uc = URGENCY_CONFIG[result.urgency];
        const UIcon = uc.icon;

        return (
          <div className="flex-1 flex flex-col gap-3 fade-in">
            {/* Urgency badge */}
            <div className={`rounded-lg px-3 py-2.5 border ${uc.bg} ${uc.border} flex items-center gap-2`}>
              <UIcon className={`w-4 h-4 ${uc.color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold uppercase tracking-wider ${uc.color}`}>
                  Urgency: {result.urgency}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 leading-snug">
                  {result.workflowState}
                </div>
              </div>
            </div>

            {/* Recommended action */}
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Recommended Action
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{result.recommendedAction}</p>
            </div>

            {/* Assigned team */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-start gap-2">
              <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Assigned Team
                </div>
                <div className="text-xs font-medium text-slate-700">{result.assignedTeam}</div>
              </div>
            </div>

            {/* Risk if delayed */}
            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">
                Risk If Delayed
              </div>
              <p className="text-xs text-red-700 leading-relaxed">{result.riskIfDelayed}</p>
            </div>

            {/* Next action */}
            <div className="rounded-lg bg-blue-600 p-3">
              <div className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider mb-1">
                Next Action
              </div>
              <div className="flex items-start gap-1.5">
                <ChevronRight className="w-3 h-3 text-white mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white leading-relaxed">{result.nextAction}</p>
              </div>
            </div>

            {/* API mode indicator */}
            <div className="flex items-center gap-1.5 mt-auto pt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${result.apiMode ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              <span className="text-[10px] text-slate-400">
                {result.apiMode ? 'Live ML model (FastAPI)' : 'Mock inference engine'}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
