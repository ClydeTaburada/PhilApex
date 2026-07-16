"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StaffLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to login. Please check your credentials.");
        return;
      }

      router.replace("/staff/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4 rounded-2xl">
      <div className="form-field">
        <label htmlFor="login-email" className="form-label">
          Staff Email
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
          placeholder="you@philapex.com"
        />
      </div>

      <div className="form-field">
        <label htmlFor="login-password" className="form-label">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          placeholder="••••••••"
        />
      </div>

      {error ? (
        <div className="alert alert-error text-sm" role="alert">
          {error}
        </div>
      ) : null}

      <button
        id="login-submit"
        type="submit"
        disabled={loading}
        className="btn btn-primary btn-lg w-full mt-2"
      >
        {loading ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: 14,
                height: 14,
                border: "2px solid rgba(255,255,255,.4)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin .6s linear infinite",
              }}
            />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </button>

    </form>
  );
}
