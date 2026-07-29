import { ArrowUp, Sparkles } from "lucide-react";

export default function ChatInput({
  question,
  onChange,
  onSubmit,
  loading,
  disabled,
}) {
  const remainingCharacters = 1000 - question.length;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (question.trim() && !loading && !disabled) {
        onSubmit(event);
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100"
    >
      <textarea
        value={question}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={1000}
        rows={4}
        disabled={loading || disabled}
        placeholder="Ask anything about your organization’s documents…"
        className="w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
      />

      <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles size={14} className="text-indigo-500" />
          <span>Enter to send · Shift + Enter for a new line</span>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span
            className={`text-xs ${
              remainingCharacters < 100 ? "text-amber-600" : "text-slate-400"
            }`}
          >
            {remainingCharacters} remaining
          </span>

          <button
            type="submit"
            disabled={loading || disabled || !question.trim()}
            className="btn-primary min-w-28 px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUp size={17} />

            {loading ? "Thinking…" : "Ask AI"}
          </button>
        </div>
      </div>
    </form>
  );
}
