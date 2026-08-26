export default function CTASection({ onRegister }) {
  return (
    <section id="join" className="px-5 py-6 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-7 rounded-2xl bg-[#3157ff]/10 border border-[#3157ff]/20 px-8 py-7 text-center shadow-sm md:flex-row md:text-left">
        <div className="flex flex-col items-center gap-5 md:flex-row">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#3157ff]/20 text-[#5b8aff] shadow-lg shadow-blue-500/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-9 w-9">
              <path d="M4.5 16.5c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.8-.8.8-2.2 0-3s-2.2-.8-3 0zM15 9l-3 3M9.5 6.5c1-1 2.5-2.5 4.5-3.5 3-1.5 6-1 6-1s.5 3-1 6c-1 2-2.5 3.5-3.5 4.5M14.5 14.5l-9-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black leading-tight text-white md:text-3xl">
              Ready to be part of the next <span className="text-[#5b8aff]">big innovation?</span>
            </h2>
            <p className="mt-2 text-base font-medium text-gray-400">
              Join Bridge today and turn opportunities into reality.
            </p>
          </div>
        </div>

        <button onClick={onRegister} className="w-full shrink-0 rounded-lg bg-[#3157ff] px-8 py-4 text-sm font-extrabold text-white shadow-xl shadow-blue-500/25 transition hover:bg-[#2447e8] md:w-auto">
          Register
        </button>
      </div>
    </section>
  );
}
