import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <p className="text-white font-bold text-lg mb-3">🪈 Maa Flutes</p>
            <p className="text-sm leading-relaxed">
              Handcrafted Indian classical flutes, music tools, and learning
              resources for every level of player.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white font-semibold mb-4">Explore</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/shop", label: "Shop" },
                { href: "/blog", label: "Blog" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="hover:text-amber-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-white font-semibold mb-4">Account</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/login", label: "Sign in" },
                { href: "/register", label: "Create account" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="hover:text-amber-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 text-xs text-center">
          © {new Date().getFullYear()} Maa Flutes. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
