/**
 * pages/api/auth/[...nextauth].js
 *
 * NextAuth catch-all route — handles /api/auth/signin, /api/auth/session, etc.
 */

import NextAuth from "next-auth";
import { authOptions } from "../../../lib/auth";

export default NextAuth(authOptions);
