"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import UserMenu from "./UserMenu";
import CartButton from "./CartButton";
import CartDrawer from "./CartDrawer";
import MobileNav from "./MobileNav";
import NextImage from "next/image";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/courses", label: "Courses" },
  { href: "/online-classes", label: "Online Classes" },
  { href: "/loop-practice", label: "Loop Practice" },
  { href: "/blog", label: "Blog" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Header({ initialUser }: { initialUser: User | null }) {
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname() ?? "/";

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link
              href="/"
              aria-label="Maa Flutes — Home"
              className="font-bold text-xl text-stone-900 hover:text-amber-700 transition-colors shrink-0"
            >
              🪈 Maa Flutes
            </Link>

            <nav
              className="hidden md:flex items-center gap-1"
              aria-label="Primary"
            >
              {navLinks.map(({ href, label }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      active
                        ? "bg-amber-50 text-amber-700"
                        : "text-stone-600 hover:text-amber-700 hover:bg-stone-50"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <CartButton onOpen={() => setCartOpen(true)} />
              <div className="hidden md:block">
                <UserMenu initialUser={initialUser} />
              </div>
              <MobileNav initialUser={initialUser} />
            </div>
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
