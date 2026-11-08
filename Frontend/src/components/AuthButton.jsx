export default function AuthButton({
  type = 'submit',
  loading = false,
  disabled = false,
  fullWidth = true,
  children,
  onClick,
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={`
        flex items-center justify-center gap-2 h-11 px-5 rounded-lg
        text-sm font-semibold text-white border-none
        transition-colors duration-150 select-none
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled
          ? 'bg-neutral-500 cursor-not-allowed'
          : 'bg-neutral-900 hover:bg-neutral-800 cursor-pointer'}
      `}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0"
        />
      )}
      {children}
    </button>
  )
}
