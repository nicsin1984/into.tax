'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminBlogPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [author, setAuthor] = useState('Nicky Singh')
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<
    { kind: 'idle' } | { kind: 'uploading' } | { kind: 'ok'; slug: string } | { kind: 'error'; msg: string }
  >({ kind: 'idle' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title) {
      setStatus({ kind: 'error', msg: 'Title and PDF file are required.' })
      return
    }
    setStatus({ kind: 'uploading' })
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('excerpt', excerpt)
      form.append('author', author)
      form.append('file', file)
      const res = await fetch('/api/blog/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: form,
      })
      const body = await res.json()
      if (!res.ok) {
        setStatus({ kind: 'error', msg: body.error || `Upload failed (${res.status})` })
        return
      }
      setStatus({ kind: 'ok', slug: body.slug })
      setTitle('')
      setExcerpt('')
      setFile(null)
    } catch (err) {
      setStatus({
        kind: 'error',
        msg: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-12">
        <h1 className="mb-6 font-serif text-2xl">Blog Admin</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (password.trim()) setAuthed(true)
          }}
          className="space-y-4"
        >
          <label className="block">
            <span className="text-sm text-neutral-600">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
              autoFocus
            />
          </label>
          <button
            type="submit"
            className="rounded bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
          >
            Continue
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl">Upload blog post</h1>
        <Link href="/blog" className="text-sm text-[#c9a84c] hover:underline">
          View blog &rarr;
        </Link>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        PDF &rarr; published at <code>/blog/[slug]</code>
      </p>

      {status.kind === 'ok' && (
        <div className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          &check; Post published &mdash;{' '}
          <Link
            href={`/blog/${status.slug}`}
            className="font-medium text-[#c9a84c] hover:underline"
          >
            View post &rarr;
          </Link>
        </div>
      )}
      {status.kind === 'error' && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {status.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="text-sm text-neutral-700">Title *</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-700">
            Excerpt <span className="text-neutral-400">(optional)</span>
          </span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-700">Author</span>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="mt-1 block w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm text-neutral-700">PDF file *</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
            required
          />
        </label>

        <button
          type="submit"
          disabled={status.kind === 'uploading'}
          className="rounded bg-[#c9a84c] px-5 py-2 text-sm font-medium text-neutral-900 hover:bg-[#b8983f] disabled:opacity-50"
        >
          {status.kind === 'uploading' ? 'Uploading&hellip;' : 'Publish post'}
        </button>
      </form>
    </main>
  )
}
