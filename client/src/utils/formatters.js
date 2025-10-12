export const formatCurrency = (amount, currency = 'agon') => {
  const formatted = parseFloat(amount).toFixed(2);
  return formatted;
};

export const getCurrencySymbol = (currency) => {
  switch (currency) {
    case 'agon':
      return 'Ⱥ';
    case 'stoneworks_dollar':
      return 'SW$';
    default:
      return '';
  }
};

export const getCurrencyName = (currency) => {
  switch (currency) {
    case 'agon':
      return 'Agon';
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

