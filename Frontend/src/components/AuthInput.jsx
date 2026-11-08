import { useState } from 'react'

export default function AuthInput({
  label,
  id,
  error,
  hint,
  rightSlot,
  required = false,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false)

  const borderClass = error
    ? 'border-red-400 bg-red-50'
    : focused
    ? 'border-neutral-900'
    : 'border-neutral-300'

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-900 mb-1.5 select-none">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          {...inputProps}
          onFocus={e => { setFocused(true); inputProps.onFocus?.(e) }}
          onBlur={e => { setFocused(false); inputProps.onBlur?.(e) }}
          className={`
            w-full h-11 rounded-lg border-[1.5px] text-sm text-neutral-900
            bg-white outline-none transition-colors duration-150
            placeholder:text-neutral-400
            ${rightSlot ? 'pl-3.5 pr-11' : 'px-3.5'}
            ${borderClass}
          `}
        />

        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-500 leading-snug">{error}</p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-xs text-neutral-500 leading-snug">{hint}</p>
      )}
    </div>
  )
}
