import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getEverySpotlight, slugifyName } from '@/lib/queries'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    'https://ibktckdphhwjnmvzwssu.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'
  )

  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://into.tax', lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: 'https://into.tax/blog', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: 'https://into.tax/spotlight', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ]

  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('slug, published_at')
    .not('published_at', 'is', null)

  const blogUrls: MetadataRoute.Sitemap = (blogPosts || []).map(post => ({
    url: `https://into.tax/blog/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Every spotlight profile ever featured gets a permanent indexable URL.
  // Uses the shared slugifyName helper to stay in sync with the route handler.
  const allSpotlights = await getEverySpotlight()
  const spotlightUrls: MetadataRoute.Sitemap = allSpotlights.map(s => ({
    url: `https://into.tax/spotlight/${slugifyName(s.person_name)}`,
    lastModified: s.issue_date ? new Date(s.issue_date) : new Date(),
    changeFrequency: 'yearly',
    priority: 0.7,
  }))

  return [...staticPages, ...blogUrls, ...spotlightUrls]
}
