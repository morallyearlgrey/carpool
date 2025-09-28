import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

// NextAuth configuration
export const authOptions: AuthOptions = {
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
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    // Add user info to JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    // Make JWT data available in session
    async session({ session, token }) {
  if (token.id) {
    session.user = {
      ...session.user,
      id: token.id as string,
      firstName: token.firstName ?? "",
      lastName: token.lastName ?? "",
    };
  }
  return session;
},
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };