/**
 * pages/dashboard.js  —  Embedded Domo dashboard (protected)
 *
 * What happens here:
 *  1. getServerSideProps checks the session — if not logged in, redirect to login.
 *  2. getServerSideProps calls the embed-token API server-side to get a Domo token
 *     filtered to this user's company (+ Peer Group rows).
 *  3. The token and embed URL are passed as props to the page.
 *  4. The browser renders an invisible form that auto-submits to the Domo iframe,
 *     which is the standard Domo programmatic embed handshake.
 *     Clients never see a Domo URL or any Domo branding in the nav bar.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";
import { getEmbedToken } from "../lib/domo";
import { signOut } from "next-auth/react";
import Head from "next/head";
import { useEffect, useRef } from "react";

const EMBED_ID = "D842k"; // Comp Benchmarking

export default function DashboardPage({ embedUrl, embedToken, userEmail, companyName }) {
  const formRef   = useRef(null);
  const iframeRef = useRef(null);

  // Auto-submit the hidden form into the iframe once the page loads.
  // This is the Domo programmatic embed handshake.
  useEffect(() => {
    if (formRef.current && iframeRef.current) {
      formRef.current.submit();
    }
  }, []);

  return (
    <>
      <Head>
        <title>RM Select Benchmarking — Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="dashboard-layout">
        {/* ── Navigation bar ─────────────────────────────────────────── */}
        <nav className="navbar">
          <div className="navbar__logo">
            {/* Swap the div below for <img src="/logo.png" …> once you add the real logo */}
            <div
              style={{
                width: 100,
                height: 28,
                background: "rgba(255,255,255,0.15)",
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#fff",
              }}
            >
              RM SELECT
            </div>
            <span>Benchmarking</span>
          </div>

          <div className="navbar__actions">
            {companyName && (
              <span className="navbar__user">{companyName}</span>
            )}
            <span className="navbar__user" style={{ opacity: 0.65 }}>
              {userEmail}
            </span>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </button>
          </div>
        </nav>

        {/* ── Dashboard iframe ────────────────────────────────────────── */}
        <main className="dashboard-content">
          <div className="dashboard-iframe-wrapper">
            {/* Hidden form — submits the embed token to the iframe (Domo's handshake) */}
            <form
              ref={formRef}
              method="post"
              action={embedUrl}
              target="domo-embed"
              style={{ display: "none" }}
            >
              <input type="hidden" name="embedToken" value={embedToken} />
            </form>

            <iframe
              ref={iframeRef}
              name="domo-embed"
              title="RM Select Benchmarking Dashboard"
              allowFullScreen
            />
          </div>
        </main>

        <footer className="footer">
          © {new Date().getFullYear()} Richey May &amp; Co. — Confidential. All rights reserved.
        </footer>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  // 1 — Require authentication
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  const company = session.user.companyName ?? "Peer Group";

  // 2 — Get the Domo embed token server-side (Client Secret never touches browser)
  try {
    const { token, embedUrl } = await getEmbedToken(EMBED_ID, company);
    return {
      props: {
        embedUrl,
        embedToken:  token,
        userEmail:   session.user.email,
        companyName: session.user.companyName ?? null,
      },
    };
  } catch (err) {
    console.error("Failed to get Domo embed token:", err);
    // Still render the page; the iframe will show an error rather than crashing
    return {
      props: {
        embedUrl:    "",
        embedToken:  "",
        userEmail:   session.user.email,
        companyName: session.user.companyName ?? null,
      },
    };
  }
}
