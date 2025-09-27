"use client"; // This line tells Next.js to render this component on the client

import React, { useState } from 'react';

// Main App component
export default function App() {
  // State to manage the selected gender ('F', 'M', or null)
  const [selectedGender, setSelectedGender] = useState(null);

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
      
      {/* Header Section */}
      <header className="w-full p-6 sm:p-8">
        <div className="container mx-auto flex items-center">
          {/* Diamond Logo */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#663399] transform rotate-45 mr-4"></div>
          {/* Brand Name */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-[#663399]">KNIGHTPOOL</h1>
        </div>
      </header>

      {/* Main content area for the form */}
      <main className="flex-grow flex items-center justify-center p-4">
        
        {/* Profile Settings Card */}
        <div className="w-full max-w-sm bg-[#f7f5fc] p-8 rounded-3xl shadow-lg">
          <h2 className="text-3xl font-bold text-center mb-8">Profile Settings</h2>
          
          <div className="space-y-5">
            {/* Image Upload Button */}
            <label 
              htmlFor="image-upload" 
              className="w-full text-center bg-white py-3 px-4 rounded-full shadow-sm cursor-pointer hover:bg-gray-100 transition-colors duration-300 block"
            >
              Image Upload
            </label>
            <input id="image-upload" type="file" className="hidden" />

            {/* Name Input */}
            <input 
              type="text" 
              placeholder="Name" 
              className="inputs"
            />

            {/* Age Input */}
            <input 
              type="number" 
              placeholder="Age" 
              className="inputs"
            />

            {/* Gender Selection */}
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

            {/* School Input */}
            <input 
              type="text" 
              placeholder="School" 
              className="inputs"
            />

            {/* Work Input */}
            <input 
              type="text" 
              placeholder="Work" 
              className="inputs"
            />

            {/* Confirm Button */}
            <button className="buttons w-full text-white font-bold py-3 px-4 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-300 mt-4">
              Confirm Profile
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
