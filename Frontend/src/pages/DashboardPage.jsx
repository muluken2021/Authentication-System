import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-neutral-200 h-15 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-neutral-900 rounded-lg flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="2" y="10" width="3" height="6" rx="1" fill="white"/>
              <rect x="7.5" y="6" width="3" height="10" rx="1" fill="white"/>
              <rect x="13" y="2" width="3" height="14" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="text-[16px] font-bold text-neutral-900 tracking-tight">BizFinance</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-500">{user?.fullName ?? user?.email}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-8 py-12 w-full max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">
          Welcome, {user?.fullName?.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="text-neutral-500 mb-10 text-sm">Your BizFinance dashboard is ready.</p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {['Income', 'Expenses', 'Invoices', 'Reports'].map(item => (
            <div key={item} className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
              <p className="text-xs text-neutral-400 mb-2">{item}</p>
              <p className="text-2xl font-bold text-neutral-900">—</p>
            </div>
          ))}
        </div>

        {/* Auth status banner */}
        <div className="bg-neutral-900 rounded-xl px-5 py-4 text-sm text-white flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-green-400">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <span>
            Authenticated as <strong>{user?.email}</strong>
            {user?.authProvider === 'google' && (
              <span className="ml-1 text-neutral-400">(Google)</span>
            )}
          </span>
        </div>
      </main>
    </div>
  )
}
