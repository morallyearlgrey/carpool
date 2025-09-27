"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { useSession } from "next-auth/react";

const words = ["Smarter", "Faster", "Greener", "Connected"];

const HomePage: React.FC = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger all animations on mount
    setAnimate(true);
  }, []);

  useEffect(() => {
    // Word fade animation
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
    <div className="flex flex-col min-h-screen font-sans">
      {/* Navbar */}
      <Navbar
        isLoggedIn={isLoggedIn}
        className={`transition-transform duration-1000 ${
          animate ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"
        }`}
      />

      {/* Hero Section */}
      <main className="flex flex-1 flex-col md:flex-row items-center w-full max-w-7xl mx-auto px-6">
        {/* Left: Image Container */}
        <div
          className={`relative w-full md:w-1/2 aspect-[4/3] flex-1 h-96 md:h-[500px] lg:h-[600px] mb-8 md:mb-0 md:mr-12 flex items-center justify-center transition-all duration-1000 ease-out delay-100 ${
            animate ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
          }`}
        >
          <div className="relative w-full h-full max-w-[600px] max-h-[600px] rounded-3xl overflow-hidden flex items-center justify-center">
            <Image
              src="/map-illustration.png"
              alt="Carpool illustration"
              fill
              className="object-contain transition-transform duration-1000 ease-out transform hover:scale-105"
              priority
            />
          </div>
        </div>

        {/* Right: Text Content */}
        <div
          className={`flex flex-col items-center md:items-start justify-center w-full md:w-1/2 text-center md:text-left py-12 md:py-0`}
        >
          {/* Headline */}
          <h1
            className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight text-shadow transition-all duration-1000 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
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

          {/* Paragraph */}
          <p
            className={`text-[#62627a] text-base sm:text-lg max-w-md mb-8 leading-relaxed transition-all duration-1000 ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            Connect with coworkers, friends, or nearby riders for a smarter,
            eco-friendly commute. Powered by Google Maps.
          </p>

          {/* Button */}
          <button
            className={`buttons px-8 py-3 text-base md:text-lg text-white font-semibold rounded-full shadow-lg transition transform duration-500 hover:scale-105 hover:shadow-xl ${
              animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            Get Started
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`w-full p-4 text-center text-[#9988aa] text-sm border-t border-[#d8d0e0] transition-opacity duration-1000 ${
          animate ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDelay: "800ms" }}
      >
        &copy; {new Date().getFullYear()} KnightPool. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
