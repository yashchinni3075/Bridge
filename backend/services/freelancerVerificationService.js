import User from '../models/User.js';
import FreelancerVerification from '../models/FreelancerVerification.js';

// Returns the freelancer_verifications document for the logged-in Freelancer.
// Creates it (partially seeded from any legacy User.verification data) on first access.
export const getOrCreateByFreelancer = async (freelancerId) => {
  const existing = await FreelancerVerification.findOne({ freelancerId });
  if (existing) return existing;

  const user = await User.findById(freelancerId).lean();
  const verification = user?.verification || {};
  const github = verification.github || {};
  const linkedin = verification.linkedin || {};

  const doc = new FreelancerVerification({
    freelancerId,
    github: {
      username: github.username || '',
      profileUrl: github.profileUrl || '',
      isVerified: github.isVerified || false,
      verifiedAt: github.verifiedAt || null,
      note: github.note || '',
    },
    linkedin: {
      profileUrl: linkedin.profileUrl || '',
      isVerified: linkedin.isVerified || false,
      verifiedAt: linkedin.verifiedAt || null,
      method: linkedin.method || 'url',
      note: linkedin.note || '',
    },
    identity: {
      documentType: verification.documentType || 'Government ID',
      documentUrl: verification.documentUrl || null,
      status: verification.status || (user?.isVerified ? 'approved' : 'not_submitted'),
      verifiedAt: verification.reviewedAt || null,
    },
    trustScore: 0,
  });
  await doc.save();
  return doc;
};

// Idempotent migration: copies existing verification data stored on the
// User/Freelancer document (verification.github / verification.linkedin) into
// the dedicated freelancer_verifications collection.
// The legacy fields on the User document are preserved (not deleted).
export const migrateExistingFreelancerVerifications = async () => {
  const users = await User.find({ role: 'freelancer' })
    .select('_id verification isVerified')
    .lean();

  let migrated = 0;

  for (const user of users) {
    const verification = user.verification || {};
    const hasLegacyData =
      Boolean(verification.github?.username) ||
      Boolean(verification.github?.isVerified) ||
      Boolean(verification.linkedin?.profileUrl) ||
      verification.status !== 'not_submitted' ||
      Boolean(verification.documentUrl);

    if (!hasLegacyData) continue;

    const existing = await FreelancerVerification.findOne({ freelancerId: user._id });

    if (existing) {
      const updates = {};
      if (!existing.github?.username && verification.github?.username) {
        updates['github.username'] = verification.github.username;
        updates['github.profileUrl'] = verification.github.profileUrl || '';
        updates['github.isVerified'] = Boolean(verification.github.isVerified);
        updates['github.verifiedAt'] = verification.github.verifiedAt || null;
        updates['github.note'] = verification.github.note || '';
      }
      if (!existing.linkedin?.profileUrl && verification.linkedin?.profileUrl) {
        updates['linkedin.profileUrl'] = verification.linkedin.profileUrl;
        updates['linkedin.isVerified'] = Boolean(verification.linkedin.isVerified);
        updates['linkedin.verifiedAt'] = verification.linkedin.verifiedAt || null;
        updates['linkedin.method'] = verification.linkedin.method || 'url';
        updates['linkedin.note'] = verification.linkedin.note || '';
      }
      if (Object.keys(updates).length) {
        await FreelancerVerification.updateOne({ _id: existing._id }, { $set: updates });
      }
    } else {
      await getOrCreateByFreelancer(user._id);
    }

    migrated += 1;
  }

  return { checked: users.length, migrated };
};