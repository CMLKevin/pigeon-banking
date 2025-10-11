import { formatCurrency, getCurrencySymbol, getCurrencyName } from '../utils/formatters';

const WalletCard = ({ currency, balance, gradient }) => {
  const gradients = {
    phantom_coin: 'from-purple-600 via-purple-500 to-pink-500',
    stoneworks_dollar: 'from-cyan-500 via-blue-500 to-indigo-600'
  };

  const icons = {
    phantom_coin: (
      <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    stoneworks_dollar: (
      <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  return (
    <div className={`bg-gradient-to-br ${gradients[currency]} rounded-3xl p-6 text-white shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden group`}>
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-white/80 text-sm font-medium mb-2">Balance</p>
            <h2 className="text-4xl font-bold tracking-tight">
              {getCurrencySymbol(currency)} {formatCurrency(balance)}
            </h2>
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {icons[currency]}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-white/90 font-semibold text-lg">{getCurrencyName(currency)}</p>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-white/40 rounded-full"></div>
            <div className="w-2 h-2 bg-white/40 rounded-full"></div>
            <div className="w-2 h-2 bg-white/40 rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
