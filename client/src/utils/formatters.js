export const formatCurrency = (amount, currency = 'agon') => {
  const formatted = Number(parseFloat(amount) || 0).toFixed(2);
  return formatted;
};

export const getCurrencySymbol = (currency) => {
  switch (currency) {
    case 'agon':
      return '₷';
    case 'stoneworks_dollar':
      return '◉';
    default:
      return '';
  }
};

export const getCurrencyName = (currency) => {
  switch (currency) {
    case 'agon':
      return 'Stoneworks Dollars (₷)';
    case 'stoneworks_dollar':
      return 'Game Chips';
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

