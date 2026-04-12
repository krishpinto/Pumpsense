'use client';
// Health score trend over time (multiple readings)

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendPoint } from '@/lib/analysisEngine';

interface TrendChartProps {
  data: TrendPoint[];
}

const DOT_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#a855f7'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot({ cx, cy, payload }: any) {
  const colorMap: Record<string, string> = {
    Healthy: '#10b981', Watch: '#f59e0b', Critical: '#ef4444', Severe: '#a855f7',
  };
  const color = colorMap[payload.severity] ?? '#94a3b8';
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />;
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-slate-400 text-sm">
        No readings yet. Analyze a sample to begin.
      </div>
    );
  }

  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={28}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, _: any, props: any) => [
              `${v} / 100`,
              `Health — ${(props?.payload as TrendPoint)?.fault ?? ''}`,
            ]}
            contentStyle={{ fontSize: 11, borderRadius: 6 }}
          />
          {/* Watch threshold */}
          <ReferenceLine y={65} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1}
            label={{ value: 'Watch', position: 'right', fontSize: 9, fill: '#f59e0b' }} />
          {/* Critical threshold */}
          <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1}
            label={{ value: 'Critical', position: 'right', fontSize: 9, fill: '#ef4444' }} />
          <Line
            type="monotone" dataKey="healthScore" stroke="#3b82f6" strokeWidth={2}
            dot={<CustomDot />} activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
