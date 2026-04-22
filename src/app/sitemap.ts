import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE = 'https://daraa.sa';
  const now = new Date().toISOString();
  return [
    { url: `${BASE}/`,     lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/chat`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
