import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

// Type definitions for NextAuth callbacks
interface ExtendedJWT {
  id?: string;
  firstName?: string;
  lastName?: string;
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

interface ExtendedUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
  image?: string;
}

interface ExtendedSession {
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
}

// NextAuth configuration
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const client = await clientPromise;
        const db = client.db("carpool");

        const user = await db.collection("users").findOne({ email: credentials.email });
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    // Add user info to JWT
    async jwt({ token, user }: { token: unknown; user?: unknown }) {
      const typedToken = token as ExtendedJWT;
      if (user) {
        const typedUser = user as ExtendedUser;
        typedToken.id = typedUser.id;
        typedToken.firstName = typedUser.firstName;
        typedToken.lastName = typedUser.lastName;
      }
      return typedToken as unknown;
    },
    // Make JWT data available in session
    async session({ session, token }: { session: unknown; token: unknown }) {
      const typedToken = token as ExtendedJWT;
      const typedSession = session as ExtendedSession;
      
      if (typedToken.id) {
        typedSession.user = {
          ...typedSession.user,
          id: typedToken.id,
          firstName: typedToken.firstName ?? "",
          lastName: typedToken.lastName ?? "",
        };
      }
      return typedSession;
    },
  },
};

const handler = NextAuth(authOptions as never);
export { handler as GET, handler as POST };