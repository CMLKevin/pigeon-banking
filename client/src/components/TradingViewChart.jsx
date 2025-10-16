import { useEffect, useRef, memo } from 'react';

function TradingViewChart({ symbol = 'BTCUSD', theme = 'dark', height = 500 }) {
  const container = useRef();

  useEffect(() => {
    // Clear any existing content
    if (container.current) {
      container.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      support_host: 'https://www.tradingview.com',
      backgroundColor: theme === 'dark' ? 'rgba(19, 23, 34, 1)' : 'rgba(255, 255, 255, 1)',
      gridColor: theme === 'dark' ? 'rgba(42, 46, 57, 0.5)' : 'rgba(0, 0, 0, 0.1)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      studies: []
    });

    if (container.current) {
      container.current.appendChild(script);
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: `${height}px`, width: '100%' }}>
      <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }}></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewChart);
