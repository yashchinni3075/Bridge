// dummyData.js — standalone dummy data. Shaped to match the earlier
// founda-app backend's API responses, so swapping to real fetch() later
// is a drop-in change, not a rewrite.

export const investorMatches = [
  {
    id: "i1",
    name: "Karan Mehta",
    org: "Northstar Angels",
    title: "Managing Partner",
    sectors: ["Fintech", "SaaS"],
    stage: "Pre-seed",
    checkRange: "$25K–75K",
    score: 93,
    verification: "verified",
    location: "Bengaluru, India",
    bio: "Managing Partner at Northstar Angels, backing early fintech and SaaS founders across South Asia for over 8 years. Previously led seed investments at a Mumbai-based micro-VC.",
    pastInvestments: [
      { name: "PayNest", sector: "Fintech", year: 2023 },
      { name: "Ledgerly", sector: "Fintech", year: 2022 },
      { name: "Craftly", sector: "Marketplace", year: 2021 },
    ],
    links: [
      { platform: "Website", url: "https://northstarangels.example.com" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/karanmehta" },
    ],
  },
  {
    id: "i2",
    name: "Devika Rao",
    org: "Solo Angel",
    title: "Independent Angel Investor",
    sectors: ["Consumer", "Fintech"],
    stage: "Pre-seed",
    checkRange: "$10K–40K",
    score: 81,
    verification: "pending",
    location: "Mumbai, India",
    bio: "Ex-founder turned angel investor, writing small first checks into consumer and fintech startups led by first-time founders.",
    pastInvestments: [{ name: "Huddle", sector: "Consumer", year: 2024 }],
    links: [{ platform: "LinkedIn", url: "https://linkedin.com/in/devikarao" }],
  },
  {
    id: "i3",
    name: "Marcus Webb",
    org: "Foundry Capital",
    title: "Principal",
    sectors: ["SaaS", "Fintech"],
    stage: "Seed",
    checkRange: "$150K–400K",
    score: 68,
    verification: "verified",
    location: "Singapore",
    bio: "Principal at Foundry Capital, focused on B2B SaaS and fintech infrastructure across Southeast and South Asia.",
    pastInvestments: [
      { name: "Verdant", sector: "Climate", year: 2023 },
      { name: "StackPay", sector: "Fintech", year: 2022 },
    ],
    links: [
      { platform: "Website", url: "https://foundrycapital.example.com" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/marcuswebb" },
    ],
  },
];

export const teammateMatches = [
  {
    id: "t1",
    name: "Ishaan Verma",
    role: "Backend Developer",
    skills: ["Node.js", "PostgreSQL", "AWS"],
    availability: "Full-time",
    score: 91,
    verification: "verified",
    location: "Pune, India",
    experience: "5 years",
    rating: 4.8,
    bio: "Backend engineer specializing in scalable API design and cloud infrastructure. Previously built payment infrastructure at a Series B fintech startup.",
    pastWork: [
      { title: "Payments microservice", company: "PayNest", year: 2024 },
      { title: "Auth & billing system", company: "Freelance client", year: 2023 },
    ],
    links: [
      { platform: "GitHub", url: "https://github.com/ishaanverma" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/ishaanverma" },
    ],
  },
  {
    id: "t2",
    name: "Priyanka Iyer",
    role: "Finance / Ops",
    skills: ["Financial Modeling", "Fundraising Docs"],
    availability: "Part-time",
    score: 84,
    verification: "verified",
    location: "Delhi, India",
    experience: "7 years",
    rating: 4.7,
    bio: "Finance operator who has built fundraising models and data rooms for 12+ early-stage startups across two accelerator cohorts.",
    pastWork: [{ title: "Series A data room", company: "Ledgerly", year: 2023 }],
    links: [{ platform: "LinkedIn", url: "https://linkedin.com/in/priyankaiyer" }],
  },
  {
    id: "t3",
    name: "Grace Adeyemi",
    role: "Growth Marketer",
    skills: ["SEO", "Paid Ads", "Content"],
    availability: "Part-time",
    score: 76,
    verification: "pending",
    location: "Lagos, Nigeria",
    experience: "3 years",
    rating: 4.5,
    bio: "Growth marketer focused on early-stage consumer startups — scaled organic traffic 4x for a D2C brand in 6 months.",
    pastWork: [{ title: "Growth sprint", company: "Craftly", year: 2024 }],
    links: [
      { platform: "Portfolio", url: "https://graceadeyemi.example.com" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/graceadeyemi" },
    ],
  },
];

export const milestones = [
  {
    id: "m1",
    title: "Crossed 1,000 active users",
    date: "2026-07-01",
    category: "Traction",
    verified: true,
    source: "Google Analytics (connected)",
  },
  {
    id: "m2",
    title: "Closed friends & family round ($40K)",
    date: "2026-06-05",
    category: "Funding",
    verified: false,
    source: "Self-reported",
  },
  {
    id: "m3",
    title: "Hired first backend contractor",
    date: "2026-05-12",
    category: "Team",
    verified: false,
    source: "Self-reported",
  },
];

export const pitchScore = {
  overall: 74,
  breakdown: {
    "Market Clarity": 82,
    "Traction Proof": 61,
    "Team Strength": 70,
    "Financial Model": 58,
    "Ask Clarity": 88,
  },
  notes:
    "Traction and financial model sections are pulling the score down. Add a 6-month revenue/user-growth chart and clarify unit economics.",
};

export const LINK_PLATFORMS = [
  "Website",
  "LinkedIn",
  "Twitter / X",
  "Instagram",
  "Crunchbase",
  "AngelList / Wellfound",
  "GitHub",
];
