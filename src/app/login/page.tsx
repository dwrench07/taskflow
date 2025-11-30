"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/data";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setError("");
    if (userId.trim()) {
      setIsLoading(true);
      try {
        const user = await getUser(userId);
        if (user) {
          // Store user ID in localStorage for future API calls
          console.log('Storing userId in localStorage:', userId);
          localStorage.setItem('userId', userId);
          login(userId); // Set the session ID as the user ID
          router.push("/"); // Redirect to the home page
        } else {
          setError("Invalid User ID. Please try again.");
        }
      } catch (err) {
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="space-y-4 w-full max-w-md px-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <input
          type="text"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border p-2 w-full rounded"
          disabled={isLoading}
        />
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`bg-blue-500 text-white p-2 w-full rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  );
}
