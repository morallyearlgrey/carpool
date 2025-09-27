"use client"; // This line tells Next.js to render this component on the client

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

// Main App component
export default function App() {
  // State to manage the selected gender ('F', 'M', or null)
  const [selectedGender, setSelectedGender] = useState(null);
  const [currentPage, setCurrentPage] = useState("profile");

  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  /**
   * Handles the click event for the gender selection buttons.
   * Toggles the selection: if the clicked gender is already selected, it deselects it.
   * Otherwise, it sets the new gender as selected.
   * @param {'F' | 'M'} gender - The gender to be selected.
   */
  const handleGenderSelect = (gender) => {
    if (selectedGender === gender) {
      setSelectedGender(null); // Deselect if already selected
    } else {
      setSelectedGender(gender); // Select the new gender
    }
  };

  return (
    // Main container with a light purple background
    <div className="min-h-screen font-sans text-[#663399] flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Main content area for the form */}
      <main className="flex-grow flex items-center justify-center p-4">
        {/* Profile Settings Card */}
        <div className="w-full max-w-sm bg-[#f7f5fc] p-8 rounded-3xl shadow-lg flex flex-col items-center">
          <h2 className="text-3xl font-bold text-center mb-8">Profile</h2>

          {/* Log out button */}
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

          {/* Uncomment this section for the full profile form */}
          {/*
          <div className="space-y-5 w-full mt-6">
            <label 
              htmlFor="image-upload" 
              className="w-full text-center bg-white py-3 px-4 rounded-full shadow-sm cursor-pointer hover:bg-gray-100 transition-colors duration-300 block"
            >
              Image Upload
            </label>
            <input id="image-upload" type="file" className="hidden" />

            <input type="text" placeholder="Name" className="inputs w-full" />
            <input type="number" placeholder="Age" className="inputs w-full" />

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleGenderSelect('F')}
                className={`w-full py-3 rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#663399] transition-colors duration-300 ${selectedGender === 'F' ? 'bg-[#663399] text-white' : 'bg-white'}`}
              >
                F
              </button>
              <button 
                onClick={() => handleGenderSelect('M')}
                className={`w-full py-3 rounded-full shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#663399] transition-colors duration-300 ${selectedGender === 'M' ? 'bg-[#663399] text-white' : 'bg-white'}`}
              >
                M
              </button>
            </div>

            <input type="text" placeholder="School" className="inputs w-full" />
            <input type="text" placeholder="Work" className="inputs w-full" />

            <button className="buttons w-full text-white font-bold py-3 px-4 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-300 mt-4">
              Confirm Profile
            </button>
          </div>
          */}
        </div>
      </main>
    </div>
  );
}
