export default function AuthBrand() {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <rect x="2" y="10" width="3" height="6" rx="1" fill="white" />
          <rect x="7.5" y="6" width="3" height="10" rx="1" fill="white" />
          <rect x="13" y="2" width="3" height="14" rx="1" fill="white" />
        </svg>
      </div>
      <span className="text-[17px] font-bold text-neutral-900 tracking-tight">
        BizFinance
      </span>
    </div>
  )
}
