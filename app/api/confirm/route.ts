import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.redirect("https://into.tax?signup=invalid")
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const { data, error } = await supabase
    .from("subscribers")
    .update({ 
      confirmed: true, 
      active: true,
      confirmation_token: null,
      confirmed_at: new Date().toISOString()
    })
    .eq("confirmation_token", token)
    .select()

  if (data?.length) {
    return NextResponse.redirect("https://into.tax?signup=confirmed")
  }

  // Token already used or not found — redirect to confirmed either way
  // Can't distinguish between already-confirmed and invalid once token is nulled
  return NextResponse.redirect("https://into.tax?signup=confirmed")
}
