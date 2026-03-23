"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Home,
  ShoppingCart,
  BarChart3,
	Package,
} from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const [openOrders, setOpenOrders] = useState(false);

  return (
    <div className="w-64 h-screen bg-gray-50 dark:bg-black border-r border-gray-200 dark:border-gray-800 p-4">
      <nav className="space-y-2">
        {/* Home */}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
        >
          <Home size={18} />
          Home
        </Link>

        {/* Orders Parent */}
        <div>
          <button
            onClick={() => setOpenOrders(!openOrders)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              Orders
            </div>

            {openOrders ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {/* Submenu */}
          {openOrders && (
            <div className="ml-6 mt-2 space-y-1">
              <Link
                href="/order"
                className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                All Orders
              </Link>

              <Link
                href="/abandoned"
                className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                Abandoned Checkouts
              </Link>
            </div>
          )}
        </div>

        <Link
          href="/products"
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
        >
          <Package size={18} />
          Products
        </Link>
        <Link
          href="/ads"
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
        >
          <BarChart3 size={18} />
          Ads
        </Link>
      </nav>
    </div>
  );
}
