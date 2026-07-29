import {
  FileText,
  Layers3,
  Target,
} from "lucide-react";

const formatScore = (score) => {
  if (typeof score !== "number") {
    return null;
  }

  return `${(score * 100).toFixed(
    1,
  )}%`;
};

export default function SourceCard({
  source,
}) {
  const formattedScore =
    formatScore(source.score);

  const hasChunkIndex =
    Number.isInteger(
      source.chunkIndex,
    );

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5">
      <div className="flex items-start gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <FileText size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800">
                {source.title ||
                  "Untitled document"}
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {source.originalName ||
                  "Organization document"}
              </p>
            </div>

            <span className="shrink-0 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
              [{source.citationNumber}]
            </span>
          </div>
        </div>
      </div>

      {source.preview && (
        <div className="border-y border-slate-100 bg-slate-50/60 px-4 py-3">
          <p className="line-clamp-3 text-xs leading-5 text-slate-500">
            {source.preview}
          </p>
        </div>
      )}

      {(formattedScore ||
        hasChunkIndex) && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          {formattedScore && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700">
              <Target size={13} />
              {formattedScore} match
            </span>
          )}

          {hasChunkIndex && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500">
              <Layers3 size={13} />
              Chunk{" "}
              {source.chunkIndex}
            </span>
          )}
        </div>
      )}
    </article>
  );
}