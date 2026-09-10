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
 *  - No ML training data, no external APIs, no weighted component formulas.
 *    The final match score is strictly cosine similarity over tag vectors.
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
// Freelancer representation
// ---------------------------------------------------------------------------

/**
 * Build the freelancer tag set from the COMPLETE relevant profile:
 *   - domain / domains
 *   - skills (all of them, array or comma-separated)
 *   - interests
 *   - headline / bio / summary (professional text)
 *   - experience level (normalized)
 *
 * Every piece of professional signal contributes to the vector so that no
 * single field can force the score to zero.
 */
export const getFreelancerTags = (freelancer) => {
  const tags = new Set();

  const addList = (list) => {
    for (const item of list || []) {
      if (typeof item !== 'string') continue;
      for (const part of item.split(',')) {
        const tag = canonicalize(part);
        if (tag) tags.add(tag);
      }
    }
  };

  addList(freelancer?.skills);

  // domains: support both a single `domain` string and a `domains` array.
  if (Array.isArray(freelancer?.domains)) {
    addList(freelancer.domains);
  } else {
    const domain = canonicalize(freelancer?.domain);
    if (domain) tags.add(domain);
  }

  addList(freelancer?.interests);
  addList(freelancer?.headline);

  // professional text (bio / summary)
  const bio = freelancer?.bio || freelancer?.summary || freelancer?.about;
  for (const tag of tokenizeText(bio)) tags.add(tag);

  // normalise experience level into a shared vocabulary tag
  const exp = canonicalize(freelancer?.experience);
  if (exp && !STOPWORDS.has(exp)) tags.add(exp);

  return [...tags];
};

// ---------------------------------------------------------------------------
// Startup hiring representation
// ---------------------------------------------------------------------------

/**
 * Build the hiring opportunity tag set from the COMPLETE relevant hiring info:
 *   - jobTitle / jobRole
 *   - domain / category
 *   - requiredSkills + preferredSkills
 *   - job description (tokenised professional text)
 *   - candidate eligibility criteria (degrees/branches/certifications)
 *   - startup industry / stage (normalized)
 *
 * Job role, description and both skill sets all contribute; no field is a
 * hard filter.
 */
export const getHiringTags = (hiring) => {
  const tags = new Set();

  const addList = (list) => {
    for (const item of list || []) {
      if (typeof item !== 'string') continue;
      for (const part of item.split(',')) {
        const tag = canonicalize(part);
        if (tag) tags.add(tag);
      }
    }
  };

  const jobTitle = canonicalize(hiring?.jobTitle || hiring?.jobRole);
  if (jobTitle) tags.add(jobTitle);

  const domain = canonicalize(hiring?.domain || hiring?.category);
  if (domain) tags.add(domain);

  addList(hiring?.requiredSkills);
  addList(hiring?.preferredSkills);

  // job description -> tokens
  if (hiring?.jobDescription) {
    for (const tag of tokenizeText(hiring.jobDescription)) tags.add(tag);
  }

  // candidate eligibility criteria -> degrees, branches, certifications,
  // additional criteria text.
  const criteria = hiring?.criteria || {};
  if (criteria.minimumQualification) {
    for (const tag of tokenizeText(criteria.minimumQualification)) tags.add(tag);
  }
  addList(criteria.eligibleDegrees);
  addList(criteria.eligibleBranches);
  addList(criteria.certifications);
  if (criteria.additionalCriteria) {
    for (const tag of tokenizeText(criteria.additionalCriteria)) tags.add(tag);
  }
  if (criteria.minimumExperience) {
    const exp = canonicalize(criteria.minimumExperience);
    if (exp) tags.add(exp);
  }

  // startup info industry / stage
  const startupInfo = hiring?.startupInfo || {};
  if (startupInfo.industry) {
    for (const tag of tokenizeText(startupInfo.industry)) tags.add(tag);
  }
  if (startupInfo.stage) {
    const stage = canonicalize(startupInfo.stage);
    if (stage) tags.add(stage);
  }

  return [...tags];
};

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
 * Convert a tag set into a binary vector over the shared vocabulary.
 */
export const buildVector = (tags, vocabulary) => {
  const tagSet = new Set(tags || []);
  return (vocabulary || []).map((tag) => (tagSet.has(tag) ? 1 : 0));
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
 * @param {string[]} queryTags  normalized tags of the querying profile
 * @param {Array<{ id: string, tags: string[] }>} candidates
 *
 * Returns ranked candidates (highest similarity first) with:
 *   - quantity: the raw candidate object
 *   - similarity, matchScore, matchedTags, queryTags, candidateTags,
 *     vocabulary, queryVector, candidateVector, note
 */
export const computeCosineMatches = (queryTags, candidates) => {
  const vocabulary = buildSharedVocabulary([
    { tags: queryTags },
    ...candidates,
  ]);

  const queryVector = buildVector(queryTags, vocabulary);
  const queryNorm = queryVector.reduce((sum, v) => sum + v * v, 0);

  const results = candidates.map((candidate) => {
    const candidateVector = buildVector(candidate.tags, vocabulary);
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
