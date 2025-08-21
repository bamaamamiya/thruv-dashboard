import { Inter } from "next/font/google";
import Navbar from "./components/analytics/Navbar";
import "./globals.css";
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
        <link
          rel="icon"
          sizes="192x192"
          href="/icons/192x192.png"
        />
        <link
          rel="icon"
          sizes="512x512"
          href="/icons/512x512.png"
        />
        {/* tambahan meta PWA lain kalau perlu */}
      </head>
      <body className={`${inter.className}`}>
        <Navbar />
        <div className="container mx-auto py-6 bg-white dark:bg-black dark:text-white">{children}</div>
      </body>
    </html>
  );
}
