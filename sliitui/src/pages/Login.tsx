import { type FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { ApiError } from "@/src/api/client";
import { useAuth } from "@/src/features/auth/AuthProvider";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();
  const googleButtonContainerRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasGoogleClientId = Boolean(GOOGLE_CLIENT_ID?.trim());

  useEffect(() => {
    if (!hasGoogleClientId || !googleButtonContainerRef.current) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!window.google?.accounts?.id || !googleButtonContainerRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (!response.credential) {
            setError("Google sign-in token was not provided.");
            return;
          }

          try {
            await googleLogin(response.credential);
            const nextPath =
              location.state && typeof location.state === "object" && "from" in location.state
                ? String((location.state as { from?: string }).from ?? "/dashboard")
                : "/dashboard";
            navigate(nextPath, { replace: true });
          } catch (requestError) {
            setError(requestError instanceof ApiError ? requestError.message : "Google sign-in failed.");
          }
        },
      });

      googleButtonContainerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
        type: "standard",
        theme: "outline",
        text: "signin_with",
        shape: "pill",
        width: 280,
      });
    };

    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [googleLogin, hasGoogleClientId, location.state, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      const nextPath =
        location.state && typeof location.state === "object" && "from" in location.state
          ? String((location.state as { from?: string }).from ?? "/dashboard")
          : "/dashboard";
      navigate(nextPath, { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20">
      <div className="w-full max-w-xl">
        <section className="rounded-[2rem] border border-white/8 bg-surface-low p-8 md:p-12 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-primary/70 mb-4 text-center">Operator access</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-on-surface leading-tight text-center">
            Sign in to run the archive from your own dashboard.
          </h1>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Email</span>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  className="w-full rounded-2xl border border-white/8 bg-background pl-12 pr-4 py-4 outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@sliit.local"
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">Password</span>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  className="w-full rounded-2xl border border-white/8 bg-background pl-12 pr-4 py-4 outline-none transition-all focus:ring-2 focus:ring-primary/20"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              className="w-full inline-flex min-w-60 items-center justify-center rounded-2xl bg-primary px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-background transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Enter dashboard"}
            </button>

            <div className="pt-2 text-center">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-secondary">Or continue with</p>
              <div className="rounded-2xl border border-white/10 bg-background/30 p-4 flex justify-center">
                <div ref={googleButtonContainerRef} className="min-h-10" />
                {!hasGoogleClientId ? (
                  <p className="mt-2 text-xs text-amber-200">
                    Google login is currently unavailable.
                  </p>
                ) : null}
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
