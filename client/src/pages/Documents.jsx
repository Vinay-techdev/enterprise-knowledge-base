import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileText,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

const DOCUMENT_TYPES = ["all"];

const TYPE_CONFIG = {
  other: {
    label: "Document",
    icon: FileText,
    style: "bg-slate-100 text-slate-700",
    iconStyle: "bg-indigo-50 text-indigo-600",
  },
};

const STATUS_CONFIG = {
  uploaded: "bg-blue-50 text-blue-700",
  processing: "bg-amber-50 text-amber-700",
  ready: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** index).toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));

const capitalize = (value = "") =>
  value.charAt(0).toUpperCase() + value.slice(1);

const getDocumentType = (document) => document.documentType || "other";

const getDisplayTitle = (document) =>
  document.title || document.originalName || "Untitled document";

const getSearchableText = (document) =>
  [
    document.title,
    document.originalName,
    document.uploadedBy?.name,
    document.mimeType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export default function Documents() {
  const { user } = useAuth();
  const inputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadDocuments = async () => {
    setLoading(true);

    try {
      const { data } = await api.get("/documents");

      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load documents"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const typeCounts = useMemo(() => {
    const counts = {
      all: documents.length,
    };

    for (const document of documents) {
      const type = getDocumentType(document);

      counts[type] = (counts[type] || 0) + 1;
    }

    return counts;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesType =
        selectedType === "all" || getDocumentType(document) === selectedType;

      const matchesSearch =
        !normalizedQuery ||
        getSearchableText(document).includes(normalizedQuery);

      return matchesType && matchesSearch;
    });
  }, [documents, query, selectedType]);

  const selectFile = (selected) => {
    if (!selected) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(selected.type)) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      toast.error("Only PDF, DOCX and TXT files are allowed");

      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      toast.error("File size must not exceed 10 MB");

      return;
    }

    setFile(selected);
  };

  const upload = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error("Choose a PDF, DOCX or TXT file");

      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    if (title.trim()) {
      formData.append("title", title.trim());
    }

    try {
      setUploading(true);

      const { data } = await api.post("/documents", formData);

      setDocuments((current) => [data.document, ...current]);

      setTitle("");
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      toast.success("Document uploaded and processed successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const download = async (document) => {
    try {
      setBusyId(document._id);

      if (document.storageProvider === "s3") {
        const { data } = await api.get(`/documents/${document._id}/download`);

        if (!data.downloadUrl) {
          throw new Error("Download URL was not returned");
        }

        window.location.assign(data.downloadUrl);
        return;
      }

      const response = await api.get(`/documents/${document._id}/download`, {
        responseType: "blob",
      });

      const url = URL.createObjectURL(response.data);

      const anchor = window.document.createElement("a");

      anchor.href = url;
      anchor.download = document.originalName;

      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      let message = "Download failed";

      if (error.response?.data instanceof Blob) {
        try {
          const errorBody = JSON.parse(await error.response.data.text());

          message = errorBody.message || message;
        } catch {
          // Keep the default message.
        }
      } else {
        message = getErrorMessage(error, message);
      }

      toast.error(message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (document) => {
    const confirmed = window.confirm(
      `Delete “${document.originalName}”? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyId(document._id);

      await api.delete(`/documents/${document._id}`);

      setDocuments((current) =>
        current.filter((item) => item._id !== document._id),
      );

      toast.success("Document deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Delete failed"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-10">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            knowledge library
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-slate-900">
            Documents
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-slate-500">
            Upload, search and securely manage documents prepared for AI-powered
            retrieval.
          </p>
        </div>

        <div className="relative w-full lg:w-[430px]">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, filename or uploader"
            className="input-premium pl-10"
          />
        </div>
      </header>

      <form onSubmit={upload} className="card-premium mt-7 p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Document title{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </span>

            <input
              value={title}
              maxLength={160}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Employee handbook"
              className="input-premium"
            />
          </label>

          <label>
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Choose file
            </span>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => selectFile(event.target.files?.[0])}
              className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700 hover:border-indigo-300"
            />
          </label>

          <button
            disabled={uploading}
            className="btn-primary h-[46px] px-5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={17} />

            {uploading ? "Processing…" : "Upload document"}
          </button>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="shrink-0 text-indigo-600" size={18} />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-indigo-950">
                  {file.name}
                </p>

                <p className="text-xs text-indigo-600">
                  {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);

                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
              className="rounded-lg p-1 text-indigo-500 hover:bg-indigo-100"
              aria-label="Remove selected file"
            >
              <X size={17} />
            </button>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-400">
          PDF, DOCX and TXT · Maximum 10 MB · Documents are automatically
          processed for AI search
        </p>
      </form>

      <section className="mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {DOCUMENT_TYPES.map((type) => {
            const count = typeCounts[type] || 0;

            if (type !== "all" && count === 0) {
              return null;
            }

            const config =
              type === "all"
                ? {
                    label: "All",
                  }
                : TYPE_CONFIG[type] || TYPE_CONFIG.other;

            const active = selectedType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-950/15"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {config.label}

                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800">Knowledge documents</h2>

          <p className="mt-0.5 text-xs text-slate-400">
            {filteredDocuments.length}{" "}
            {filteredDocuments.length === 1 ? "document" : "documents"}
          </p>
        </div>

        {(query || selectedType !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedType("all");
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <DocumentGridSkeleton />
      ) : filteredDocuments.length === 0 ? (
        <EmptyDocuments filtered={Boolean(query) || selectedType !== "all"} />
      ) : (
        <div className="mt-4 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredDocuments.map((document) => (
            <SmartDocumentCard
              key={document._id}
              document={document}
              user={user}
              busy={busyId === document._id}
              onDownload={download}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SmartDocumentCard({ document, user, busy, onDownload, onDelete }) {
  const type = getDocumentType(document);

  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.other;

  const TypeIcon = typeConfig.icon;

  const status = document.status || "uploaded";

  const canDelete =
    user?.role === "admin" || document.uploadedBy?._id === user?.id;

  const isProcessing = status === "uploaded" || status === "processing";



  return (
    <article className="card-premium group flex min-h-[340px] flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-950/10">
      <div className="flex items-start justify-between gap-4 p-5">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${typeConfig.iconStyle}`}
        >
          <TypeIcon size={22} />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${typeConfig.style}`}
          >
            {typeConfig.label}
          </span>

          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
              STATUS_CONFIG[status] || STATUS_CONFIG.uploaded
            }`}
          >
            {capitalize(status)}
          </span>
        </div>
      </div>

      <div className="flex-1 px-5">
        <h3 className="line-clamp-2 text-lg font-bold tracking-tight text-slate-900">
          {getDisplayTitle(document)}
        </h3>

        <p className="mt-1 truncate text-xs text-slate-400">
          {document.originalName}
        </p>

        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
          {isProcessing
            ? "The document is being extracted, chunked and prepared for AI-powered search."
            : document.status === "failed"
              ? document.processingError || "Document processing failed."
              : "This document is ready for semantic search and grounded question answering."}
        </p>
      </div>

      <div className="mt-5 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
          <span>{formatBytes(document.size)}</span>

          <span>
            {document.chunkCount || 0}{" "}
            {(document.chunkCount || 0) === 1 ? "chunk" : "chunks"}
          </span>

          <span>{formatDate(document.createdAt)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="max-w-[180px] truncate text-xs text-slate-400">
            By {document.uploadedBy?.name || "Unknown"}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onDownload(document)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Download ${document.originalName}`}
              title={`Download ${document.originalName}`}
            >
              <Download size={17} />
            </button>

            {canDelete && (
              <button
                type="button"
                disabled={busy || isProcessing}
                onClick={() => onDelete(document)}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Delete ${document.originalName}`}
                title={
                  isProcessing
                    ? "Document processing is still in progress"
                    : `Delete ${document.originalName}`
                }
              >
                <Trash2 size={17} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function DocumentGridSkeleton() {
  return (
    <div className="mt-4 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="card-premium animate-pulse p-5">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-2xl bg-slate-100" />

            <div className="h-6 w-20 rounded-full bg-slate-100" />
          </div>

          <div className="mt-5 h-5 w-2/3 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />

          <div className="mt-6 space-y-2">
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 rounded bg-slate-100" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
          </div>

          <div className="mt-6 flex gap-2">
            <div className="h-7 w-16 rounded-lg bg-slate-100" />
            <div className="h-7 w-20 rounded-lg bg-slate-100" />
          </div>

          <div className="mt-8 h-12 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyDocuments({ filtered }) {
  return (
    <div className="card-premium mt-4 grid min-h-[320px] place-items-center p-8 text-center">
      <div>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <FileText size={26} />
        </div>

        <h3 className="mt-5 font-bold text-slate-800">
          {filtered
            ? "No matching documents"
            : "Your knowledge library is empty"}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {filtered
            ? "Try another keyword or select a different document type."
            : "Upload your first PDF, DOCX or TXT document to generate intelligent metadata."}
        </p>
      </div>
    </div>
  );
}
