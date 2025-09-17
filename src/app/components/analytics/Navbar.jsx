"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import MobileSidebar from "./MobileSidebar";

const Navbar = () => {
  const router = useRouter();
  const [isThruvShop, setIsThruvShop] = useState(true);

  // Dark mode state
  const [isDark, setIsDark] = useState(false);

  // Init dark mode from localStorage / system
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else if (saved === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDark(prefersDark);
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleStoreName = () => {
    setIsThruvShop((prev) => !prev);
  };

  const toggleDarkMode = () => {
    setIsDark((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newMode;
    });
  };

  return (
    <nav className="sticky top-0 z-30 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex justify-between items-center shadow-sm">
      {/* Left Nav */}
      <div className="hidden md:flex">
        <button
          onClick={() => router.push("/")}
          className="px-3 py-1.5 text-sm font-medium 
          text-gray-700 dark:text-gray-200 
          hover:text-black dark:hover:text-white 
          hover:bg-gray-100 dark:hover:bg-gray-900 
          rounded-md transition"
        >
          Dashboard
        </button>
        <button
          onClick={() => router.push("/order")}
          className="px-3 py-1.5 text-sm font-medium 
          text-gray-700 dark:text-gray-200 
          hover:text-black dark:hover:text-white 
          hover:bg-gray-100 dark:hover:bg-gray-900 
          rounded-md transition"
        >
          Orders
        </button>
        <button
          onClick={() => router.push("/heat")}
          className="px-3 py-1.5 text-sm font-medium 
          text-gray-700 dark:text-gray-200 
          hover:text-black dark:hover:text-white 
          hover:bg-gray-100 dark:hover:bg-gray-900 
          rounded-md transition"
        >
          Heat
        </button>
        <button
          onClick={() => router.push("/ads")}
          className="px-3 py-1.5 text-sm font-medium 
          text-gray-700 dark:text-gray-200 
          hover:text-black dark:hover:text-white 
          hover:bg-gray-100 dark:hover:bg-gray-900 
          rounded-md transition"
        >
          Ads
        </button>
      </div>

      {/* Mobile Sidebar Trigger */}
      <MobileSidebar
        isDark={isDark}
        toggleDarkMode={toggleDarkMode}
        isThruvShop={isThruvShop}
        toggleStoreName={toggleStoreName}
      />

      {/* Right - Store Brand + Dark Mode Toggle */}
      <div className="hidden md:flex items-center gap-2">
        {/* Store brand toggle */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={toggleStoreName}
          title="Toggle Store Name"
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {isThruvShop ? "Thruv" : "Store"}
          </p>
          <img
            src={isThruvShop ? "/images/thruv.jpg" : "/images/shop.png"}
            alt="Store Logo"
            className="w-8 h-8 rounded-md object-cover 
            border border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1 rounded-md border border-gray-200 dark:border-gray-500 
          hover:bg-gray-100 dark:hover:bg-gray-900 
          transition"
          title="Toggle Dark Mode"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-white" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
