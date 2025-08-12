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


      </div>
    </nav>
  );
};

export default Navbar;
