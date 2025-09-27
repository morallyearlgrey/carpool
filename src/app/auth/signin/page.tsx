"use client";
import React, { useState } from 'react';

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";


import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar"

export default function SignIn() { 
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const { data: session, status } = useSession();
    const isLoggedIn = status === "authenticated"; 

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
        // Redirect to register with the email pre-filled
            router.push(`/auth/register`);
        } else if (result?.ok) {
        // Here i need to store the current user ID as a cookie

        document.cookie = `userId=1; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

      
        router.push("/");
    }
    
  };

    return (
<div className="min-h-screen font-sans text-[#663399] flex flex-col">
      
          <Navbar isLoggedIn={isLoggedIn}></Navbar>
      

      <main className="flex-grow flex items-center justify-center p-4">
        
        <div className="w-full max-w-sm bg-[#f7f5fc] p-8 rounded-3xl shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">LOG IN</h2>
          
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 outline-none focus:outline-none rounded-lg bg-[var(--light-blue)] text-[var(--white)]"
                />
                <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2 outline-none focus:outline-none rounded-lg bg-[var(--light-blue)] text-[var(--white)]"
                />
                <button
                type="submit"
                className="px-4 py-1.5 text-sm md:px-6 md:py-2 md:text-base bg-transparent text-[#663399] font-medium rounded-full border border-[#663399] hover:bg-[#663399]/60  whitespace-nowrap cursor-pointer transition-all duration-300"
                >
                SUBMIT
                </button>
            </form>
        </div>
    </main>

    </div>

    )

}
