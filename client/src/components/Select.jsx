const Select = ({ label, value, onChange, options, required = false, error = null }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-phantom-text-primary mb-2.5">
          {label}
          {required && <span className="text-phantom-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full px-4 py-4 pr-12 rounded-2xl border-2 bg-phantom-bg-secondary text-phantom-text-primary transition-all duration-200 appearance-none cursor-pointer ${
            error 
              ? 'border-phantom-error focus:border-phantom-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' 
              : 'border-phantom-border hover:border-phantom-border-light focus:border-phantom-accent-primary focus:shadow-input'
          } focus:outline-none`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-phantom-bg-secondary text-phantom-text-primary">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-phantom-text-tertiary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

export default Select;

