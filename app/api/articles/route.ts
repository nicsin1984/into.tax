import { NextResponse } from "next/server"
import { getFilteredArticles } from "@/lib/queries"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") || undefined
  const tagsParam = searchParams.get("tags")
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined
  const search = searchParams.get("search") || undefined
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined

  const articles = await getFilteredArticles({
    category,
    tags,
    search,
    limit,
  })

  return NextResponse.json(articles)
}
