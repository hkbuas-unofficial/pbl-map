import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Simple SVG line chart for web
export default function LineChart({ data, width = 320, height = 160, lineColor = '#3498db', fillColor = 'rgba(52,152,219,0.15)' }) {
  if (!data || data.length === 0) return null;

  const padding = { top: 10, right: 10, bottom: 30, left: 36 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - (d.count / maxValue) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Show every 8th label (every 2 hours)
  const xLabels = data.filter((_, i) => i % 8 === 0).map((d, i) => ({
    label: d.label,
    x: points[i * 8]?.x || 0,
  }));

  const yLabels = [0, Math.round(maxValue / 2), maxValue];

  return (
    <View style={styles.container}>
      <svg width={width} height={height} style={styles.svg}>
        {/* Grid lines */}
        {yLabels.map((val, i) => {
          const y = padding.top + chartH - (val / maxValue) * chartH;
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#eee" strokeWidth={1} />
              <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#888">{val}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={fillColor} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.count > 0 ? 3 : 0} fill={lineColor} />
        ))}

        {/* X axis labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={height - 8} textAnchor="middle" fontSize={10} fill="#888">
            {l.label}
          </text>
        ))}
      </svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  svg: {
    maxWidth: '100%',
  },
});
