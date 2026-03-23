"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Search } from "lucide-react";
import MobileSidebar from "./MobileSidebar";

const Navbar = () => {
  const [isThruvShop, setIsThruvShop] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [search, setSearch] = useState("");

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
    <nav className="sticky top-0 z-30 bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">

      {/* LEFT: Search + Mobile Sidebar */}
      <div className="flex items-center gap-3 w-full md:w-auto">

        {/* Mobile Sidebar */}
        <div className="md:hidden">
          <MobileSidebar
            isDark={isDark}
            toggleDarkMode={toggleDarkMode}
            isThruvShop={isThruvShop}
            toggleStoreName={toggleStoreName}
          />
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            type="text"
            placeholder="Search order, name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md 
            bg-gray-100 dark:bg-gray-900 
            text-gray-800 dark:text-gray-200
            border border-gray-200 dark:border-gray-700
            focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden md:flex items-center gap-2">

        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={toggleStoreName}
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

        <button
          onClick={toggleDarkMode}
          className="p-1 rounded-md border border-gray-200 dark:border-gray-500 
          hover:bg-gray-100 dark:hover:bg-gray-900 transition"
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