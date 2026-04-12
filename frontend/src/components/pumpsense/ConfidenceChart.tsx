'use client';
// Horizontal confidence bars for each fault class

import { ConfidenceEntry } from '@/lib/analysisEngine';
import { FaultLabel } from '@/lib/sampleData';

const CLASS_COLORS: Record<FaultLabel, { bar: string; bg: string; text: string }> = {
  0: { bar: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  1: { bar: 'bg-amber-500',   bg: 'bg-amber-50',    text: 'text-amber-700'   },
  2: { bar: 'bg-red-500',     bg: 'bg-red-50',      text: 'text-red-700'     },
  3: { bar: 'bg-purple-600',  bg: 'bg-purple-50',   text: 'text-purple-700'  },
};

interface ConfidenceChartProps {
  confidence: ConfidenceEntry[];
  primaryClassId: FaultLabel;
}

export function ConfidenceChart({ confidence, primaryClassId }: ConfidenceChartProps) {
  return (
    <div className="space-y-2.5">
      {confidence.map((entry) => {
        const c = CLASS_COLORS[entry.classId];
        const isPrimary = entry.classId === primaryClassId;
        return (
          <div key={entry.classId} className={`rounded-md p-2 ${isPrimary ? c.bg : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-medium ${isPrimary ? c.text : 'text-slate-500'}`}>
                {entry.label}
              </span>
              <span className={`text-xs font-bold tabular-nums ${isPrimary ? c.text : 'text-slate-400'}`}>
                {entry.value.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${c.bar}`}
                style={{ width: `${entry.value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
