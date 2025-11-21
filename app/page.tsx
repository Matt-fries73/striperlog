"use client";

import React from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="px-4 py-3 border-b border-slate-800">
        <h1 className="text-2xl font-semibold tracking-tight">StriperLog</h1>
        <p className="text-sm text-slate-400">
          NJ surf &amp; bay trip log (local-only MVP)
        </p>
      </header>

      {/* Content area */}
      <section className="flex-1 px-4 py-4 max-w-xl w-full mx-auto">
        <div className="mb-4">
          <h2 className="text-lg font-medium">Trips</h2>
          <p className="text-sm text-slate-400">
            You haven&apos;t logged any trips yet. Once you save a session, it
            will show up here.
          </p>
        </div>

        {/* Placeholder for future trip list */}
        <div className="border border-dashed border-slate-700 rounded-xl p-4 text-sm text-slate-400">
          Trip list will appear here after we hook up storage.
        </div>
      </section>

      {/* Bottom bar with main action */}
      <footer className="px-4 py-3 border-t border-slate-800">
        <button
          type="button"
          onClick={() => alert("Log Trip form coming next 👀")}
          className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-base hover:bg-emerald-400 transition"
        >
          Log New Trip
        </button>
      </footer>
    </main>
  );
}
