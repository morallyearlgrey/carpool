"use client";
import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/solid";

const routes: { title: string; href: string }[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Schedule", href: "/schedule" },
  { title: "Login", href: "/auth/signin" },
  { title: "Register", href: "/auth/register" },
];

interface NavbarProps {
  isLoggedIn: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

//   const profilePhoto = photo || "/LogOut.png";
  const profilePhoto = "/grimace.jpg";

  return (
    <div className="relative w-full z-20">
      <div className="absolute inset-0 h-50 bg-gradient-to-b from-[#402B52]/90 to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-between h-30 w-full px-6">
        <div className="flex justify-start">
          <Link
            href="/"
            className="flex items-center space-x-2"
          >
            <svg className="w-8 h-8 text-[#663399]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
          </svg>
           <h1 className="text-2xl font-extrabold text-[#663399] tracking-wide">
            KnightPool
          </h1>
          </Link>
        </div>

        <div className="justify-end sm:flex hidden gap-2">
          {routes.map((route, index) => {
            if (isLoggedIn && (route.title === "Login" || route.title === "Register")) return null;

            const isSpecial = route.title === "Login" || route.title === "Register";

            return (
              <Link
                key={index}
                href={route.href}
                className={`relative flex items-center px-4 py-2 text-white text-base rounded-sm transition-all duration-500 ${
                  isSpecial ? "px-4 py-1.5 text-sm md:px-6 md:py-2 md:text-base bg-transparent text-[#663399] font-medium rounded-full border border-[#663399] hover:bg-[#663399] transition whitespace-nowrap" : "hover:text-[#663399]"
                }`}
              >
                {route.title}
              </Link>
            );
          })}

          {/* Profile image */}
          {isLoggedIn && (
            <Link href="/profile">
              <Image
                className="object-cover rounded-full h-10 w-10 border border-white"
                src={profilePhoto}
                alt="Profile"
                width={40}
                height={40}
              />
            </Link>
          )}
        </div>

        <button
          onClick={toggleMenu}
          className="sm:hidden bg-[#663399] rounded z-50 cursor-pointer"
        >
          {menuOpen ? <XMarkIcon className="h-7 w-7" /> : <Bars3Icon className="h-7 w-7" />}
        </button>
      </div>

      {menuOpen && (
        <MobileMenu
          toggleMenu={toggleMenu}
          isLoggedIn={isLoggedIn}
          photo={profilePhoto}
        />
      )}
    </div>
  );
};

interface MobileMenuProps {
  toggleMenu: () => void;
  isLoggedIn: boolean;
  photo?: string | null;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ toggleMenu, isLoggedIn, photo }) => {
  return (
    <div className="fixed inset-0 flex flex-col z-40 bg-black">
      <div className="flex w-full flex-col gap-1 px-4 pb-2 py-12">
        <Link
          href="/"
          onClick={toggleMenu}
          className="flex items-center space-x-2"
        >
          <svg className="w-8 h-8 text-[#663399]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w.org/2000/svg">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
          </svg>
          <h1 className="text-2xl font-extrabold text-[#663399] tracking-wide">
            KnightPool
          </h1>
        </Link>

        {routes.map((route, index) => {
          if (isLoggedIn && (route.title === "Login" || route.title === "Register")) return null;

          const isSpecial = route.title === "Login" || route.title === "Register";

          return (
            <Link
              key={index}
              href={route.href}
              onClick={toggleMenu}
              className={`flex items-center px-4 py-2 text-white text-sm rounded-sm transition-all duration-500 ${
                isSpecial ? "px-4 py-1.5 text-sm md:px-6 md:py-2 md:text-base bg-transparent text-[#663399] font-medium rounded-full border border-[#663399] hover:bg-[#663399] transition whitespace-nowrap" : "hover:text-[#663399]"
              }`}
            >
              {route.title}
            </Link>
          );
        })}

        {isLoggedIn && photo && (
          <div className="mt-auto px-4 pb-4">
            <Link href="/account" onClick={toggleMenu}>
              <Image
                className="object-cover rounded-full h-12 w-12 border border-white"
                src={photo}
                alt="Profile"
                width={48}
                height={48}
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export { Navbar };
