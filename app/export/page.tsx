"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getAllTrips } from "@/lib/tripStorage";
import type { Trip } from "@/types/trip";

export default function ExportPage() {
  const router = useRouter();
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [json, setJson] = React.useState<string>("[]");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const all = getAllTrips();
    setTrips(all);
    setJson(JSON.stringify(all, null, 2));
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy JSON:", err);
      alert("Could not copy to clipboard. You can still select and copy manually.");
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "striperlog-trips.json";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to trigger download:", err);
      alert("Could not start download.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-slate-400"
        >
          ← Back
        </button>
        <div className="text-right">
          <h1 className="text-lg font-semibold">Export Data</h1>
          <p className="text-xs text-slate-400">
            Trips: {trips.length}
          </p>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 max-w-3xl w-full mx-auto flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition"
          >
            {copied ? "Copied!" : "Copy JSON"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-2 rounded-lg border border-slate-700 text-sm text-slate-200 hover:bg-slate-900 transition"
          >
            Download JSON file
          </button>
        </div>

        <p className="text-xs text-slate-400">
          This is a full export of your current trips from this device. You can
          paste it into a notebook, Python, or a database later for analysis
          and modeling.
        </p>

        <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden">
          <textarea
            readOnly
            className="w-full h-full bg-slate-950 text-xs text-slate-100 font-mono p-3 outline-none resize-none"
            value={json}
          />
        </div>
      </div>
    </main>
  );
}
