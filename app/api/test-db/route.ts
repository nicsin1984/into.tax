import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Hardcoded credentials
const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, source_name, category, priority, published_at, created_at')
      .limit(10)
    
    // Get unique categories
    const { data: allArticles } = await supabase.from('articles').select('category')
    const categories: Record<string, number> = {}
    allArticles?.forEach((row) => {
      categories[row.category || 'null'] = (categories[row.category || 'null'] || 0) + 1
    })
    
    return NextResponse.json({
      success: true,
      url: SUPABASE_URL,
      articleCount: data?.length || 0,
      articles: data,
      categoryCounts: categories,
      error: error?.message || null
    })
  } catch (e) {
    return NextResponse.json({
      success: false,
      error: (e as Error).message
    })
  }
}
