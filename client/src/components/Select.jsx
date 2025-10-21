const Select = ({ label, value, onChange, options, required = false, error = null }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-gold tracking-wide uppercase mb-3">
          {label}
          {required && <span className="text-deco-burgundy ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {/* Art deco corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gold/30 group-focus-within:border-gold transition-colors z-10"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gold/30 group-focus-within:border-gold transition-colors z-10"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gold/30 group-focus-within:border-gold transition-colors z-10"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gold/30 group-focus-within:border-gold transition-colors z-10"></div>
        
        <select
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full px-5 py-4 pr-12 border-2 bg-noir-charcoal text-deco-cream transition-all duration-300 appearance-none cursor-pointer ${
            error 
              ? 'border-deco-burgundy focus:border-deco-burgundy shadow-[0_0_0_3px_rgba(128,0,32,0.2)]' 
              : 'border-gold/30 hover:border-gold/50 focus:border-gold shadow-inset-deco focus:shadow-gold-glow'
          } focus:outline-none`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-noir-charcoal text-deco-cream">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gold/60 group-focus-within:text-gold transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

export default Select;

