"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearShopifyCustomerTokenCookie } from "@/lib/shopify/customer";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/courses", label: "Courses" },
  { href: "/blog", label: "Blog" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function MobileNav({
  initialUser = null,
}: {
  initialUser?: User | null;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  // Seeded from the server-rendered layout so first paint already reflects
  // the correct auth state on refresh.
  const [user, setUser] = useState<User | null>(initialUser);
  const [isSigningOut, startSignOut] = useTransition();

  useEffect(() => {
    // Reconcile in case the session changed between server render and hydration
    // (e.g. signed out in another tab).
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  function handleLogout() {
    startSignOut(async () => {
      clearShopifyCustomerTokenCookie();
      await supabase.auth.signOut({ scope: "local" });
      setOpen(false);
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden p-2 text-stone-700"
      >
        <MenuIcon />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <span className="font-bold text-lg text-stone-900">Maa Flutes</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="p-1 text-stone-500"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="px-4 py-6 space-y-1" aria-label="Primary">
          {navLinks.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 rounded-xl font-medium transition-colors ${
                  active
                    ? "bg-amber-50 text-amber-700"
                    : "text-stone-700 hover:bg-amber-50 hover:text-amber-700"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-6 border-t border-stone-100">
          {user ? (
            <div className="space-y-3">
              <p className="text-xs text-stone-500 truncate text-center">
                {user.email}
              </p>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block w-full py-3 text-center border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 transition-colors"
              >
                My courses
              </Link>
              <button
                onClick={handleLogout}
                disabled={isSigningOut}
                className="block w-full py-3 text-center text-red-600 font-semibold rounded-xl border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block w-full py-3 text-center bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
