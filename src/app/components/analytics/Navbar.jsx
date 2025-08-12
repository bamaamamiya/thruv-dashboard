"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const router = useRouter();
  const [isThruvShop, setIsThruvShop] = useState(true);

  // Dark mode state
  const [isDark, setIsDark] = useState(false);

  // Inisialisasi dark mode dari localStorage atau system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else if (saved === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      // fallback system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleStoreName = () => {
    setIsThruvShop((prev) => !prev);
  };

  const toggleDarkMode = () => {
  console.log("toggleDarkMode clicked");
  if (isDark) {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
    setIsDark(false);
  } else {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
    setIsDark(true);
  }
};


  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-gray-200  px-6 py-3 flex justify-between items-center shadow-sm transition-colors duration-300 ">
      {/* Left Nav */}
      <div className="flex gap-2">
        <button
          onClick={() => router.push("/")}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
        >
          Dashboard
        </button>
        <button
          onClick={() => router.push("/order")}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
        >
          Orders
        </button>
      </div>

      {/* Right - Store Brand + Dark Mode Toggle */}
      <div className="flex items-center gap-4">
        {/* Store brand toggle */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={toggleStoreName}
          title="Toggle Store Name"
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {isThruvShop ? "Thruv" : "Store"}
          </p>
          <img
            src={isThruvShop ? "/images/thruv.jpg" : "/images/shop.png"}
            alt="Store Logo"
            className="w-8 h-8 rounded-md object-cover border border-gray-200 dark:border-gray-700"
          />
        </div>

        {/* Dark mode toggle button */}
        <button
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            // Sun icon (light mode)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m8.485-8.485l-.707.707M4.222 4.222l-.707.707m16.97 8.485h-1M5 12H4m14.071 5.071l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z"
              />
            </svg>
          ) : (
            // Moon icon (dark mode)
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              stroke="none"
            >
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
