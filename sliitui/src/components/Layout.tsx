import { type FormEvent, useEffect, useState } from "react";
import { Bell, LayoutGrid, LogOut, Menu, Search, Shield, User, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/src/features/auth/AuthProvider";
import { cn } from "@/src/lib/utils";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const [search, setSearch] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { to: "/search", label: "Browse" },
    ...(isAuthenticated ? [{ to: "/dashboard", label: "My Uploads" }] : []),
    ...(user?.role === "moderator" || user?.role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/search${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
    setIsMenuOpen(false);
  }

  return (
    <nav className="fixed top-0 z-50 w-full glass-header">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-lg font-black tracking-tighter text-primary sm:text-xl">
              <LayoutGrid className="h-6 w-6 fill-primary" />
              <span>SLIIT Archive</span>
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "border-b-2 border-transparent pb-1 text-sm font-medium transition-colors hover:text-primary",
                      isActive || location.pathname === item.to ? "border-primary text-primary" : "text-secondary",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="mx-6 hidden max-w-md flex-1 lg:block">
            <form className="relative group" onSubmit={handleSearch}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
              <input
                className="w-full rounded-xl border border-white/5 bg-surface-low py-2 pl-10 pr-4 text-sm transition-all placeholder:text-secondary/50 focus:ring-2 focus:ring-primary/20"
                placeholder="Search documents, modules..."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="hidden text-secondary transition-colors hover:text-primary sm:inline-flex" type="button">
              <Bell className="h-5 w-5" />
            </button>

            {isAuthenticated ? (
              <>
                <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-surface-low px-3 py-2 xl:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-surface-high">
                    {user?.role === "admin" || user?.role === "moderator" ? (
                      <Shield className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-on-surface">{user?.full_name || user?.email}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-secondary">{user?.role}</p>
                  </div>
                </div>

                <button
                  className="hidden text-secondary transition-colors hover:text-primary md:inline-flex"
                  type="button"
                  onClick={() => void logout()}
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-background transition-all hover:brightness-110 active:scale-95 sm:px-5 sm:py-2.5"
              >
                <User className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}

            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-surface-low text-secondary transition-colors hover:text-primary md:hidden"
              type="button"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div className="mt-4 rounded-[1.75rem] border border-white/8 bg-surface-low p-4 shadow-2xl md:hidden">
            <form className="relative" onSubmit={handleSearch}>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
              <input
                className="w-full rounded-xl border border-white/5 bg-background/70 py-3 pl-10 pr-4 text-sm transition-all placeholder:text-secondary/50 focus:ring-2 focus:ring-primary/20"
                placeholder="Search documents, modules..."
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </form>

            <div className="mt-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "block rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors",
                      isActive || location.pathname === item.to
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-white/5 bg-background/40 text-on-surface",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="mt-4 rounded-2xl border border-white/5 bg-background/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface-high">
                    {user?.role === "admin" || user?.role === "moderator" ? (
                      <Shield className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{user?.full_name || user?.email}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-secondary">{user?.role}</p>
                  </div>
                </div>

                <button
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary/30 hover:text-primary"
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void logout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </nav>
  );
}

export function Footer() {
  const footerLinks = [
    { to: "/about", label: "About SLIIT" },
    { to: "/guidelines", label: "Library Guidelines" },
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/support", label: "Contact Support" },
    { to: "/terms", label: "Terms of Use" },
  ];

  return (
    <footer className="mt-auto w-full border-t border-white/5 bg-surface-low py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-8 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <span className="text-lg font-bold text-primary">SLIIT Archive</span>
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-secondary md:text-left">
            Copyright 2026 SLIIT Archive. All university rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-xs font-semibold uppercase tracking-wider text-secondary transition-all hover:text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
