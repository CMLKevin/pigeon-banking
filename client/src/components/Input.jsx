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
        <label className="block text-sm font-semibold text-phantom-text-primary mb-2.5">
          {label}
          {required && <span className="text-phantom-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-phantom-text-tertiary">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-4 rounded-2xl border-2 bg-phantom-bg-secondary text-phantom-text-primary placeholder:text-phantom-text-tertiary transition-all duration-200 ${
            error 
              ? 'border-phantom-error focus:border-phantom-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' 
              : 'border-phantom-border hover:border-phantom-border-light focus:border-phantom-accent-primary focus:shadow-input'
          } focus:outline-none`}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-phantom-error flex items-center gap-1.5">
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

