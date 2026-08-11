// Formatting helpers for the investor dashboard.
// These are display-only helpers; amounts are stored in lakhs (₹).

/**
 * Formats an amount given in lakhs into the Indian display convention.
 * e.g. 50 -> "₹50L", 200 -> "₹2Cr", 130 -> "₹1.3Cr"
 */
export function formatLakhs(lakhs) {
  if (lakhs >= 100) {
    const crores = lakhs / 100
    const rounded = Number.isInteger(crores) ? crores : crores.toFixed(1)
    return `₹${rounded}Cr`
  }
  return `₹${lakhs}L`
}
