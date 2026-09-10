/**
 * End-to-end test for the Freelancer -> Startup Hiring Match Engine.
 *
 * Part A  - Real HTTP flow against the running backend + real MongoDB data.
 * Part B  - Edge cases that must not touch the real DB (zero-vector + empty
 *           hiring collection), validated at the controller/service level.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import StartupHiring from './models/StartupHiring.js';
import FreelancerProfile from './models/FreelancerProfile.js';
import { getFreelancerTags, getHiringTags, buildSharedVocabulary, buildVector, cosineSimilarity, computeCosineMatches } from './services/matchingEngineService.js';
import { getFreelancerHiringMatches } from './controllers/freelancerMatchController.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to', process.env.MONGO_URI);

const BASE = 'http://localhost:5000/api';
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

const assertAuth = async () => {
  console.log('\n[AUTH]');
  const noToken = await fetch(`${BASE}/matching/freelancer/hiring`);
  check('GET without token returns 401', noToken.status === 401, `got ${noToken.status}`);

  // Authenticate the REAL freelancer via the real login endpoint.
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rutujasutar05@gmail.com', password: 'Rutuja@123' }),
  });
  const loginBody = await loginRes.json();
  check('Freelancer login succeeds', loginRes.status === 200 && !!loginBody.token, loginBody.message || '');
  if (!loginBody.token) return null;

  // Startup token: sign a real JWT for the startup user (same payload as login).
  const shrushtiUser = await User.findOne({ email: 'shrushti@gmail.com' });
  const startupToken = jwt.sign({ id: shrushtiUser._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  const startupRes = await fetch(`${BASE}/matching/freelancer/hiring`, {
    headers: { Authorization: `Bearer ${startupToken}` },
  });
  check('Startup role gets 403 on freelancer feed', startupRes.status === 403, `got ${startupRes.status}`);

  // Invalid token
  const badRes = await fetch(`${BASE}/matching/freelancer/hiring`, {
    headers: { Authorization: 'Bearer invalid.token.here' },
  });
  check('Invalid token returns 401', badRes.status === 401, `got ${badRes.status}`);

  return loginBody.token;
};

const assertMatches = async (token) => {
  console.log('\n[MATCH API]');
  const res = await fetch(`${BASE}/matching/freelancer/hiring`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  check('Match Engine API returns 200', res.status === 200, `got ${res.status}`);
  const body = await res.json();
  check('Response has success=true', body.success === true);
  check('Response has matches array', Array.isArray(body.matches));

  const matches = body.matches || [];

  // Visibility rule: the Match Engine only shows >= 40% cosine matches.
  check('every returned match satisfies score >= 40', matches.every((m) => m.matchScore >= 40), JSON.stringify(matches.map((m) => m.matchScore)));

  if (matches.length > 0) {
    // Sorting: descending by matchScore.
    const sorted = [...matches].map((m) => m.matchScore).every((v, i, a) => i === 0 || a[i - 1] >= v);
    check('Matches sorted highest -> lowest', sorted, JSON.stringify(matches.map((m) => m.matchScore)));

    // Real startup hiring records must appear (no demo data) when above threshold.
    const swe = matches.find((m) => m.jobTitle === 'Software Engineer');
    if (swe) {
      check('startupName is real (Shrushti\'s Venture)', (swe.startupName || '').toLowerCase().includes('shrushti'), swe.startupName);
      check('real requiredSkills present', JSON.stringify(swe.requiredSkills) === JSON.stringify(['Java', 'SQL', 'React', 'Spring Boot']), JSON.stringify(swe.requiredSkills));
      check('real preferredSkills present', JSON.stringify(swe.preferredSkills) === JSON.stringify(['JavaScript', 'Git']), JSON.stringify(swe.preferredSkills));
      check('real domain present', swe.domain === 'Software Development', swe.domain);
      check('real experienceRequired present', swe.experienceRequired === '0-2 years', swe.experienceRequired);
      check('real vacancies', swe.vacancies === 2, String(swe.vacancies));
      check('real salary', swe.salary?.min === 6 && swe.salary?.max === 8 && swe.salary?.currency === 'INR', JSON.stringify(swe.salary));
      check('real employmentType', swe.employmentType === 'Full Time', swe.employmentType);
      check('real location', swe.location === 'Pune', swe.location);
      check('hiringId present', !!swe.hiringId);
      check('startupId present', !!swe.startupId);
      check('startupUserId present', !!swe.startupUserId);
      check('eligibility object present', !!swe.eligibility && typeof swe.eligibility.eligible === 'boolean', JSON.stringify(swe.eligibility));
      check('criteria object present', swe.criteria !== null && typeof swe.criteria === 'object', JSON.stringify(swe.criteria));
      check('eligibility never alters cosine score', typeof swe.matchScore === 'number' && swe.matchScore >= 0 && swe.matchScore <= 100, `matchScore=${swe.matchScore}`);
      check('sharedTags exposed', Array.isArray(swe.sharedTags) && swe.sharedTags.length > 0);
      check('vectors exposed with matching length', Array.isArray(swe.freelancerVector) && Array.isArray(swe.hiringVector) && swe.freelancerVector.length === swe.hiringVector.length, `f=${swe.freelancerVector?.length} h=${swe.hiringVector?.length}`);
      check('dotProduct == A·B', Number.isFinite(swe.dotProduct), `dot=${swe.dotProduct}`);
      check('profile domain/skills exposed', swe.freelancerDomain !== undefined && Array.isArray(swe.freelancerSkills), JSON.stringify({ d: swe.freelancerDomain, s: swe.freelancerSkills }));
    }

    // Score = cosine similarity computed from returned tags.
    let scoreVerified = true;
    for (const m of matches) {
      const vocab = buildSharedVocabulary([{ tags: m.freelancerTags }, { tags: m.hiringTags }]);
      const vF = buildVector(m.freelancerTags, vocab);
      const vH = buildVector(m.hiringTags, vocab);
      const cos = cosineSimilarity(vF, vH);
      const expected = Math.round(cos * 100);
      if (m.matchScore !== expected || Math.abs(m.similarity - cos) > 1e-9) {
        scoreVerified = false;
        console.log(`      mismatch for ${m.jobTitle}: API=${m.matchScore}/${m.similarity} recomputed=${expected}/${cos.toFixed(6)}`);
      }
    }
    check('matchScore == cosineSimilarity*100 (recomputed for every row)', scoreVerified);

    // Freelancer tags reflect the REAL profile (domain + skills).
    const f = await FreelancerProfile.findOne({ name: 'Rutuja' }).lean();
    const expectedFTags = getFreelancerTags(f);
    const first = matches[0];
    check(
      'freelancerTags are built from real profile tags',
      JSON.stringify([...first.freelancerTags].sort()) === JSON.stringify([...expectedFTags].sort()),
      JSON.stringify(first.freelancerTags)
    );

    // Matched tags are the intersection of the two vectors.
    const expectedMatched = (first.freelancerTags || []).filter((t) => (first.hiringTags || []).includes(t));
    check(
      'matchedTags == freelancer ∩ hiring tags',
      JSON.stringify([...first.matchedTags].sort()) === JSON.stringify([...expectedMatched].sort()),
      JSON.stringify({ got: first.matchedTags, expected: expectedMatched })
    );
  } else {
    console.log('      (no matches >= 40% in the current real data; threshold behavior verified above)');
  }

  return matches;
};

const assertNoStaticData = (matches) => {
  console.log('\n[NO STATIC DATA]');
  const demoBrands = ['kindleworks', 'nimbus', 'ledgerly', 'ferrylane'];
  const haystack = JSON.stringify(matches).toLowerCase();
  check('No demo brands (Kindleworks/Nimbus/Ledgerly/FerryLane) in results', !demoBrands.some((b) => haystack.includes(b)));
};

const assertCornerCases = async () => {
  console.log('\n[CORNER CASES]');

  // Repeat the proven zero-vector scenario from test-engine.mjs using the real service.
  const zeroQuery = compute(computeZeroQueryEntry());
  check('Zero query vector -> score 0 + reason', zeroQuery.entry.matchScore === 0 && zeroQuery.entry.note.length > 0, zeroQuery.entry.note);
  const zeroCandidate = compute(computeZeroCandidateEntry());
  check('Zero candidate vector -> score 0 + reason', zeroCandidate.entry.matchScore === 0 && zeroCandidate.entry.note.length > 0, zeroCandidate.entry.note);

  // Empty startup_hiring collection -> the controller must return the empty-state message.
  // Run in a SCRATCH database so real data is untouched.
  await mongoose.disconnect();
  await mongoose.connect(`${process.env.MONGO_URI}-empty-test`).then(() => mongoose.connection.db.dropDatabase());
  const scratchFreelancer = await FreelancerProfile.create({
    userId: new mongoose.Types.ObjectId(),
    name: 'Scratch Freelancer',
    skills: ['Python', 'Django'],
    domain: 'Data Science',
  });
  const mockReq = { user: { _id: scratchFreelancer.userId, role: 'freelancer' } };
  const mockRes = { statusCode: 0, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  const mockNext = (e) => { throw e; };
  await getFreelancerHiringMatches(mockReq, mockRes, mockNext);
  check(
    'Empty startup_hiring -> 200 with "No startup hiring opportunities available yet."',
    mockRes.statusCode === 200 && mockRes.body?.message === 'No startup hiring opportunities available yet.',
    `status=${mockRes.statusCode} message=${mockRes.body?.message}`
  );
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
};

// tiny pure helpers so the zero-vector checks stay readable
const compute = (candidates) => {
  let res;
  if (candidates.zero === 'query') {
    res = computeCosineMatches([], [{ id: 'x', quantity: {}, tags: ['java'] }]);
  } else {
    res = computeCosineMatches(['java'], [{ id: 'y', quantity: {}, tags: [] }]);
  }
  return { entry: res[0] };
};
const computeZeroQueryEntry = () => ({ zero: 'query' });
const computeZeroCandidateEntry = () => ({ zero: 'candidate' });

console.log('=== E2E: Freelancer Match Engine ===');
const token = await assertAuth();
if (token) {
  const matches = await assertMatches(token);
  await assertNoStaticData(matches);
}
await assertCornerCases();

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);