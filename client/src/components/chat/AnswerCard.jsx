import ReactMarkdown from "react-markdown";
import { BookOpenCheck, Bot, Database } from "lucide-react";
import SourceCard from "./SourceCard";

export default function AnswerCard({ answer, sources = [], retrieval }) {
  const markdownAnswer = typeof answer === "string" ? answer : "";

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
            {(retrieval.relevantCount ?? 0) === 1 ? "source" : "sources"}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-7">
        <div className="max-w-4xl">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mb-4 mt-7 text-2xl font-bold tracking-tight text-slate-900 first:mt-0">
                  {children}
                </h1>
              ),

              h2: ({ children }) => (
                <h2 className="mb-3 mt-7 text-xl font-bold tracking-tight text-slate-900 first:mt-0">
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3 className="mb-2 mt-6 text-base font-bold text-slate-900 first:mt-0">
                  {children}
                </h3>
              ),

              p: ({ children }) => (
                <p className="mb-3 text-sm leading-7 text-slate-700 sm:text-[15px]">
                  {children}
                </p>
              ),

              ul: ({ children }) => (
                <ul className="mb-4 list-disc space-y-2 pl-6 marker:text-indigo-500">
                  {children}
                </ul>
              ),

              ol: ({ children }) => (
                <ol className="mb-4 list-decimal space-y-2 pl-6 marker:text-indigo-500">
                  {children}
                </ol>
              ),

              li: ({ children }) => (
                <li className="text-sm leading-7 text-slate-700 sm:text-[15px]">
                  {children}
                </li>
              ),

              strong: ({ children }) => (
                <strong className="font-semibold text-slate-900">
                  {children}
                </strong>
              ),

              code: ({ children }) => (
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] text-slate-700">
                  {children}
                </code>
              ),

              hr: () => <hr className="my-6 border-slate-200" />,
            }}
          >
            {markdownAnswer}
          </ReactMarkdown>
        </div>

        <div className="mt-7 border-t border-slate-100 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpenCheck size={18} className="text-indigo-600" />

                <h3 className="font-bold text-slate-800">Supporting sources</h3>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  {sources.length}
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
            <div className="mt-4 grid gap-4 2xl:grid-cols-2">
              {sources.map((source) => (
                <SourceCard
                  key={
                    source.chunkId ||
                    `${source.documentId}-${source.chunkIndex ?? "document"}`
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
