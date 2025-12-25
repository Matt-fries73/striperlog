"use client";

import React from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  // On mount, check current session and subscribe to changes
  React.useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      console.log("AuthGate session check:", session);
      console.log("Supabase user id:", session?.user?.id);

      if (!isMounted) return;

      if (session) {
        setStatus("authenticated");
        setUserEmail(session.user.email ?? null);
      } else {
        setStatus("unauthenticated");
        setUserEmail(null);
      }

      const { data: subscription } = supabaseBrowser.auth.onAuthStateChange(
        (_event, session) => {
          if (!isMounted) return;

          if (session) {
            setStatus("authenticated");
            setUserEmail(session.user.email ?? null);
          } else {
            setStatus("unauthenticated");
            setUserEmail(null);
          }
        }
      );

      return () => {
        subscription.subscription.unsubscribe();
      };
    }

    const cleanupPromise = initAuth();

    return () => {
      isMounted = false;
      // just in case initAuth resolved with a cleanup
      void cleanupPromise;
    };
  }, []);

  // Temporary debug log
  React.useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      console.log("Supabase session:", data.session);
      console.log("Supabase user id:", data.session?.user?.id);
    });
  }, []);

  async function handleSignInWithGoogle() {
    try {
      setIsSigningIn(true);
      const { error } = await supabaseBrowser.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Supabase will redirect back here if you configure this origin as an allowed redirect URL
          redirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        console.error("Google sign-in error:", error);
        alert("Sign-in failed. Please try again.");
      }
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleSignOut() {
    try {
      await supabaseBrowser.auth.signOut();
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  }

  // Loading state while we check the session
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Checking session…</p>
      </main>
    );
  }

  // Logged out → show simple login screen
  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h1 className="text-lg font-semibold">Sign in to StriperLog</h1>
          <p className="text-xs text-slate-400">
            Log in with Google to sync your trips across devices.
          </p>

          <button
            onClick={handleSignInWithGoogle}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-slate-900 py-2.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-70"
          >
            {isSigningIn ? "Redirecting…" : "Sign in with Google"}
          </button>

          <p className="text-[11px] text-slate-500">
            You&apos;ll be redirected to Google, then back here.
          </p>
        </div>
      </main>
    );
  }

  // Logged in → show a small top bar + the app content
  return (
    <>
      <header className="w-full bg-slate-950 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400">StriperLog</span>
          {userEmail && (
            <span className="text-slate-500 truncate max-w-[160px]">
              {userEmail}
            </span>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="text-[11px] text-slate-400 hover:text-slate-200"
        >
          Sign out
        </button>
      </header>
      {children}
    </>
  );
}