import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-4xl lg:text-5xl font-black text-stone-900 mt-0 mb-6 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl lg:text-3xl font-bold text-stone-900 mt-12 mb-4">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl lg:text-2xl font-bold text-stone-900 mt-8 mb-3">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-stone-700 leading-relaxed mb-5 text-base lg:text-lg">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-5 space-y-2 text-stone-700 text-base lg:text-lg">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-5 space-y-2 text-stone-700 text-base lg:text-lg">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-amber-500 bg-amber-50 pl-5 pr-4 py-3 my-6 italic text-stone-700 rounded-r">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-stone-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children }) => (
    <code className="bg-stone-100 text-amber-700 px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  hr: () => <hr className="my-10 border-stone-200" />,
  a: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isInternal = href?.startsWith("/") ?? false;
    if (isInternal && href) {
      return (
        <Link
          href={href}
          className="text-amber-700 underline underline-offset-2 hover:text-amber-800"
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className="text-amber-700 underline underline-offset-2 hover:text-amber-800"
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    );
  },
};

export function useMDXComponents(): MDXComponents {
  return components;
}
