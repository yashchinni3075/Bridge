export const investorProfile = {
  name: 'Rahul Patil',
  firstName: 'Rahul',
  email: 'rahul.patil@example.com',
  role: 'Investor',
  initials: 'RP',
}

export const overviewStats = [
  {
    id: 'recommended',
    label: 'Recommended',
    value: 24,
  },
  {
    id: 'saved',
    label: 'Saved',
    value: 8,
  },
  {
    id: 'active',
    label: 'Connected',
    value: 12,
  },
]

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
]
