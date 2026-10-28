import { SITE, abs } from "@/lib/site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/adminSignin"],
      },
    ],
    sitemap: abs("/sitemap.xml"),
    host: SITE.url,
  };
}
