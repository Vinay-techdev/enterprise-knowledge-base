import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Search, Trash2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value),
  );

export default function Documents() {
  const { user } = useAuth();
  const inputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/documents");
      setDocuments(data.documents);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load documents"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadDocuments();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.originalName.toLowerCase().includes(term) ||
        item.uploadedBy?.name?.toLowerCase().includes(term),
    );
  }, [documents, query]);

  const selectFile = (selected) => {
    if (!selected) return setFile(null);
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowed.includes(selected.type)) {
      if (inputRef.current) inputRef.current.value = "";
      return toast.error("Only PDF, DOCX and TXT files are allowed");
    }
    if (selected.size > 10 * 1024 * 1024) {
      if (inputRef.current) inputRef.current.value = "";
      return toast.error("File size must not exceed 10 MB");
    }
    setFile(selected);
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!file) return toast.error("Choose a PDF, DOCX or TXT file");
    const formData = new FormData();
    formData.append("file", file);
    if (title.trim()) formData.append("title", title.trim());
    try {
      setUploading(true);
      const { data } = await api.post("/documents", formData);
      setDocuments((current) => [data.document, ...current]);
      setTitle("");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      toast.success("Document uploaded successfully");
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
          // Keep the default error message.
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
    if (
      !window.confirm(
        `Delete “${document.originalName}”? This cannot be undone.`,
      )
    )
      return;
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

  //? Apply colors to the status based on the document's status
  const getStatusStyle = (status) => {
  switch (status) {
    case "uploaded":
      return "bg-blue-50 text-blue-700";

    case "processing":
      return "bg-amber-50 text-amber-700";

    case "ready":
      return "bg-emerald-50 text-emerald-700";

    case "failed":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

  return (
    <div className="relative mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            Knowledge library
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-slate-900">
            Documents
          </h1>
          <p className="mt-2 text-sm text-slate-400 md:text-slate-500">
            Upload, search and securely manage your organization’s files.
          </p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search
            className="absolute left-3.5 top-3.5 text-slate-400"
            size={18}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, filename or uploader"
            className="input-premium pl-10"
          />
        </div>
      </div>

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
              onChange={(e) => setTitle(e.target.value)}
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
              onChange={(e) => selectFile(e.target.files?.[0])}
              className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700 hover:border-indigo-300"
            />
          </label>
          <button disabled={uploading} className="btn-primary h-[46px] px-5">
            <Upload size={17} />
            {uploading ? "Uploading…" : "Upload document"}
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
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-lg p-1 text-indigo-500 hover:bg-indigo-100"
            >
              <X size={17} />
            </button>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Supported formats: PDF, DOCX and TXT · Maximum size: 10 MB
        </p>
      </form>

      <section className="card-premium mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-800">All documents</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {filtered.length}{" "}
              {filtered.length === 1 ? "document" : "documents"}
            </p>
          </div>
        </div>
        {loading ? (
          <div className="animate-pulse space-y-4 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <FileText size={24} />
            </div>
            <p className="mt-4 font-semibold text-slate-700">
              {query ? "No matching documents" : "Your library is empty"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {query
                ? "Try a different search term."
                : "Upload your first document to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Document</th>
                  <th className="px-5 py-3.5">Uploaded by</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Size</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((document) => {
                  const canDelete =
                    user?.role === "admin" ||
                    document.uploadedBy?._id === user?.id;
                  return (
                    <tr
                      key={document._id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-xs truncate font-semibold text-slate-800">
                              {document.title}
                            </p>
                            <p className="max-w-xs truncate text-xs text-slate-400">
                              {document.originalName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {document.uploadedBy?.name || "Unknown"}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(document.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {formatBytes(document.size)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(document.status)}`}>
                          {document.status === "processing" && "Processing"}

                          {document.status === "ready" && "Ready"}

                          {document.status === "failed" && "Failed"}

                          {document.status === "uploaded" && "Uploaded"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={busyId === document._id}
                            onClick={() => download(document)}
                            className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                            aria-label={`Download ${document.originalName}`}
                          >
                            <Download size={17} />
                          </button>
                          {canDelete && (
                            <button
                              disabled={ busyId === document._id || document.status === "processing" || document.status === "uploaded" }
                              onClick={() => remove(document)}
                              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              aria-label={`Delete ${document.originalName}`}
                              title={document.status !== "ready" ? "Document is still processing" : `Download ${document.originalName}`}>
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
