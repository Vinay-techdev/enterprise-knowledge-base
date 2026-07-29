import { BookOpenCheck, Bot, Database } from "lucide-react";
import SourceCard from "./SourceCard";

export default function AnswerCard({ answer, sources, retrieval }) {
  return (
    <section className="card-premium overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-950/15">
            <Bot size={21} />
          </div>

          <div>
            <h2 className="font-bold tracking-tight text-slate-800">
              AI Assistant
            </h2>

            <p className="text-xs text-slate-400">
              Grounded in your organization’s documents
            </p>
          </div>
        </div>

        {retrieval && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            <Database size={14} />
            {retrieval.relevantCount ?? 0} relevant{" "}
            {(retrieval.relevantCount ?? 0) === 1 ? "chunk" : "chunks"}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700 sm:text-[15px]">
          {answer}
        </div>

        <div className="mt-7 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2">
            <BookOpenCheck size={18} className="text-indigo-600" />

            <h3 className="font-bold text-slate-800">Sources</h3>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              {sources.length}
            </span>
          </div>

          {sources.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-7 text-center">
              <p className="text-sm font-medium text-slate-600">
                No supporting sources were found.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try asking a more specific question about your uploaded
                documents.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {sources.map((source) => (
                <SourceCard
                  key={
                    source.chunkId ||
                    `${source.documentId}-${source.chunkIndex}`
                  }
                  source={source}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
