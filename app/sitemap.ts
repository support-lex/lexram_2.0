import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lexram.ai'
  const lastModified = new Date()

  // ── Public marketing pages ──────────────────────────────────────────
  const publicPages = [
    { url: '', priority: 1, changeFrequency: 'weekly' as const },
    { url: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/features', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/faq', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/careers', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/blog', priority: 0.9, changeFrequency: 'daily' as const },
    { url: '/sign-in', priority: 0.9, changeFrequency: 'monthly' as const },
    { url: '/reset-password', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/terms', priority: 0.5, changeFrequency: 'yearly' as const },
    { url: '/privacy', priority: 0.5, changeFrequency: 'yearly' as const },
    { url: '/cookies', priority: 0.4, changeFrequency: 'yearly' as const },
    { url: '/refund-policy', priority: 0.5, changeFrequency: 'yearly' as const },
    { url: '/bare-acts-library', priority: 0.8, changeFrequency: 'weekly' as const },
    { url: '/acts', priority: 0.7, changeFrequency: 'weekly' as const },
    // ── Practice areas ──────────────────────────────────────────────
    { url: '/practice/bail-application-drafting', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/practice/writ-petition-drafting', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/practice/legal-notice-drafting', priority: 0.8, changeFrequency: 'weekly' as const },
    // ── Payment ──────────────────────────────────────────────────────
    { url: '/payment/success', priority: 0.4, changeFrequency: 'monthly' as const },
    // ── TSR landing ──────────────────────────────────────────────────
    { url: '/title-scrutiny-report', priority: 0.9, changeFrequency: 'weekly' as const },
  ]

  return publicPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
