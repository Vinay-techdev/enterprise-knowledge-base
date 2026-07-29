import { FileText, Layers3, Target } from "lucide-react";

const formatScore = (score) => {
  if (typeof score !== "number") {
    return "—";
  }

  return `${(score * 100).toFixed(1)}%`;
};

export default function SourceCard({ source }) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
          <FileText size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">
            {source.title || "Untitled document"}
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-400">
            {source.originalName || `Source ${source.citationNumber}`}
          </p>
        </div>

        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          [{source.citationNumber}]
        </span>
      </div>

      {source.preview && (
        <p className="mt-4 line-clamp-3 text-xs leading-5 text-slate-500">
          {source.preview}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
          <Target size={13} />
          {formatScore(source.score)} match
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500">
          <Layers3 size={13} />
          Chunk {source.chunkIndex}
        </span>
      </div>
    </article>
  );
}
