export const dynamic = "force-dynamic";

import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";
import { BLOG_ARTICLES } from "@/lib/blog/articles";

export default function ResourcesPage() {
  return (
    <MarketingChrome>
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Resources</p>
        <h1 className="mt-2 text-3xl font-semibold text-[#0F2A4A]">EU AI Act notes for practitioners</h1>
        <p className="mt-3 text-sm text-slate-600">
          Short, accurate primers grounded in Regulation (EU) 2024/1689. No fabricated market statistics. Not legal advice.
        </p>
        <ul className="mt-8 space-y-4">
          {BLOG_ARTICLES.map((a) => (
            <li key={a.slug} className="card p-5">
              <div className="text-xs text-slate-500">
                {a.publishedAt} · {a.readingMinutes} min · {a.tags.join(" · ")}
              </div>
              <Link href={`/resources/${a.slug}`} className="mt-1 block text-lg font-semibold text-[#0F2A4A] hover:text-sky-800">
                {a.title}
              </Link>
              <p className="mt-2 text-sm text-slate-600">{a.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </MarketingChrome>
  );
}
