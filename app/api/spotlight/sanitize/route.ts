import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const SUPABASE_URL = "https://ibktckdphhwjnmvzwssu.supabase.co"
const CONFIRM_TOKEN = "clean-cite-tags-2026-04-18"

function clean(text: string | null | undefined): string | null {
  if (!text) return text ?? null
  return String(text)
    .replace(/<\/?cite[^>]*>/g, "")
    .replace(/\s+\./g, ".")
    .replace(/\.\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function htmlResponse(title: string, message: string, status: number = 200, details?: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
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
    return htmlResponse("Confirmation required", "Add ?confirm=<token> to the URL to run the sanitizer.", 400)
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return htmlResponse("Error", "Service role key not configured.", 500)

  const supabase = createClient(SUPABASE_URL, key)

  const report: string[] = []

  // 1. Clean spotlight table (live display)
  const { data: live, error: liveErr } = await supabase
    .from("spotlight")
    .select("id, person_name, paragraph, source_evidence, headline")
    .eq("published", true)

  if (liveErr) return htmlResponse("Error reading spotlight", liveErr.message, 500)

  let liveCleaned = 0
  for (const row of live || []) {
    const p = clean(row.paragraph)
    const se = clean(row.source_evidence)
    const h = clean(row.headline)
    if (p !== row.paragraph || se !== row.source_evidence || h !== row.headline) {
      await supabase.from("spotlight").update({ paragraph: p, source_evidence: se, headline: h }).eq("id", row.id)
      report.push(`  cleaned spotlight: ${row.person_name}`)
      liveCleaned++
    }
  }

  // 2. Clean spotlight_pool table (source for future rotations)
  const { data: pool, error: poolErr } = await supabase
    .from("spotlight_pool")
    .select("id, full_name, bio")

  if (poolErr) return htmlResponse("Error reading pool", poolErr.message, 500)

  let poolCleaned = 0
  for (const row of pool || []) {
    const b = clean(row.bio)
    if (b !== row.bio) {
      await supabase.from("spotlight_pool").update({ bio: b }).eq("id", row.id)
      poolCleaned++
    }
  }
  report.push(`  pool rows cleaned: ${poolCleaned} / ${(pool || []).length}`)

  // 3. Revalidate
  try { revalidatePath("/") } catch {}
  try { revalidatePath("/spotlight") } catch {}

  const summary = `Cleaned ${liveCleaned} live spotlight rows, ${poolCleaned} pool rows.\n\n${report.join("\n")}`

  return htmlResponse(
    "Sanitize complete",
    "Cite tags and whitespace cleaned from spotlight and spotlight_pool tables. The site will refresh within a minute.",
    200,
    summary
  )
}
