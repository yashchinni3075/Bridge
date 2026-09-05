import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Freelancer from "./models/Freelancer.js";

const seed = [
  {
    name: "Ananya Rao",
    headline: "Senior Product Designer",
    tagline: "Design systems and 0\u21921 product design for early-stage teams.",
    location: "Bengaluru, India",
    experience: 6,
    rate: 2200,
    availability: "Open to Work",
    engagement: "Ongoing",
    github: "github.com/ananyarao",
    bio: "I help early-stage startups turn fuzzy ideas into shippable, well-tested product experiences. Ex-Swiggy, ex-Cred.",
    domains: ["Product Design", "Frontend Engineering"],
    skills: ["Figma", "Design Systems", "UX Research", "React", "Prototyping"],
    verified: true,
    trustScore: 90,
    verification: {
      email: "verified",
      mobile: "verified",
      identity: "verified",
      education: "verified",
      portfolio: "verified",
      reference: "pending",
    },
  },
  {
    name: "Kabir Mehta",
    headline: "Full-Stack Engineer",
    tagline: "React + Node engineer who ships production-ready MVPs fast.",
    location: "Pune, India",
    experience: 4,
    rate: 1800,
    availability: "Open to Work",
    engagement: "Co-founder",
    github: "github.com/kabirmehta",
    bio: "Full-stack engineer focused on fintech and marketplace products. I like owning a feature end to end.",
    domains: ["Frontend Engineering", "Backend Engineering"],
    skills: ["React", "Node.js", "PostgreSQL", "AWS", "TypeScript"],
    verified: true,
    trustScore: 75,
    verification: {
      email: "verified",
      mobile: "verified",
      identity: "verified",
      education: "pending",
      portfolio: "verified",
    },
  },
  {
    name: "Sara Thomas",
    headline: "Data Analyst",
    tagline: "Turns messy product data into decisions leadership can act on.",
    location: "Kochi, India",
    experience: 3,
    rate: 1400,
    availability: "Currently Engaged",
    engagement: "One-off",
    github: "github.com/sarathomas",
    bio: "SQL, Python and dashboards — I embed with product teams to build the metrics that actually get used.",
    domains: ["Data & Analytics"],
    skills: ["SQL", "Python", "Tableau", "A/B Testing", "dbt"],
    verified: false,
    trustScore: 45,
    verification: {
      email: "verified",
      mobile: "verified",
    },
  },
  {
    name: "Rohan Verma",
    headline: "Growth Marketer",
    tagline: "Performance marketing and lifecycle campaigns for D2C brands.",
    location: "Delhi, India",
    experience: 5,
    rate: 1600,
    availability: "Open to Work",
    engagement: "Ongoing",
    github: "github.com/rohanverma",
    bio: "I've scaled paid acquisition budgets from \u20B95L to \u20B980L/month across three D2C brands without blowing CAC.",
    domains: ["Growth Marketing"],
    skills: ["Performance Marketing", "SEO", "Lifecycle Marketing", "Analytics", "Copywriting"],
    verified: true,
    trustScore: 65,
    verification: {
      email: "verified",
      mobile: "verified",
      identity: "verified",
    },
  },
  {
    name: "Priya Nair",
    headline: "Backend Engineer",
    tagline: "Distributed systems engineer specialising in payments infra.",
    location: "Hyderabad, India",
    experience: 7,
    rate: 2600,
    availability: "Open to Work",
    engagement: "Ongoing",
    github: "github.com/priyanair",
    bio: "Seven years building high-throughput backend systems, five of them in payments and settlement infrastructure.",
    domains: ["Backend Engineering", "Finance & Ops"],
    skills: ["Java", "Kafka", "PostgreSQL", "AWS", "System Design"],
    verified: true,
    trustScore: 100,
    verification: {
      email: "verified",
      mobile: "verified",
      identity: "verified",
      education: "verified",
      portfolio: "verified",
      reference: "verified",
    },
  },
  {
    name: "Devika Iyer",
    headline: "Finance & Ops Consultant",
    tagline: "Fractional finance lead for seed and Series A startups.",
    location: "Mumbai, India",
    experience: 8,
    rate: 2400,
    availability: "Not Available",
    engagement: "One-off",
    github: "github.com/devikaiyer",
    bio: "Chartered accountant turned fractional CFO. I set up the financial rails startups need before their Series A.",
    domains: ["Finance & Ops"],
    skills: ["Financial Modelling", "Fundraising", "Compliance", "Excel", "Budgeting"],
    verified: false,
    trustScore: 20,
    verification: {
      email: "verified",
    },
  },
];

const run = async () => {
  await Freelancer.deleteMany({});
  const docs = await Freelancer.insertMany(seed);
  console.log(`Seeded ${docs.length} freelancers`);
  await mongoose.connection.close();
  process.exit(0);
};

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 })
  .then(run)
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  });
