import { Upload, CheckCircle2, X, FileText } from "lucide-react";

export default function FileUpload({ file, onChange, accept, hint, label }) {
  return (
    <div>
      {!file ? (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-line rounded-lg py-7 cursor-pointer hover:border-coral transition-colors bg-white">
          <Upload size={18} className="text-ink-soft" />
          <span className="text-sm text-ink-soft">{label || "Click to upload, or drag and drop"}</span>
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
        <div className="flex items-center justify-between border border-line rounded-lg px-3 py-2.5 bg-white text-sm">
          <span className="flex items-center gap-2">
            <FileText size={15} className="text-emerald" />
            {file}
            <CheckCircle2 size={14} className="text-emerald" />
          </span>
          <button onClick={() => onChange(null)} className="text-ink-soft hover:text-rose">
            <X size={15} />
          </button>
        </div>
      )}
      {hint && <p className="text-xs text-ink-soft mt-1.5">{hint}</p>}
    </div>
  );
}
