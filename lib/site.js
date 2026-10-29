// One place for the facts about the mosque. Everything SEO-related reads from here.
export const SITE = {
  url: "https://www.islampurjamemasjid.org",
  name: "ইসলামপুর জামে মসজিদ",
  nameEn: "Islampur Jame Masjid",
  shortDescription:
    "ইসলামপুর জামে মসজিদ, দুধমুখা বাজার, দাগনভূঞা, ফেনী। আজকের নামাজের সময়সূচি, নোটিশ বোর্ড ও অনলাইনে চাঁদা পরিশোধ।",
  founded: "1940",
  address: {
    street: "দুধমুখা",
    locality: "দাগনভূঞা",
    region: "ফেনী",
    country: "BD",
  },

  geo: {
    lat: 22.8937523,
    lng: 91.2605779,
  },
  phone: "+8801789521852",
  image: "/mosque.jpg",
  logo: "/logo.jpg",
  sameAs: ["https://www.facebook.com/islampur.masjid"],
};

export const OG_IMAGES = [
  { url: "/mosque.jpg", width: 1195, height: 896, alt: "ইসলামপুর জামে মসজিদ" },
];

// Shared by every page that sets its own `openGraph`.
export const OG_BASE = {
  type: "website",
  locale: "bn_BD",
  siteName: SITE.name,
  images: OG_IMAGES,
};

export const abs = (path = "") => `${SITE.url}${path}`;

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${SITE.geo.lat},${SITE.geo.lng}`;

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": abs("/#website"),
        url: abs("/"),
        name: SITE.name,
        alternateName: [SITE.nameEn, "Islampur Masjid Dagonbhuiyan"],
        inLanguage: "bn",
        publisher: { "@id": abs("/#mosque") },
      },
      {
        "@type": "Mosque",
        "@id": abs("/#mosque"),
        name: SITE.name,
        alternateName: [SITE.nameEn, "Islampur Jame Masjid, Dudmukha, Feni"],
        description: SITE.shortDescription,
        url: abs("/"),
        image: [abs("/mosque.jpg"), abs("/mosque-2.jpg"), abs("/mosque-3.jpg")],
        logo: abs(SITE.logo),
        telephone: SITE.phone,
        foundingDate: SITE.founded,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.locality,
          addressRegion: SITE.address.region,
          addressCountry: SITE.address.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: SITE.geo.lat,
          longitude: SITE.geo.lng,
        },
        hasMap: mapsUrl,
        areaServed: "দাগনভূঞা, ফেনী",
        sameAs: SITE.sameAs,
      },
    ],
  };
}
