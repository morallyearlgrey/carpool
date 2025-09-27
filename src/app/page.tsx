"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

import { Navbar } from "@/components/navbar"
const words = ["Smarter", "Faster", "Greener", "Connected"];

import { useSession } from "next-auth/react";


const HomePage: React.FC = () => {
   const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // start fade out
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setFade(true); // fade in new word
      }, 300); // fade duration
    }, 2000); // total time per word
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans"> {/* bg color is now in globals.css */}
    <Navbar isLoggedIn={isLoggedIn}></Navbar>
      
      {/* Hero Section */}
      <main className="flex flex-1 flex-col md:flex-row items-center w-full max-w-7xl mx-auto px-6">
        {/* Left: Image Container */}
				<div className="relative w-full md:w-1/2 aspect-[4/3] flex-1 h-96 md:h-[500px] lg:h-[600px] mb-8 md:mb-0 md:mr-12 flex items-center justify-center">
					{/* The outer container for the map illustration, defining its maximum size and shape */}
					<div className="relative w-full h-full max-w-[600px] max-h-[600px] rounded-3xl overflow-hidden flex items-center justify-center"> {/* Set the dark background here */}
						 <Image
								src="/map-illustration.png" // Assuming you've placed this in your public folder
								alt="Carpool illustration"
								fill
								// Change from object-cover to object-contain, and set the background of the parent
								className="object-contain mix-blend-multiply" // Use object-contain to ensure the whole image is visible
								priority
							/>
					</div>
				</div>

        {/* Right: Text Content */}
        <div className="flex flex-col items-center md:items-start justify-center w-full md:w-1/2 text-center md:text-left py-12 md:py-0">
          {/* Responsive Font Size for Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight text-shadow">
            <span
              className={`transition-opacity duration-300 inline-block mr-4 sm:mr-4 ${
                fade ? "opacity-100" : "opacity-0"
              }`}
            >
              {words[currentWordIndex]}
            </span>
            <span className="inline-block text-[#3a3a5a] text-shadow">
              commuting
            </span>
          </h1>
          {/* Responsive Font Size for Paragraph */}
          <p className="text-[#62627a] text-base sm:text-lg max-w-md mb-8 leading-relaxed">
            Connect with coworkers, friends, or nearby riders for a smarter,
            eco-friendly commute. Powered by Google Maps.
          </p>
          <button className="buttons px-8 py-3 text-base md:text-lg text-white font-semibold rounded-full shadow-lg transition">
            Get Started
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-4 text-center text-[#9988aa] text-sm border-t border-[#d8d0e0]">
        &copy; {new Date().getFullYear()} KnightPool. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
