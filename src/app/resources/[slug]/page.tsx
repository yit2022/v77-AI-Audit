export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing-chrome";
import { BLOG_ARTICLES, getArticle } from "@/lib/blog/articles";
import { COMPANY } from "@/lib/company";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }));
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function inline(s: string) {
  return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  };
  for (const line of lines) {
    if (line.startsWith("# ")) {
      closeLists();
      out.push(`<h1 class="text-3xl font-semibold text-[#0F2A4A] mt-2">${esc(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      closeLists();
      out.push(`<h2 class="text-xl font-semibold text-[#0F2A4A] mt-8">${esc(line.slice(3))}</h2>`);
    } else if (line.startsWith("- ")) {
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push('<ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">'); inUl = true; }
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push('<ol class="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">'); inOl = true; }
      out.push(`<li>${inline(line.replace(/^\d+\.\s/, ""))}</li>`);
    } else if (!line.trim()) {
      closeLists();
    } else {
      closeLists();
      out.push(`<p class="mt-3 text-sm leading-relaxed text-slate-700">${inline(line)}</p>`);
    }
  }
  closeLists();
  return out.join("\n");
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const html = renderMarkdown(article.body);
  return (
    <MarketingChrome>
      <article className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <Link href="/resources" className="text-sm font-semibold text-sky-700 hover:underline">
          ← Resources
        </Link>
        <p className="mt-4 text-xs text-slate-500">
          {article.publishedAt} · {article.readingMinutes} min read · {COMPANY.productName}
        </p>
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <p className="mt-10 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-[#0F2A4A]">
          Ready to operationalise this?{" "}
          <Link href="/#risk-checker" className="font-semibold text-sky-800 hover:underline">
            Run the risk tier checker
          </Link>{" "}
          or{" "}
          <Link href="/#request-pilot" className="font-semibold text-sky-800 hover:underline">
            request a pilot
          </Link>
          .
        </p>
      </article>
    </MarketingChrome>
  );
}
