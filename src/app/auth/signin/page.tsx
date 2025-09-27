"use client";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setErrorMsg("Invalid email or password. Please try again or register.");
      // Optionally redirect to register page:
      // router.push(`/auth/register?email=${email}`);
    } else if (result?.ok) {
      // Redirect to home page after successful login
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen font-sans text-[#663399] flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#f7f5fc] p-8 rounded-3xl shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">LOG IN</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <p className="text-red-500 text-center text-sm">{errorMsg}</p>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 outline-none focus:outline-none rounded-lg border border-gray-300"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 outline-none focus:outline-none rounded-lg border border-gray-300"
              required
            />
            <button
              type="submit"
              className="cursor-pointer w-full px-4 py-2 text-sm md:text-base bg-transparent text-[#663399] font-medium rounded-full border border-[#663399] hover:bg-[#663399]/60 transition-all duration-300"
            >
              SUBMIT
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
