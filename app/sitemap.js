import { abs } from "@/lib/site";
import { getNoticeList } from "@/lib/publicData";

export const revalidate = 3600;

export default async function sitemap() {
  const notices = await getNoticeList(500);
  const latest = notices[0]?.updatedAt || notices[0]?.date;

  return [
    {
      url: abs("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: abs("/notices"),
      lastModified: latest ? new Date(latest) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: abs("/pay"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...notices.map((n) => ({
      url: abs(`/notices/${n._id}`),
      lastModified: new Date(n.updatedAt || n.date),
      changeFrequency: "yearly",
      priority: 0.6,
    })),
  ];
}
