export function calculateTrustAndStars(verification = {}) {
  const v = verification || {};
  const github = v.github || {};
  const linkedin = v.linkedin || {};
  const aadhaar = v.aadhaar || {};

  let score = 0;

  if (github.isVerified) score += 20;
  if (linkedin.isVerified) score += 20;
  if (aadhaar.status === "approved") score += 30;
  const isEmailVerified = v.email === true || v.email === "verified";
  const isPhoneVerified = v.phone === true || v.mobile === "verified";
  if (isEmailVerified) score += 15;
  if (isPhoneVerified) score += 15;

  score = Math.max(0, Math.min(100, score));

  let starRating = 0;
  if (score >= 90) starRating = 5;
  else if (score >= 70) starRating = 4;
  else if (score >= 50) starRating = 3;
  else if (score >= 30) starRating = 2;
  else if (score >= 1) starRating = 1;
  else starRating = 0;

  const isFullyVerified = starRating === 5;

  return { trustScore: score, starRating, isFullyVerified };
}
