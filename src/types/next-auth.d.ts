// Type declarations for extending NextAuth

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
  }
}