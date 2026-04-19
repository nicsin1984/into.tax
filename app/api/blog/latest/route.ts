import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const revalidate = 0
export const dynamic = "force-dynamic"

const SUPABASE_URL = "https://ibktckdphhwjnmvzwssu.supabase.co"

export async function GET() {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!key) {
      return NextResponse.json({ posts: [] })
    }
    const supabase = createClient(SUPABASE_URL, key)
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, author, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3)

    if (error || !data) {
      return NextResponse.json({ posts: [] })
    }
    return NextResponse.json({ posts: data })
  } catch {
    return NextResponse.json({ posts: [] })
  }
}
