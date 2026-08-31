import { useState } from "react";
import { Globe, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
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
          <Globe size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-xl border border-line bg-raised pl-10 pr-3.5 py-2.5 text-sm transition-shadow placeholder:text-muted/60 focus:border-brand-line focus:outline-none focus:ring-4 focus:ring-brand/10"
            placeholder="yourstartup.com"
            value={value?.domain || ""}
            onChange={(e) => onChange({ domain: e.target.value, status: "unverified", whois: null })}
          />
        </div>
        <Button variant="ghost" onClick={runCheck} disabled={!value?.domain || checking}>
          {checking ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Checking WHOIS…
            </>
          ) : (
            "Verify domain"
          )}
        </Button>
      </div>

      {value?.status === "verified" && value.whois && (
        <div className="mt-2.5 animate-pop rounded-xl border border-emerald/25 bg-emerald-soft p-3.5 text-xs">
          <div className="mb-2 flex items-center gap-1.5 font-bold text-emerald">
            <CheckCircle2 size={13} /> Domain verified via WHOIS
          </div>
          <div className="grid grid-cols-[110px_1fr] gap-y-1 font-mono text-[11px] text-ink/80">
            <span className="text-muted">Registrar</span>
            <span>{value.whois.registrar}</span>
            <span className="text-muted">Registered on</span>
            <span>{value.whois.createdOn}</span>
            <span className="text-muted">Status</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald">
              {value.whois.status} <ShieldCheck size={11} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
