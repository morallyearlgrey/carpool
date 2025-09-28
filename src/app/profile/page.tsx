"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default function App() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";


  return (
    <div className="min-h-screen font-sans text-[#663399] flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#f7f5fc] p-8 rounded-3xl shadow-lg flex flex-col items-center">
          <h2 className="text-3xl font-bold text-center mb-8">
            Welcome {isLoggedIn ? `${session.user.firstName} ${session.user.lastName}` : "Guest"}
          </h2>

          {isLoggedIn && (
            <div className="flex justify-center mt-4 w-full">
              <Button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="px-6 py-2 text-base bg-transparent text-[#663399] font-medium rounded-full border border-[#663399] hover:bg-[#663399]/60 transition-all duration-300 w-full cursor-pointer"
              >
                Log Out
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}