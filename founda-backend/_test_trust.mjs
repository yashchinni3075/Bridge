import { calculateTrustAndStars } from "./utils/trustCalculator.js";

console.log("full:", JSON.stringify(calculateTrustAndStars({
  github: { isVerified: true },
  linkedin: { isVerified: true },
  aadhaar: { status: "approved" },
  email: true,
  phone: true,
})));

console.log("partial:", JSON.stringify(calculateTrustAndStars({
  github: { isVerified: true },
  email: true,
})));

console.log("empty:", JSON.stringify(calculateTrustAndStars()));