const columns = [
  {
    heading: "Explore",
    links: ["For Entrepreneurs", "For Freelancers", "For Investors"],
  },
  {
    heading: "Company",
    links: ["About Us", "Blog", "Contact"],
  },
  {
    heading: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Help"],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#060b18] px-5 py-10 text-white md:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr]">
        <div>
          <a href="#top" className="flex items-center gap-2 text-lg font-extrabold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3157ff] text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-5 w-5">
                <path d="M12 3 3.5 18h5l3.5-6 3.5 6h5L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 18h5" strokeLinecap="round" />
              </svg>
            </span>
            Bridge
          </a>
          <p className="mt-3 max-w-xs text-sm font-medium leading-6 text-gray-400">
            Connecting founders, skills and capital for a better tomorrow.
          </p>
          <div className="mt-5 flex gap-2">
            {["f", "x", "in", "yt"].map((item) => (
              <span key={item} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[11px] font-bold text-gray-400">
                {item}
              </span>
            ))}
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <h3 className="text-sm font-black text-white">{column.heading}</h3>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm font-medium text-gray-400 transition hover:text-white">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="text-sm font-medium text-gray-400 md:text-right">
          (c) {year} Bridge. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
