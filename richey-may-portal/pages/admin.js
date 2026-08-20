/**
 * pages/admin.js  —  Admin panel (admin users only)
 *
 * Features:
 *  • Create / delete companies (these must match Client_Name values in Domo exactly)
 *  • Create / delete users and assign them to a company
 *  • List of all current users and companies
 *
 * Non-admin users who try to visit /admin are redirected to /dashboard.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../lib/auth";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Head from "next/head";

export default function AdminPage() {
  // ── State ──────────────────────────────────────────────────────────────
  const [companies, setCompanies]     = useState([]);
  const [users, setUsers]             = useState([]);

  // New company form
  const [newCompany, setNewCompany]   = useState("");
  const [companyMsg, setCompanyMsg]   = useState("");

  // New user form
  const [newEmail, setNewEmail]       = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCompanyId, setNewCompanyId] = useState("");
  const [newIsAdmin, setNewIsAdmin]   = useState(false);
  const [userMsg, setUserMsg]         = useState("");

  // ── Load data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchCompanies();
    fetchUsers();
  }, []);

  async function fetchCompanies() {
    const res = await fetch("/api/admin/companies");
    if (res.ok) setCompanies(await res.json());
  }

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
  }

  // ── Create company ─────────────────────────────────────────────────────
  async function handleCreateCompany(e) {
    e.preventDefault();
    setCompanyMsg("");
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCompany }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewCompany("");
      setCompanyMsg("✅ Company created.");
      fetchCompanies();
    } else {
      setCompanyMsg(`❌ ${data.error}`);
    }
  }

  // ── Delete company ─────────────────────────────────────────────────────
  async function handleDeleteCompany(id, name) {
    if (!confirm(`Delete company "${name}"? Users assigned to it will lose their company.`)) return;
    await fetch(`/api/admin/companies?id=${id}`, { method: "DELETE" });
    fetchCompanies();
    fetchUsers();
  }

  // ── Create user ────────────────────────────────────────────────────────
  async function handleCreateUser(e) {
    e.preventDefault();
    setUserMsg("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:     newEmail,
        password:  newPassword,
        companyId: newCompanyId || null,
        isAdmin:   newIsAdmin,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewEmail("");
      setNewPassword("");
      setNewCompanyId("");
      setNewIsAdmin(false);
      setUserMsg("✅ User created.");
      fetchUsers();
    } else {
      setUserMsg(`❌ ${data.error}`);
    }
  }

  // ── Delete user ────────────────────────────────────────────────────────
  async function handleDeleteUser(id, email) {
    if (!confirm(`Delete user "${email}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    fetchUsers();
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>RM Select — Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="admin-layout">
        {/* Nav */}
        <nav className="navbar">
          <div className="navbar__logo">
            <div
              style={{
                width: 100, height: 28, background: "rgba(255,255,255,0.15)",
                borderRadius: 3, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.75rem", fontWeight: 700,
                letterSpacing: "0.04em", color: "#fff",
              }}
            >
              RM SELECT
            </div>
            <span>Admin</span>
          </div>
          <div className="navbar__actions">
            <a href="/dashboard" className="btn btn--secondary btn--sm">Dashboard</a>
            <button
              className="btn btn--secondary btn--sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </button>
          </div>
        </nav>

        <main className="admin-content">
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--navy-dark)", marginBottom: "1.75rem" }}>
            User &amp; Company Management
          </h1>

          <div className="admin-grid">
            {/* ── LEFT: Companies ─────────────────────────────────────── */}
            <div>
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <h2 className="section-title">Add Company</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                  The company name must exactly match the <strong>Client_Name</strong> value in your Domo dataset.
                </p>
                <form onSubmit={handleCreateCompany}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="companyName">Company name</label>
                    <input
                      id="companyName"
                      type="text"
                      className="form-input"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      required
                    />
                  </div>
                  {companyMsg && (
                    <p style={{ fontSize: "0.82rem", marginBottom: "0.75rem", color: companyMsg.startsWith("✅") ? "var(--green-dark)" : "#c0392b" }}>
                      {companyMsg}
                    </p>
                  )}
                  <button type="submit" className="btn btn--primary">Add Company</button>
                </form>
              </div>

              <div className="card">
                <h2 className="section-title">Companies</h2>
                {companies.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No companies yet.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th style={{ width: 70 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c) => (
                        <tr key={c.id}>
                          <td>{c.name}</td>
                          <td>
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={() => handleDeleteCompany(c.id, c.name)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* ── RIGHT: Users ─────────────────────────────────────────── */}
            <div>
              <div className="card" style={{ marginBottom: "1.5rem" }}>
                <h2 className="section-title">Add User</h2>
                <form onSubmit={handleCreateUser}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="userEmail">Email</label>
                    <input
                      id="userEmail"
                      type="email"
                      className="form-input"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="client@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="userPassword">Temporary password</label>
                    <input
                      id="userPassword"
                      type="text"
                      className="form-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="userCompany">Assign to company</label>
                    <select
                      id="userCompany"
                      className="form-select"
                      value={newCompanyId}
                      onChange={(e) => setNewCompanyId(e.target.value)}
                    >
                      <option value="">— None (admin / unassigned) —</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      id="userIsAdmin"
                      type="checkbox"
                      checked={newIsAdmin}
                      onChange={(e) => setNewIsAdmin(e.target.checked)}
                    />
                    <label htmlFor="userIsAdmin" className="form-label" style={{ margin: 0 }}>
                      Grant admin access
                    </label>
                  </div>
                  {userMsg && (
                    <p style={{ fontSize: "0.82rem", marginBottom: "0.75rem", color: userMsg.startsWith("✅") ? "var(--green-dark)" : "#c0392b" }}>
                      {userMsg}
                    </p>
                  )}
                  <button type="submit" className="btn btn--primary">Create User</button>
                </form>
              </div>

              <div className="card">
                <h2 className="section-title">Users</h2>
                {users.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No users yet.</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Company</th>
                        <th>Role</th>
                        <th style={{ width: 70 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td>{u.company?.name ?? <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                          <td>
                            <span className={`badge ${u.isAdmin ? "badge--admin" : "badge--client"}`}>
                              {u.isAdmin ? "Admin" : "Client"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn--danger btn--sm"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="footer">
          © {new Date().getFullYear()} Richey May &amp; Co.
        </footer>
      </div>
    </>
  );
}

// Server-side: redirect non-admins away
export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }
  if (!session.user.isAdmin) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
}
