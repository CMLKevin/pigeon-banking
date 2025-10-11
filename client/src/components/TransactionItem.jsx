import { formatCurrency, getCurrencySymbol, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const TransactionItem = ({ transaction }) => {
  const { user } = useAuth();
  const isSent = transaction.from_user_id === user.id;
  const isSwap = transaction.transaction_type === 'swap';

  const getIcon = () => {
    if (isSwap) {
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      );
    }
    
    if (isSent) {
      return (
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-md">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
    if (isSwap) return 'text-cyan-400';
    return isSent ? 'text-phantom-error' : 'text-phantom-success';
  };

  const getAmountPrefix = () => {
    if (isSwap) return '';
    return isSent ? '-' : '+';
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-phantom-bg-tertiary rounded-2xl transition-all duration-200 border border-transparent hover:border-phantom-border group">
      <div className="flex items-center space-x-4">
        <div className="transform transition-transform group-hover:scale-110">
          {getIcon()}
        </div>
        <div>
          <p className="font-semibold text-phantom-text-primary">{getTitle()}</p>
          <p className="text-sm text-phantom-text-tertiary">{formatDate(transaction.created_at)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${getAmountClass()}`}>
          {getAmountPrefix()}{getCurrencySymbol(transaction.currency)} {formatCurrency(transaction.amount)}
        </p>
        {transaction.description && (
          <p className="text-sm text-phantom-text-secondary mt-0.5">{transaction.description}</p>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;
