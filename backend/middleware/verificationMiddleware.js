/**
 * Restrict routes to users whose verification status is approved.
 * Admins bypass this restriction.
 */
export const requireVerifiedUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  const status = req.user.verification?.status || (req.user.isVerified ? 'approved' : 'not_submitted');

  if (status !== 'approved') {
    return res.status(403).json({
      success: false,
      code: 'VERIFICATION_REQUIRED',
      verificationStatus: status,
      rejectionReason: req.user.verification?.rejectionReason || null,
      message: 'Access denied: Identity verification approved status is required to access this feature.',
    });
  }

  next();
};

