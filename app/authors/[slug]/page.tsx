import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const dynamicParams = true

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'

type AuthorBio = {
  slug: string
  name: string
  title: string | null
  organisation: string | null
  organisation_description: string | null
  bio: string
  photo_url: string | null
  external_url: string | null
}

async function getAuthor(slug: string): Promise<AuthorBio | null> {
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase
    .from('author_bios')
    .select('slug, name, title, organisation, organisation_description, bio, photo_url, external_url')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('Author bio fetch error:', error)
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
  const author = await getAuthor(slug)
  if (!author) return { title: 'Not found | into.tax' }
  return {
    title: author.name + ' | into.tax',
    description: author.title
      ? `${author.name} — ${author.title}${author.organisation ? ', ' + author.organisation : ''}`
      : author.name,
  }
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const author = await getAuthor(slug)
  if (!author) notFound()

  const paragraphs = author.bio
    ? author.bio.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
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
        Contributor
      </p>

      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        {author.photo_url && (
          <div className="shrink-0">
            <img
              src={author.photo_url}
              alt={author.name}
              className="h-48 w-40 rounded object-cover sm:h-60 sm:w-48"
            />
          </div>
        )}

        <div className="min-w-0">
          <h1 className="font-serif text-3xl leading-tight text-neutral-900 sm:text-4xl">
            {author.name}
          </h1>
          {author.title && (
            <p className="mt-3 text-base text-neutral-700">
              {author.title}
              {author.organisation && (
                <>
                  {' at '}
                  <span className="text-neutral-900">{author.organisation}</span>
                </>
              )}
            </p>
          )}
          {author.organisation_description && (
            <p className="mt-1 text-sm italic text-neutral-500">
              {author.organisation_description}
            </p>
          )}
        </div>
      </div>

      {paragraphs.length > 0 && (
        <article className="mt-10 border-t border-neutral-200 pt-8 font-serif text-lg leading-relaxed text-neutral-900">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? '' : 'mt-5'}>
              {p}
            </p>
          ))}
        </article>
      )}

      {author.external_url && (
        <aside className="mt-12 border-t border-neutral-200 pt-6">
          <a
            href={author.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#c9a84c] hover:underline"
          >
            More from {author.name.split(' ')[0]} &rarr;
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
