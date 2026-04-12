'use client';
// SVG pump asset visual — color and animation respond to severity

import { FaultLabel } from '@/lib/sampleData';

const SEVERITY_STYLES: Record<FaultLabel, { ring: string; fill: string; stroke: string; glow: string; pulseClass: string }> = {
  0: { ring: '#10b981', fill: '#d1fae5', stroke: '#059669', glow: 'drop-shadow(0 0 6px rgba(16,185,129,0.5))',  pulseClass: 'pulse-healthy'  },
  1: { ring: '#f59e0b', fill: '#fef3c7', stroke: '#d97706', glow: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))',  pulseClass: 'pulse-watch'    },
  2: { ring: '#ef4444', fill: '#fee2e2', stroke: '#dc2626', glow: 'drop-shadow(0 0 10px rgba(239,68,68,0.7))',  pulseClass: 'pulse-critical' },
  3: { ring: '#a855f7', fill: '#f3e8ff', stroke: '#9333ea', glow: 'drop-shadow(0 0 12px rgba(168,85,247,0.8))', pulseClass: 'pulse-severe'   },
};

interface PumpAssetProps {
  classId: FaultLabel;
  isLive: boolean;
}

export function PumpAsset({ classId, isLive }: PumpAssetProps) {
  const s = SEVERITY_STYLES[classId];
  const spinClass = classId === 3 ? 'spin-fast' : classId >= 2 ? 'spin-fast' : isLive ? 'spin-slow' : 'spin-slow';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 120 120"
        className="w-28 h-28 transition-all duration-500"
        style={{ filter: s.glow }}
      >
        {/* Pump casing */}
        <circle cx="60" cy="60" r="42" fill={s.fill} stroke={s.ring} strokeWidth="3" />

        {/* Impeller blades */}
        <g className={spinClass} style={{ transformOrigin: '60px 60px' }}>
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <rect
              key={angle}
              x="57" y="25" width="6" height="22" rx="3"
              fill={s.stroke}
              transform={`rotate(${angle} 60 60)`}
            />
          ))}
          <circle cx="60" cy="60" r="7" fill={s.stroke} />
        </g>

        {/* Inlet pipe (left) */}
        <rect x="0" y="52" width="18" height="16" rx="2" fill={s.ring} />
        {/* Outlet pipe (top) */}
        <rect x="52" y="0" width="16" height="18" rx="2" fill={s.ring} />

        {/* Warning icon overlay for fault states */}
        {classId >= 2 && (
          <g>
            <circle cx="92" cy="28" r="12" fill={classId === 3 ? '#7c3aed' : '#dc2626'} />
            <text x="92" y="33" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">
              {classId === 3 ? '!' : '⚠'}
            </text>
          </g>
        )}

        {/* Outer status ring */}
        <circle cx="60" cy="60" r="54" fill="none" stroke={s.ring} strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
      </svg>

      {/* Vibration bar (animated in live mode or fault) */}
      {(isLive || classId > 0) && (
        <div className="flex items-end gap-0.5 h-6">
          {[3, 5, 4, 7, 3, 6, 4, 5, 3, 6, 4, 7, 3].map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-sm transition-all"
              style={{
                height: `${(h + (classId * 2)) * 2}px`,
                backgroundColor: s.ring,
                animation: `pulse-bar ${0.3 + i * 0.05}s ease-in-out infinite alternate`,
                opacity: 0.7 + (i % 3) * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
