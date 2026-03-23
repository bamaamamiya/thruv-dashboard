"use client";
import { auth } from "@/lib/firebaseClient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { user, loading } = useAuth(); // 🔥 ambil status user
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // kalau udah login, langsung lempar ke "/"
  useEffect(() => {
    if (!loading && user) {
      router.replace("/"); // replace biar gak bisa back ke /login
    }
  }, [user, loading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <div className="text-center mt-10">Checking session...</div>;
  if (user) return null; // biar gak render form pas udah login

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-black px-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-50 dark:bg-neutral-900 p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-800 dark:text-white">
          Welcome Back 👋
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 p-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-neutral-800 p-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 transition duration-200"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
