// --------------------------------------------------
// Mock data for the Investor Dashboard.
//
// All values here are static/demo only — replace them
// with real API responses once the backend is integrated.
// Funding amounts are stored in lakhs (₹) — see utils/format.js.
// --------------------------------------------------

// Logged-in investor profile.
// TODO: Replace with the authenticated user response.
export const investorProfile = {
  name: 'Rahul Patil',
  firstName: 'Rahul',
  email: 'rahul.patil@example.com',
  role: 'Investor',
  initials: 'RP',
  verified: true,
}

// Overview stat cards at the top of the dashboard.
export const overviewStats = [
  {
    id: 'recommended',
    label: 'Recommended Startups',
    value: 24,
    hint: 'Startups matching your interests',
  },
  {
    id: 'saved',
    label: 'Saved Startups',
    value: 8,
    hint: 'Startups you bookmarked',
  },
  {
    id: 'pending',
    label: 'Pending Connections',
    value: 5,
    hint: 'Connections awaiting a response',
  },
  {
    id: 'active',
    label: 'Active Connections',
    value: 12,
    hint: 'Startups you are connected with',
  },
]

// --------------------------------------------------
// AI-recommended startups.
// aiMatch and pitchScore are mock/demo values that will
// later come from the AI matchmaking and pitch-evaluation services.
// --------------------------------------------------
export const recommendedStartups = [
  {
    id: 'finova',
    name: 'Finova',
    industry: 'FinTech',
    stage: 'Seed',
    location: 'Pune',
    description: 'AI-powered financial management platform for small businesses in India.',
    fundingRequired: 50,
    pitchScore: 91,
    progress: 72,
    aiMatch: 94,
  },
  {
    id: 'healthsync',
    name: 'HealthSync',
    industry: 'Healthcare',
    stage: 'Seed',
    location: 'Mumbai',
    description: 'Digital health records and automated patient follow-up for modern clinics.',
    fundingRequired: 75,
    pitchScore: 88,
    progress: 64,
    aiMatch: 89,
  },
  {
    id: 'agrosense',
    name: 'AgroSense',
    industry: 'Agriculture',
    stage: 'Pre-Seed',
    location: 'Bangalore',
    description: 'IoT crop advisory platform helping smallholder farmers boost their yields.',
    fundingRequired: 35,
    pitchScore: 86,
    progress: 68,
    aiMatch: 86,
  },
]

// Startup credibility evaluation shown in the table.
export const startupCredibility = [
  {
    id: 'finova',
    name: 'Finova',
    industry: 'FinTech',
    pitchScore: 91,
    progress: 72,
    aiMatch: 94,
    status: 'Strong Match',
  },
  {
    id: 'healthsync',
    name: 'HealthSync',
    industry: 'Healthcare',
    pitchScore: 88,
    progress: 64,
    aiMatch: 89,
    status: 'Good Match',
  },
  {
    id: 'agrosense',
    name: 'AgroSense',
    industry: 'Agriculture',
    pitchScore: 86,
    progress: 68,
    aiMatch: 86,
    status: 'Good Match',
  },
]

// Recent startup connections.
export const recentConnections = [
  {
    id: 'finova',
    startup: 'Finova',
    industry: 'FinTech',
    status: 'Accepted',
    date: 'Aug 08, 2026',
  },
  {
    id: 'healthsync',
    startup: 'HealthSync',
    industry: 'Healthcare',
    status: 'Pending',
    date: 'Aug 05, 2026',
  },
  {
    id: 'agrosense',
    startup: 'AgroSense',
    industry: 'Agriculture',
    status: 'Accepted',
    date: 'Jul 28, 2026',
  },
]

// Recent notifications. isRead drives the unread badge count.
export const notifications = [
  {
    id: 'n1',
    type: 'connection',
    text: 'Finova accepted your connection request.',
    time: '2 min ago',
    isRead: false,
  },
  {
    id: 'n2',
    type: 'match',
    text: 'A new startup matched your investment preferences.',
    time: '1 hr ago',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'milestone',
    text: 'HealthSync updated its startup milestone.',
    time: '3 hrs ago',
    isRead: false,
  },
  {
    id: 'n4',
    type: 'update',
    text: 'Your saved startup AgroSense added a new update.',
    time: 'Yesterday',
    isRead: true,
  },
]
