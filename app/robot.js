export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/pay-slip/"],
      },
    ],
    sitemap: "https://www.islampurjamemasjid.org/sitemap.xml",
  };
}
