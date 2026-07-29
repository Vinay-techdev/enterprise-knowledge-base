import { BookOpenCheck, Bot, Database } from "lucide-react";
import SourceCard from "./SourceCard";

const renderAnswer = (text = "") => {
  return text.split("\n").map((line, lineIndex) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={lineIndex} className="h-3" />;
    }

    const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");

    const content = isBullet ? trimmed.slice(2) : trimmed;

    const parts = content.split(/(\*\*.*?\*\*)/g);

    const formattedContent = parts.map((part, partIndex) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={partIndex} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIndex} className="flex gap-3">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />

          <p className="leading-7">{formattedContent}</p>
        </div>
      );
    }

    return (
      <p key={lineIndex} className="leading-7">
        {formattedContent}
      </p>
    );
  });
};

export default function AnswerCard({ answer, sources, retrieval }) {
  const uniqueDocumentCount = new Set(
    sources.map(
      (source) => source.documentId || source.originalName || source.title,
    ),
  ).size;

  return (
    <section className="card-premium overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
            <Bot size={21} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold tracking-tight text-slate-900">
                AI Assistant
              </h2>

              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Grounded
              </span>
            </div>

            <p className="mt-0.5 text-xs text-slate-400">
              Generated from your workspace documents
            </p>
          </div>
        </div>

        {retrieval && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
            <Database size={14} />
            {retrieval.relevantCount ?? 0} relevant{" "}
            {(retrieval.relevantCount ?? 0) === 1 ? "chuck" : "sources"}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-7">
        <div className="max-w-4xl space-y-1 text-sm text-slate-700 sm:text-[15px]">
          {renderAnswer(answer)}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck size={18} className="text-indigo-600" />

            <h3 className="font-bold text-slate-800">Supporting sources</h3>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {sources?.length}
            </span>
          </div>

          {sources.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Retrieved from {uniqueDocumentCount}{" "}
              {uniqueDocumentCount === 1 ? "document" : "documents"}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
