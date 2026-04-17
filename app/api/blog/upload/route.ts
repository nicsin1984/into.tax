import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const BUCKET = 'blog-pdfs'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post'
}

export async function POST(req: NextRequest) {
  // --- auth ---
  const pw = req.headers.get('x-admin-password')
  const expected = process.env.BLOG_ADMIN_PASSWORD
  if (!expected) {
    return NextResponse.json(
      { error: 'Server not configured: missing BLOG_ADMIN_PASSWORD' },
      { status: 500 }
    )
  }
  if (!pw || pw !== expected) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json(
      { error: 'Server not configured: missing SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  // --- form data ---
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const title = String(form.get('title') || '').trim()
  const excerpt = String(form.get('excerpt') || '').trim() || null
  const author = String(form.get('author') || '').trim() || 'Nicky Singh'
  const file = form.get('file')

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'PDF file is required' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, serviceKey)

  // --- slug uniqueness ---
  const baseSlug = slugify(title)
  let slug = baseSlug
  for (let i = 2; i < 50; i++) {
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!existing) break
    slug = `${baseSlug}-${i}`
  }

  // --- upload PDF ---
  const filename = `${Date.now()}-${slug}.pdf`
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(filename, arrayBuffer, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false,
    })
  if (uploadErr) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadErr.message}` },
      { status: 500 }
    )
  }

  const { data: publicUrl } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename)
  const pdf_url = publicUrl.publicUrl

  // --- insert row ---
  const { error: insertErr } = await supabase.from('blog_posts').insert({
    title,
    slug,
    excerpt,
    author,
    pdf_url,
    is_published: true,
  })

  if (insertErr) {
    // best-effort cleanup
    await supabase.storage.from(BUCKET).remove([filename])
    return NextResponse.json(
      { error: `Database insert failed: ${insertErr.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, slug, pdf_url })
}
