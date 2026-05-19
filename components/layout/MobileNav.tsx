"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearShopifyCustomerTokenCookie } from "@/lib/shopify/customer";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/courses", label: "Courses" },
  { href: "/online-classes", label: "Online Classes" },
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
  const [user, setUser] = useState<User | null>(initialUser);
  const [isSigningOut, startSignOut] = useTransition();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

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
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-stone-700 hover:bg-stone-100 active:bg-stone-200 transition-colors"
      >
        <MenuIcon />
      </button>

      {/* Overlay — always rendered so it can fade in/out.
          Use w-screen/h-screen instead of inset-0 because backdrop-blur on
          the parent <header> creates a new containing block for fixed elements,
          making bottom/right offsets resolve against the header (64 px) not the
          viewport. Viewport units are immune to this quirk. */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed top-0 left-0 w-screen h-screen bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed top-0 left-0 h-screen w-[min(80vw,320px)] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <span className="font-bold text-lg text-stone-900">🪈 Maa Flutes</span>
          <button
            ref={closeButtonRef}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex items-center justify-center w-11 h-11 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-700 active:bg-stone-200 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav links — scrollable if content overflows */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5"
          aria-label="Primary"
        >
          {navLinks.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center px-4 py-3.5 rounded-xl font-medium text-base transition-colors ${
                  active
                    ? "bg-amber-50 text-amber-700"
                    : "text-stone-700 hover:bg-stone-50 hover:text-amber-700 active:bg-amber-50 active:text-amber-700"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Auth section — pinned to bottom, never overlaps nav */}
        <div
          className="px-4 pt-4 pb-6 border-t border-stone-100 shrink-0"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {user ? (
            <div className="space-y-3">
              <p className="text-xs text-stone-500 truncate text-center">
                {user.email}
              </p>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex w-full py-3 items-center justify-center border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors"
              >
                My Courses
              </Link>
              <button
                onClick={handleLogout}
                disabled={isSigningOut}
                className="w-full py-3 text-center text-red-600 font-semibold rounded-xl border border-red-200 hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {isSigningOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex w-full py-3.5 items-center justify-center bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 active:bg-amber-800 transition-colors"
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
      aria-hidden="true"
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
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
