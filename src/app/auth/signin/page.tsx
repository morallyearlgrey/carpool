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
      

      {/* Main content area for the form */}
        
        <div className="w-1/2 h-full flex items-center justify-center flex-col p-20">
        <h1 className="text-3xl text-[var(--tan)] font-bold mb-6">LOG IN</h1>
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
                className="w-full p-2 bg-[var(--dark-blue)] text-white rounded-lg disabled:opacity-50  transition-transform cursor-pointer hover:scale-102"
                >
                SIGN IN
                </button>
            </form>
        </div>
    </div>

    )

}
