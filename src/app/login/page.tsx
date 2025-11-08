"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    if (userId.trim()) {
      login(userId); // Set the session ID as the user ID
      router.push("/"); // Redirect to the home page
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>
        <input
          type="text"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border p-2 w-full"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white p-2 w-full"
        >
          Login
        </button>
      </div>
    </div>
  );
}
