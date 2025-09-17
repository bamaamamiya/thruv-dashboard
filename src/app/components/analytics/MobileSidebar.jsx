"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, Menu, X } from "lucide-react";

const MobileSidebar = ({ isDark, toggleDarkMode, isThruvShop, toggleStoreName }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleNav = (path) => {
    router.push(path);
    setOpen(false);
  };

  return (
    <>
      {/* Hamburger (mobile only) */}
      <button
        className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
      </button>

      {/* Sidebar Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-64 
          bg-white dark:bg-black border-r border-gray-200 dark:border-gray-700
          z-50 transform transition-transform duration-300 
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-gray-800 dark:text-gray-100">
              Menu
            </p>
          </div>
          <button onClick={() => setOpen(false)}>
            <X className="w-6 h-6 text-gray-800 dark:text-gray-200" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col p-4 gap-3">
          <button
            onClick={() => handleNav("/")}
            className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            Dashboard
          </button>
          <button
            onClick={() => handleNav("/order")}
            className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            Orders
          </button>
          <button
            onClick={() => handleNav("/heat")}
            className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            Heat
          </button>
          <button
            onClick={() => handleNav("/ads")}
            className="text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            Ads
          </button>
        </div>

        {/* Footer - Store toggle + Dark mode */}
        <div className="absolute bottom-0 left-0 w-full border-t border-gray-200 dark:border-gray-700 p-4">
          <div
            className="flex items-center gap-3 cursor-pointer mb-3"
            onClick={toggleStoreName}
          >
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {isThruvShop ? "Thruv" : "Store"}
            </p>
            <img
              src={isThruvShop ? "/images/thruv.jpg" : "/images/shop.png"}
              alt="Store Logo"
              className="w-8 h-8 rounded-md object-cover border border-gray-200 dark:border-gray-700"
            />
          </div>

          <button
            onClick={toggleDarkMode}
            className="w-full flex justify-center items-center p-2 rounded-md border border-gray-200 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-white" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
