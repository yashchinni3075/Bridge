import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { STARTUPS } from "../data/freelancerData";
import { getFreelancers, getMyProfile, saveMyProfile } from "../utils/api";

const FreelancerContext = createContext(null);

const DEFAULT_PROFILE = {
  name: "",
  headline: "",
  tagline: "",
  location: "",
  experience: 0,
  rate: 0,
  availability: "Open to Work",
  engagement: "One-off",
  github: "",
  bio: "",
  domains: [],
  skills: [],
  verified: false,
  trustScore: 0,
  starRating: 0,
  verification: {
    github: { username: "", isVerified: false, verifiedAt: null },
    linkedin: { profileUrl: "", isVerified: false, verifiedAt: null },
    aadhaar: {
      documentUrl: "",
      status: "not_submitted",
      verifiedAt: null,
    },
    email: false,
    phone: false,
  },
};

export function FreelancerProvider({ children }) {
  const { user, token } = useAuth();
  const [role, setRole] = useState("Freelancer");
  const [freelancers, setFreelancers] = useState([]);
  const [startups, setStartups] = useState(STARTUPS);
  const [myProfile, setMyProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [applications, setApplications] = useState(seedApplications);

  const freelancersRef = useRef(freelancers);
  useEffect(() => {
    freelancersRef.current = freelancers;
  }, [freelancers]);

  const myProfileRef = useRef(myProfile);
  useEffect(() => {
    myProfileRef.current = myProfile;
  }, [myProfile]);

  // Load all freelancers from backend (for MatchEngine / listings)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const remote = await getFreelancers();
      if (!mounted) return;
      if (Array.isArray(remote) && remote.length) {
        const normalized = remote.map((f) => ({ ...f, id: f._id ?? f.id }));
        freelancersRef.current = normalized;
        setFreelancers(normalized);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load the authenticated freelancer's own profile from the backend
  const loadMyProfile = useCallback(async () => {
    if (!token) {
      setMyProfile(null);
      setProfileLoaded(true);
      return;
    }
    try {
      const profile = await getMyProfile(token);
      if (profile) {
        setMyProfile({ ...profile, id: profile._id ?? profile.id });
      } else {
        // No profile yet — start with defaults pre-filled from User data
        setMyProfile({
          ...DEFAULT_PROFILE,
          name: user?.name || "",
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err.message);
      setMyProfile({
        ...DEFAULT_PROFILE,
        name: user?.name || "",
      });
    } finally {
      setProfileLoaded(true);
    }
  }, [token, user?.name]);

  useEffect(() => {
    loadMyProfile();
  }, [loadMyProfile]);

  // Seed demo applications for the logged-in freelancer
  useEffect(() => {
    if (!myProfile?.id) return;
    setApplications((prev) => {
      if (prev.some((a) => String(a.freelancerId) === String(myProfile.id))) return prev;
      const now = Date.now();
      return [
        ...prev,
        {
          id: now + 1,
          freelancerId: myProfile.id,
          startupId: 106,
          status: "Interview",
          date: "12 Aug 2026",
          engagement: "Ongoing",
        },
        {
          id: now + 2,
          freelancerId: myProfile.id,
          startupId: 103,
          status: "Shortlisted",
          date: "18 Aug 2026",
          engagement: "Co-founder",
        },
      ];
    });
  }, [myProfile?.id]);

  const switchRole = (nextRole) => {
    setRole(nextRole);
  };

  // The active freelancer profile — always the authenticated user's real profile
  const freelancer = myProfile;

  const saveFreelancer = useCallback(async (updates) => {
    if (!token) return null;
    try {
      const saved = await saveMyProfile(token, updates);
      const normalized = { ...saved, id: saved._id ?? saved.id };
      setMyProfile(normalized);
      // Also update in the freelancers list if present
      setFreelancers((prev) => {
        const idx = prev.findIndex((f) => String(f.id) === String(normalized.id));
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = normalized;
          return next;
        }
        return [...prev, normalized];
      });
      return normalized;
    } catch (err) {
      console.error("Failed to save profile:", err.message);
      throw err;
    }
  }, [token]);

  const value = useMemo(
    () => ({
      role,
      setRole: switchRole,
      freelancers,
      setFreelancers,
      startups,
      setStartups,
      freelancer,
      myProfile,
      profileLoaded,
      selectedProfileId: myProfile?.id ?? null,
      setSelectedProfileId: () => {},
      applications,
      setApplications,
      saveFreelancer,
      loadMyProfile,
    }),
    [role, freelancers, startups, freelancer, myProfile, profileLoaded, applications, saveFreelancer, loadMyProfile],
  );

  return (
    <FreelancerContext.Provider value={value}>
      {children}
    </FreelancerContext.Provider>
  );
}

const seedApplications = [
  {
    id: 1001,
    freelancerId: 1,
    startupId: 106,
    status: "Interview",
    date: "12 Aug 2026",
    engagement: "Ongoing",
  },
  {
    id: 1002,
    freelancerId: 2,
    startupId: 103,
    status: "Shortlisted",
    date: "18 Aug 2026",
    engagement: "Co-founder",
  },
  {
    id: 1003,
    freelancerId: 3,
    startupId: 101,
    status: "Applied",
    date: "24 Aug 2026",
    engagement: "One-off",
  },
  {
    id: 1004,
    freelancerId: 5,
    startupId: 104,
    status: "Accepted",
    date: "02 Aug 2026",
    engagement: "Ongoing",
  },
];

export function useFreelancer() {
  const ctx = useContext(FreelancerContext);
  if (!ctx) {
    throw new Error("useFreelancer must be used within a FreelancerProvider");
  }
  return ctx;
}
