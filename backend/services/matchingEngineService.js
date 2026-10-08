/**
 * AI-Based Matching Engine (Section 4.4 of the BRIDGE research paper)
 *
 * Every freelancer and startup hiring opportunity is represented as a vector
 * over a SHARED VOCABULARY of normalized tags (skills, job role, domain,
 * interests, professional text, candidate criteria, startup info).
 * Cosine similarity is then computed between the freelancer vector and each
 * hiring vector to rank the most relevant matches.
 *
 * Architecture notes:
 *  - The engine is bidirectional by design: `computeCosineMatches` is generic,
 *    so the Startup -> Freelancer direction can reuse the same cosine engine.
 *  - No ML training data, no external APIs, no additive component formulas.
 *    The final match score is strictly cosine similarity over tag vectors.
 *    Vectors are WEIGHTED: curated fields (required skills, domain, job title)
 *    contribute with higher multiplicity than free-text tokens, so a long
 *    description cannot drown out an exact skill match. Weights are applied
 *    via the tag builders (`getFreelancerTagWeights` / `getHiringTagWeights`).
 *  - Eligibility requirements (experience, education, certification) are
 *    evaluated SEPARATELY from the cosine score. They never add points to or
 *    subtract points from the cosine-based match score.
 */

// ---------------------------------------------------------------------------
// Normalization / synonym mapping
// ---------------------------------------------------------------------------
//
// A controlled vocabulary used to collapse spelling, casing, abbreviation and
// format variations into a single canonical tag so that the same skill is not
// treated as many different vector dimensions.
//
//   "SQL"      -> "sql"
//   "React.js" -> "react"
//   "ReactJS"  -> "react"
//   "JS"       -> "javascript"
//   "Java Script" -> "javascript"
//   "ML"       -> "machine learning"
//   "AI"       -> "artificial intelligence"

const WORD_PATTERNS = [
  // React variants must run before the generic "js" rule.
  { re: /\breact\.?js\b/g, to: 'react' },
  { re: /\breact\s+?js\b/g, to: 'react' },
  // "Java Script" (two words) must run before generic "java" is left alone.
  { re: /\bjava\s+script\b/g, to: 'javascript' },
  { re: /\bjs\b/g, to: 'javascript' },
  { re: /\bml\b/g, to: 'machine learning' },
  // AI compound patterns must run before generic "ai"
  { re: /ai[- ]?(powered|driven|enabled|first|native|centric)\b/gi, to: 'artificial intelligence' },
  { re: /\bai\b/g, to: 'artificial intelligence' },
  { re: /\bc\+\+\b/g, to: 'c plus plus' },
  { re: /\bc#\b/g, to: 'c sharp' },
  { re: /\b\.net\b/g, to: 'dotnet' },
  { re: /\bnode\.?js\b/g, to: 'node' },
  { re: /\bangularjs\b/g, to: 'angular' },
  { re: /\btypescript\b/g, to: 'typescript' },
];

const canonicalize = (value) => {
  if (value === null || value === undefined) return null;
  let tag = value.toString().trim().toLowerCase().replace(/\s+/g, ' ');
  if (!tag) return null;
  for (const { re, to } of WORD_PATTERNS) {
    tag = tag.replace(re, to);
  }
  return tag || null;
};

// ---------------------------------------------------------------------------
// Free-text tokenization
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'for', 'to', 'with',
  'at', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'being', 'been', 'it',
  'its', 'this', 'that', 'these', 'those', 'we', 'you', 'they', 'he', 'she',
  'from', 'up', 'down', 'about', 'into', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'can', 'will', 'just', 'should', 'would', 'could', 'may', 'might', 'must',
  'new', 'good', 'great', 'looking', 'looking for', 'please', 'like', 'etc',
  'e.g.', 'ie', 'via', 'using', 'use', 'used', 'including', 'include',
  'build', 'built', 'working', 'work', 'need', 'needs', 'required',
]);

const tokenizeText = (text) => {
  const tags = new Set();
  if (!text) return [...tags];
  const raw = text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return [...tags];
  for (const word of raw.split(' ')) {
    if (STOPWORDS.has(word)) continue;
    let canon = canonicalize(word.replace(/\.+$/, ''));
    if (canon) {
        // Gentle plural handling for free-text tokens so that "APIs" and "API"
        // (and "systems"/"system") map to a single dimension. Avoids common
        // false positives like "ss"/"us" endings or very short words.
        if (canon.endsWith('s') && !canon.endsWith('ss') && !canon.endsWith('us') && canon.length > 3) {
          canon = canon.slice(0, -1);
        }
        // Drop very short tokens (single chars like "s") that create noise in
        // the vector without adding match signal.
        if (canon.length < 3) continue;
        tags.add(canon);
      }
  }
  return [...tags];
};

/**
 * Normalize a list of raw tags into a deduplicated set of canonical tags.
 * Each structured value is kept whole (a phrase like "Data Engineering" stays
 * one tag) and run through the controlled synonym mapping.
 */
export const normalizeTagList = (values) => {
  const tags = new Set();
  for (const value of values || []) {
    const tag = canonicalize(value);
    if (tag) tags.add(tag);
  }
  return [...tags];
};

// ---------------------------------------------------------------------------
// Shared tag weighting helpers
// ---------------------------------------------------------------------------
//
// The cosine engine stays a pure `dot / (||A|| * ||B||)` computation over a
// shared vocabulary, but the VECTORS are no longer flat binary. Structured,
// curated fields (required skills, domain, job title) are the primary match
// signal and therefore contribute with a higher multiplicity than tokens
// derived from free text (bio / description) so that a description stuffed
// with generic words cannot drown out an exact skill match.

// Weight for a tag contributed by a given field. Curated fields weigh more.
const WEIGHTS = {
  skills: 4, // required skills / profile skills - the core of the match
  preferredSkills: 2,
  domain: 2,
  domains: 2,
  jobTitle: 2,
  interests: 2,
  headline: 1,
  freeText: 0.5, // bio/summary/about + job description + criteria text + industry/stage
};

/** Flatten a string/array-of-strings field into canonical tags (keeps them whole). */
const canonicalKeys = (values) => {
  const keys = [];
  for (const value of values || []) {
    if (typeof value !== 'string') continue;
    for (const part of value.split(',')) {
      const tag = canonicalize(part);
      if (tag) keys.push(tag);
    }
  }
  return keys;
};

/** Accumulate weighted entries into a Map<tag, totalWeight>. */
const toWeightMap = (entries) => {
  const map = new Map();
  for (const { tag, weight } of entries) {
    if (!tag) continue;
    map.set(tag, (map.get(tag) || 0) + weight);
  }
  return map;
};

// ---------------------------------------------------------------------------
// Freelancer representation
// ---------------------------------------------------------------------------

/**
 * Build the freelancer tag WEIGHT MAP from the COMPLETE relevant profile:
 *   - domain / domains
 *   - skills (all of them, array or comma-separated)
 *   - interests
 *   - headline / bio / summary (professional text)
 *
 * Every piece of professional signal contributes to the vector so that no
 * single field can force the score to zero. Experience level is intentionally
 * EXCLUDED here: eligibility requirements are evaluated separately (see
 * `evaluateFreelancerEligibility`) and never change the cosine score.
 */
export const getFreelancerTagWeights = (freelancer) => {
  const entries = [];
  const add = (tag, weight) => {
    if (tag) entries.push({ tag, weight });
  };

  for (const tag of canonicalKeys(freelancer?.skills)) add(tag, WEIGHTS.skills);

  // domains: support both a single `domain` string and a `domains` array.
  if (Array.isArray(freelancer?.domains)) {
    for (const tag of canonicalKeys(freelancer.domains)) add(tag, WEIGHTS.domains);
  } else {
    add(canonicalize(freelancer?.domain), WEIGHTS.domain);
  }

  for (const tag of canonicalKeys(freelancer?.interests)) add(tag, WEIGHTS.interests);
  for (const tag of canonicalKeys(freelancer?.headline)) add(tag, WEIGHTS.headline);

  // professional text (bio / summary)
  const bio = freelancer?.bio || freelancer?.summary || freelancer?.about;
  for (const tag of tokenizeText(bio)) add(tag, WEIGHTS.freeText);

  return toWeightMap(entries);
};

/**
 * Build the freelancer tag set (unique tags, display / compatibility view).
 * @see getFreelancerTagWeights
 */
export const getFreelancerTags = (freelancer) => [
  ...getFreelancerTagWeights(freelancer).keys(),
];

// ---------------------------------------------------------------------------
// Startup hiring representation
// ---------------------------------------------------------------------------

/**
 * Build the hiring opportunity tag WEIGHT MAP from the COMPLETE relevant info:
 *   - jobTitle / jobRole
 *   - domain / category
 *   - requiredSkills + preferredSkills
 *   - job description (tokenised professional text)
 *   - candidate eligibility criteria (degrees/branches/certifications)
 *   - startup industry / stage (normalized)
 *
 * Job role, description and both skill sets all contribute; no field is a hard
 * filter. Experience is again excluded here — evaluated by eligibility only.
 */
export const getHiringTagWeights = (hiring) => {
  const entries = [];
  const add = (tag, weight) => {
    if (tag) entries.push({ tag, weight });
  };

  add(canonicalize(hiring?.jobTitle || hiring?.jobRole), WEIGHTS.jobTitle);
  add(canonicalize(hiring?.domain || hiring?.category), WEIGHTS.domain);

  for (const tag of canonicalKeys(hiring?.requiredSkills)) add(tag, WEIGHTS.skills);
  for (const tag of canonicalKeys(hiring?.preferredSkills)) add(tag, WEIGHTS.preferredSkills);

  // job description -> tokens
  if (hiring?.jobDescription) {
    for (const tag of tokenizeText(hiring.jobDescription)) add(tag, WEIGHTS.freeText);
  }

  // candidate eligibility criteria -> degrees, branches, certifications,
  // additional criteria text.
  const criteria = hiring?.criteria || {};
  if (criteria.minimumQualification) {
    for (const tag of tokenizeText(criteria.minimumQualification)) add(tag, WEIGHTS.freeText);
  }
  for (const tag of canonicalKeys(criteria.eligibleDegrees)) add(tag, WEIGHTS.freeText);
  for (const tag of canonicalKeys(criteria.eligibleBranches)) add(tag, WEIGHTS.freeText);
  for (const tag of canonicalKeys(criteria.certifications)) add(tag, WEIGHTS.freeText);
  if (criteria.additionalCriteria) {
    for (const tag of tokenizeText(criteria.additionalCriteria)) add(tag, WEIGHTS.freeText);
  }

  // startup info industry / stage
  const startupInfo = hiring?.startupInfo || {};
  if (startupInfo.industry) {
    for (const tag of tokenizeText(startupInfo.industry)) add(tag, WEIGHTS.freeText);
  }
  if (startupInfo.stage) {
    add(canonicalize(startupInfo.stage), WEIGHTS.freeText);
  }

  return toWeightMap(entries);
};

/**
 * Build the hiring opportunity tag set (unique tags, display / compatibility view).
 * @see getHiringTagWeights
 */
export const getHiringTags = (hiring) => [
  ...getHiringTagWeights(hiring).keys(),
];

// ---------------------------------------------------------------------------
// Shared vocabulary + vectors
// ---------------------------------------------------------------------------

/**
 * Build the shared tag vocabulary as the union of every profile's tag set.
 */
export const buildSharedVocabulary = (taggedProfiles) => {
  const vocabulary = new Set();
  for (const profile of taggedProfiles || []) {
    for (const tag of profile.tags || []) {
      vocabulary.add(tag);
    }
  }
  return [...vocabulary];
};

/**
 * Convert a tag set into a (weighted) vector over the shared vocabulary.
 *
 * @param {string[]} tags canonical tags present on the profile
 * @param {string[]} vocabulary shared vocabulary
 * @param {Map<string,number>} [weights] optional tag -> weight map; when
 *   present the vector holds the tag weight instead of a binary 1. Structured
 *   fields (skills, domain, job title) carry higher weights via the tag
 *   builders (`getFreelancerTagWeights` / `getHiringTagWeights`) so an exact
 *   skill match dominates generic free-text words.
 */
export const buildVector = (tags, vocabulary, weights) => {
  const tagSet = new Set(tags || []);
  return (vocabulary || []).map((tag) => {
    if (!tagSet.has(tag)) return 0;
    const weight = weights?.get ? weights.get(tag) || 1 : 1;
    return weight;
  });
};

/**
 * Normalize the query input to `computeCosineMatches`.
 * Accepts either a simple tag array (weights default to 1) or an object of
 * the shape `{ tags: string[], weights?: Map<tag, weight> }`.
 */
const toQueryInput = (input) => {
  if (Array.isArray(input)) return { tags: input, weights: null };
  return { tags: input?.tags || [], weights: input?.weights || null };
};

/**
 * Standard cosine similarity:
 *
 *   cosine_similarity(A, B) = (A . B) / (||A|| * ||B||)
 *
 * Returns 0 (instead of dividing by zero) when either vector is empty.
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i += 1) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const intersection = (tagsA, tagsB) => {
  const setB = new Set(tagsB || []);
  return (tagsA || []).filter((tag) => setB.has(tag));
};

/**
 * Core generic cosine matching engine over the shared vocabulary.
 *
 * @param {string[] | { tags: string[], weights?: Map<string,number> }} query
 *   normalized tags of the querying profile (optionally pre-weighted)
 * @param {Array<{ id: string, tags: string[], weights?: Map<string,number> }>} candidates
 *
 * Returns ranked candidates (highest similarity first) with:
 *   - quantity: the raw candidate object
 *   - similarity, matchScore, matchedTags, queryTags, candidateTags,
 *     vocabulary, queryVector, candidateVector, note
 */
export const computeCosineMatches = (query, candidates) => {
  const { tags: queryTags, weights: queryWeights } = toQueryInput(query);

  const vocabulary = buildSharedVocabulary([
    { tags: queryTags },
    ...candidates,
  ]);

  const queryVector = buildVector(queryTags, vocabulary, queryWeights);
  const queryNorm = queryVector.reduce((sum, v) => sum + v * v, 0);

  const results = candidates.map((candidate) => {
    const candidateVector = buildVector(
      candidate.tags,
      vocabulary,
      candidate.weights || null
    );
    const candidateNorm = candidateVector.reduce((sum, v) => sum + v * v, 0);

    let similarity = 0;
    let note = '';
    let dotProduct = 0;

    if (queryNorm === 0) {
      note = 'Not enough matching profile information (freelancer profile has no tags).';
    } else if (candidateNorm === 0) {
      note = 'Not enough matching profile information (hiring opportunity has no tags).';
    } else {
      for (let i = 0; i < queryVector.length; i += 1) {
        dotProduct += queryVector[i] * candidateVector[i];
      }
      similarity = cosineSimilarity(queryVector, candidateVector);
    }

    return {
      id: candidate.id,
      quantity: candidate.quantity,
      similarity,
      matchScore: Math.round(similarity * 100),
      matchedTags: intersection(queryTags, candidate.tags),
      queryTags: [...queryTags],
      candidateTags: [...candidate.tags],
      vocabulary,
      queryVector,
      candidateVector,
      // Mathematical internals exposed for a transparent "View Breakdown",
      // used only for display/debugging — never to construct the score.
      dotProduct,
      queryMagnitude: Math.sqrt(queryNorm),
      candidateMagnitude: Math.sqrt(candidateNorm),
      note,
};
  });

  results.sort((a, b) => b.similarity - a.similarity);
  return results;
};
/**
 * Compute cosine matches for freelancer match engine (freelancer -> startups)
 * Enforces 40% minimum threshold, 60% strong match filter
 */
export const computeFreelancerStartupMatches = (freelancer, startups) => {
  const queryWeights = getFreelancerDiscoveryTagWeights(freelancer);
  const queryTags = getFreelancerDiscoveryTags(freelancer);

  const candidates = startups.map((startup) => ({
    id: startup._id.toString(),
    quantity: startup,
    tags: getStartupDiscoveryTags(startup),
    weights: getStartupDiscoveryTagWeights(startup),
  }));

  const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

  return results
    .filter((r) => r.similarity >= MATCH_ENGINE_MIN_THRESHOLD)
    .map((r) => ({
      ...r,
      matchScore: Math.round(r.similarity * 100),
      isStrongMatch: r.similarity >= MATCH_ENGINE_STRONG_THRESHOLD,
      matchedTags: r.matchedTags,
      reasons: r.matchedTags.length > 0
        ? r.matchedTags.map((tag) => `Shared skill/domain: ${tag}`)
        : ['Profile alignment on industry and stage'],
    }));
};

/**
 * Compute cosine matches for startup match engine (startup -> freelancers)
 * Enforces 40% minimum threshold, 60% strong match filter
 */
export const computeStartupFreelancerMatchEngine = (startup, freelancers) => {
  const queryWeights = getStartupDiscoveryTagWeights(startup);
  const queryTags = getStartupDiscoveryTags(startup);

  const candidates = freelancers.map((freelancer) => ({
    id: freelancer._id.toString(),
    quantity: freelancer,
    tags: getFreelancerDiscoveryTags(freelancer),
    weights: getFreelancerDiscoveryTagWeights(freelancer),
  }));

  const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

  return results
    .filter((r) => r.similarity >= MATCH_ENGINE_MIN_THRESHOLD)
    .map((r) => ({
      ...r,
      matchScore: Math.round(r.similarity * 100),
      isStrongMatch: r.similarity >= MATCH_ENGINE_STRONG_THRESHOLD,
      matchedTags: r.matchedTags,
      reasons: r.matchedTags.length > 0
        ? r.matchedTags.map((tag) => `Shared skill: ${tag}`)
        : ['Profile alignment on industry and stage'],
    }));
};

/**
 * Compute cosine matches for investor match engine (investor -> startups)
 * Enforces 40% minimum threshold, 60% strong match filter
 */
export const computeInvestorStartupMatchEngine = (investor, startups) => {
  const queryWeights = getInvestorDiscoveryTagWeights(investor);
  const queryTags = getInvestorDiscoveryTags(investor);

  const candidates = startups.map((startup) => ({
    id: startup._id.toString(),
    quantity: startup,
    tags: getStartupInvestorTags(startup),
    weights: getStartupInvestorTagWeights(startup),
  }));

  const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

  return results
    .filter((r) => r.similarity >= MATCH_ENGINE_MIN_THRESHOLD)
    .map((r) => ({
      ...r,
      matchScore: Math.round(r.similarity * 100),
      isStrongMatch: r.similarity >= MATCH_ENGINE_STRONG_THRESHOLD,
      matchedTags: r.matchedTags,
      reasons: r.matchedTags.length > 0
        ? r.matchedTags.map((tag) => `Shared sector/preference: ${tag}`)
        : ['Portfolio alignment on industry and stage'],
    }));
};

// ---------------------------------------------------------------------------
// Eligibility (evaluated SEPARATELY from the cosine score)
// ---------------------------------------------------------------------------

/**
 * Normalise an experience string to a comparable number of years (lower bound)
 * when the value is parseable. Returns null when it cannot be interpreted.
 *   "0-1 years" -> 0
 *   "1-3 years" -> 1
 *   "2 years"   -> 2
 *   "Fresher"   -> 0
 */
const extractNumbers = (value) => {
  const s = value.toString().toLowerCase().replace(/[^0-9+\-.]/g, ' ');
  return s.split(/\s+/).filter((n) => n !== '').map(Number);
};

// Profile side: how many years of experience the freelancer has.
const parseExperienceYears = (value) => {
  if (value === null || value === undefined) return null;
  const text = value.toString().toLowerCase();
  const nums = extractNumbers(value);
  if (nums.length > 0) {
    // lower bound (e.g. "1-3" -> 1, "5+" -> 5, "2 years" -> 2)
    return Math.min(...nums);
  }
  // "Fresher" / "Entry level" -> 0
  if (/fresher|entry/.test(text)) return 0;
  return null;
};

// Hiring side: the minimum experience the role asks for.
const parseRequiredExperience = (value) => {
  if (value === null || value === undefined) return null;
  const text = value.toString().toLowerCase();
  const nums = extractNumbers(value);
  if (nums.length > 0) {
    // lower bound (e.g. "0-2 years" -> 0, "1-3" -> 1)
    return Math.min(...nums);
  }
  // "Fresher" / "Entry level" -> 0
  if (/fresher|entry/.test(text)) return 0;
  return null;
};

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

/**
 * Evaluate whether a freelancer satisfies the EXPLICIT eligibility criteria on
 * a hiring record. This is a separate outcome from the cosine match score and
 * never changes the cosine value.
 *
 * @returns {{ eligible: boolean, issues: string[], criteria: object, matched: boolean }}
 *   - eligible: true when the freelancer meets all criteria we can evaluate
 *   - issues: human-readable reasons when not eligible
 *   - matched: true when there is at least one criterion to evaluate
 */
export const evaluateFreelancerEligibility = (freelancer, hiring) => {
  const criteria = hiring?.criteria || {};
  const issues = [];

  // Experience eligibility (when hiring specifies a minimum experience).
  const reqMin = parseRequiredExperience(
    criteria.minimumExperience ||
    hiring?.experienceRequired
  );
  if (reqMin !== null && reqMin !== undefined) {
    const profileMin = parseExperienceYears(freelancer?.experience);
    if (profileMin !== null && profileMin !== undefined && profileMin < reqMin) {
      issues.push(`Does not meet minimum experience (${reqMin} years required)`);
    } else if (profileMin === null || profileMin === undefined) {
      issues.push('Freelancer experience not specified; experience could not be verified');
    }
  }

  // Required certifications (if any are required).
  const certifications = normalizeList(criteria.certifications);
  if (certifications.length > 0) {
    const freelancerCerts = normalizeList(freelancer?.certifications);
    const missing = certifications.filter(
      (c) => !freelancerCerts.some((fc) => fc.toString().toLowerCase() === c.toString().toLowerCase())
    );
    if (missing.length > 0) {
      issues.push(`Missing required certification: ${missing.join(', ')}`);
    }
  }

  // Eligible degrees / branches (informational; freelancer profile has no
  // education field by default, so flagged only if a mismatch can be proven).
  const eligibleDegrees = normalizeList(criteria.eligibleDegrees);
  const eligibleBranches = normalizeList(criteria.eligibleBranches);
  if (eligibleDegrees.length > 0) {
    const freelancerDegrees = normalizeList(freelancer?.degree || freelancer?.education);
    if (freelancerDegrees.length > 0) {
      const ok = freelancerDegrees.some((d) =>
        eligibleDegrees.some((ed) => ed.toString().toLowerCase() === d.toString().toLowerCase())
      );
      if (!ok) issues.push('Degree does not match eligible degrees');
    }
  }
  if (eligibleBranches.length > 0) {
    const freelancerBranches = normalizeList(freelancer?.branch);
    if (freelancerBranches.length > 0) {
      const ok = freelancerBranches.some((b) =>
        eligibleBranches.some((eb) => eb.toString().toLowerCase() === b.toString().toLowerCase())
      );
      if (!ok) issues.push('Branch does not match eligible branches');
    }
  }

  const eligible = issues.length === 0;
  return {
    eligible,
    matched: eligibleDegrees.length > 0 || eligibleBranches.length > 0 || certifications.length > 0 || (reqMin !== null && reqMin !== undefined),
    issues,
    criteria: {
      minimumQualification: criteria.minimumQualification || '',
      minimumExperience: criteria.minimumExperience || hiring?.experienceRequired || '',
      eligibleDegrees,
      eligibleBranches,
      certifications,
      additionalCriteria: criteria.additionalCriteria || '',
    },
  };
};

// ---------------------------------------------------------------------------
// Startup <-> Freelancer Cosine Matching (Discovery Feed)
// ---------------------------------------------------------------------------

/**
 * Build weighted tag map for a Startup profile (discovery direction)
 * Uses: domain, description, pitch, required skills, open roles, traction, stage
 */
export const getStartupDiscoveryTagWeights = (startup) => {
  const entries = [];
  const add = (tag, weight) => {
    if (tag) entries.push({ tag, weight });
  };

  // Core domain (high weight)
  add(canonicalize(startup?.domain), 4);

  // Description + pitch (free text, lower weight)
  const descText = [startup?.description, startup?.pitch, startup?.traction].filter(Boolean).join(' ');
  for (const tag of tokenizeText(descText)) add(tag, WEIGHTS.freeText);

  // Required skills from open roles
  const openRoles = Array.isArray(startup?.openRoles) ? startup.openRoles : [];
  for (const role of openRoles) {
    for (const tag of canonicalKeys(role?.requiredSkills || [])) add(tag, 3);
    for (const tag of canonicalKeys(role?.preferredSkills || [])) add(tag, 2);
    add(canonicalize(role?.title), 2);
  }

  // Startup stage
  add(canonicalize(startup?.stage), 1);

  // Team skills
  for (const tag of canonicalKeys(startup?.teamSkills || [])) add(tag, 2);

  return toWeightMap(entries);
};

/**
 * Build weighted tag map for a Freelancer profile (discovery direction)
 * Uses: domain, skills, interests, bio, experience, headline
 */
export const getFreelancerDiscoveryTagWeights = (freelancer) => {
  const entries = [];
  const add = (tag, weight) => {
    if (tag) entries.push({ tag, weight });
  };

  // Core domain
  add(canonicalize(freelancer?.domain), 4);

  // Skills (highest weight)
  for (const tag of canonicalKeys(freelancer?.skills || [])) add(tag, 4);

  // Interests
  for (const tag of canonicalKeys(freelancer?.interests || [])) add(tag, 2);

  // Bio/headline (free text)
  const bioText = [freelancer?.bio, freelancer?.headline, freelancer?.summary, freelancer?.about].filter(Boolean).join(' ');
  for (const tag of tokenizeText(bioText)) add(tag, WEIGHTS.freeText);

  // Experience level
  add(canonicalize(freelancer?.experience), 1);

  return toWeightMap(entries);
};

/**
 * Build tag set for startup discovery
 */
export const getStartupDiscoveryTags = (startup) => [
  ...getStartupDiscoveryTagWeights(startup).keys(),
];

/**
 * Build tag set for freelancer discovery
 */
export const getFreelancerDiscoveryTags = (freelancer) => [
  ...getFreelancerDiscoveryTagWeights(freelancer).keys(),
];

// ---------------------------------------------------------------------------
// Startup <-> Investor Cosine Matching (Discovery Feed)
// ---------------------------------------------------------------------------

/**
 * Build weighted tag map for Startup profile (investor matching direction)
 * Uses: domain, stage, funding range, description, pitch, traction, industry
 */
export const getStartupInvestorTagWeights = (startup) => {
  const entries = [];
  const add = (tag, weight) => {
    if (tag) entries.push({ tag, weight });
  };

  // Domain/Industry (high weight for sector matching)
  add(canonicalize(startup?.domain), 4);

  // Stage (important for investor thesis)
  add(canonicalize(startup?.stage), 3);

  // Funding requirements
  const funding = startup?.fundingRequirement || startup?.maximumFunding || startup?.minimumFunding;
  if (funding) add(canonicalize(String(funding)), 2);

  // Description + pitch (free text)
  const descText = [startup?.description, startup?.pitch, startup?.traction].filter(Boolean).join(' ');
  for (const tag of tokenizeText(descText)) add(tag, WEIGHTS.freeText);

  // Team skills
  for (const tag of canonicalKeys(startup?.teamSkills || [])) add(tag, 1);

  return toWeightMap(entries);
};

/**
 * Build weighted tag map for Investor profile (startup matching direction)
 * Uses: preferred domains, investment preferences (stages, check sizes), bio, experience
 */
export const getInvestorDiscoveryTagWeights = (investor) => {
  const entries = [];
  const add = (tag, weight) => {
    if (tag) entries.push({ tag, weight });
  };

  // Preferred domains (high weight)
  const domains = investor?.preferredDomains || investor?.investmentFocus || [];
  for (const tag of canonicalKeys(domains)) add(tag, 4);

  // Investment preferences
  const prefs = investor?.investmentPreferences || {};
  if (prefs?.stages) {
    for (const tag of canonicalKeys(prefs.stages)) add(tag, 3);
  }
  if (prefs?.minCheckSize) add(canonicalize(String(prefs.minCheckSize)), 2);
  if (prefs?.maxCheckSize) add(canonicalize(String(prefs.maxCheckSize)), 2);
  if (prefs?.geography) add(canonicalize(prefs.geography), 1);

  // Bio/experience (free text)
  const bioText = [investor?.bio, investor?.experience, investor?.investmentThesis].filter(Boolean).join(' ');
  for (const tag of tokenizeText(bioText)) add(tag, WEIGHTS.freeText);

  // Firm/experience
  add(canonicalize(investor?.experience), 1);

  return toWeightMap(entries);
};

/**
 * Build tag set for startup (investor matching)
 */
export const getStartupInvestorTags = (startup) => [
  ...getStartupInvestorTagWeights(startup).keys(),
];

/**
 * Build tag set for investor (startup matching)
 */
export const getInvestorDiscoveryTags = (investor) => [
  ...getInvestorDiscoveryTagWeights(investor).keys(),
];

// ---------------------------------------------------------------------------
// Cosine Matching - Discovery Feeds (NO threshold, return all with scores)
// ---------------------------------------------------------------------------

/**
 * Compute cosine matches for startup discovery (freelancer -> startups)
 * Returns ALL matches with matchScore (0-100), similarity, matched tags, and reasons
 */
export const computeStartupFreelancerMatches = (freelancer, startups) => {
  const queryWeights = getFreelancerDiscoveryTagWeights(freelancer);
  const queryTags = getFreelancerDiscoveryTags(freelancer);

  const candidates = startups.map((startup) => ({
    id: startup._id.toString(),
    quantity: startup,
    tags: getStartupDiscoveryTags(startup),
    weights: getStartupDiscoveryTagWeights(startup),
  }));

  const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

  return results
    .map((r) => ({
      ...r,
      matchScore: Math.round(r.similarity * 100),
      isStrongMatch: r.similarity >= DISCOVERY_STRONG_THRESHOLD,
      matchedTags: r.matchedTags,
      reasons: r.matchedTags.length > 0
        ? r.matchedTags.map((tag) => `Shared skill/domain: ${tag}`)
        : ['Profile alignment on industry and stage'],
    }));
};

/**
 * Compute cosine matches for investor discovery (investor -> startups)
 * Returns ALL matches with matchScore (0-100), similarity, matched tags, and reasons
 */
export const computeInvestorStartupMatches = (investor, startups) => {
  const queryWeights = getInvestorDiscoveryTagWeights(investor);
  const queryTags = getInvestorDiscoveryTags(investor);

  const candidates = startups.map((startup) => ({
    id: startup._id.toString(),
    quantity: startup,
    tags: getStartupInvestorTags(startup),
    weights: getStartupInvestorTagWeights(startup),
  }));

  const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

  return results
    .map((r) => ({
      ...r,
      matchScore: Math.round(r.similarity * 100),
      isStrongMatch: r.similarity >= DISCOVERY_STRONG_THRESHOLD,
      matchedTags: r.matchedTags,
      reasons: r.matchedTags.length > 0
        ? r.matchedTags.map((tag) => `Shared sector/preference: ${tag}`)
        : ['Portfolio alignment on industry and stage'],
    }));
};

// ---------------------------------------------------------------------------
// Cosine Matching - Match Engine (threshold enforced: 40% min, 60% strong)
// ---------------------------------------------------------------------------

const MATCH_ENGINE_MIN_THRESHOLD = 0.40; // 40% minimum
const MATCH_ENGINE_STRONG_THRESHOLD = 0.60; // 60% for "strong match" filter

/**
 * Compute cosine matches for startup discovery (startup -> freelancers)
 * Returns ALL matches with matchScore (0-100), similarity, matched tags, and reasons
 */
export const computeStartupFreelancerMatchesForStartup = (startup, freelancers) => {
  const queryWeights = getStartupDiscoveryTagWeights(startup);
  const queryTags = getStartupDiscoveryTags(startup);

  const candidates = freelancers.map((freelancer) => ({
    id: freelancer._id.toString(),
    quantity: freelancer,
    tags: getFreelancerDiscoveryTags(freelancer),
    weights: getFreelancerDiscoveryTagWeights(freelancer),
  }));

  const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

  return results
    .map((r) => ({
      ...r,
      matchScore: Math.round(r.similarity * 100),
      isStrongMatch: r.similarity >= 0.60,
      matchedTags: r.matchedTags,
      reasons: r.matchedTags.length > 0
        ? r.matchedTags.map((tag) => `Shared skill: ${tag}`)
        : ['Profile alignment on industry and stage'],
    }));
};

/**
 * Compute cosine matches for startup discovery (startup -> investors)
 * Returns ALL matches with matchScore (0-100), similarity, matched tags, and reasons
 */
export const computeStartupInvestorMatchesForStartup = (startup, investors) => {
  const queryWeights = getStartupInvestorTagWeights(startup);
  const queryTags = getStartupInvestorTags(startup);

  const candidates = investors.map((investor) => ({
    id: investor._id.toString(),
    quantity: investor,
    tags: getInvestorDiscoveryTags(investor),
    weights: getInvestorDiscoveryTagWeights(investor),
  }));

  const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

  return results
    .map((r) => ({
      ...r,
      matchScore: Math.round(r.similarity * 100),
      isStrongMatch: r.similarity >= 0.60,
      matchedTags: r.matchedTags,
      reasons: r.matchedTags.length > 0
        ? r.matchedTags.map((tag) => `Shared preference: ${tag}`)
        : ['Investment thesis alignment on sector and stage'],
    }));
};

// ---------------------------------------------------------------------------
// Cosine Matching - Match Engine (threshold enforced: 40% min, 60% strong)
// ---------------------------------------------------------------------------


/**
 * Compute cosine matches for freelancer match engine (freelancer -> startup hiring)
 * Enforces 40% minimum threshold, 60% strong match filter
 */
export const computeFreelancerHiringMatches = (freelancer, hirings) => {
  const queryWeights = getFreelancerTagWeights(freelancer);
  const queryTags = getFreelancerTags(freelancer);

  const candidates = hirings.map((hiring) => ({
    id: hiring._id.toString(),
    quantity: hiring,
    tags: getHiringTags(hiring),
    weights: getHiringTagWeights(hiring),
  }));

  const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

  return results
    .filter((r) => r.similarity >= MATCH_ENGINE_MIN_THRESHOLD)
    .map((r) => ({
      ...r,
      jobDescription: r.quantity?.jobDescription || '',
      matchScore: Math.round(r.similarity * 100),
      isStrongMatch: r.similarity >= MATCH_ENGINE_STRONG_THRESHOLD,
      matchedTags: r.matchedTags,
      reasons: r.matchedTags.length > 0
        ? r.matchedTags.map((tag) => `Shared skill: ${tag}`)
        : ['Profile alignment on skills and role'],
    }));
};

/**
 * Compute cosine matches for Startup Discovery (hiring-specific, aggregated across all hirings)
 * Uses the same algorithm as computeStartupHiringMatches but aggregates scores per freelancer
 * across multiple hirings, returning the best match score for each freelancer.
 */
export const computeStartupHiringMatchesForDiscovery = (hirings, freelancers) => {
  const freelancerMap = new Map();

  for (const hiring of hirings) {
    const queryWeights = getHiringTagWeights(hiring);
    const queryTags = getHiringTags(hiring);

    const candidates = freelancers.map((freelancer) => ({
      id: freelancer._id.toString(),
      quantity: freelancer,
      tags: getFreelancerTags(freelancer),
      weights: getFreelancerTagWeights(freelancer),
    }));

    const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

    for (const r of results) {
      const fid = r.id;
      const existing = freelancerMap.get(fid);

      if (!existing) {
        // First hiring match for this freelancer
        freelancerMap.set(fid, {
          ...r,
          matchScore: Math.round(r.similarity * 100),
          isStrongMatch: r.similarity >= MATCH_ENGINE_STRONG_THRESHOLD,
          matchedTags: r.matchedTags,
          reasons: r.matchedTags.length > 0
            ? r.matchedTags.map((tag) => `Shared skill: ${tag}`)
            : ['Profile alignment on skills and role'],
          hiringId: hiring._id.toString(),
          jobTitle: hiring.jobTitle || '',
          allHiringScores: [{ hiringId: hiring._id.toString(), jobTitle: hiring.jobTitle || '', score: Math.round(r.similarity * 100) }],
        });
      } else {
        // Update if this hiring gives a better score
        const newScore = Math.round(r.similarity * 100);
        existing.allHiringScores.push({
          hiringId: hiring._id.toString(),
          jobTitle: hiring.jobTitle || '',
          score: newScore,
        });

        if (newScore > existing.matchScore) {
          existing.matchScore = newScore;
          existing.similarity = r.similarity;
          existing.isStrongMatch = r.similarity >= MATCH_ENGINE_STRONG_THRESHOLD;
          existing.matchedTags = r.matchedTags;
          existing.reasons = r.matchedTags.length > 0
            ? r.matchedTags.map((tag) => `Shared skill: ${tag}`)
            : ['Profile alignment on skills and role'];
          existing.hiringId = hiring._id.toString();
          existing.jobTitle = hiring.jobTitle || '';
        }
      }
    }
  }

  return [...freelancerMap.values()];
};

/**
 * Compute cosine matches for startup match engine (startup -> freelancers for a specific hiring)
 * Enforces 40% minimum threshold, 60% strong match filter
 */
export const computeStartupHiringMatches = (hiring, freelancers) => {
  const queryWeights = getHiringTagWeights(hiring);
  const queryTags = getHiringTags(hiring);

  const candidates = freelancers.map((freelancer) => ({
    id: freelancer._id.toString(),
    quantity: freelancer,
    tags: getFreelancerTags(freelancer),
    weights: getFreelancerTagWeights(freelancer),
  }));

  const results = computeCosineMatches({ tags: queryTags, weights: queryWeights }, candidates);

  return results
    .filter((r) => r.similarity >= MATCH_ENGINE_MIN_THRESHOLD)
    .map((r) => ({
      ...r,
      matchScore: Math.round(r.similarity * 100),
      isStrongMatch: r.similarity >= MATCH_ENGINE_STRONG_THRESHOLD,
      matchedTags: r.matchedTags,
      reasons: r.matchedTags.length > 0
        ? r.matchedTags.map((tag) => `Shared skill: ${tag}`)
        : ['Profile alignment on skills and role'],
    }));
};
