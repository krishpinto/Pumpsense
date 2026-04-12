'use client';
// FFT-like frequency spectrum chart

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { FftDataPoint } from '@/lib/analysisEngine';
import { FaultLabel } from '@/lib/sampleData';

const CHART_COLORS: Record<FaultLabel, string> = {
  0: '#10b981',
  1: '#f59e0b',
  2: '#ef4444',
  3: '#a855f7',
};

interface SignalChartProps {
  data: FftDataPoint[];
  classId: FaultLabel;
  peak_f1: number;
  peak_f2: number;
  peak_f3: number;
}

export function SignalChart({ data, classId, peak_f1, peak_f2, peak_f3 }: SignalChartProps) {
  const color = CHART_COLORS[classId];
  const peaks = [peak_f1, peak_f2, peak_f3].filter(f => f > 2);

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fftGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="freq"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            label={{ value: 'Hz', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#94a3b8' }}
          />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => [Number(v).toFixed(5), 'Amplitude']}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            labelFormatter={(l: any) => `${l} Hz`}
            contentStyle={{ fontSize: 11, borderRadius: 6 }}
          />
          {peaks.map((pf, i) => (
            <ReferenceLine
              key={i} x={Math.round(pf / 5) * 5}
              stroke={color} strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: `f${i + 1}`, position: 'top', fontSize: 9, fill: color }}
            />
          ))}
          <Area type="monotone" dataKey="amplitude" stroke={color} strokeWidth={1.5}
            fill="url(#fftGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
