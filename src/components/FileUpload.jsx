import { UploadCloud, CheckCircle2, X, FileText } from "lucide-react";

export default function FileUpload({ file, onChange, accept, hint, label }) {
  return (
    <div>
      {!file ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-app/50 py-7 transition-all hover:border-brand-line hover:bg-brand-soft/40">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-raised text-muted shadow-card">
            <UploadCloud size={17} />
          </span>
          <span className="text-sm font-medium text-muted">{label || "Click to upload, or drag and drop"}</span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files[0];
              if (f) onChange(f.name);
            }}
          />
        </label>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-emerald/30 bg-emerald-soft/60 px-3.5 py-3 text-sm">
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-raised text-emerald shadow-card">
              <FileText size={14} />
            </span>
            <b className="max-w-52 truncate sm:max-w-xs">{file}</b>
            <CheckCircle2 size={15} className="shrink-0 text-emerald" />
          </span>
          <button onClick={() => onChange(null)} title="Remove file" className="rounded-md p-1 text-muted transition-colors hover:bg-raised hover:text-rose">
            <X size={15} />
          </button>
        </div>
      )}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}
