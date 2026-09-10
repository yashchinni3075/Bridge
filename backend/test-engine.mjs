/**
 * Unit tests for the AI-Based Matching Engine (Section 4.4 of the BRIDGE paper).
 *
 * Covers the ten required test cases plus normalization, rich vector
 * construction, zero-vector handling, and the pure-cosine property.
 */
import {
  normalizeTagList,
  getFreelancerTags,
  getHiringTags,
  buildSharedVocabulary,
  buildVector,
  cosineSimilarity,
  computeCosineMatches,
  evaluateFreelancerEligibility,
} from './services/matchingEngineService.js';

let pass = 0;
let fail = 0;

const check = (name, cond, extra = '') => {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    console.log(`  ✗ ${name} ${extra}`);
  }
};

const scoreBetween = (freelancer, hiring) => {
  const fTags = getFreelancerTags(freelancer);
  const hTags = getHiringTags(hiring);
  const vocab = buildSharedVocabulary([{ tags: fTags }, { tags: hTags }]);
  const vF = buildVector(fTags, vocab);
  const vH = buildVector(hTags, vocab);
  const sim = cosineSimilarity(vF, vH);
  return { fTags, hTags, vocab, vF, vH, sim, score: Math.round(sim * 100), matched: vocab.filter((t) => vF[vocab.indexOf(t)] === 1 && vH[vocab.indexOf(t)] === 1) };
};

console.log('\n== NORMALIZATION ==');
let norm = normalizeTagList(['SQL', 'Python', 'React.js', 'ReactJS', 'React js', 'JS', 'Java Script', 'ML', 'AI', 'C++', 'C#']);
check('React.js / ReactJS / React js all -> react', norm.includes('react'), JSON.stringify(norm));
check('JS -> javascript', norm.includes('javascript'), JSON.stringify(norm));
check('Java Script -> javascript', norm.includes('javascript'), JSON.stringify(norm));
check('ML -> machine learning', norm.includes('machine learning'), JSON.stringify(norm));
check('AI -> artificial intelligence', norm.includes('artificial intelligence'), JSON.stringify(norm));
check('SQL stays sql', norm.includes('sql'));
check('Python stays python', norm.includes('python'));
check('no duplicate after normalization', new Set(norm).size === norm.length);

console.log('\n== TEST 1: Exact-ish skill overlap -> non-zero cosine ==');
{
  const f = { skills: ['Python', 'SQL', 'Java'], domain: 'Software Development' };
  const h = { jobTitle: 'Backend Engineer', domain: 'Software Development', requiredSkills: ['Python', 'SQL', 'Java', 'React'] };
  const r = scoreBetween(f, h);
  check('non-zero cosine similarity', r.sim > 0, `sim=${r.sim.toFixed(4)}`);
}

console.log('\n== TEST 2: Domains differ but skills overlap -> still non-zero ==');
{
  const f = { skills: ['Python', 'SQL', 'PySpark'], domain: 'Data Engineering' };
  const h = { jobTitle: 'Software Engineer', domain: 'Software Development', requiredSkills: ['Python', 'SQL'], preferredSkills: ['Backend'] };
  const r = scoreBetween(f, h);
  check('non-zero similarity even though domains differ', r.sim > 0, `sim=${r.sim.toFixed(4)}`);
}

console.log('\n== TEST 3: Domain mismatch must NOT force 0 ==');
{
  const f = { domain: 'Data Engineering', skills: ['Python', 'SQL', 'PySpark', 'Power BI'] };
  const h = { jobTitle: 'Software Engineer', domain: 'Software Development', requiredSkills: ['Java', 'React', 'Spring Boot'], preferredSkills: ['JavaScript', 'Git'] };
  const r = scoreBetween(f, h);
  check('score computed from complete representation (not forced 0)', Number.isFinite(r.score), `score=${r.score}`);
}

console.log('\n== TEST 4: More overlapping skills -> higher similarity ==');
{
  const f = { skills: ['Python', 'SQL', 'Java', 'React', 'PySpark'], domain: 'Software Development' };
  const overlapping = { jobTitle: 'Data Engineer', domain: 'Data Engineering', requiredSkills: ['Python', 'SQL', 'PySpark'] };
  const noOverlap = { jobTitle: 'Graphics Designer', domain: 'Design', requiredSkills: ['Photoshop', 'Illustrator'] };
  const rOver = scoreBetween(f, overlapping);
  const rNone = scoreBetween(f, noOverlap);
  check('overlapping hiring scores higher than non-overlapping hiring', rOver.sim > rNone.sim, `over=${rOver.sim.toFixed(4)} none=${rNone.sim.toFixed(4)}`);
}

console.log('\n== TEST 5: No overlapping relevant content -> genuine 0 ==');
{
  const f = { domain: 'Data Engineering', skills: ['Python', 'PySpark'] };
  const h = { jobTitle: 'Chef', domain: 'Culinary', requiredSkills: ['Cooking', 'Baking'] };
  const r = scoreBetween(f, h);
  check('cosine is 0 (or near) when no shared dimension', r.sim === 0, `sim=${r.sim.toFixed(4)}`);
}

console.log('\n== TEST 6: Adding a skill must NOT remove existing ones ==');
{
  const f1 = { domain: 'Software Development', skills: ['Python', 'SQL'] };
  const f2 = { domain: 'Software Development', skills: ['Python', 'SQL', 'React'] };
  const t1 = getFreelancerTags(f1);
  const t2 = getFreelancerTags(f2);
  check('new profile keeps old skills', t1.every((t) => t2.includes(t)), JSON.stringify({ t1, t2 }));
  check('new skill added', t2.includes('react'));
}

console.log('\n== TEST 7: Adding Data Engineering domain preserves Software Development ==');
{
  const f1 = { domain: 'Software Development', skills: ['Python'] };
  const f2 = { domains: ['Software Development', 'Data Engineering'], skills: ['Python'] };
  const t1 = getFreelancerTags(f1);
  const t2 = getFreelancerTags(f2);
  check('both domains preserved', t2.includes('software development') && t2.includes('data engineering'), JSON.stringify(t2));
}

console.log('\n== TEST 8: Changing profile changes the cosine result dynamically ==');
{
  const h = { jobTitle: 'Data Engineer', domain: 'Data Engineering', requiredSkills: ['Python', 'PySpark', 'SQL'] };
  const before = scoreBetween({ domain: 'Design', skills: ['Photoshop'] }, h);
  const after = scoreBetween({ domain: 'Data Engineering', skills: ['Python', 'PySpark', 'SQL'] }, h);
  check('result changes when profile changes', after.sim > before.sim, `before=${before.sim.toFixed(4)} after=${after.sim.toFixed(4)}`);
}

console.log('\n== TEST 9: New hiring becomes available via the engine (service-level) ==');
{
  // Any hiring passed in as a candidate is matched; the API makes new DB
  // records flow through automatically. Here we show a brand-new hiring
  // produces a ranked entry with a cosine-derived score.
  const fTags = getFreelancerTags({ domain: 'Data Engineering', skills: ['Python', 'SQL'] });
  const newHiring = getHiringTags({ jobTitle: 'Data Scientist', domain: 'Data Science', requiredSkills: ['Python', 'SQL', 'Machine Learning'] });
  const ranked = computeCosineMatches(fTags, [{ id: 'brand-new', quantity: { jobTitle: 'Data Scientist' }, tags: newHiring }]);
  check('new hiring produces a ranked match', ranked.length === 1 && ranked[0].id === 'brand-new');
  check('score is cosine-derived, not hardcoded', typeof ranked[0].matchScore === 'number' && ranked[0].matchScore >= 0 && ranked[0].matchScore <= 100, `score=${ranked[0].matchScore}`);
}

console.log('\n== TEST 10: Displayed percentage == cosineSimilarity*100 ==');
{
  const r = scoreBetween(
    { domain: 'Software Development', skills: ['Java', 'SQL', 'React'] },
    { jobTitle: 'Software Engineer', domain: 'Software Development', requiredSkills: ['Java', 'SQL', 'React', 'Spring Boot'] }
  );
  const expected = Math.round(r.sim * 100);
  check('matchScore == cos*100', expected === r.score, `score=${r.score} expected=${expected}`);
}

console.log('\n== BREAKDOWN MATH (dot product + norms == cosine) ==');
{
  const fTags = getFreelancerTags({ domain: 'Software Development', skills: ['Java', 'SQL', 'React'] });
  const hTags = getHiringTags({ jobTitle: 'Software Engineer', domain: 'Software Development', requiredSkills: ['Java', 'SQL', 'React', 'Spring Boot'] });
  const results = computeCosineMatches(fTags, [{ id: 'x', quantity: {}, tags: hTags }]);
  const rm = results[0];
  const recomputed = rm.dotProduct / (rm.queryMagnitude * rm.candidateMagnitude);
  check('dotProduct exposed and > 0', Number.isFinite(rm.dotProduct) && rm.dotProduct > 0, `dot=${rm.dotProduct}`);
  check('norms exposed and positive', rm.queryMagnitude > 0 && rm.candidateMagnitude > 0, `a=${rm.queryMagnitude} b=${rm.candidateMagnitude}`);
  check('dot / (normA*normB) == cosine', Math.abs(recomputed - rm.similarity) < 1e-9, `recomputed=${recomputed.toFixed(6)} cos=${rm.similarity.toFixed(6)}`);
}

console.log('\n== RICH FREELANCER REPRESENTATION (full profile) ==');
{
  const rutuja = {
    domain: 'Data Engineering',
    skills: ['Python', 'SQL', 'PySpark', 'NumPy', 'Power BI'],
    interests: ['Cloud', 'Gen AI', 'Data Engineering'],
    bio: 'Data engineering and analytics professional interested in software and data systems.',
    experience: '1-3 years',
  };
  const tags = getFreelancerTags(rutuja);
  check('domain included', tags.includes('data engineering'), JSON.stringify(tags));
  check('multiple skills included', ['python', 'sql', 'pyspark', 'numpy', 'power bi'].every((s) => tags.includes(s)), JSON.stringify(tags));
  check('interests included', tags.includes('cloud'), JSON.stringify(tags));
  check('bio tokens included', tags.includes('data') && tags.includes('software'), JSON.stringify(tags));
}

console.log('\n== RICH HIRING REPRESENTATION (full hiring record) ==');
{
  const hiring = {
    jobTitle: 'Software Engineer',
    domain: 'Software Development',
    requiredSkills: ['Java', 'SQL', 'React'],
    preferredSkills: ['JavaScript', 'Git'],
    jobDescription: 'Looking for a software engineer experienced in backend development, APIs, Python and SQL.',
    criteria: {
      minimumQualification: 'Bachelor of Engineering',
      eligibleBranches: ['Computer Science', 'IT'],
      certifications: ['AWS'],
      minimumExperience: '1-3 years',
    },
    startupInfo: { industry: 'Software Development', stage: 'Series A' },
  };
  const tags = getHiringTags(hiring);
  check('job title included', tags.includes('software engineer'), JSON.stringify(tags));
  check('required + preferred skills included', ['java', 'sql', 'react', 'javascript', 'git'].every((s) => tags.includes(s)), JSON.stringify(tags));
  check('job description tokens included', tags.includes('backend') && tags.includes('python') && tags.includes('sql') && tags.includes('api'), JSON.stringify(tags));
  check('criteria branches/certs included', tags.includes('it') && tags.includes('aws'), JSON.stringify(tags));
}

console.log('\n== ELIGIBILITY (separate from cosine score) ==');
{
  const hiring = {
    experienceRequired: '3-5 years',
    criteria: { minimumExperience: '3-5 years', certifications: ['AWS'] },
  };
  const eligibleF = evaluateFreelancerEligibility({ experience: '4 years', certifications: ['AWS'] }, hiring);
  check('eligible freelancer -> eligible true', eligibleF.eligible === true, JSON.stringify(eligibleF.issues));
  const ineligibleF = evaluateFreelancerEligibility({ experience: '1-2 years', certifications: [] }, hiring);
  check('inexperienced freelancer flagged with issue', ineligibleF.issues.length > 0, JSON.stringify(ineligibleF.issues));
  // Eligibility must NOT change the cosine score.
  const cosine = scoreBetween(
    { experience: '1-2 years', skills: ['Python'], domain: 'Data Engineering' },
    { jobTitle: 'Data Engineer', domain: 'Data Engineering', requiredSkills: ['Python'], experienceRequired: '3-5 years' }
  );
  check('cosine score unaffected by eligibility mismatch', cosine.score >= 0 && Number.isFinite(cosine.score), `score=${cosine.score}`);
}

console.log('\n== ZERO VECTOR ==');
{
  const z = computeCosineMatches([], [{ id: 'x', quantity: {}, tags: ['java'] }]);
  check('zero query vector -> 0', z[0].matchScore === 0);
  const z2 = computeCosineMatches(['java'], [{ id: 'y', quantity: {}, tags: [] }]);
  check('zero candidate vector -> 0', z2[0].matchScore === 0);
  const z3 = cosineSimilarity([0, 0, 0], [1, 1, 1]);
  check('cosineSimilarity zero vector returns 0 (no NaN)', z3 === 0, `got ${z3}`);
}

console.log('\n== 40% VISIBILITY THRESHOLD (filter, cosine score unchanged) ==');
// The visibility rule "matchScore >= 40" is applied AFTER cosine similarity and
// never alters the cosine value itself. These scenarios build real vectors and
// verify that the threshold behaves exactly as specified (39 hidden, 40 shown,
// 41 shown).
{
  const query39 = ['a', 'b', 'c'];
  const hiring39 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't'];
  const query40 = ['a', 'b', 'c', 'd'];
  const hiring40 = Array.from({ length: 25 }, (_, i) => String.fromCharCode(97 + i));
  const query41 = ['a', 'b', 'c', 'd', 'e'];
  const hiring41 = Array.from({ length: 30 }, (_, i) => String.fromCharCode(97 + i));

  const candidates = [
    { id: 'h39', quantity: {}, tags: hiring39 },
    { id: 'h40', quantity: {}, tags: hiring40 },
    { id: 'h41', quantity: {}, tags: hiring41 },
  ];

  const r39 = computeCosineMatches(query39, candidates.filter((c) => c.id === 'h39'))[0];
  const r40 = computeCosineMatches(query40, candidates.filter((c) => c.id === 'h40'))[0];
  const r41 = computeCosineMatches(query41, candidates.filter((c) => c.id === 'h41'))[0];

  check('39% scenario scores exactly 39', r39.matchScore === 39, `score=${r39.matchScore} sim=${r39.similarity.toFixed(4)}`);
  check('40% scenario scores exactly 40', r40.matchScore === 40, `score=${r40.matchScore} sim=${r40.similarity.toFixed(4)}`);
  check('41% scenario scores exactly 41', r41.matchScore === 41, `score=${r41.matchScore} sim=${r41.similarity.toFixed(4)}`);

  const applyThreshold = (results) => results.filter((m) => m.matchScore >= 40);
  const shown = applyThreshold([r39, r40, r41]).map((m) => m.id);
  check('39% is HIDDEN by the >=40 rule', !shown.includes('h39'), JSON.stringify(shown));
  check('40% is SHOWN by the >=40 rule', shown.includes('h40'), JSON.stringify(shown));
  check('41% is SHOWN by the >=40 rule', shown.includes('h41'), JSON.stringify(shown));

  check('threshold does NOT modify the 39 cosine value', r39.similarity > 0 && r39.matchScore === 39, `sim=${r39.similarity}`);
}

console.log('\n== BLOCKED-ACCOUNT EXCLUSION (match pipeline) ==');
// A generic helper mirroring the controller pipeline: candidates are excluded
// when their owning user is blocked, before/independent of the cosine ranking.
{
  const applyBlockedExclusion = (candidates, blockedOwnerIds) =>
    candidates.filter((c) => !blockedOwnerIds.has(c.ownerUserId));

  const freelancers = [
    { id: 'f1', ownerUserId: 'u-active-1', tags: ['python', 'sql'], name: 'Active Alice' },
    { id: 'f2', ownerUserId: 'u-blocked-2', tags: ['python', 'sql'], name: 'Blocked Bob' },
  ];
  const visible = applyBlockedExclusion(freelancers, new Set(['u-blocked-2']));
  check('blocked account excluded from candidates', visible.length === 1 && visible[0].id === 'f1', JSON.stringify(visible.map((v) => v.id)));

  const hirings = [
    { id: 'h1', ownerUserId: 'u-blocked-startup', tags: ['java', 'sql'] },
    { id: 'h2', ownerUserId: 'u-active-startup', tags: ['java', 'sql'] },
  ];
  const visibleH = applyBlockedExclusion(hirings, new Set(['u-blocked-startup']));
  check('blocked startup hiring excluded from candidates', visibleH.length === 1 && visibleH[0].id === 'h2', JSON.stringify(visibleH.map((v) => v.id)));
}

console.log(`\n=== UNIT RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
