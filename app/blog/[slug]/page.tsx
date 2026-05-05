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
  body: string | null
  author: string
  author_slug: string | null
  pdf_url: string
  published_at: string
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, body, author, author_slug, pdf_url, published_at')
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
    title: post.title + ' | into.tax',
    description: post.excerpt ?? undefined,
  }
}

function formatDate(iso: string) {
  return new Date(iso)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase()
}

function splitAuthor(author: string) {
  const parts = author.split(',').map((p) => p.trim())
  return {
    name: parts[0] || author,
    credentials: parts.slice(1).join(', '),
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const { name, credentials } = splitAuthor(post.author)
  const paragraphs = post.body
    ? post.body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : []

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
      <nav className="mb-10">
        <Link
          href="/blog"
          className="text-xs uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-800"
        >
          &larr; All posts
        </Link>
      </nav>
      <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[#c9a84c]">
        Guest Voice
      </p>
      <h1 className="font-serif text-3xl leading-tight text-neutral-900 sm:text-4xl md:text-5xl">
        {post.title}
      </h1>
      {post.excerpt && (
        <p className="mt-6 font-serif text-xl leading-relaxed text-neutral-700 sm:text-2xl">
          {post.excerpt}
        </p>
      )}
      <div className="mt-8 border-y border-neutral-200 py-4 text-sm">
        <p className="text-neutral-900">
          <span className="font-medium">
            By{' '}
            {post.author_slug ? (
              <Link
                href={`/authors/${post.author_slug}`}
                className="underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-700 hover:text-neutral-700"
              >
                {name}
              </Link>
            ) : (
              name
            )}
          </span>
        </p>
        {credentials && (
          <p className="mt-0.5 text-neutral-600">{credentials}</p>
        )}
        <p className="mt-2 text-xs uppercase tracking-wider text-neutral-500">
          {formatDate(post.published_at)}
        </p>
      </div>
      {paragraphs.length > 0 ? (
        <article className="mt-10 font-serif text-lg leading-relaxed text-neutral-900">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-7xl first-letter:font-semibold first-letter:leading-none first-letter:text-neutral-900'
                  : 'mt-5'
              }
            >
              {p}
            </p>
          ))}
        </article>
      ) : (
        <div className="mt-10 overflow-hidden rounded border border-neutral-200 bg-neutral-50">
          <iframe
            src={post.pdf_url}
            title={post.title}
            className="h-[80vh] w-full"
          />
        </div>
      )}
      {post.pdf_url && (
        <aside className="mt-12 border-t border-neutral-200 pt-6">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Original document
          </p>
          <a
            href={post.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-[#c9a84c] hover:underline"
          >
            Download the original as a PDF &darr;
          </a>
        </aside>
      )}
      <footer className="mt-16 border-t border-neutral-200 pt-6">
        <Link
          href="/blog"
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          &larr; All posts
        </Link>
      </footer>
    </main>
  )
}
