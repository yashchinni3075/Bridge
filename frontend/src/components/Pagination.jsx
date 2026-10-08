import React, { useMemo } from 'react';

/**
 * Shared pagination footer.
 *
 * Expects the same `pagination` block every backend list endpoint now returns:
 * { page, limit, total, totalPages, hasPrevPage, hasNextPage }
 *
 * Renders nothing when there is a single page, so callers don't need to guard.
 *
 * `theme` matches the surrounding page: 'dark' (default) for the slate-950
 * dashboards, 'light' for the white cards used by ConnectionsHub.
 */
const PAGE_WINDOW = 5;

export default function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  disabled = false,
  label = 'results',
  theme = 'dark',
}) {
  const totalPages = pagination?.totalPages ?? 1;
  const page = pagination?.page ?? 1;
  const total = pagination?.total ?? 0;
  const limit = pagination?.limit ?? 10;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];
    const span = Math.min(PAGE_WINDOW, totalPages);
    const end = Math.min(totalPages, page + Math.floor(span / 2));
    const start = Math.max(1, end - span + 1);
    const out = [];
    for (let i = start; i <= end; i += 1) out.push(i);
    return out;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const isDark = theme === 'dark';

  const shell = isDark
    ? 'bg-slate-900/80 backdrop-blur-xl border-slate-800/80 shadow-xl'
    : 'bg-white border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const selectCls = isDark
    ? 'bg-slate-950/80 border-slate-800/80 text-white focus:border-indigo-500 shadow-inner'
    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500';
  const btnIdle = isDark
    ? 'border-slate-800 text-slate-300 hover:bg-slate-800/60'
    : 'border-slate-300 text-slate-700 hover:bg-slate-100';

  return (
    <div className={`${shell} border rounded-3xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4`}>
      <div className="flex items-center gap-3">
        <span className={`text-[11px] ${textMuted}`}>
          Showing {from}–{to} of {total} {label}
        </span>
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={disabled}
            aria-label={`${label} per page`}
            className={`${selectCls} border rounded-xl px-3 py-1.5 text-[11px] focus:outline-none transition disabled:opacity-40`}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        )}
      </div>

      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || !pagination.hasPrevPage}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${btnIdle}`}
        >
          Prev
        </button>

        {pageNumbers.map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            disabled={disabled}
            aria-current={n === page ? 'page' : undefined}
            className={`min-w-[32px] px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition disabled:cursor-not-allowed disabled:opacity-40 ${
              n === page
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/25'
                : `${btnIdle} disabled:hover:bg-transparent`
            }`}
          >
            {n}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || !pagination.hasNextPage}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${btnIdle}`}
        >
          Next
        </button>
      </nav>
    </div>
  );
}