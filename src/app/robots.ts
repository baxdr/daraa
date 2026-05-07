import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/scan/', '/establishment/', '/documents/'],
      },
    ],
    sitemap: 'https://daraa.sa/sitemap.xml',
  };
}
