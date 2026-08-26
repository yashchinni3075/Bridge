import { createContext, useContext, useState } from "react";
import {
  FREELANCERS as DEFAULT_FREELANCERS,
  STARTUPS,
  INITIAL_APPLICATIONS,
} from "../data/freelancerData";

const FreelancerContext = createContext(null);

export function FreelancerProvider({ children }) {
  const [role, setRoleState] = useState("Freelancer");
  const [freelancers, setFreelancers] = useState(DEFAULT_FREELANCERS);
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [selectedProfileId, setSelectedProfileId] = useState(
    DEFAULT_FREELANCERS[0].id,
  );

  const freelancer =
    freelancers.find((f) => f.id === Number(selectedProfileId)) ||
    freelancers[0];
  const startup =
    STARTUPS.find((s) => s.id === Number(selectedProfileId)) || STARTUPS[0];

  const activeProfile = role === "Freelancer" ? freelancer : null;
  const activeStartup = role === "Startup" ? startup : null;

  const setRole = (nextRole) => {
    setRoleState(nextRole);
    setSelectedProfileId(
      nextRole === "Freelancer"
        ? DEFAULT_FREELANCERS[0].id
        : STARTUPS[0].id,
    );
  };

  return (
    <FreelancerContext.Provider
      value={{
        role,
        setRole,
        freelancers,
        setFreelancers,
        applications,
        setApplications,
        selectedProfileId,
        setSelectedProfileId,
        freelancer,
        startup,
        activeProfile,
        activeStartup,
      }}
    >
      {children}
    </FreelancerContext.Provider>
  );
}

export function useFreelancer() {
  const ctx = useContext(FreelancerContext);
  if (!ctx)
    throw new Error(
      "useFreelancer must be used within FreelancerProvider",
    );
  return ctx;
}
