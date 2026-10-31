import { MdCampaign } from "react-icons/md";
import PageBanner from "@/components/PageBanner";
import { NoticeCard } from "@/components/NoticeBoard";
import JsonLd from "@/components/JsonLd";
import { getNoticeList } from "@/lib/publicData";
import { OG_BASE, SITE, abs } from "@/lib/site";

export const revalidate = 60;

export const metadata = {
  title: "নোটিশ বোর্ড",
  description:
    "ইসলামপুর জামে মসজিদ, দাগনভূঞা, ফেনী-এর সর্বশেষ নোটিশ ও ঘোষণা সমূহ।",
  alternates: { canonical: "/notices" },
  openGraph: {
    ...OG_BASE,
    url: "/notices",
    title: "নোটিশ বোর্ড | ইসলামপুর জামে মসজিদ",
    description: "ইসলামপুর জামে মসজিদের সর্বশেষ নোটিশ ও ঘোষণা।",
  },
};

export default async function NoticesPage() {
  const notices = await getNoticeList(100);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "নোটিশ বোর্ড",
    url: abs("/notices"),
    isPartOf: { "@id": abs("/#website") },
    inLanguage: "bn",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: abs("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "নোটিশ বোর্ড",
          item: abs("/notices"),
        },
      ],
    },
  };

  return (
    <div className="bg-[#f7f5ef] min-h-screen">
      <JsonLd data={jsonLd} />
      <PageBanner
        title="নোটিশ বোর্ড"
        subtitle="ইসলামপুর জামে মসজিদের সর্বশেষ নোটিশ ও ঘোষণা"
        icon={<MdCampaign className="mx-auto mb-1 text-3xl text-amber-300" />}
      />
      <div className="relative z-10 max-w-3xl px-4 pt-6 pb-10 mx-auto">
        {notices.length === 0 && (
          <p className="py-10 text-center text-slate-500">
            এখনো কোনো নোটিশ নেই।
          </p>
        )}
        <div className="space-y-3">
          {notices.map((n) => (
            <NoticeCard key={n._id} notice={n} />
          ))}
        </div>
      </div>
    </div>
  );
}
