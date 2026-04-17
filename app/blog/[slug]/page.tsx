import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const dynamicParams = true

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

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, author, pdf_url, published_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) {
    console.error('Blog post fetch error:', error)
    return null
  }
  return data
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not found | into.tax' }
  return {
    title: `${post.title} | into.tax`,
    description: post.excerpt ?? undefined,
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="mb-6 text-sm text-neutral-500">
        <Link href="/" className="hover:text-neutral-800">into.tax</Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-neutral-800">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-700">{post.title}</span>
      </nav>

      <header className="mb-6">
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">{post.title}</h1>
        {post.excerpt && <p className="mt-3 text-neutral-600">{post.excerpt}</p>}
        <p className="mt-4 text-xs uppercase tracking-wider text-neutral-500">
          {post.author} &middot; {formatDate(post.published_at)}
        </p>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <a href={post.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#c9a84c] hover:underline">
          Open PDF in new tab &rarr;
        </a>
        <a href={post.pdf_url} download className="text-sm text-neutral-600 hover:text-neutral-900">
          Download &darr;
        </a>
      </div>

      <div className="overflow-hidden rounded border border-neutral-200 bg-neutral-50">
        <iframe src={post.pdf_url} title={post.title} className="h-[80vh] w-full" />
      </div>

      <footer className="mt-12 border-t border-neutral-200 pt-6">
        <Link href="/blog" className="text-sm text-neutral-500 hover:text-neutral-800">
          &larr; All posts
        </Link>
      </footer>
    </main>
  )
}
