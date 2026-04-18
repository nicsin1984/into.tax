"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Post = {
  slug: string
  title: string
  author: string
  published_at: string
}

function bylineName(author: string) {
  try {
    return author.split(",")[0].trim()
  } catch {
    return author || ""
  }
}

function shortDate(iso: string) {
  try {
    return new Date(iso)
      .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      .toUpperCase()
  } catch {
    return ""
  }
}

export function BlogTeaser() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadPosts(): Promise<Post[]> {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!url || !key) return []

        const mod = await import("@supabase/supabase-js")
        const supabase = mod.createClient(url, key)
        const { data, error } = await supabase
          .from("blog_posts")
          .select("slug, title, author, published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false })
          .limit(3)

        if (error || !data) return []
        return data as Post[]
      } catch {
        return []
      }
    }

    loadPosts().then((result) => {
      if (cancelled) return
      setPosts(result)
      setLoaded(true)
    }).catch(() => {
      if (cancelled) return
      setPosts([])
      setLoaded(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded || posts.length === 0) return null

  return (
    <div className="rounded border border-border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          From the blog
        </h2>
        <Link href="/blog" className="text-xs text-muted-foreground hover:text-foreground">
          All posts →
        </Link>
      </div>
      <ul className="space-y-3">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="group block">
              <p className="text-sm font-medium text-foreground group-hover:underline">
                {p.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {bylineName(p.author)} · {shortDate(p.published_at)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
