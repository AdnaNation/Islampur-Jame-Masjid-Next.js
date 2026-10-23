// Makes the site installable ("Add to Home screen") as an app.
export default function manifest() {
  return {
    name: "ইসলামপুর জামে মসজিদ",
    short_name: "ইসলামপুর মসজিদ",
    description: "ইসলামপুর জামে মসজিদের চাঁদা, পেমেন্ট ও হিসাব",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0f3d2e",
    lang: "bn",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
