import { useEffect, useState } from "react";
import { useFreelancer } from "../../context/FreelancerContext";
import { useAuth } from "../../context/AuthContext";
import { uploadAadhaar, verifyGithub, verifyLinkedin } from "../../utils/api";
import Badge from "../../components/freelancer/Badge";
import StarRating from "../../components/freelancer/StarRating";
import StatCard from "../../components/freelancer/StatCard";

const AADHAAR_STATUS = {
  not_submitted: { label: "Not Submitted", tone: "gray" },
  pending: { label: "Pending Review", tone: "orange" },
  approved: { label: "Approved", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

export default function Verification({ setPage }) {
  const { freelancer, loadMyProfile } = useFreelancer();
  const { token } = useAuth();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [githubInput, setGithubInput] = useState(
    freelancer?.verification?.github?.username || "",
  );
  const [linkedinInput, setLinkedinInput] = useState(
    freelancer?.verification?.linkedin?.profileUrl || "",
  );

  useEffect(() => {
    setGithubInput(freelancer?.verification?.github?.username || "");
    setLinkedinInput(freelancer?.verification?.linkedin?.profileUrl || "");
  }, [freelancer?.verification?.github?.username, freelancer?.verification?.linkedin?.profileUrl]);

  const handleGithub = async () => {
    setBusy("github");
    setError("");
    setNotice("");
    try {
      await verifyGithub(token, { username: githubInput });
      setNotice("GitHub account verified successfully.");
      await loadMyProfile();
    } catch (err) {
      setError(err.message || "GitHub verification failed");
    } finally {
      setBusy("");
    }
  };

  const handleLinkedin = async () => {
    setBusy("linkedin");
    setError("");
    setNotice("");
    try {
      await verifyLinkedin(token, { profileUrl: linkedinInput });
      setNotice("LinkedIn profile verified successfully.");
      await loadMyProfile();
    } catch (err) {
      setError(err.message || "LinkedIn verification failed");
    } finally {
      setBusy("");
    }
  };

  const handleAadhaar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setBusy("aadhaar");
    setError("");
    setNotice("");
    try {
      await uploadAadhaar(token, file);
      setNotice("Aadhaar uploaded. Your ID is now pending review.");
      await loadMyProfile();
    } catch (err) {
      setError(err.message || "Aadhaar upload failed");
    } finally {
      setBusy("");
    }
  };

  if (!freelancer) {
    return (
      <div className="card p-10 text-center text-sm text-founda-muted">
        Loading profile...
      </div>
    );
  }

  const verification = freelancer?.verification || {};
  const githubVerified = verification?.github?.isVerified;
  const linkedinVerified = verification?.linkedin?.isVerified;
  const aadhaar = verification?.aadhaar || {};
  const aadhaarStatus =
    AADHAAR_STATUS[aadhaar.status] || AADHAAR_STATUS.not_submitted;

  const score = freelancer?.trustScore ?? 0;
  const stars = freelancer?.starRating ?? 0;
  const verifiedCount = [githubVerified, linkedinVerified, aadhaar.status === "approved"]
    .filter(Boolean).length;
  const scoreDeg = (score / 100) * 360;

  const docUrl = freelancer?.verification?.aadhaar?.documentUrl || "";
  const docFileName = docUrl.split(/[\\/]/).pop();
  const docHref = docFileName
    ? `http://localhost:5000/uploads/aadhaar/${docFileName}?t=${Date.now()}`
    : "";
  const showUploader = aadhaar.status !== "approved";

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-founda-purple">
          03 — Trust
        </p>
        <h1 className="mt-1 text-2xl font-bold text-founda-ink lg:text-3xl">
          Verification & Credibility
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-founda-muted">
          Verification is evidence-based. Complete your GitHub, LinkedIn, and
          Aadhaar checks to build your trust score and unlock the Verified Pro
          badge.
        </p>
        {notice && (
          <p className="mt-3 text-xs font-medium text-emerald-600 animate-fade-in">
            {notice}
          </p>
        )}
        {error && (
          <p className="mt-3 text-xs font-medium text-red-500 animate-fade-in">
            {error}
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Trust score donut */}
        <div className="card p-5 text-center">
          <div
            className="mx-auto grid h-40 w-40 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#5B21F4 0deg, #0879E8 ${scoreDeg * 0.6}deg, #12C7B0 ${scoreDeg}deg, #E8ECF4 ${scoreDeg}deg)`,
            }}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
              <div>
                <div className="text-3xl font-bold text-founda-purple">
                  {score}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-founda-muted">
                  Trust Score
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            {freelancer.verified ? (
              <Badge tone="purple">Verified Pro</Badge>
            ) : (
              <Badge tone="gray">Not Fully Verified</Badge>
            )}
          </div>
          <div className="mt-2 flex justify-center">
            <StarRating rating={stars} size="lg" />
          </div>
          <p className="mt-1 text-xs text-founda-muted">
            {verifiedCount}/3 core checks verified.
          </p>
        </div>

        {/* Interactive verification cards */}
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Verified profile badge</h2>
              <p className="mt-1 text-sm text-founda-muted">
                Verify your identity to increase your trust score and earn the
                Verified Pro badge (5 stars).
              </p>
            </div>
            <StarRating rating={stars} size="sm" showValue />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {/* GitHub */}
            <div className="rounded-2xl border border-founda-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">GitHub</h3>
                  <p className="mt-1 text-xs leading-relaxed text-founda-muted">
                    Verify your GitHub account to prove professional
                    development history.
                  </p>
                </div>
                {githubVerified ? (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-founda-purple">+20 pts</span>
                )}
              </div>
              <div className="mt-3">
                {githubVerified ? (
                  <div className="space-y-2">
                    <div>
                      <Badge tone="green">&#10003; Verified</Badge>
                      <p className="mt-2 text-xs font-medium text-founda-ink">
                        @{verification.github.username}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      placeholder="e.g. https://github.com/username or @username"
                      className="w-full rounded-xl border border-founda-line bg-white px-3 py-2 text-sm text-founda-ink outline-none transition focus:border-founda-purple"
                    />
                    <button
                      className="btn-secondary w-full"
                      disabled={busy === "github" || !githubInput.trim()}
                      onClick={handleGithub}
                    >
                      {busy === "github" ? "Verifying..." : "Verify GitHub"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* LinkedIn */}
            <div className="rounded-2xl border border-founda-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">LinkedIn</h3>
                  <p className="mt-1 text-xs leading-relaxed text-founda-muted">
                    Verify your LinkedIn profile for professional credibility.
                  </p>
                </div>
                {linkedinVerified ? (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-founda-purple">+20 pts</span>
                )}
              </div>
              <div className="mt-3">
                {linkedinVerified ? (
                  <div className="space-y-2">
                    <div>
                      <Badge tone="green">&#10003; Verified</Badge>
                      <p className="mt-2 truncate text-xs font-medium text-founda-ink">
                        {verification.linkedin.profileUrl}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={linkedinInput}
                      onChange={(e) => setLinkedinInput(e.target.value)}
                      placeholder="https://www.linkedin.com/in/username"
                      className="w-full rounded-xl border border-founda-line bg-white px-3 py-2 text-sm text-founda-ink outline-none transition focus:border-founda-purple"
                    />
                    <button
                      className="btn-secondary w-full"
                      disabled={busy === "linkedin" || !linkedinInput.trim()}
                      onClick={handleLinkedin}
                    >
                      {busy === "linkedin" ? "Verifying..." : "Verify LinkedIn"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Aadhaar */}
            <div className="rounded-2xl border border-founda-line p-4 sm:col-span-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Aadhaar / National ID</h3>
                  <p className="mt-1 text-xs leading-relaxed text-founda-muted">
                    Upload a PDF, PNG, or JPG of your national ID for identity
                    verification.
                  </p>
                </div>
                <span className="text-xs font-bold text-founda-purple">+30 pts</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge tone={aadhaarStatus.tone}>{aadhaarStatus.label}</Badge>
                {aadhaar.status === "approved" ? (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : showUploader && (
                  <label className="btn-secondary inline-flex cursor-pointer items-center gap-2">
                    {busy === "aadhaar"
                      ? "Uploading..."
                      : aadhaar.status === "pending" || aadhaar.status === "rejected"
                        ? "Re-upload Document"
                        : "Upload Document"}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      disabled={busy === "aadhaar"}
                      onChange={handleAadhaar}
                    />
                  </label>
                )}
                {aadhaar.status === "pending" && (
                  <span className="text-xs text-founda-muted">
                    Submitted for review
                  </span>
                )}
                {docFileName && docHref && (
                  <a
                    href={docHref}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[220px] truncate text-xs font-medium text-founda-purple underline underline-offset-2"
                    title={docFileName}
                  >
                    View {docFileName}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Verified Evidence"
          value={`${verifiedCount}/3`}
          hint="core checks"
          icon={<span className="text-emerald-500">&#10003;</span>}
        />
        <StatCard
          label="Profile Trust"
          value={`${score}%`}
          hint="used by Match Engine"
          icon={<span className="text-founda-purple">&#9670;</span>}
        />
        <StatCard
          label="Star Rating"
          value={`${stars}/5`}
          hint="credibility score"
          icon={<span className="text-amber-500">&#9733;</span>}
        />
      </div>
    </div>
  );
}
