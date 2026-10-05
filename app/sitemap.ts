import { MetadataRoute } from 'next'

// Sitemap uses no-store fetches for products/blogs, so it must be dynamic
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsglobaljewels.com'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/collection`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ]

  // Dynamic product pages
  let productPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${baseUrl}/api/products?limit=1000`, { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      const products = Array.isArray(data) ? data : (data?.products || [])
      productPages = products.map((product: any) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(product.updated_at || product.created_at || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) { console.error('Sitemap products error:', error) }

  // Dynamic blog pages
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${baseUrl}/api/blog`, { cache: 'no-store' })
    if (res.ok) {
      const blogs = await res.json()
      if (Array.isArray(blogs)) {
        blogPages = blogs.map((blog: any) => ({
          url: `${baseUrl}/blog/${blog.slug}`,
          lastModified: new Date(blog.published_at || Date.now()),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      }
    }
  } catch (error) { console.error('Sitemap blogs error:', error) }

  return [...staticPages, ...productPages, ...blogPages]
}
