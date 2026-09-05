export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

const norm = (s) => s.trim().toLowerCase();

function overlap(a = [], b = []) {
  const bSet = new Set(b.map(norm));
  const shared = a.filter((skill) => bSet.has(norm(skill)));
  const aSet = new Set(a.map(norm));
  const missing = b.filter((skill) => !aSet.has(norm(skill)));
  return { shared, missing };
}

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

// Score a startup as a match for a given freelancer.
export function matchScore(freelancer, startup, engagement) {
  const { shared, missing } = overlap(freelancer.skills, startup.requiredSkills);
  const skill = startup.requiredSkills.length
    ? clamp((shared.length / startup.requiredSkills.length) * 100)
    : 50;
  const domain = freelancer.domains.includes(startup.domain) ? 100 : 40;
  const experience = clamp(40 + freelancer.experience * 9);
  const engagementFit = engagement === startup.engagement ? 100 : 55;
  const trust = freelancer.trustScore;

  const total = clamp(
    skill * 0.4 +
      domain * 0.2 +
      experience * 0.12 +
      engagementFit * 0.13 +
      trust * 0.15,
  );

  return { total, shared, missing, skill, domain, experience, engagementFit, trust };
}

// Score a freelancer as a candidate for a given startup.
export function candidateScore(freelancer, startup) {
  const { shared, missing } = overlap(freelancer.skills, startup.requiredSkills);
  const skill = startup.requiredSkills.length
    ? clamp((shared.length / startup.requiredSkills.length) * 100)
    : 50;
  const domain = freelancer.domains.includes(startup.domain) ? 100 : 40;
  const experience = clamp(40 + freelancer.experience * 9);
  const engagementFit = freelancer.engagement === startup.engagement ? 100 : 55;
  const trust = freelancer.trustScore;

  const total = clamp(
    skill * 0.4 +
      domain * 0.2 +
      experience * 0.12 +
      engagementFit * 0.13 +
      trust * 0.15,
  );

  return { total, shared, missing, skill, domain, experience, engagementFit, trust };
}
