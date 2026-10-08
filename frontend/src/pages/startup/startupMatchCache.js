/**
 * Module-level cache for the startup module's match feeds.
 *
 * Every one of these endpoints runs a full cosine-similarity ranking, and the
 * AI-enriched variants add a multi-second Gemini round-trip on top of that. The
 * discovery pages are route components, so switching between nav options
 * unmounts and remounts them. Without a cache each switch re-requested the same
 * ranking and flashed "Computing cosine similarity..." every time.
 *
 * Results are keyed by signed-in user id + endpoint, which means:
 *   - switching accounts can never reuse another account's results, and
 *   - the dashboard home cards and the Discover pages share one entry, because
 *     they read the same payloads.
 */
import api from '../../services/api';

const cache = new Map();
const inflight = new Map();

const currentUserId = () => {
  try {
    return JSON.parse(localStorage.getItem('bridge_user') || 'null')?._id?.toString() || null;
  } catch {
    return null;
  }
};

const keyFor = (endpoint) => {
  const userId = currentUserId();
  return userId ? `${userId}::${endpoint}` : null;
};

/**
 * Cached feed for an endpoint, or null when nothing is cached (or the user id
 * is unavailable, in which case nothing is ever cached).
 *
 * Used as a lazy useState initialiser so a remount paints the previous results
 * immediately instead of showing the computing placeholder.
 */
export const getCachedFeed = (endpoint) => {
  const key = keyFor(endpoint);
  return key ? cache.get(key) || null : null;
};

/**
 * Fetch a match feed, reusing the cached copy unless `force` is set.
 *
 * An in-flight request is also shared, so React 18 StrictMode's double-mount in
 * development - and the dashboard home cards racing this page on first paint -
 * cannot each pay for a separate Gemini call.
 */
export const fetchStartupFeed = async (endpoint, { force = false, params } = {}) => {
  const key = keyFor(endpoint);

  if (!force && key && cache.has(key)) return cache.get(key);
  if (!force && key && inflight.has(key)) return inflight.get(key);

  const request = api
    .get(endpoint, { params })
    .then((res) => {
      const feed = {
        matches: [...(res.data?.matches || [])].sort(
          (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
        ),
        emptyReason: res.data?.emptyReason || null,
        message: res.data?.message || '',
      };
      if (key) cache.set(key, feed);
      return feed;
    })
    .finally(() => {
      if (key) inflight.delete(key);
    });

  if (key) inflight.set(key, request);
  return request;
};

/**
 * Drop every cached feed for the signed-in startup. Called after the profile is
 * saved so a new domain, stage or set of open roles is reflected immediately -
 * those fields feed the tag vector the ranking is built from.
 */
export const clearStartupMatchCache = () => {
  const userId = currentUserId();
  if (!userId) return;
  for (const key of [...cache.keys()]) {
    if (key.startsWith(`${userId}::`)) cache.delete(key);
  }
};
