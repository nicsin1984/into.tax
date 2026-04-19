import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const BUCKET = 'blog-pdfs'

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'post'
  )
}

export async function POST(req: NextRequest) {
  const pw = req.headers.get('x-admin-password')
  const expected = process.env.BLOG_ADMIN_PASSWORD
  if (!expected) {
    return NextResponse.json(
      { error: 'Server not configured: missing BLOG_ADMIN_PASSWORD' },
      { status: 500 },
    )
  }
  if (!pw || pw !== expected) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (err) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const title = String(formData.get('title') || '').trim()
  const author = String(formData.get('author') || '').trim()
  const excerpt = String(formData.get('excerpt') || '').trim() || null
  const body = String(formData.get('body') || '').trim()
  const pdf = formData.get('pdf') as File | null

  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })
  if (!author) return NextResponse.json({ error: 'Missing author' }, { status: 400 })
  if (!body) return NextResponse.json({ error: 'Missing body' }, { status: 400 })

  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const slug = slugify(title)

  let pdf_url = ''
  if (pdf && pdf.size > 0) {
    if (pdf.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF upload must be application/pdf' }, { status: 400 })
    }
    const arrayBuffer = await pdf.arrayBuffer()
    const storagePath = slug + '-' + Date.now() + '.pdf'
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })
    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload PDF: ' + uploadError.message },
        { status: 500 },
      )
    }
    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    pdf_url = publicData.publicUrl
  }

  const { error: insertError } = await supabase.from('blog_posts').insert({
    title,
    slug,
    excerpt,
    body,
    author,
    pdf_url,
    is_published: true,
  })
  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to insert post: ' + insertError.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, slug })
}
