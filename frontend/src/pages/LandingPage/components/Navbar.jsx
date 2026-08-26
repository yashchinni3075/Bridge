export default function Navbar({ onLogin, onRegister }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0f1e]/95 px-5 py-4 backdrop-blur md:px-10 md:py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="#top" className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3157ff] text-white shadow-lg shadow-blue-500/25">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-6 w-6">
              <path d="M12 3 3.5 18h5l3.5-6 3.5 6h5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 18h5" strokeLinecap="round" />
            </svg>
          </span>
          Bridge
        </a>

        <nav className="hidden items-center gap-10 text-sm font-bold text-gray-300 lg:flex">
          <a href="#top" className="text-[#5b8aff] transition hover:text-[#3157ff]">Home</a>
          <a href="#roles" className="transition hover:text-[#5b8aff]">For Entrepreneurs</a>
          <a href="#roles" className="transition hover:text-[#5b8aff]">For Freelancers</a>
          <a href="#roles" className="transition hover:text-[#5b8aff]">For Investors</a>
          <a href="#process" className="transition hover:text-[#5b8aff]">How it Works</a>
          <a href="#features" className="transition hover:text-[#5b8aff]">About</a>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <button
            onClick={onLogin}
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-gray-200 shadow-sm transition hover:border-[#3157ff] hover:text-[#5b8aff]"
          >
            Log in
          </button>
          <button
            onClick={onRegister}
            className="rounded-xl bg-[#3157ff] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#2447e8]"
          >
            Register
          </button>
        </div>

        <button className="rounded-xl border border-white/15 p-2.5 text-gray-300 md:hidden" aria-label="Open menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
