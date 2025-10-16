"use client";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";

export default function WhatsAppPage() {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [loggedIn, setLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const fetchStatusAndQr = async () => {
    try {
      const statusRes = await fetch(`${process.env.NEXT_PUBLIC_WA_API}/status`);
      const statusData = await statusRes.json();

      if (statusData.loggedIn) {
        setLoggedIn(true);
        setQr(null);
        setStatus("✅ Sudah login");
      } else {
        setLoggedIn(false);
        setStatus("📲 Scan QR untuk login WhatsApp Bot");

        const qrRes = await fetch(`${process.env.NEXT_PUBLIC_WA_API}/qr`);
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQr(qrData.qr);
        } else if (qrRes.status === 404) {
          setQr(null);
          setStatus("✅ Sudah login, QR tidak tersedia");
        } else {
          setQr(null);
          setStatus("❌ Gagal fetch QR");
        }
      }
    } catch (err) {
      setStatus("❌ Gagal fetch status: " + err.message);
      setQr(null);
    }
  };

  useEffect(() => {
    fetchStatusAndQr();
    const interval = setInterval(fetchStatusAndQr, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_WA_API}/logout`, {
        method: "POST",
      });
      const data = await res.json();
      console.log(data.message);
      setLoggedIn(false);
      setStatus("✅ Logout berhasil, scan QR untuk login ulang");
      fetchStatusAndQr(); // ambil QR baru
    } catch (err) {
      console.error("Logout gagal", err);
    }
  };

  const bgColor = isDarkMode ? "#000" : "#fff";
  const textColor = isDarkMode ? "#E6EDF3" : "#000";
  const cardBg = isDarkMode ? "#000" : "#fff";
  const qrFgColor = isDarkMode ? "#FFFFFF" : "#000000";

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-6 transition-colors duration-300"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <h1 className="text-3xl font-bold mb-6 tracking-tight">
        WhatsApp Dashboard
      </h1>

      <div
        className="w-full max-w-sm p-6 rounded-2xl shadow-md flex flex-col items-center space-y-4 transition-colors duration-300"
        style={{ backgroundColor: cardBg }}
      >
        <p className="text-center text-sm sm:text-base">{status}</p>

        {!loggedIn && qr && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <QRCode
              value={qr}
              size={220}
              fgColor={qrFgColor}
              bgColor={cardBg}
            />
          </div>
        )}

        {loggedIn && (
          <button
            className="w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-200"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
        WhatsApp integration powered by bama
      </p>
    </div>
  );
}
