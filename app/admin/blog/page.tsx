'use client'

import { useState } from 'react'
import Link from 'next/link'

type Status =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'ok'; slug: string }
  | { kind: 'error'; msg: string }

export default function AdminBlogPage() {
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body, setBody] = useState('')
  const [pdf, setPdf] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !author || !body) {
      setStatus({ kind: 'error', msg: 'Title, author and body are all required.' })
      return
    }
    setStatus({ kind: 'uploading' })
    try {
      const form = new FormData()
      form.append('title', title)
      form.append('author', author)
      form.append('excerpt', excerpt)
      form.append('body', body)
      if (pdf) form.append('pdf', pdf)
      const res = await fetch('/api/blog/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ kind: 'error', msg: data.error || res.statusText })
        return
      }
      setStatus({ kind: 'ok', slug: data.slug })
      setTitle('')
      setAuthor('')
      setExcerpt('')
      setBody('')
      setPdf(null)
    } catch (err) {
      setStatus({
        kind: 'error',
        msg: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-3xl text-neutral-900">New blog post</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Paste article text below. Separate paragraphs with blank lines. PDF is
        optional (shown as a download link at the bottom of the post).
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field label="Admin password" required>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Title" required>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field
          label="Author"
          required
          hint='Format: "Name, Title, Firm" - comma-separated. First segment becomes the byline name, rest become credentials.'
        >
          <input
            type="text"
            required
            placeholder="Jane Smith, Partner, Tax Disputes, Example LLP"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Standfirst (excerpt)" hint="1-2 sentences under the headline. Optional.">
          <textarea
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Body" required hint="Separate paragraphs with a blank line.">
          <textarea
            rows={20}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 font-mono text-sm"
          />
        </Field>

        <Field label="PDF (optional)" hint="If provided, shown as a download link at the bottom of the post.">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdf(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </Field>

        <button
          type="submit"
          disabled={status.kind === 'uploading'}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {status.kind === 'uploading' ? 'Publishing...' : 'Publish'}
        </button>

        {status.kind === 'ok' && (
          <p className="text-sm text-green-700">
            Published.{' '}
            <Link href={'/blog/' + status.slug} className="underline">
              View post &rarr;
            </Link>
          </p>
        )}
        {status.kind === 'error' && (
          <p className="text-sm text-red-700">Error: {status.msg}</p>
        )}
      </form>
    </main>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-neutral-500">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}
