"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export const checkIsAuthenticated = async () => {

  console.error("checking to see if you are logged in!");
  const session = await getServerSession(authOptions) as ExtendedSession | null;

  if (!session?.user) 
    {
      console.error("girl you aint logged in!");
      return null; // not logged in
    }
  return {
    isAuthenticated: true,
    user: session.user, // contains id, email, firstname, lastname
  };
};
