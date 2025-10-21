const Button = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  disabled = false,
  fullWidth = false,
  size = 'medium'
}) => {
  const baseClasses = 'font-bold tracking-wider uppercase transition-all duration-300 focus:outline-none relative overflow-hidden active:scale-[0.98] disabled:active:scale-100 border-2';
  
  const sizes = {
    small: 'px-4 py-2.5 text-sm',
    medium: 'px-6 py-3.5 text-base',
    large: 'px-8 py-4 text-lg'
  };

  const variants = {
    primary: 'bg-gradient-gold text-noir-black border-gold hover:shadow-gold-glow hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-metallic before:opacity-0 hover:before:opacity-100 before:transition-opacity before:-z-10 disabled:bg-noir-steel disabled:border-noir-steel disabled:text-deco-silver/50 disabled:cursor-not-allowed disabled:shadow-none disabled:opacity-50',
    secondary: 'bg-noir-charcoal text-gold border-gold/50 hover:border-gold hover:text-gold-light hover:shadow-glow-sm before:absolute before:inset-0 before:bg-gold/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:border-noir-steel disabled:text-deco-silver/50',
    ghost: 'bg-transparent text-deco-silver border-transparent hover:bg-noir-charcoal hover:text-gold hover:border-gold/30 disabled:cursor-not-allowed disabled:opacity-50',
    danger: 'bg-gradient-to-r from-deco-burgundy to-red-700 text-deco-cream border-deco-burgundy hover:shadow-[0_0_20px_rgba(128,0,32,0.5)] disabled:from-noir-steel disabled:to-noir-steel disabled:border-noir-steel disabled:cursor-not-allowed disabled:opacity-50'
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

