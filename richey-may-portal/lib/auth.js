/**
 * lib/auth.js
 *
 * Shared NextAuth options — used by the [...nextauth] API route
 * and by getServerSession() on protected pages.
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const CredentialsProvider = require("next-auth/providers/credentials").default;

const prisma = new PrismaClient();

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { company: true },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        // Return only what we want in the JWT / session
        return {
          id:          String(user.id),
          email:       user.email,
          isAdmin:     user.isAdmin,
          companyName: user.company?.name ?? null,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    // Persist extra fields into the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id          = user.id;
        token.isAdmin     = user.isAdmin;
        token.companyName = user.companyName;
      }
      return token;
    },
    // Expose those fields on the client-side session object
    async session({ session, token }) {
      session.user.id          = token.id;
      session.user.isAdmin     = token.isAdmin;
      session.user.companyName = token.companyName;
      return session;
    },
  },

  pages: {
    signIn: "/",          // our custom login page
    error:  "/",          // redirect auth errors back to login
  },

  secret: process.env.NEXTAUTH_SECRET,
};

module.exports = { authOptions };
