import { formatCurrency, getCurrencySymbol, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const TransactionItem = ({ transaction }) => {
  const { user } = useAuth();
  const isSent = transaction.from_user_id === user.id;
  const isSwap = transaction.transaction_type === 'swap';

  const getIcon = () => {
    if (isSwap) {
      return (
        <div className="w-12 h-12 bg-gradient-gold border-2 border-gold-dark flex items-center justify-center shadow-gold-glow">
          <svg className="w-6 h-6 text-noir-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      );
    }
    
    if (isSent) {
      return (
        <div className="w-12 h-12 bg-deco-burgundy/20 border-2 border-deco-burgundy flex items-center justify-center">
          <svg className="w-6 h-6 text-deco-burgundy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-12 h-12 bg-deco-emerald/20 border-2 border-deco-emerald flex items-center justify-center">
        <svg className="w-6 h-6 text-deco-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
        </svg>
      </div>
    );
  };

  const getTitle = () => {
    if (isSwap) return 'Currency Swap';
    return isSent ? `Sent to ${transaction.to_username}` : `Received from ${transaction.from_username}`;
  };

  const getAmountClass = () => {
    if (isSwap) return 'text-gold';
    return isSent ? 'text-deco-burgundy' : 'text-deco-emerald';
  };

  const getAmountPrefix = () => {
    if (isSwap) return '';
    return isSent ? '-' : '+';
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-noir-charcoal/30 transition-all duration-200 border border-gold/10 hover:border-gold/30 group relative">
      <div className="absolute top-0 left-0 w-1 h-1 bg-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 right-0 w-1 h-1 bg-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex items-center space-x-4">
        <div className="transform transition-transform group-hover:scale-110">
          {getIcon()}
        </div>
        <div>
          <p className="font-bold text-gold uppercase tracking-wide text-sm">{getTitle()}</p>
          <p className="text-xs text-deco-silver/60">{formatDate(transaction.created_at)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${getAmountClass()}`}>
          {getAmountPrefix()}{getCurrencySymbol(transaction.currency)} {formatCurrency(transaction.amount)}
        </p>
        {transaction.description && (
          <p className="text-xs text-deco-silver/70 mt-0.5">{transaction.description}</p>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;
