import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.autisense.ai";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/professionals", "/community", "/support"],
        disallow: [
          "/dashboard/",
          "/screening/",
          "/results/",
          "/profile/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
