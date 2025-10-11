export const formatCurrency = (amount, currency = 'phantom_coin') => {
  const formatted = parseFloat(amount).toFixed(2);
  return formatted;
};

export const getCurrencySymbol = (currency) => {
  switch (currency) {
    case 'phantom_coin':
      return 'PC';
    case 'stoneworks_dollar':
      return 'SW$';
    default:
      return '';
  }
};

export const getCurrencyName = (currency) => {
  switch (currency) {
    case 'phantom_coin':
      return 'PhantomCoin';
    case 'stoneworks_dollar':
      return 'Stoneworks Dollar';
    default:
      return currency;
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

