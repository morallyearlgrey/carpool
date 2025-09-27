"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const checkIsAuthenticated = async () => {

  console.error("checking to see if you are logged in!");
  const session = await getServerSession(authOptions);

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
