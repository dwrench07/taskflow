"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (email.trim() && password.trim() && name.trim()) {
            setIsLoading(true);
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    login(data.user); // Set the session
                    router.push("/"); // Redirect to the home page
                } else {
                    const errData = await response.json();
                    setError(errData.error || "Failed to create account. Please try again.");
                }
            } catch (err) {
                setError("An error occurred. Please try again.");
            } finally {
                setIsLoading(false);
            }
        } else {
            setError("Please fill in all required fields.");
        }
    };

    const inputClass = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background transition-colors placeholder:text-muted-foreground hover:border-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 flex flex-col items-center text-center">
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-lg font-bold text-primary-foreground ring-1 ring-primary/30">
                        D
                    </span>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">Start organizing with Dash</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    {error && (
                        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="text-sm font-medium text-foreground">Full name</label>
                            <input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} disabled={isLoading} required />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                            <input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} disabled={isLoading} required />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                            <input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} disabled={isLoading} required minLength={6} />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isLoading ? 'Creating account…' : 'Sign up'}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
