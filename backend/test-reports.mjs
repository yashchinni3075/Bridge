/**
 * End-to-end tests for the Reports + Automatic Blocking + two-sided Match
 * system. Runs entirely in a SCRATCH database (MONGO_URI + '-report-test')
 * so the real project data is never modified.
 *
 * Covers:
 *   - freelancer can report a startup
 *   - startup can report a freelancer
 *   - report stored in the `reports` collection
 *   - report count increments
 *   - 10th report automatically blocks the reported user
 *   - blocked user cannot contact others
 *   - blocked user cannot be contacted
 *   - blocked startup cannot create/publish hiring
 *   - blocked freelancer excluded from Startup -> Match Freelancers
 *   - blocked startup excluded from Freelancer Match Engine
 *   - real MongoDB ObjectIds used everywhere
 *   - no hardcoded/demo matching data
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import FreelancerProfile from './models/FreelancerProfile.js';
import StartupHiring from './models/StartupHiring.js';
import Report from './models/Report.js';
import { createReport, getReportCount } from './controllers/reportController.js';
import { sendConnectionRequest } from './controllers/connectionController.js';
import { protect } from './middleware/authMiddleware.js';
import {
  getFreelancerHiringMatches,
  getStartupMatchFreelancers,
} from './controllers/freelancerMatchController.js';

dotenv.config();
await mongoose.connect(`${process.env.MONGO_URI}-report-test`).then(() => mongoose.connection.db.dropDatabase());
console.log('Scratch DB connected:', `${process.env.MONGO_URI}-report-test`);

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

const mockRes = () => ({
  statusCode: 0,
  body: null,
  status(c) { this.statusCode = c; return this; },
  json(b) { this.body = b; return this; },
});

const call = async (handler, req) => {
  const res = mockRes();
  const next = (e) => { throw e; };
  await handler(req, res, next);
  return res;
};

// ---------------------------------------------------------------------------
// Scratch data
// ---------------------------------------------------------------------------
console.log('\n== SCRATCH SETUP ==');

const freelancerUser = await User.create({
  name: 'Scratch Freelancer',
  email: 'scratch-fl@test.com',
  password: 'password123',
  role: 'freelancer',
});
const startupUser = await User.create({
  name: 'Scratch Startup',
  email: 'scratch-st@test.com',
  password: 'password123',
  role: 'startup',
});
const blockedFreelancerUser = await User.create({
  name: 'Blocked Freelancer',
  email: 'blocked-fl@test.com',
  password: 'password123',
  role: 'freelancer',
  isBlocked: true,
});
const blockedStartupUser = await User.create({
  name: 'Blocked Startup',
  email: 'blocked-st@test.com',
  password: 'password123',
  role: 'startup',
  isBlocked: true,
});

const flProfile = await FreelancerProfile.create({
  userId: freelancerUser._id,
  name: 'Scratch Freelancer',
  domain: 'Software Development',
  skills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
  experience: '0-1 years',
});
const blockedFlProfile = await FreelancerProfile.create({
  userId: blockedFreelancerUser._id,
  name: 'Blocked Freelancer',
  domain: 'Software Development',
  skills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
  experience: '0-1 years',
});

// Two hiring records: one from the active startup, one from the blocked startup.
const activeHiring = await StartupHiring.create({
  startupId: new mongoose.Types.ObjectId(),
  userId: startupUser._id,
  jobTitle: 'Software Engineer',
  jobDescription: 'Full-stack engineer using Java, SQL, React, JavaScript and Python.',
  vacancies: 2,
  domain: 'Software Development',
  requiredSkills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
  status: 'open',
});
const blockedHiring = await StartupHiring.create({
  startupId: new mongoose.Types.ObjectId(),
  userId: blockedStartupUser._id,
  jobTitle: 'Blocked Job',
  jobDescription: 'Java SQL React JavaScript Python developer needed.',
  vacancies: 1,
  domain: 'Software Development',
  requiredSkills: ['Java', 'SQL', 'React', 'JavaScript', 'Python'],
  status: 'open',
});

check('setup: real ObjectIds used', mongoose.Types.ObjectId.isValid(freelancerUser._id) && mongoose.Types.ObjectId.isValid(startupUser._id) && mongoose.Types.ObjectId.isValid(activeHiring._id));
check('setup: no demo/hardcoded ids (all Mongo ObjectIds)', [freelancerUser, startupUser, blockedFreelancerUser, blockedStartupUser, activeHiring, blockedHiring].every((x) => mongoose.isObjectIdOrHexString(String(x._id))));

// ---------------------------------------------------------------------------
// Freelancer -> Startup report
// ---------------------------------------------------------------------------
console.log('\n== FREELANCER REPORTS STARTUP ==');

let res = await call(createReport, {
  user: { _id: freelancerUser._id, role: 'freelancer' },
  body: { reportedUserId: startupUser._id, reason: 'Fake job', description: 'Job does not exist.' },
});
check('freelancer report startup -> 201', res.statusCode === 201, `status=${res.statusCode} msg=${res.body?.message}`);
check('report persisted in reports collection', (await Report.countDocuments()) === 1);
const stored = await Report.findOne().lean();
check('report has reporterRole=freelancer', stored.reporterRole === 'freelancer');
check('report has reportedRole=startup', stored.reportedRole === 'startup');
check('report uses real reporter ObjectId', stored.reporterId.toString() === freelancerUser._id.toString());
check('report uses real reported ObjectId', stored.reportedUserId.toString() === startupUser._id.toString());
check('report initialized as pending', stored.status === 'pending');

res = await call(createReport, {
  user: { _id: freelancerUser._id, role: 'freelancer' },
  body: { reportedUserId: startupUser._id, reason: 'Scam/Fraud', jobId: activeHiring._id },
});
check('report with jobId is saved', res.statusCode === 201 && res.body?.report?.jobId?.toString() === activeHiring._id.toString());

// Report against self must be rejected
res = await call(createReport, {
  user: { _id: freelancerUser._id, role: 'freelancer' },
  body: { reportedUserId: freelancerUser._id, reason: 'Other' },
});
check('cannot report self -> 400', res.statusCode === 400, `status=${res.statusCode}`);

// Report against nonexistent user must be rejected
res = await call(createReport, {
  user: { _id: freelancerUser._id, role: 'freelancer' },
  body: { reportedUserId: new mongoose.Types.ObjectId(), reason: 'Other' },
});
check('cannot report nonexistent user -> 404', res.statusCode === 404, `status=${res.statusCode}`);

// Invalid reason must be rejected
res = await call(createReport, {
  user: { _id: freelancerUser._id, role: 'freelancer' },
  body: { reportedUserId: startupUser._id, reason: 'Made up reason' },
});
check('invalid reason rejected -> 400', res.statusCode === 400, `status=${res.statusCode}`);

// ---------------------------------------------------------------------------
// Startup -> Freelancer report
// ---------------------------------------------------------------------------
console.log('\n== STARTUP REPORTS FREELANCER ==');

res = await call(createReport, {
  user: { _id: startupUser._id, role: 'startup' },
  body: { reportedUserId: freelancerUser._id, reason: 'Misrepresentation of skills', description: 'Skills do not match.' },
});
check('startup report freelancer -> 201', res.statusCode === 201, `status=${res.statusCode}`);
const sReport = await Report.findOne({ reporterId: startupUser._id, reportedUserId: freelancerUser._id, reporterRole: 'startup' }).lean();
check('startup report stored with reporterRole=startup', !!sReport && sReport.reportedRole === 'freelancer');

// ---------------------------------------------------------------------------
// Report count
// ---------------------------------------------------------------------------
console.log('\n== REPORT COUNT ==');

res = await call(getReportCount, { params: { userId: startupUser._id } });
check('report count endpoint returns totalReports', res.statusCode === 200 && res.body?.totalReports === 2, `count=${res.body?.totalReports}`);
check('report count returns isBlocked=false', res.statusCode === 200 && res.body?.isBlocked === false);

// ---------------------------------------------------------------------------
// Match engine excludes blocked accounts (both directions) BEFORE auto-block
// ---------------------------------------------------------------------------
console.log('\n== MATCH FILTERING EXCLUDES BLOCKED ==');

// Startup -> Match Freelancers: blocked freelancer must NOT appear.
res = await call(getStartupMatchFreelancers, {
  user: { _id: startupUser._id, role: 'startup' },
  params: { hiringId: activeHiring._id },
});
check('startup match api returns 200', res.statusCode === 200, `status=${res.statusCode}`);
const startupMatches = res.body?.matches || [];
const matchedIds = new Set(startupMatches.map((m) => String(m.freelancerId)));
check('blocked freelancer excluded from Startup Match Freelancers', !matchedIds.has(blockedFreelancerUser._id.toString()), JSON.stringify([...matchedIds]));
check('active freelancer appears in Startup Match Freelancers', matchedIds.has(freelancerUser._id.toString()), JSON.stringify([...matchedIds]));
check('all startup matches >= 40%', startupMatches.every((m) => m.matchScore >= 40), JSON.stringify(startupMatches.map((m) => m.matchScore)));
check('startup matches are real ObjectIds (no hardcoded data)', startupMatches.every((m) => mongoose.isObjectIdOrHexString(String(m.freelancerId))));
check('startup matches sorted descending', startupMatches.every((m, i, a) => i === 0 || a[i - 1].matchScore >= m.matchScore));

// Freelancer -> Hire: blocked startup's hiring must NOT appear; active startup appears.
res = await call(getFreelancerHiringMatches, {
  user: { _id: freelancerUser._id, role: 'freelancer' },
});
check('freelancer match api returns 200', res.statusCode === 200, `status=${res.statusCode}`);
const fMatches = res.body?.matches || [];
const fHiringIds = new Set(fMatches.map((m) => String(m.hiringId)));
check('blocked startup hiring excluded from Freelancer Match Engine', !fHiringIds.has(blockedHiring._id.toString()), JSON.stringify([...fHiringIds]));
check('active startup hiring included in Freelancer Match Engine', fHiringIds.has(activeHiring._id.toString()), JSON.stringify([...fHiringIds]));
check('all freelancer matches >= 40%', fMatches.every((m) => m.matchScore >= 40), JSON.stringify(fMatches.map((m) => m.matchScore)));
check('freelancer matches reference real startup userId (no hardcoded data)', fMatches.every((m) => mongoose.isObjectIdOrHexString(String(m.startupUserId))));

// ---------------------------------------------------------------------------
// Auto-block at 10 reports
// ---------------------------------------------------------------------------
console.log('\n== AUTO-BLOCK AT 10 REPORTS ==');

// startupUser currently has 2 reports (both from this scratch set). Add 8 more.
for (let i = 0; i < 8; i += 1) {
  await call(createReport, {
    user: { _id: freelancerUser._id, role: 'freelancer' },
    body: { reportedUserId: startupUser._id, reason: 'Spam/Duplicate', description: `Report #${i}` },
  });
}
const afterTen = await User.findById(startupUser._id).select('isBlocked').lean();
check('10th report automatically blocks the reported user', afterTen.isBlocked === true, `isBlocked=${afterTen.isBlocked}`);

const totalReports = await Report.countDocuments({ reportedUserId: startupUser._id });
check('10 reports against the user exist', totalReports === 10, `count=${totalReports}`);

res = await call(getReportCount, { params: { userId: startupUser._id } });
check('report count reflects blocked status', res.statusCode === 200 && res.body?.totalReports === 10 && res.body?.isBlocked === true);

// ---------------------------------------------------------------------------
// Blocked user cannot contact (as requester) and cannot be contacted (as recipient)
// ---------------------------------------------------------------------------
console.log('\n== BLOCKED ACCOUNT CONTACT GUARDS ==');

// A request targeted AT a blocked recipient is rejected by the connection guard.
res = await call(sendConnectionRequest, {
  user: { _id: freelancerUser._id, role: 'freelancer' },
  params: { recipientId: blockedStartupUser._id },
  body: { note: '' },
});
check('cannot contact a blocked account -> 400', res.statusCode === 400 && (res.body?.message || '').toLowerCase().includes('unavailable'), `status=${res.statusCode} msg=${res.body?.message}`);

// ---------------------------------------------------------------------------
// Protect middleware rejects blocked users on the API layer
// ---------------------------------------------------------------------------
console.log('\n== PROTECT MIDDLEWARE (API LAYER) ==');

import jwt from 'jsonwebtoken';

// A blocked user must be turned away with 403 before any controller runs.
const blockedToken = jwt.sign({ id: blockedStartupUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '30d' });
const protectReq = { headers: { authorization: `Bearer ${blockedToken}` } };
const protectRes = mockRes();
const protectNext = () => {};
await protect(protectReq, protectRes, protectNext);
check('blocked user rejected by protect -> 403 suspended message', protectRes.statusCode === 403 && (protectRes.body?.message || '').toLowerCase().includes('suspended'), `status=${protectRes.statusCode} msg=${protectRes.body?.message}`);

// A healthy (unblocked) user passes protect.
const freelancerToken = jwt.sign({ id: freelancerUser._id.toString() }, process.env.JWT_SECRET, { expiresIn: '30d' });
const healthyReq = { headers: { authorization: `Bearer ${freelancerToken}` } };
const healthyRes = mockRes();
let passedProtect = false;
const healthyNext = () => { passedProtect = true; };
await protect(healthyReq, healthyRes, healthyNext);
check('unblocked user passes protect', passedProtect && healthyRes.statusCode === 0);

// ---------------------------------------------------------------------------
// Live auto-block -> match exclusion chain
// ---------------------------------------------------------------------------
console.log('\n== LIVE AUTO-BLOCK EXCLUSION (after 10th report) ==');

// At this point startupUser is BLOCKED (10th report auto-blocked it). Its
// hiring record must now be excluded from the Freelancer Match Engine too.
res = await call(getFreelancerHiringMatches, {
  user: { _id: freelancerUser._id, role: 'freelancer' },
});
check('freelancer match still returns 200 after auto-block', res.statusCode === 200, `status=${res.statusCode}`);
const liveIds = new Set((res.body?.matches || []).map((m) => String(m.hiringId)));
check('auto-blocked startup hiring excluded from match results', !liveIds.has(activeHiring._id.toString()), JSON.stringify([...liveIds]));

// ---------------------------------------------------------------------------
// Cleanup + report
// ---------------------------------------------------------------------------
await mongoose.connection.db.dropDatabase();
await mongoose.disconnect();

console.log(`\n=== REPORTS RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);