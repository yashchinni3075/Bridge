const clamp = (n, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(n)));

function similarity(a, b) {
  const A = new Set(a.map((x) => x.toLowerCase()));
  const B = new Set(b.map((x) => x.toLowerCase()));
  const intersection = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union ? intersection / union : 0;
}

export function matchScore(freelancer, startup, engagement) {
  const skill = similarity(freelancer.skills, startup.requiredSkills) * 100;
  const domain = freelancer.domains.includes(startup.domain)
    ? 100
    : freelancer.interests.includes(startup.domain)
      ? 60
      : 20;
  const experience = clamp(freelancer.experience * 32);
  const engagementFit =
    startup.engagement === engagement ? 100 : 35;
  const trust = freelancer.trustScore;

  const total = clamp(
    skill * 0.42 +
      domain * 0.2 +
      experience * 0.1 +
      engagementFit * 0.1 +
      trust * 0.18,
  );

  const shared = startup.requiredSkills.filter((skillName) =>
    freelancer.skills.some(
      (x) => x.toLowerCase() === skillName.toLowerCase(),
    ),
  );

  const missing = startup.requiredSkills.filter(
    (skillName) => !shared.includes(skillName),
  );

  return {
    total,
    skill: clamp(skill),
    domain,
    experience,
    engagementFit,
    trust,
    shared,
    missing,
  };
}

export function candidateScore(freelancer, startup) {
  return matchScore(freelancer, startup, startup.engagement);
}

export function initials(name) {
  return name
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export { clamp };
