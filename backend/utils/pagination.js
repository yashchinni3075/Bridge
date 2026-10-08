/**
 * Shared pagination helpers.
 *
 * Every paginated endpoint in the app parses its `page`/`limit` query params
 * through `parsePagination` so the response shape and the clamping rules stay
 * identical across modules. Nothing here trusts client input: `limit` is always
 * bounded, so a hand-crafted query cannot ask for an unbounded scan.
 */

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Parses a query value as an integer, falling back only when it is not numeric
// at all. Keeps "0" and "-5" as real numbers so they get clamped rather than
// silently becoming the default (which is what `parseInt(x) || fallback` does).
const toIntOr = (value, fallback) => {
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

/**
 * Reads `page` & `limit` off a request query.
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const parsePagination = (query = {}, { defaultLimit = DEFAULT_PAGE_SIZE, maxLimit = MAX_PAGE_SIZE } = {}) => {
  const page = Math.max(1, toIntOr(query.page, 1));
  const limit = Math.min(Math.max(1, toIntOr(query.limit, defaultLimit)), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Builds the `pagination` block returned alongside a page of results.
 * `totalPages` is always >= 1 so the UI never has to divide by zero.
 */
export const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    // `pages` kept as an alias so existing notification consumers keep working.
    pages: totalPages,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  };
};

/**
 * Applies `.skip()`/`.limit()` to a Mongoose query.
 * Pass the pre-count query (same filter, no skip/limit) so `total` and the page
 * of rows are always derived from an identical filter.
 */
export const applyPagination = (query, { skip, limit }) =>
  query.skip(skip).limit(limit);

/**
 * One-call helper for the common "count, then fetch a page" pattern.
 * @param countQuery a query with the same filter but no skip/limit (e.g. Model.find(filter))
 * @param fetchQuery  a query returning the rows (e.g. Model.find(filter).sort(...).populate(...))
 */
export const paginateQuery = async (countQuery, fetchQuery, pagination) => {
  const { page, limit, skip } = pagination;
  const [total, rows] = await Promise.all([
    countQuery.countDocuments(),
    applyPagination(fetchQuery, { skip, limit }),
  ]);
  return { rows, total, meta: buildPaginationMeta({ page, limit, total }) };
};

/**
 * Escapes a user-supplied string before it is used inside a Mongo `$regex`.
 * Without this, input such as "(" is an invalid pattern and Mongo rejects the
 * entire query (HTTP 500).
 */
export const escapeRegex = (value) =>
  String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');