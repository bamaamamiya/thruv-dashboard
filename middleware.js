// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  // Ambil cookies
  const token = request.cookies.get("token")?.value;

  // Kalau belum login → redirect ke /login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Kalau sudah login → lanjut
  return NextResponse.next();
}

// Tentukan halaman mana yang butuh proteksi
export const config = {
  matcher: ["/dashboard", "/order"], // bisa array untuk banyak path
};
