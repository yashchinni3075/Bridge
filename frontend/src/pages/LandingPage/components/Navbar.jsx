export default function Navbar({ onLogin }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-100/70 bg-white/95 px-5 py-2.5 backdrop-blur md:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <a href="#top" className="flex items-center gap-2 text-base font-extrabold tracking-tight text-[#07142f]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3157ff] text-white shadow-lg shadow-blue-500/25">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5">
              <path d="M12 3 3.5 18h5l3.5-6 3.5 6h5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 18h5" strokeLinecap="round" />
            </svg>
          </span>
          Bridge
        </a>

        <nav className="hidden items-center gap-8 text-[11px] font-bold text-slate-700 lg:flex">
          <a href="#top" className="text-[#3157ff] transition hover:text-[#1738d6]">Home</a>
          <a href="#roles" className="transition hover:text-[#3157ff]">For Entrepreneurs</a>
          <a href="#roles" className="transition hover:text-[#3157ff]">For Freelancers</a>
          <a href="#roles" className="transition hover:text-[#3157ff]">For Investors</a>
          <a href="#process" className="transition hover:text-[#3157ff]">How it Works</a>
          <a href="#features" className="transition hover:text-[#3157ff]">About</a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={onLogin}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold text-[#07142f] shadow-sm transition hover:border-blue-200 hover:text-[#3157ff]"
          >
            Log in
          </button>
          <button className="rounded-lg bg-[#3157ff] px-4 py-2 text-[11px] font-bold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#2447e8]">
            Get Started -&gt;
          </button>
        </div>

        <button className="rounded-lg border border-blue-100 p-2 text-[#07142f] md:hidden" aria-label="Open menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}