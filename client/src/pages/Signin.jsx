import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContext"; // adjust path if needed

const api_url = "https://job-tracker-ya9s.onrender.com/api";

const demoCredentials = [
  { key: "email", label: "Email", value: "grey.4e2@gmail.com" },
  { key: "password", label: "Password", value: "Grey@123" },
];

const inputClass =
  "w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 transition-colors duration-200 " +
  "bg-white text-gray-800 border-gray-200 placeholder-gray-300 focus:ring-gray-300 " +
  "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500 dark:focus:ring-gray-500 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const Signin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null); // "email" | "password" | null
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCopy = async (key, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // If login is slow (Render cold start), let the user know why
    let wakeToastId = null;
    const wakeTimer = setTimeout(() => {
      wakeToastId = toast.info(
        "Server is waking up, this can take a minute on first visit…",
        0
      );
    }, 5000);

    try {
      const response = await fetch(`${api_url}/user/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error || data?.message || "Sign in failed. Try again.");
        return;
      }

      const token = data?.data?.token;
      if (!token) {
        toast.error("Unexpected response from the server. Try again.");
        return;
      }

      sessionStorage.setItem("token", token);
      toast.success("Signed in successfully.");
      navigate("/dashboard"); // toast lives at app root, so it persists across pages
    } catch (err) {
      console.error(err);
      toast.error("Can't reach the server. Check your connection and try again.");
    } finally {
      clearTimeout(wakeTimer);
      if (wakeToastId) toast.dismiss(wakeToastId);
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-6 px-8 w-120 shadow-sm transition-colors duration-200">

        {/* Header */}
        <div className="flex flex-row mb-2">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 transition-colors duration-200">
            <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-base font-medium text-gray-800 dark:text-gray-100">Sign in</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Welcome back</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 tracking-wide">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              disabled={loading}
              className={inputClass}
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-gray-400 dark:text-gray-500 hover:underline hover:opacity-80 transition-opacity duration-200"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 text-sm font-medium py-2.5 rounded-lg transition-opacity duration-200 cursor-pointer flex items-center justify-center gap-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-5">
          No account?{" "}
          <Link
            to="/signup"
            className="text-gray-700 dark:text-gray-200 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>

      {/* Demo credentials */}
      <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm px-3 py-2.5 w-56 transition-colors duration-200">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Demo account</p>
        <div className="space-y-1">
          {demoCredentials.map(({ key, label, value }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleCopy(key, value)}
              className="w-full flex items-center justify-between gap-2 text-left px-2 py-1 rounded-md hover:bg-gray-500/10 transition-colors duration-200 ease-in-out cursor-pointer group"
            >
              <span className="min-w-0">
                <span className="block text-[10px] text-gray-400 dark:text-gray-500">{label}</span>
                <span className="block text-xs text-gray-700 dark:text-gray-200 font-mono truncate">{value}</span>
              </span>
              {copied === key ? (
                <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity duration-200 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Signin;