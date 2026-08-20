/**
 * pages/api/admin/companies.js
 *
 * Admin-only endpoints for managing companies.
 *
 *   GET    /api/admin/companies        — list all companies
 *   POST   /api/admin/companies        — create a company
 *   DELETE /api/admin/companies?id=X   — delete a company
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function requireAdmin(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user.isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return session;
}

export default async function handler(req, res) {
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });
    return res.status(200).json(companies);
  }

  if (req.method === "POST") {
    const { name } = req.body ?? {};
    if (!name) return res.status(400).json({ error: "name is required" });

    try {
      const company = await prisma.company.create({ data: { name: name.trim() } });
      return res.status(201).json(company);
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Company already exists" });
      }
      throw err;
    }
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    await prisma.company.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
