"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import type { AppTheme } from "@/types/theme";

interface PrivacyPolicyContentProps {
  content: string;
  theme: Partial<AppTheme>;
  siteTitle: string;
}

export function PrivacyPolicyContent({
  content,
  theme,
  siteTitle,
}: PrivacyPolicyContentProps) {
  const primary = theme.primaryColor ?? "#4a6b5a";
  const bg = theme.background ?? "#0d1f18";
  const fontFamily = theme.fontFamily ?? "var(--font-sans)";
  const isBgImage = typeof bg === "string" && bg.startsWith("http");

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        background: isBgImage ? `url(${bg}) center/cover` : bg,
        fontFamily,
      }}
    >
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <Link
          href="/"
          className="inline-block text-sm text-white/60 hover:text-white/90 mb-8"
          style={{ color: primary }}
        >
          ← Back to {siteTitle}
        </Link>
        <article
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white/95 prose-headings:mt-10 prose-headings:mb-4
            prose-p:text-white/85 prose-p:my-3
            prose-li:text-white/85 prose-li:my-1
            prose-hr:my-8 prose-hr:border-white/20
            prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a
                  href={href ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline"
                >
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
