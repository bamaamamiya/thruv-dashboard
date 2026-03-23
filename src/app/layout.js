import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "./components/analytics/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "./components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "My Store",
  description: "Create by bama",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-title" content="My Store" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" sizes="192x192" href="/icons/192x192.png" />
        <link rel="icon" sizes="512x512" href="/icons/512x512.png" />
      </head>

      <body
        className={`${inter.className}  bg-gray-50 text-black dark:bg-black dark:text-white`}
      >
        <AuthProvider>
          {/* 🔝 Navbar */}
          <Navbar />

          {/* 🔽 Layout bawah */}
          <div className="flex">
            {/* Sidebar kiri */}
            <div className="hidden md:block w-64 h-[calc(100vh-64px)] sticky top-16 border-r border-gray-200 dark:border-gray-800">
              <Sidebar />
            </div>

            {/* Content kanan */}
            <main className="flex-1 p-2 overflow-y-auto">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
