import React, { useMemo } from 'react';

// ProbabilityChart renders YES probability area chart with tooltip
// Expects quotes array with yes_bid/yes_ask/no_bid/no_ask and created_at
const ProbabilityChart = ({ quotes, height = 260 }) => {
  const width = 700; // container can scroll horizontally if smaller
  const padding = { top: 20, right: 20, bottom: 28, left: 46 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const data = useMemo(() => {
    if (!quotes || quotes.length === 0) return null;
    // Convert quotes to YES probability using mid-price of YES
    const points = quotes
      .filter((q) => q && q.yes_bid !== undefined && q.yes_ask !== undefined)
      .map((q) => {
        const mid = (parseFloat(q.yes_bid) + parseFloat(q.yes_ask)) / 2;
        return {
          t: new Date(q.created_at).getTime(),
          p: Math.min(1, Math.max(0, mid)),
          ts: q.created_at,
        };
      });
    if (points.length < 2) return null;

    const tMin = points[0].t;
    const tMax = points[points.length - 1].t;
    const scaleX = (t) => ((t - tMin) / Math.max(1, tMax - tMin)) * chartWidth;
    const scaleY = (p) => chartHeight - p * chartHeight; // p in [0,1]

    const path = points
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(pt.t)},${scaleY(pt.p)}`)
      .join(' ');

    // Area path to baseline (probability 0)
    const area = `${path} L ${scaleX(points[points.length - 1].t)},${scaleY(0)} L ${scaleX(points[0].t)},${scaleY(0)} Z`;

    // Y ticks at 0%, 25%, 50%, 75%, 100%
    const yTicks = [1, 0.75, 0.5, 0.25, 0].map((p) => ({ p, y: scaleY(p) }));

    // X ticks ~5 equidistant
    const xTicks = [];
    const tickCount = 5;
    for (let i = 0; i < tickCount; i++) {
      const t = tMin + ((tMax - tMin) * i) / (tickCount - 1);
      xTicks.push({ t, x: scaleX(t) });
    }

    return { points, path, area, yTicks, xTicks, tMin, tMax, scaleX, scaleY };
  }, [quotes, chartWidth, chartHeight]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 bg-phantom-bg-secondary rounded-2xl border border-phantom-border">
        <p className="text-phantom-text-tertiary">Not enough data to render probability</p>
      </div>
    );
  }

  const { points, area, path, yTicks, xTicks } = data;

  return (
    <div className="bg-phantom-bg-secondary p-6 rounded-2xl border border-phantom-border">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-phantom-text-primary">YES Probability</h3>
        <span className="text-sm text-phantom-text-tertiary">Last: {(points[points.length - 1].p * 100).toFixed(1)}%</span>
      </div>
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="text-phantom-text-tertiary select-none">
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid and axes */}
            {yTicks.map((t, idx) => (
              <g key={idx}>
                <line x1={0} y1={t.y} x2={chartWidth} y2={t.y} stroke="currentColor" strokeOpacity="0.08" />
                <text x={-10} y={t.y} textAnchor="end" alignmentBaseline="middle" className="text-xs fill-current">
                  {(t.p * 100).toFixed(0)}%
                </text>
              </g>
            ))}
            <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="currentColor" strokeOpacity="0.2" />

            {xTicks.map((t, idx) => (
              <text key={idx} x={t.x} y={chartHeight + 18} textAnchor="middle" className="text-xs fill-current">
                {new Date(t.t).toLocaleDateString()}
              </text>
            ))}

            {/* Area */}
            <path d={area} fill="#22c55e" fillOpacity="0.12" />
            {/* Line */}
            <path d={path} fill="none" stroke="#22c55e" strokeWidth="2" />
          </g>
        </svg>
      </div>
      <p className="mt-2 text-xs text-phantom-text-tertiary">Computed from Polymarket YES mid-price over selected range.</p>
    </div>
  );
};

export default ProbabilityChart;


