/**
 * pages/index.js  —  Login page
 *
 * This is the only page clients see before they authenticate.
 * After a successful login, NextAuth redirects them to /dashboard.
 */

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email:    email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <>
      <Head>
        <title>RM Select Benchmarking — Sign In</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="login-page">
        <div className="login-card">
          <div className="login-card__header">
            {/* Replace src with /logo.png once you drop the real file into public/ */}
            <div
              style={{
                width: 160,
                height: 48,
                background: "var(--navy-dark)",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.75rem",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "0.03em",
              }}
            >
              RM SELECT
            </div>
            <h1 className="login-card__title">RM Select Benchmarking</h1>
            <p className="login-card__subtitle">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="btn btn--primary"
              style={{ width: "100%", marginTop: "1.25rem" }}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p
          style={{
            marginTop: "1.5rem",
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.78rem",
          }}
        >
          © {new Date().getFullYear()} Richey May &amp; Co. — Confidential
        </p>
      </div>
    </>
  );
}

// If the user is already logged in, skip the login page and go to dashboard
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (session) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
}
