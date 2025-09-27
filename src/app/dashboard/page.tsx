'use client'; // Required for using React hooks like useState and useEffect

import React, { useState, useEffect } from 'react';
import RecommendedRides from '@/components/RecommendedRides';

// --- Embedded SVG Icons (No Installation Needed) ---
const BellIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
const RouteIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H13" /><circle cx="18" cy="5" r="3" /></svg>
);
const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const PlusCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
);
const CarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10H8c0 0-2.7.6-4.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" /><path d="M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M5 11v-4c0-.6.4-1 1-1h12c.6 0 1 .4 1 1v4" /><path d="m2 11 3-3" /><path d="m22 11-3-3" /></svg>
);
// --- End of SVG Icons ---

const DashboardPage = () => {
  // State to trigger the animation after the component mounts
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // Set a short timeout to allow the component to render before transitioning
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer); // Cleanup timer
  }, []);

  const animationClasses = (delay: string) => 
    `transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br p-6 lg:p-10 text-gray-800 font-sans"
      // style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}
    >
      <header className={`flex justify-between items-center bg-white bg-opacity-40 rounded-lg p-4 mb-8 shadow-lg shadow-purple-500/10 backdrop-blur-lg ${animationClasses('0ms')}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg transform rotate-45 flex items-center justify-center shadow-md">
            <span className="transform -rotate-45 text-white text-xs font-bold">K</span>
          </div>
          <span className="text-xl font-bold tracking-wider text-purple-800">KNIGHTPOOL</span>
        </div>
        <span className="text-xl font-semibold text-purple-700">Dashboard</span>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        
        <div className={`lg:col-span-1 flex flex-col gap-8 ${animationClasses('100ms')}`}>
          <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 flex-grow">
            <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2"><BellIcon className="text-purple-600"/> Upcoming Rides</h2>
            <div className="bg-white bg-opacity-70 rounded-lg min-h-[180px] flex items-center justify-center p-4">
              <p className="text-gray-600 text-lg">No upcoming rides scheduled.</p>
            </div>
          </div>
          <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 flex-grow">
            <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2"><RouteIcon className="text-purple-600"/> Suggested Rides</h2>
            <div className="bg-white bg-opacity-70 rounded-lg min-h-[180px] p-4">
              {/* Recommended rides component - replace currentUserId and request with real data when available */}
              <RecommendedRides currentUserId={"000000000000000000000000"} request={{ date: new Date().toISOString(), startTime: '08:30', beginLocation: { lat: 37.77, long: -122.42 }, finalLocation: { lat: 37.79, long: -122.39 } }} />
            </div>
          </div>
        </div>

        <div className={`lg:col-span-1 flex flex-col items-center gap-8 h-full ${animationClasses('200ms')}`}>
          <button className="buttons group w-52 h-52 flex items-center justify-center text-white font-bold text-xl transform rotate-45 shadow-2xl shadow-purple-500/40 hover:shadow-purple-400/60 hover:scale-105 transition-all duration-300 ease-in-out my-auto rounded-2xl">
            <span className="transform -rotate-45 text-center flex flex-col items-center gap-2">
              <PlusCircleIcon className="w-8 h-8 transition-transform duration-300 group-hover:rotate-90" />
              Request a Ride
            </span>
          </button>
          <button className="buttons group w-52 h-52 flex items-center justify-center text-white font-bold text-xl transform rotate-45 shadow-2xl shadow-purple-500/40 hover:shadow-purple-400/60 hover:scale-105 transition-all duration-300 ease-in-out my-auto rounded-2xl">
            <span className="transform -rotate-45 text-center flex flex-col items-center gap-2">
              <CarIcon className="w-8 h-8 transition-transform duration-300 group-hover:translate-x-1" />
              Offer a Ride
            </span>
          </button>
        </div>

        <div className={`lg:col-span-1 bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 flex flex-col items-center ${animationClasses('300ms')}`}>
          <h2 className="text-2xl font-bold text-purple-800 mb-6 w-full text-center flex items-center justify-center gap-2"><UserIcon className="text-purple-600"/> Profile</h2>
          <div className="w-32 h-32 bg-gray-200 rounded-lg mb-6 flex items-center justify-center text-gray-500 text-sm overflow-hidden shadow-inner">
            <UserIcon className="w-16 h-16 text-gray-400"/>
          </div>
          <div className="w-full space-y-4">
            <input type="text" placeholder="Name" className="inputs" />
            <input type="text" placeholder="Age" className="inputs" />
            <input type="text" placeholder="Gender" className="inputs" />
            <input type="text" placeholder="School" className="inputs" />
            <input type="text" placeholder="Work" className="inputs" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
