"use client"; // This directive marks the component as a Client Component

import React from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { Navbar } from "@/components/navbar"


const ScreenshotIcon = () => (
		<svg className="w-10 h-10 sm:w-12 sm:h-12 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
			<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5" />
		</svg>
);

const ManualIcon = () => (
		<svg className="w-10 h-10 sm:w-12 sm:h-12 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
		</svg>
);



// Interface for the props of the DiamondButton component
// Unused interface removed

// Main App Component
const App: React.FC = () => {

      const { status } = useSession();
        const isLoggedIn = status === "authenticated";
    
    const router = useRouter();

    // Event handlers for the buttons
    const handleManualInputClick = (): void => {
        // Navigate to the manual schedule form where the user can fill each weekday
        router.push('/schedule/manual');
    };

    const handleImageUploadClick = (): void => {
        // For now, image upload isn't implemented. Keep as a noop or open file picker later.
        router.push('/schedule/screenshot');

    };

    // Removed unused manualInputIcon variable

    // Removed unused imageUploadIcon variable


    return (
        <div className="flex flex-col min-h-screen bg-[#F9F5FF] text-slate-800 font-sans">
                <Navbar isLoggedIn={isLoggedIn}></Navbar>


            {/* Main Content Section */}
            <main className="flex-grow flex flex-col items-center justify-center p-4 text-center">
                
                {/* Title */}
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-700 mb-16 sm:mb-20">
                    Schedule Set Up
                </h1>

                {/* Buttons Container */}
                <div className="flex flex-col md:flex-row justify-center items-center w-full max-w-4xl gap-16 md:gap-20 lg:gap-32">
									{/* Manual Setup */}
                                    <button onClick={handleManualInputClick} className="buttons group w-52 h-52 flex items-center justify-center text-white font-bold text-xl transform rotate-45 shadow-2xl shadow-purple-500/40 hover:shadow-purple-400/60 hover:scale-105 transition-all duration-300 ease-in-out my-auto rounded-2xl">
                                        <span className="transform -rotate-45 text-center flex flex-col items-center gap-2">
                                            <ManualIcon />
                                            Manual Setup
                                        </span>
                                    </button>
									{/* Upload a Screenshot */}
                                    <button onClick={handleImageUploadClick} className="buttons group w-52 h-52 flex items-center justify-center text-white font-bold text-xl transform rotate-45 shadow-2xl shadow-purple-500/40 hover:shadow-purple-400/60 hover:scale-105 transition-all duration-300 ease-in-out my-auto rounded-2xl">
                                        <span className="transform -rotate-45 text-center flex flex-col items-center gap-2">
                                            <ScreenshotIcon />
                                            Upload a Screenshot
                                        </span>
                                    </button>
                </div>
            </main>
        </div>
    );
};

export default App;
