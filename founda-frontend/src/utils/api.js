const BASE = "http://localhost:5000/api";

async function handle(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

/* ─── Auth ─── */
export const registerUser = async (data) => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handle(res);
};

export const verifyOTP = async (data) => {
  const res = await fetch(`${BASE}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handle(res);
};

export const loginUser = async (data) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handle(res);
};

/* ─── Freelancers ─── */
export const getFreelancers = async () => {
  try {
    const res = await fetch(`${BASE}/freelancers`);
    return await handle(res);
  } catch {
    return [];
  }
};

export const getFreelancer = async (id) => {
  try {
    const res = await fetch(`${BASE}/freelancers/${id}`);
    return await handle(res);
  } catch {
    return null;
  }
};

export const updateFreelancer = async (id, data) => {
  try {
    const res = await fetch(`${BASE}/freelancers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handle(res);
  } catch {
    return data;
  }
};

export const createFreelancer = async (data) => {
  try {
    const res = await fetch(`${BASE}/freelancers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handle(res);
  } catch {
    return { _id: Date.now().toString(), ...data };
  }
};

/* ─── Authenticated Freelancer Profile ─── */
export const getMyProfile = async (token) => {
  const res = await fetch(`${BASE}/freelancers/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handle(res);
};

export const saveMyProfile = async (token, data) => {
  const res = await fetch(`${BASE}/freelancers/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handle(res);
};

/* ─── Verification & Trust ─── */
export const uploadAadhaar = async (token, file) => {
  const formData = new FormData();
  formData.append("document", file);
  const res = await fetch(`${BASE}/verification/upload-aadhaar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handle(res);
};

export const verifyGithub = async (token, data = {}) => {
  const res = await fetch(`${BASE}/verification/oauth/github`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handle(res);
};

export const verifyLinkedin = async (token, data = {}) => {
  const res = await fetch(`${BASE}/verification/oauth/linkedin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return handle(res);
};

/* ─── Startups ─── */
export const getStartups = async () => {
  try {
    const res = await fetch(`${BASE}/startups`);
    return await handle(res);
  } catch {
    return [];
  }
};

export const getStartup = async (id) => {
  try {
    const res = await fetch(`${BASE}/startups/${id}`);
    return await handle(res);
  } catch {
    return null;
  }
};

export const createStartup = async (data) => {
  try {
    const res = await fetch(`${BASE}/startups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handle(res);
  } catch {
    return { _id: Date.now().toString(), ...data };
  }
};

export const getStartupJobs = async () => {
  try {
    const res = await fetch(`${BASE}/startups/jobs`);
    return await handle(res);
  } catch {
    return [];
  }
};

/* ─── Investors ─── */
export const getInvestors = async () => {
  try {
    const res = await fetch(`${BASE}/investors`);
    return await handle(res);
  } catch {
    return [];
  }
};

export const getInvestor = async (id) => {
  try {
    const res = await fetch(`${BASE}/investors/${id}`);
    return await handle(res);
  } catch {
    return null;
  }
};

export const getPitchDecks = async () => {
  try {
    const res = await fetch(`${BASE}/investors/pitches`);
    return await handle(res);
  } catch {
    return [];
  }
};

export const getInvestmentRounds = async () => {
  try {
    const res = await fetch(`${BASE}/investors/rounds`);
    return await handle(res);
  } catch {
    return [];
  }
};

/* ─── Matches ─── */
export const getMatches = async (role, userId) => {
  try {
    const res = await fetch(`${BASE}/matches?role=${role}&userId=${userId}`);
    return await handle(res);
  } catch {
    return [];
  }
};
