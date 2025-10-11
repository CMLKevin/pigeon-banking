const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false,
  fullWidth = false,
  size = 'medium'
}) => {
  const baseClasses = 'rounded-2xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-phantom-bg-primary active:scale-[0.98] disabled:active:scale-100';
  
  const sizes = {
    small: 'px-4 py-2.5 text-sm',
    medium: 'px-6 py-3.5 text-base',
    large: 'px-8 py-4 text-lg'
  };

  const variants = {
    primary: 'bg-gradient-phantom text-white hover:shadow-glow hover:scale-[1.02] focus:ring-phantom-accent-primary disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-50',
    secondary: 'bg-phantom-bg-secondary text-phantom-text-primary border-2 border-phantom-border-light hover:border-phantom-accent-primary hover:text-phantom-accent-primary hover:shadow-glow-sm focus:ring-phantom-accent-primary disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-phantom-text-secondary hover:bg-phantom-bg-secondary hover:text-phantom-text-primary focus:ring-phantom-border-light disabled:cursor-not-allowed disabled:opacity-50',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] focus:ring-red-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed disabled:opacity-50'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${widthClass}`}
    >
      {children}
    </button>
  );
};

export default Button;

