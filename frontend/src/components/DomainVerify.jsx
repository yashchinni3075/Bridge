import { useState } from "react";
import { Globe, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "./ui";

// NOTE FOR THE TEAM: Browsers cannot call WHOIS servers directly (no
// CORS support on WHOIS/RDAP endpoints), so this must go through your
// own backend in production — e.g. a small Node endpoint that calls a
// WHOIS/RDAP API (such as who-dat, whoisjson.com, or the RDAP endpoint
// for the domain's registry) and returns clean JSON to the frontend.
// This component simulates that response so the UI/UX can be built and
// demoed today without the backend being ready yet.

function simulateWhoisLookup(domain) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        domain,
        registrar: "GoDaddy.com, LLC",
        createdOn: "2025-03-14",
        registrantOrg: domain.split(".")[0].replace(/-/g, " "),
        status: "active",
      });
    }, 1400);
  });
}

export default function DomainVerify({ value, onChange }) {
  const [checking, setChecking] = useState(false);

  async function runCheck() {
    if (!value?.domain) return;
    setChecking(true);
    const whois = await simulateWhoisLookup(value.domain);
    onChange({ ...value, status: "verified", whois });
    setChecking(false);
  }

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            className="w-full border border-line rounded-lg pl-9 pr-3 py-2.5 text-sm bg-white"
            placeholder="yourstartup.com"
            value={value?.domain || ""}
            onChange={(e) =>
              onChange({ domain: e.target.value, status: "unverified", whois: null })
            }
          />
        </div>
        <Button variant="ghost" onClick={runCheck} disabled={!value?.domain || checking}>
          {checking ? (
            <span className="flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" /> Checking WHOIS…
            </span>
          ) : (
            "Verify domain"
          )}
        </Button>
      </div>

      {value?.status === "verified" && value.whois && (
        <div className="mt-2.5 bg-emerald-soft border border-emerald/20 rounded-lg p-3 text-xs text-[#136B49]">
          <div className="flex items-center gap-1.5 font-semibold mb-1.5">
            <CheckCircle2 size={13} /> Domain verified via WHOIS
          </div>
          <div className="grid grid-cols-2 gap-y-1 font-mono text-[11px]">
            <span>Registrar:</span>
            <span>{value.whois.registrar}</span>
            <span>Registered on:</span>
            <span>{value.whois.createdOn}</span>
            <span>Status:</span>
            <span>{value.whois.status}</span>
          </div>
        </div>
      )}
    </div>
  );
}
