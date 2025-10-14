import React, { useMemo } from 'react';

const QuoteChart = ({ quotes, side = 'both' }) => {
  // Dimensions
  const width = 600;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const chartData = useMemo(() => {
    if (!quotes || quotes.length === 0) return null;

    // Sort quotes by timestamp
    const sortedQuotes = [...quotes].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    // Get price range
    const allPrices = sortedQuotes.flatMap(q => {
      const prices = [];
      if (side === 'yes' || side === 'both') {
        if (q.yes_bid) prices.push(parseFloat(q.yes_bid));
        if (q.yes_ask) prices.push(parseFloat(q.yes_ask));
      }
      if (side === 'no' || side === 'both') {
        if (q.no_bid) prices.push(parseFloat(q.no_bid));
        if (q.no_ask) prices.push(parseFloat(q.no_ask));
      }
      return prices;
    });

    const minPrice = Math.max(0, Math.min(...allPrices) - 0.05);
    const maxPrice = Math.min(1, Math.max(...allPrices) + 0.05);
    const priceRange = maxPrice - minPrice;

    // Scale functions
    const scaleX = (index) => (index / (sortedQuotes.length - 1)) * chartWidth;
    const scaleY = (price) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;

    // Generate paths
    const generatePath = (dataAccessor) => {
      return sortedQuotes
        .map((q, i) => {
          const value = dataAccessor(q);
          if (value === null || value === undefined) return null;
          const x = scaleX(i);
          const y = scaleY(parseFloat(value));
          return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
        })
        .filter(Boolean)
        .join(' ');
    };

    return {
      sortedQuotes,
      minPrice,
      maxPrice,
      yesBidPath: side === 'yes' || side === 'both' ? generatePath(q => q.yes_bid) : null,
      yesAskPath: side === 'yes' || side === 'both' ? generatePath(q => q.yes_ask) : null,
      noBidPath: side === 'no' || side === 'both' ? generatePath(q => q.no_bid) : null,
      noAskPath: side === 'no' || side === 'both' ? generatePath(q => q.no_ask) : null,
      scaleX,
      scaleY
    };
  }, [quotes, side, chartWidth, chartHeight]);

  if (!chartData || quotes.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 bg-phantom-bg-secondary rounded-2xl border border-phantom-border">
        <p className="text-phantom-text-tertiary">Not enough quote history to display chart</p>
      </div>
    );
  }

  const { sortedQuotes, minPrice, maxPrice, yesBidPath, yesAskPath, noBidPath, noAskPath } = chartData;

  // Y-axis labels
  const yAxisLabels = [maxPrice, (maxPrice + minPrice) / 2, minPrice];

  return (
    <div className="bg-phantom-bg-secondary p-6 rounded-2xl border border-phantom-border">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-phantom-text-primary">Price History</h3>
        <div className="flex gap-4 text-sm">
          {(side === 'yes' || side === 'both') && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-phantom-text-secondary">YES</span>
            </div>
          )}
          {(side === 'no' || side === 'both') && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-phantom-text-secondary">NO</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="text-phantom-text-tertiary">
          <g transform={`translate(${padding.left}, ${padding.top})`}>
            {/* Grid lines */}
            {yAxisLabels.map((price, i) => {
              const y = chartData.scaleY(price);
              return (
                <g key={i}>
                  <line
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={-10}
                    y={y}
                    textAnchor="end"
                    alignmentBaseline="middle"
                    className="text-xs fill-current"
                  >
                    {price.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* X-axis */}
            <line
              x1={0}
              y1={chartHeight}
              x2={chartWidth}
              y2={chartHeight}
              stroke="currentColor"
              strokeOpacity="0.2"
            />

            {/* Y-axis */}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={chartHeight}
              stroke="currentColor"
              strokeOpacity="0.2"
            />

            {/* Time labels */}
            {sortedQuotes.filter((_, i) => i % Math.ceil(sortedQuotes.length / 5) === 0).map((quote, i) => {
              const index = sortedQuotes.indexOf(quote);
              const x = chartData.scaleX(index);
              const time = new Date(quote.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              return (
                <text
                  key={i}
                  x={x}
                  y={chartHeight + 25}
                  textAnchor="middle"
                  className="text-xs fill-current"
                >
                  {time}
                </text>
              );
            })}

            {/* Chart lines */}
            {yesBidPath && (
              <path
                d={yesBidPath}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                strokeOpacity="0.6"
                strokeDasharray="4 4"
              />
            )}
            {yesAskPath && (
              <path
                d={yesAskPath}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              />
            )}
            {noBidPath && (
              <path
                d={noBidPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeOpacity="0.6"
                strokeDasharray="4 4"
              />
            )}
            {noAskPath && (
              <path
                d={noAskPath}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />
            )}
          </g>
        </svg>
      </div>

      <div className="mt-4 text-xs text-phantom-text-tertiary">
        <p>Solid line = Ask price (buy price) • Dashed line = Bid price (sell price)</p>
        <p className="mt-1">Showing last {sortedQuotes.length} quotes</p>
      </div>
    </div>
  );
};

export default QuoteChart;

