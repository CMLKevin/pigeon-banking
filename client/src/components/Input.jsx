const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  required = false,
  error = null,
  min,
  max,
  step,
  icon = null
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-gold tracking-wide uppercase mb-3">
          {label}
          {required && <span className="text-deco-burgundy ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 group-focus-within:text-gold transition-colors">
            {icon}
          </div>
        )}
        {/* Art deco corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold/30 group-focus-within:border-gold transition-colors"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold/30 group-focus-within:border-gold transition-colors"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold/30 group-focus-within:border-gold transition-colors"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold/30 group-focus-within:border-gold transition-colors"></div>
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className={`w-full ${icon ? 'pl-12' : 'pl-5'} pr-5 py-4 border-2 bg-noir-charcoal text-deco-cream placeholder:text-deco-silver/40 transition-all duration-300 ${
            error 
              ? 'border-deco-burgundy focus:border-deco-burgundy shadow-[0_0_0_3px_rgba(128,0,32,0.2)]' 
              : 'border-gold/30 hover:border-gold/50 focus:border-gold shadow-inset-deco focus:shadow-gold-glow'
          } focus:outline-none`}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-deco-burgundy flex items-center gap-2 font-medium">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;

