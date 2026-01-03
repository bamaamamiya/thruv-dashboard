import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  // konfigurasi lain Next.js bisa ditambahkan di sini
};

export default withPWA({
  dest: "public", // tempat output service worker
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
