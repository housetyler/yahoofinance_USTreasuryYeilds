/**
 * pages/api/admin/users.js
 *
 * Admin-only endpoints for managing users.
 *
 *   GET    /api/admin/users        — list all users (with company)
 *   POST   /api/admin/users        — create a new user
 *   DELETE /api/admin/users?id=X   — delete a user
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isAdmin: true,
        company: { select: { id: true, name: true } },
      },
      orderBy: { email: "asc" },
    });
    return res.status(200).json(users);
  }

  if (req.method === "POST") {
    const { email, password, companyId, isAdmin } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const hash = await bcrypt.hash(password, 12);

    try {
      const user = await prisma.user.create({
        data: {
          email:     email.toLowerCase().trim(),
          password:  hash,
          isAdmin:   Boolean(isAdmin),
          companyId: companyId ? Number(companyId) : null,
        },
        select: { id: true, email: true, isAdmin: true, companyId: true },
      });
      return res.status(201).json(user);
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: "Email already exists" });
      }
      throw err;
    }
  }

  if (req.method === "DELETE") {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ error: "id is required" });
    await prisma.user.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
