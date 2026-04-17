import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | into.tax',
  description: 'Long-form analysis on UK tax intelligence and accountancy governance.',
}

export const revalidate = 60

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  author: string
  pdf_url: string
  published_at: string
}

async function getPosts(): Promise<BlogPost[]> {
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, author, pdf_url, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
  if (error) {
    console.error('Blog list fetch error:', error)
    return []
  }
  return data ?? []
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogIndexPage() {
  const posts = await getPosts()

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12 border-b border-neutral-200 pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">into.tax</p>
        <h1 className="mt-2 font-serif text-4xl">Blog</h1>
        <p className="mt-3 text-neutral-600">
          Long-form analysis on UK tax intelligence, accountancy governance, and
          the forces reshaping practice.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-neutral-500">No posts yet. Check back soon.</p>
      ) : (
        <ul className="space-y-10">
          {posts.map((post) => (
            <li key={post.id} className="group">
              <Link href={`/blog/${post.slug}`} className="block">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  {formatDate(post.published_at)} &middot; {post.author}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-neutral-900 group-hover:text-[#c9a84c]">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 text-neutral-600">{post.excerpt}</p>
                )}
                <span className="mt-3 inline-block text-sm text-[#c9a84c]">
                  Read &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-20 border-t border-neutral-200 pt-6">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
          &larr; Back to into.tax
        </Link>
      </footer>
    </main>
  )
}
