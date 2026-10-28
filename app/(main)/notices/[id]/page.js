import { notFound } from "next/navigation";
import NoticeDetail from "@/components/NoticeDetail";
import JsonLd from "@/components/JsonLd";
import { getNotice } from "@/lib/publicData";
import { OG_BASE, SITE, abs } from "@/lib/site";

export const revalidate = 60;

const headlineOf = (n) =>
  n.subject ? `${n.title} — ${n.subject}` : n.title || "নোটিশ";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const n = await getNotice(id);
  if (!n) return { title: "নোটিশ পাওয়া যায়নি", robots: { index: false } };

  const title = headlineOf(n);
  const description = n.excerpt || `ইসলামপুর জামে মসজিদের নোটিশ - ${n.date}`;
  return {
    title,
    description,
    alternates: { canonical: `/notices/${id}` },
    openGraph: {
      ...OG_BASE,
      type: "article",
      url: `/notices/${id}`,
      title,
      description,
      publishedTime: n.createdAt || n.date,
      modifiedTime: n.updatedAt || n.date,
    },
  };
}

export default async function NoticePage({ params }) {
  const { id } = await params;
  const notice = await getNotice(id);
  if (!notice) notFound(); // a real 404, so Google drops deleted notices

  const url = abs(`/notices/${id}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: headlineOf(notice).slice(0, 110),
        description: notice.excerpt || undefined,
        datePublished: notice.createdAt || notice.date,
        dateModified: notice.updatedAt || notice.date,
        inLanguage: "bn",
        mainEntityOfPage: url,
        image: [abs(SITE.image)],
        author: { "@id": abs("/#mosque") },
        publisher: {
          "@type": "Organization",
          name: SITE.name,
          logo: { "@type": "ImageObject", url: abs(SITE.logo) },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: abs("/") },
          {
            "@type": "ListItem",
            position: 2,
            name: "নোটিশ বোর্ড",
            item: abs("/notices"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: headlineOf(notice),
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <NoticeDetail id={id} initialNotice={notice} />
    </>
  );
}
