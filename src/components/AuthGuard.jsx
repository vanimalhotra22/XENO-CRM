"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Cpu, Mail, Lock, User as UserIcon, AlertCircle } from "lucide-react";

const AuthContext = createContext(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isRegister, setIsRegister] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister
      ? { name, email, password }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUser(data.user);
        // Clear fields
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setError(
          data.error || "Authentication failed. Please verify credentials.",
        );
      }
    } catch (err) {
      setError("Connection failed. Verify local servers are active.");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-custom text-xs mt-3 animate-pulse font-medium">
          Authorizing CRM secure access...
        </p>
      </div>
    );
  }

  const isPublicRoute = pathname === "/";

  // If user is authenticated, provide context and render normal application children
  if (user) {
    return (
      <AuthContext.Provider value={{ user, logout, checkSession }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // If visiting public landing page but not logged in, provide context (with null user) and render children
  if (isPublicRoute) {
    return (
      <AuthContext.Provider value={{ user: null, logout, checkSession }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Unauthenticated: Render Login/Register Screen
  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl space-y-6 shadow-2xl relative border border-zinc-800/10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/5">
            <Cpu className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="font-black text-2xl text-slate-900 dark:text-white tracking-wide">
              Xeno CRM Portal
            </h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">
              Secure Marketer Authorization
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/15 text-rose-500 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div className="space-y-1.5">
              <label className="text-muted-custom font-bold">Full Name</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-zinc-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Vani Malhotra"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-muted-custom font-bold">Email Address</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E.g., marketer@xeno.in"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-custom font-bold">Password</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs cursor-pointer shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isRegister ? (
              "Create Marketer Account"
            ) : (
              "Authenticate Secure Sign-In"
            )}
          </button>
        </form>

        <div className="text-center border-t border-zinc-800/10 pt-4">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-xs text-indigo-500 hover:text-indigo-400 font-bold cursor-pointer transition-colors"
          >
            {isRegister
              ? "Already registered? Sign-in here"
              : "New marketer? Create an account here"}
          </button>
        </div>
      </div>
    </div>
  );
}
