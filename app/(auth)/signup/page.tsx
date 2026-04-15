"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  const handleGoogleSignup = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-[420px] bg-background-secondary border border-[rgba(255,255,255,0.06)] rounded-2xl p-10 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8 text-xl font-bold">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center font-extrabold text-[#f0f0f5]">F</div>
          <span>
            Fluent<span className="gradient-text">Mind</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Create your account</h1>
        <p className="text-center text-[#a0a0b5] text-base mb-8">
          Start your journey to fluent English speaking
        </p>

        <button
          className="flex items-center justify-center gap-3 w-full px-5 py-3 bg-background-tertiary border border-[rgba(255,255,255,0.1)] rounded-xl font-semibold text-base text-[#f0f0f5] cursor-pointer transition-all duration-150 hover:bg-background-elevated hover:border-[rgba(255,255,255,0.16)]"
          onClick={handleGoogleSignup}
          type="button"
          id="google-signup-btn"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 my-4 text-[#6b6b80] text-sm before:content-[''] before:flex-1 before:h-[1px] before:bg-[rgba(255,255,255,0.06)] after:content-[''] after:flex-1 after:h-[1px] after:bg-[rgba(255,255,255,0.06)]">or</div>

        {error && <div className="px-4 py-3 bg-[rgba(244,63,94,0.08)] border border-[rgba(244,63,94,0.15)] rounded-md text-danger-400 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="input-wrapper">
            <label className="input-label" htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              type="text"
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-wrapper">
            <label className="input-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-wrapper">
            <label className="input-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            id="signup-submit-btn"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-[#a0a0b5]">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-400 font-semibold">Log in</Link>
        </div>
      </div>
    </div>
  );
}
