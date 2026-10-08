import User from '../models/User.js';
import FreelancerVerification from '../models/FreelancerVerification.js';

// Returns the freelancer_verifications document for the logged-in Freelancer.
// Creates it (partially seeded from any legacy User.verification data) on first access.
export const getOrCreateByFreelancer = async (freelancerId) => {
  const existing = await FreelancerVerification.findOne({ freelancerId });
  if (existing) return existing;

  const user = await User.findById(freelancerId).lean();
  const verification = user?.verification || {};

  const doc = new FreelancerVerification({
    freelancerId,
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

// Idempotent migration: copies existing identity verification data stored on the
// User/Freelancer document into the dedicated freelancer_verifications collection.
// The legacy fields on the User document are preserved (not deleted).
export const migrateExistingFreelancerVerifications = async () => {
  const users = await User.find({ role: 'freelancer' })
    .select('_id verification isVerified')
    .lean();

  let migrated = 0;

  for (const user of users) {
    const verification = user.verification || {};
    const hasLegacyData =
      verification.status !== 'not_submitted' || Boolean(verification.documentUrl);

    if (!hasLegacyData) continue;

    const existing = await FreelancerVerification.findOne({ freelancerId: user._id });

    if (existing) {
      const updates = {};
      if (!existing.identity?.documentUrl && verification.documentUrl) {
        updates['identity.documentUrl'] = verification.documentUrl;
        updates['identity.status'] = verification.status || 'pending';
        updates['identity.documentType'] = verification.documentType || 'Government ID';
        updates['identity.verifiedAt'] = verification.reviewedAt || null;
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