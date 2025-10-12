import { formatCurrency, getCurrencySymbol, getCurrencyName } from '../utils/formatters';

const WalletCard = ({ currency, balance, gradient }) => {
  const gradients = {
    agon: 'from-purple-600 via-purple-500 to-pink-500',
    stoneworks_dollar: 'from-cyan-500 via-blue-500 to-indigo-600'
  };

  const icons = {
    agon: (
      <svg className="w-8 h-8 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    stoneworks_dollar: (
      <svg className="w-8 h-8 text-white/90" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
        <circle cx="12" cy="7" r="1" fill="currentColor"/>
        <circle cx="12" cy="17" r="1" fill="currentColor"/>
        <circle cx="7" cy="12" r="1" fill="currentColor"/>
        <circle cx="17" cy="12" r="1" fill="currentColor"/>
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
