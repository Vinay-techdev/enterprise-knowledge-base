import { BrainCircuit } from "lucide-react";

export default function LoadingAnswer() {
  return (
    <section className="card-premium overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <BrainCircuit size={19} />
        </div>

        <div>
          <p className="font-bold text-slate-800">
            Searching your knowledge base
          </p>

          <p className="text-xs text-slate-400">
            Retrieving relevant sources and preparing an answer…
          </p>
        </div>
      </div>

      <div className="animate-pulse space-y-4 p-5 sm:p-6">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-11/12 rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />

        <div className="pt-3">
          <div className="h-20 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </section>
  );
}
