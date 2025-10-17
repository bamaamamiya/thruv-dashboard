"use client";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { FiCheckCircle, FiAlertCircle, FiLogOut, FiRefreshCcw } from "react-icons/fi";

export default function WhatsAppPage() {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [loggedIn, setLoggedIn] = useState(false);

  const fetchStatusAndQr = async () => {
    try {
      const statusRes = await fetch(`${process.env.NEXT_PUBLIC_WA_API}/status`);
      const statusData = await statusRes.json();

      if (statusData.loggedIn) {
        setLoggedIn(true);
        setQr(null);
        setStatus("✅ WhatsApp Aktif");
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_WA_API}/logout`, { method: "POST" });
      const data = await res.json();
      console.log(data.message);
      setLoggedIn(false);
      setStatus("✅ Logout berhasil, scan QR untuk login ulang");
      fetchStatusAndQr();
    } catch (err) {
      console.error("Logout gagal", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Dashboard</h1>
          <button
            onClick={fetchStatusAndQr}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Refresh Status"
          >
            <FiRefreshCcw className="w-6 h-6" />
          </button>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md dark:shadow-gray-700 p-6 flex flex-col items-center space-y-4 transition-colors duration-300">
          <div className="flex items-center space-x-2">
            {loggedIn ? <FiCheckCircle className="text-green-500 w-6 h-6" /> : <FiAlertCircle className="text-yellow-400 w-6 h-6" />}
            <p className="font-medium text-center">{status}</p>
          </div>

          {!loggedIn && qr && (
            <div className="p-4 bg-white rounded-lg dark:bg-white">
              <QRCode value={qr} size={220} fgColor="#000" bgColor="#fff" />
            </div>
          )}

          {loggedIn && (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors space-x-2"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          )}
        </div>

        <footer className="text-center text-xs text-gray-400 dark:text-gray-500">
          WhatsApp integration powered by bama
        </footer>
      </div>
    </div>
  );
}
