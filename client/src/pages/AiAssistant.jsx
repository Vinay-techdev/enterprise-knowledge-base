import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  FileSearch,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/client";
import AnswerCard from "../components/chat/AnswerCard";
import ChatInput from "../components/chat/ChatInput";
import DocumentSelector from "../components/chat/DocumentSelector";
import LoadingAnswer from "../components/chat/LoadingAnswer";
import { askKnowledgeBase } from "../services/chatService";

export default function AiAssistant() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [retrieval, setRetrieval] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [asking, setAsking] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [askError, setAskError] = useState("");

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    setDocumentsError("");

    try {
      const { data } = await api.get("/documents");

      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (error) {
      const message = getErrorMessage(error, "Could not load documents");

      setDocumentsError(message);
      toast.error(message);
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const submitQuestion = async (event, directQuestion = null) => {
    event?.preventDefault();

    const normalizedQuestion = (directQuestion ?? question).trim();

    if (!normalizedQuestion) {
      return toast.error("Enter a question first");
    }

    try {
      setAsking(true);
      setAskError("");
      setAnswer("");
      setSources([]);
      setRetrieval(null);
      setSubmittedQuestion(normalizedQuestion);

      const data = await askKnowledgeBase({
        question: normalizedQuestion,
        documentId: selectedDocument || null,
      });

      setAnswer(data.answer || "");
      setSources(Array.isArray(data.sources) ? data.sources : []);
      setRetrieval(data.retrieval || null);
    } catch (error) {
      const message = getErrorMessage(
        error,
        "The AI assistant is temporarily unavailable",
      );

      setAskError(message);
      toast.error(message);
    } finally {
      setAsking(false);
    }
  };

  const retryQuestion = () => {
    if (submittedQuestion) {
      setQuestion(submittedQuestion);

      submitQuestion(
        {
          preventDefault() {},
        },
        submittedQuestion,
      );
    }
  };

  const readyDocumentCount = documents.filter(
    (document) => document.status === "ready",
  ).length;

  const selectedDocumentDetails = documents.find(
    (document) => document._id === selectedDocument,
  );

  return (
    <div className="relative mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6 text-white shadow-2xl shadow-indigo-950/20 sm:p-8 lg:p-10">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur">
            <Sparkles size={14} />
            Organization knowledge assistant
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Ask your knowledge base
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
            Search your organization’s documents and receive grounded answers
            with supporting source citations.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-indigo-100 backdrop-blur">
              <FileSearch size={15} />
              {readyDocumentCount} ready{" "}
              {readyDocumentCount === 1 ? "document" : "documents"}
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-indigo-100 backdrop-blur">
              <ShieldCheck size={15} />
              Organization-scoped retrieval
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="card-premium p-5">
            <DocumentSelector
              documents={documents}
              selectedDocument={selectedDocument}
              onChange={setSelectedDocument}
              loading={loadingDocuments}
              disabled={asking}
            />

            {documentsError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700">
                  {documentsError}
                </p>

                <button
                  type="button"
                  onClick={loadDocuments}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700"
                >
                  <RefreshCw size={13} />
                  Retry
                </button>
              </div>
            )}
          </section>

          <section className="card-premium p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <FileSearch size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current scope
                </p>

                <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                  {selectedDocumentDetails
                    ? selectedDocumentDetails.title ||
                      selectedDocumentDetails.originalName
                    : "All ready documents"}
                </p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              {selectedDocumentDetails
                ? "Answers will use only this selected document."
                : "Answers may use all ready documents in your workspace."}
            </p>
          </section>
        </aside>

        <main className="min-w-0 space-y-6">
          <section className="card-premium p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Bot size={19} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">Ask AI</h2>

                <p className="text-xs text-slate-400">
                  Answers are generated from retrieved document context.
                </p>
              </div>
            </div>

            <ChatInput
              question={question}
              onChange={setQuestion}
              onSubmit={submitQuestion}
              loading={asking}
              disabled={loadingDocuments || readyDocumentCount === 0}
            />

            {!loadingDocuments && readyDocumentCount === 0 && (
              <p className="mt-3 text-xs font-medium text-amber-600">
                Upload and process at least one document before asking
                questions.
              </p>
            )}
          </section>

          {asking && <LoadingAnswer />}

          {!asking && askError && (
            <section className="card-premium border-red-100 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={21} />
                </div>

                <h2 className="mt-4 font-bold text-slate-800">
                  The assistant could not answer
                </h2>

                <p className="mt-1 max-w-lg text-sm leading-6 text-slate-500">
                  {askError}
                </p>

                <button
                  type="button"
                  onClick={retryQuestion}
                  className="btn-primary mt-4"
                >
                  <RefreshCw size={16} />
                  Try again
                </button>
              </div>
            </section>
          )}

          {!asking && !askError && answer && (
            <>
              {submittedQuestion && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-2xl">
                    <p className="mb-1.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      You
                    </p>

                    <div className="rounded-2xl rounded-tr-md bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-sm leading-6 text-white shadow-lg shadow-indigo-950/20">
                      {submittedQuestion}
                    </div>
                  </div>
                </div>
              )}

              <AnswerCard
                answer={answer}
                sources={sources}
                retrieval={retrieval}
              />
            </>
          )}

          {!asking && !askError && !answer && (
            <section className="card-premium grid min-h-[360px] place-items-center p-8 text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.4rem] bg-gradient-to-br from-indigo-50 to-violet-100 text-indigo-600">
                  <Sparkles size={27} />
                </div>

                <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-800">
                  What would you like to know?
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Ask about policies, project details, receipts, technical
                  notes, or any information contained in your organization’s
                  documents.
                </p>

                <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
                  {[
                    "Summarize the available documents.",
                    "What authentication technology was used?",
                    "What fees are mentioned in the receipt?",
                    "What programming concepts were covered?",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={readyDocumentCount === 0}
                      onClick={() => setQuestion(prompt)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-xs font-medium leading-5 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
