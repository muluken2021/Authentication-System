/* Static sample data — no API calls */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const BALANCE_POINTS = [62, 70, 78, 72, 84, 91]
const INCOME_BARS    = [55, 70, 60, 80, 65, 90]
const EXPENSE_BARS   = [40, 50, 45, 60, 50, 70]

function Sparkline({ data, color }) {
  const W = 240, H = 52
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / 100) * H}`).join(' ')
  const fill = `0,${H} ${pts} ${W},${H}`
  const id = `sg${color.replace('#', '')}`
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function NavItem({ children, active = false }) {
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${active ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-neutral-600'}`}>
      {children}
    </div>
  )
}

export default function AuthPreview() {
  return (
    <div
      className="w-full max-w-[360px] bg-white rounded-2xl overflow-hidden flex shadow-2xl"
      role="img"
      aria-label="BizFinance dashboard preview"
    >
      {/* Sidebar */}
      <div className="w-12 shrink-0 bg-neutral-50 border-r border-neutral-100 flex flex-col items-center py-4 px-1.5 gap-2">
        {/* Logo */}
        <div className="w-7 h-7 bg-neutral-900 rounded-md flex items-center justify-center mb-2 shrink-0">
          <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <rect x="2" y="10" width="3" height="6" rx="1" fill="white" />
            <rect x="7.5" y="6" width="3" height="10" rx="1" fill="white" />
            <rect x="13" y="2" width="3" height="14" rx="1" fill="white" />
          </svg>
        </div>
        <NavItem active>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
        </NavItem>
        <NavItem>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        </NavItem>
        <NavItem>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </NavItem>
        <NavItem>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </NavItem>
        <NavItem>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </NavItem>
        <div className="flex-1" />
        <NavItem>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </NavItem>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-hidden">
        {/* Balance */}
        <div className="mb-3.5">
          <p className="text-[9px] text-neutral-400 font-medium tracking-widest uppercase mb-1">Your balance</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[19px] font-bold text-neutral-900 tracking-tight">$48,295.64</span>
            <span className="bg-green-100 text-green-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap">
              ↗ +3.4%
            </span>
          </div>
        </div>

        {/* Total balance chart */}
        <div className="mb-3.5">
          <p className="text-[8px] font-semibold text-neutral-400 tracking-widest uppercase mb-1.5">Total Balance</p>
          <div className="flex justify-between mb-1">
            {['$200k','$160k','$120k','$80k','$40k','$0'].map(l => (
              <span key={l} className="text-[7px] text-neutral-300">{l}</span>
            ))}
          </div>
          <div className="h-14 w-full">
            <Sparkline data={BALANCE_POINTS} color="#171717" />
          </div>
          <div className="flex justify-between mt-1">
            {MONTHS.map(m => (
              <span key={m} className="text-[7px] text-neutral-400">{m}</span>
            ))}
          </div>
        </div>

        {/* Cash in / cash out */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[8px] font-semibold text-neutral-400 tracking-widest uppercase">Cash In &amp; Out</p>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[7px] text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-sm bg-lime-400 inline-block" />Income
              </span>
              <span className="flex items-center gap-1 text-[7px] text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-sm bg-neutral-300 inline-block" />Expense
              </span>
            </div>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-16">
            {MONTHS.map((m, i) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="flex items-end gap-0.5 h-[52px]">
                  <div
                    className="w-2 bg-lime-400 rounded-t-sm"
                    style={{ height: `${(INCOME_BARS[i] / 100) * 52}px` }}
                  />
                  <div
                    className="w-2 bg-neutral-300 rounded-t-sm"
                    style={{ height: `${(EXPENSE_BARS[i] / 100) * 52}px` }}
                  />
                </div>
                <span className="text-[7px] text-neutral-400">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly overview */}
        <div className="flex gap-2 mt-3.5 pt-3 border-t border-neutral-100">
          {[
            { label: 'Income',   value: '$12.4k', color: 'text-green-600' },
            { label: 'Expenses', value: '$8.1k',  color: 'text-red-500'   },
            { label: 'Net',      value: '+$4.3k', color: 'text-neutral-900'},
          ].map(item => (
            <div key={item.label} className="flex-1 text-center">
              <p className="text-[7px] text-neutral-400 mb-0.5">{item.label}</p>
              <p className={`text-[10px] font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
