import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SUPABASE_URL = "https://ibktckdphhwjnmvzwssu.supabase.co"
const CONFIRM_TOKEN = "revert-batch1-2026-04-18"
const PREVIOUS_ISSUE_DATE = "2026-03-08"
const CURRENT_ISSUE_DATE = "2026-04-05"

function htmlResponse(title: string, message: string, status: number = 200, details?: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Spotlight ${title}</title>
<style>body{font-family:Georgia,serif;max-width:640px;margin:80px auto;padding:20px;color:#1a1a1a;background:#f5f1eb}h1{font-size:28px;margin-bottom:16px;font-weight:normal}p{font-size:16px;line-height:1.6}.details{font-family:ui-monospace,monospace;font-size:13px;background:#fff;padding:16px;border-left:3px solid #1a1a1a;margin:20px 0;white-space:pre-wrap}a{color:#1a1a1a}</style></head>
<body><h1>${title}</h1><p>${message}</p>${details ? `<div class="details">${details}</div>` : ""}
<p><a href="https://into.tax/">Return to into.tax</a> &nbsp;&middot;&nbsp; <a href="https://into.tax/spotlight">View Spotlight</a></p>
</body></html>`
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const confirm = url.searchParams.get("confirm")
  if (confirm !== CONFIRM_TOKEN) {
    return htmlResponse("Confirmation required", "Missing or invalid confirm token.", 400)
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return htmlResponse("Error", "Service role key not configured.", 500)
  const supabase = createClient(SUPABASE_URL, key)

  // 1. Hide current (Batch #1) spotlights
  const { data: currentRows, error: e1 } = await supabase
    .from("spotlight")
    .update({ published: false })
    .eq("issue_date", CURRENT_ISSUE_DATE)
    .select("person_name")

  if (e1) return htmlResponse("Error hiding current", e1.message, 500)

  // 2. Re-publish previous spotlights (Emma et al)
  const { data: prevRows, error: e2 } = await supabase
    .from("spotlight")
    .update({ published: true })
    .eq("issue_date", PREVIOUS_ISSUE_DATE)
    .select("person_name")

  if (e2) return htmlResponse("Error restoring previous", e2.message, 500)

  // 3. Mark Batch #1 in rotation_log as reverted (preserves history but distinguishes)
  const { data: batch } = await supabase
    .from("spotlight_rotation_log")
    .update({ status: "reverted", archived_at: new Date().toISOString() })
    .eq("batch_number", 1)
    .select("profile_ids")
    .maybeSingle()

  // 4. Reset the 5 pool profiles from 'live' back to 'approved' so they can be picked again later
  let poolResetCount = 0
  if (batch?.profile_ids && Array.isArray(batch.profile_ids)) {
    const { error: e3, count } = await supabase
      .from("spotlight_pool")
      .update({ status: "approved", featured_from: null, featured_until: null, updated_at: new Date().toISOString() }, { count: "exact" })
      .in("id", batch.profile_ids as string[])
    if (!e3) poolResetCount = count || 0
  }

  // 5. Revalidate
  try { revalidatePath("/") } catch {}
  try { revalidatePath("/spotlight") } catch {}

  const summary = `Hidden (Batch #1): ${(currentRows || []).map((r: any) => r.person_name).join(", ")}
Restored (previous editorial): ${(prevRows || []).map((r: any) => r.person_name).join(", ")}
Pool profiles reset (live -> approved): ${poolResetCount}
Batch #1 rotation_log status: reverted`

  return htmlResponse(
    "Revert complete",
    "Site has been reverted to the previous editorial set (Emma, Dan, Dave, Rebecca, Kate). Batch #1 profiles are hidden but preserved in the database.",
    200,
    summary
  )
}
