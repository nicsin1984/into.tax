import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

const SUPABASE_URL = "https://ibktckdphhwjnmvzwssu.supabase.co"

function htmlResponse(title: string, message: string, status: number = 200, details?: string) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Spotlight ${title}</title>
<style>
body{font-family:Georgia,serif;max-width:640px;margin:80px auto;padding:20px;color:#1a1a1a;background:#f5f1eb}
h1{font-size:28px;margin-bottom:16px;font-weight:normal}
p{font-size:16px;line-height:1.6}
.details{font-family:ui-monospace,monospace;font-size:13px;background:#fff;padding:16px;border-left:3px solid #1a1a1a;margin:20px 0;white-space:pre-wrap}
a{color:#1a1a1a}
.nav{margin-top:32px;font-size:14px}
</style></head>
<body>
<h1>${title}</h1>
<p>${message}</p>
${details ? `<div class="details">${details}</div>` : ""}
<p class="nav"><a href="https://into.tax/">Return to into.tax</a> &nbsp;&middot;&nbsp; <a href="https://into.tax/spotlight">View Spotlight page</a></p>
</body></html>`
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const batchId = url.searchParams.get("batch")
  const token = url.searchParams.get("token")

  if (!batchId || !token) {
    return htmlResponse("Invalid link", "Missing batch ID or approval token.", 400)
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    return htmlResponse("Server error", "Supabase service role key not configured.", 500)
  }

  const supabase = createClient(SUPABASE_URL, key)

  // 1. Fetch batch and validate token
  const { data: batch, error: batchErr } = await supabase
    .from("spotlight_rotation_log")
    .select("*")
    .eq("id", batchId)
    .maybeSingle()

  if (batchErr || !batch) {
    return htmlResponse("Batch not found", "This approval link is invalid or the batch has been deleted.", 404)
  }

  if (batch.approval_token !== token) {
    return htmlResponse("Invalid token", "The approval token does not match this batch.", 403)
  }

  if (batch.status === "approved") {
    return htmlResponse(
      "Already approved",
      `Batch #${batch.batch_number} was already approved ${batch.approved_at ? "at " + batch.approved_at : ""}. No action taken.`,
      200,
      "Profiles:\n" + (batch.profile_names || []).map((n: string, i: number) => `${i + 1}. ${n}`).join("\n")
    )
  }

  if (batch.status !== "pending_approval") {
    return htmlResponse(
      "Cannot approve",
      `Batch #${batch.batch_number} is in state "${batch.status}" and cannot be approved.`,
      400
    )
  }

  // 2. Fetch the 5 pool profiles
  const { data: profiles, error: profilesErr } = await supabase
    .from("spotlight_pool")
    .select("*")
    .in("id", batch.profile_ids as string[])

  if (profilesErr || !profiles || profiles.length === 0) {
    return htmlResponse(
      "Profiles missing",
      `Could not fetch candidate profiles from the pool. ${profilesErr?.message || ""}`,
      500
    )
  }

  // 3. Archive currently-published spotlight rows (preserves history)
  const { error: archiveErr } = await supabase
    .from("spotlight")
    .update({ published: false })
    .eq("published", true)

  if (archiveErr) {
    return htmlResponse("Archive failed", `Failed to archive current spotlights: ${archiveErr.message}`, 500)
  }

  // 4. Build new rows with pool->spotlight column mapping
  const issueDate = batch.live_from ? String(batch.live_from).split("T")[0] : new Date().toISOString().split("T")[0]
  const nowIso = new Date().toISOString()

  const newRows = profiles.map((p: any) => {
    const parts = String(p.full_name || "").trim().split(/\s+/)
    const firstName = parts[0] || ""
    const lastName = parts.slice(1).join(" ") || ""
    return {
      person_name: p.full_name,
      first_name: firstName,
      last_name: lastName,
      job_title: p.role,
      firm: p.organisation,
      specialism: p.speciality,
      paragraph: p.bio,
      linkedin_url: p.linkedin_url || null,
      email: p.email || null,
      issue_date: issueDate,
      draft_status: "published",
      published: true,
      published_at: nowIso,
      times_featured: (p.times_featured || 0) + 1,
    }
  })

  // 5. Insert new spotlight rows
  const { error: insertErr } = await supabase.from("spotlight").insert(newRows)
  if (insertErr) {
    return htmlResponse("Insert failed", `Failed to insert new spotlights: ${insertErr.message}`, 500)
  }

  // 6. Mark batch approved
  await supabase
    .from("spotlight_rotation_log")
    .update({ status: "approved", approved_at: nowIso })
    .eq("id", batchId)

  // 7. Update pool profiles - mark as live
  await supabase
    .from("spotlight_pool")
    .update({
      status: "live",
      last_featured_at: nowIso,
      featured_from: batch.live_from || nowIso,
      featured_until: batch.live_until || null,
      updated_at: nowIso,
    })
    .in("id", batch.profile_ids as string[])

  // 8. Revalidate homepage + spotlight page
  try { revalidatePath("/") } catch {}
  try { revalidatePath("/spotlight") } catch {}

  const details = `Batch #${batch.batch_number}  |  ${batch.week_label || ""}

Now live on into.tax:
${profiles.map((p: any, i: number) => `${i + 1}. ${p.full_name} - ${p.role}, ${p.organisation}`).join("\n")}

Approved at ${nowIso}`

  return htmlResponse(
    "Spotlight approved",
    `Batch #${batch.batch_number} is now live on into.tax. The new profiles will appear on the homepage and /spotlight within about a minute.`,
    200,
    details
  )
}
