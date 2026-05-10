"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { clearShopifyCustomerTokenCookie } from "@/lib/shopify/customer";

export default function UserMenu({
  initialUser = null,
}: {
  initialUser?: User | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  // Seeded from the server-rendered layout so first paint already has the
  // correct UI — no Sign-in flash on refresh.
  const [user, setUser] = useState<User | null>(initialUser);
  const [open, setOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reconcile with the live client session in case it changed since the
    // server render (e.g. another tab signed out).
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    startSignOut(async () => {
      // Sign out client-side first: this fires SIGNED_OUT on the auth listener
      // immediately, so the avatar disappears the moment the user clicks.
      clearShopifyCustomerTokenCookie();
      await supabase.auth.signOut({ scope: "local" });
      setOpen(false);
      // replace + refresh so the user can't go back to a protected page,
      // and so RSC re-renders with the now-empty session cookie.
      router.replace("/");
      router.refresh();
    });
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-stone-700 hover:text-amber-700 transition-colors"
      >
        Sign in
      </Link>
    );
  }

  const initials = user.user_metadata?.full_name
    ? (user.user_metadata.full_name as string)
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user.email?.[0].toUpperCase() ?? "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 focus:outline-none"
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="w-8 h-8 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
          {initials}
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-50"
        >
          <div className="px-4 py-2 border-b border-stone-100">
            <p className="text-xs text-stone-500 truncate">{user.email}</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            role="menuitem"
          >
            My courses
          </Link>
          <button
            onClick={handleLogout}
            disabled={isSigningOut}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-wait"
            role="menuitem"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
