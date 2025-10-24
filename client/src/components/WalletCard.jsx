import { formatCurrency, getCurrencySymbol, getCurrencyName } from '../utils/formatters';

const WalletCard = ({ currency, balance, gradient }) => {
  const gradients = {
    agon: 'bg-gradient-gold',
    stoneworks_dollar: 'bg-gold-bronze'
  };

  const icons = {
    agon: (
      <svg className="w-8 h-8 text-noir-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    stoneworks_dollar: (
      <svg className="w-8 h-8 text-noir-black" fill="currentColor" viewBox="0 0 24 24">
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
    <div className={`${gradients[currency]} p-6 shadow-gold-glow hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden group border-2 border-gold-dark`}>
      {/* Art deco corner decorations */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-noir-black"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-noir-black"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-noir-black"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-noir-black"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-noir-black/70 text-xs font-bold uppercase tracking-widest mb-2">Balance</p>
            <h2 className="text-5xl font-bold tracking-tight text-noir-black">
              {getCurrencySymbol(currency)} {formatCurrency(balance)}
            </h2>
          </div>
          <div className="w-14 h-14 bg-noir-black/20 backdrop-blur-sm border-2 border-noir-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {icons[currency]}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-noir-black font-bold text-lg uppercase tracking-wider">{getCurrencyName(currency)}</p>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-noir-black/40 transform rotate-45"></div>
            <div className="w-2 h-2 bg-noir-black/40 transform rotate-45"></div>
            <div className="w-2 h-2 bg-noir-black/40 transform rotate-45"></div>
            <div className="w-2 h-2 bg-noir-black transform rotate-45 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;
