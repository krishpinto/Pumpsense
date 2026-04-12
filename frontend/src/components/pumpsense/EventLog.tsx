'use client';
// Event log — history of all analyzed readings in the session

import { AnalysisResult } from '@/lib/analysisEngine';

interface Props {
  events: AnalysisResult[];
}

const SEVERITY_BADGE: Record<string, string> = {
  Healthy:  'bg-emerald-100 text-emerald-700',
  Watch:    'bg-amber-100 text-amber-700',
  Critical: 'bg-red-100 text-red-700',
  Severe:   'bg-purple-100 text-purple-700',
};

const URGENCY_BADGE: Record<string, string> = {
  Routine:   'text-emerald-600',
  Monitor:   'text-amber-600',
  Urgent:    'text-red-600',
  Immediate: 'text-purple-700',
};

export function EventLog({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-sm text-slate-400">
        No events yet — run an analysis to populate the log.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100">
            {['Timestamp', 'Source', 'Fault Type', 'Severity', 'Health', 'Confidence', 'Urgency', 'Action'].map(h => (
              <th key={h} className="text-left py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...events].reverse().map((e, i) => {
            const ts = new Date(e.timestamp);
            const timeStr = ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const primary = e.confidence.find(c => c.classId === e.classId);
            return (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="py-2 px-3 font-mono text-slate-400 whitespace-nowrap">{timeStr}</td>
                <td className="py-2 px-3 text-slate-600 font-medium whitespace-nowrap">{e.reading.file}</td>
                <td className="py-2 px-3 text-slate-700 whitespace-nowrap">{e.primaryFault}</td>
                <td className="py-2 px-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${SEVERITY_BADGE[e.severity]}`}>
                    {e.severity}
                  </span>
                </td>
                <td className="py-2 px-3 font-mono font-bold text-slate-700">{e.healthScore}/100</td>
                <td className="py-2 px-3 font-mono text-slate-600">{primary?.value.toFixed(1)}%</td>
                <td className={`py-2 px-3 font-semibold whitespace-nowrap ${URGENCY_BADGE[e.urgency]}`}>
                  {e.urgency}
                </td>
                <td className="py-2 px-3 text-slate-500 max-w-[200px] truncate">{e.nextAction}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
