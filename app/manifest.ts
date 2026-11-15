import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Home ❤️ Cafe · Campus Cafe Ordering",
    short_name: "HomeCafe",
    description: "Sips of happiness in every cup. Order drinks and fries ahead of your campus break.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
