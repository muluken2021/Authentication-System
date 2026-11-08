import AuthBrand from './AuthBrand.jsx'
import AuthPreview from './AuthPreview.jsx'

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white overflow-hidden">
      {/* ── Left panel — auth form ── */}
      <div className="flex flex-col w-full lg:w-[52%] xl:w-[48%] px-8 py-10 sm:px-14 lg:px-16 overflow-y-auto">
        <AuthBrand />

        {/* Vertically centred form area */}
        <div className="flex flex-1 flex-col justify-center w-full max-w-[400px] mx-auto py-10">
          {children}
        </div>
      </div>

      {/* ── Right panel — dashboard preview ── */}
      <div className="hidden lg:flex flex-1 bg-neutral-100 items-center justify-center p-10">
        <AuthPreview />
      </div>
    </div>
  )
}
