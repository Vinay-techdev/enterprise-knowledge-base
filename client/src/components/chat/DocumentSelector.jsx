import { ChevronDown, FileText } from "lucide-react";

export default function DocumentSelector({
  documents,
  selectedDocument,
  onChange,
  loading,
  disabled,
}) {
  const readyDocuments = documents.filter(
    (document) => document.status === "ready",
  );

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        Search scope
      </span>

      <div className="relative">
        <FileText
          size={18}
          className="pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <select
          value={selectedDocument}
          onChange={(event) => onChange(event.target.value)}
          disabled={loading || disabled}
          className="input-premium appearance-none pl-10 pr-10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">All ready documents</option>

          {readyDocuments.map((document) => (
            <option key={document._id} value={document._id}>
              {document.title || document.originalName}
            </option>
          ))}
        </select>

        <ChevronDown
          size={17}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {selectedDocument
          ? "The assistant will search only the selected document."
          : "The assistant will search across your organization’s knowledge base."}
      </p>
    </label>
  );
}
