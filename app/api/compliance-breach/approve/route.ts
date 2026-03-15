import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'

const resend = new Resend(process.env.RESEND_API_KEY)

function html(content: string) {
  return new Response(content, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const token = searchParams.get("token")

  if (!token || token !== process.env.COMPLIANCE_BREACH_SECRET) {
    return html("<h2>Unauthorised</h2>")
  }
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return html("<h2>Invalid request</h2>")
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // Fetch the breach row
  const { data: row, error: fetchErr } = await supabase
    .from("compliance_breach")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchErr || !row) {
    return html("<h2>Briefing not found</h2>")
  }
  if (row.status !== "draft") {
    return html(`<h2>Already ${row.status}</h2><p>This briefing was already processed.</p>`)
  }

  // Mark as approved
  const now = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from("compliance_breach")
    .update({ status: "approved", approved_at: now })
    .eq("id", id)

  if (updateErr) {
    return html(`<h2>Update failed</h2><p>${updateErr.message}</p>`)
  }

  // Fetch confirmed, active subscribers
  const { data: subscribers, error: subErr } = await supabase
    .from("subscribers")
    .select("email, name")
    .eq("confirmed", true)
    .is("unsubscribed_at", null)

  if (subErr || !subscribers?.length) {
    return html(`<h2>Approved — but no subscribers found</h2><p>${subErr?.message ?? "subscribers list is empty"}</p>`)
  }

  // Build the subscriber email
  const articleTitle = row.draft_text?.split("\n")[0]?.slice(0, 120) ?? "Compliance Breach"
  const subscriberHtml = buildSubscriberEmail(row.draft_text ?? "", row.article_id)

  // Send to all subscribers via Resend (batch)
  const emailResults = await Promise.allSettled(
    subscribers.map((sub: { email: string; name?: string }) =>
      resend.emails.send({
        from: "into.tax <compliance@into.tax>",
        to: sub.email,
        subject: `Compliance Breach: ${articleTitle}`,
        html: subscriberHtml,
      })
    )
  )

  const sent = emailResults.filter(r => r.status === "fulfilled").length
  const failed = emailResults.filter(r => r.status === "rejected").length

  // Mark as published
  await supabase
    .from("compliance_breach")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", id)

  return html(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Published</title>
<style>body{font-family:Georgia,serif;background:#FDFCFA;color:#1a1a1a;max-width:600px;margin:60px auto;padding:0 24px}</style>
</head>
<body>
  <h1 style="color:#A0522D;">Published</h1>
  <p>Compliance Breach briefing sent to <strong>${sent}</strong> subscriber${sent !== 1 ? "s" : ""}.</p>
  ${failed ? `<p style="color:#c00">${failed} email(s) failed to send.</p>` : ""}
  <p><a href="https://into.tax" style="color:#A0522D;">← Back to into.tax</a></p>
</body>
</html>`)
}

function buildSubscriberEmail(draftText: string, _articleId: string | null): string {
  const paragraphs = draftText
    .split(/\n+/)
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px 0;line-height:1.7;">${p}</p>`)
    .join("")

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ede8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ede8;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FDFCFA;border-radius:4px;overflow:hidden;">

      <!-- Header -->
      <tr>
        <td style="background:#1a1a1a;padding:20px 32px;">
          <span style="font-family:Georgia,serif;font-size:20px;color:#FDFCFA;letter-spacing:0.05em;">into.tax</span>
          <span style="font-family:'Courier New',monospace;font-size:11px;color:#A0522D;margin-left:12px;text-transform:uppercase;letter-spacing:0.1em;">NorthStar</span>
        </td>
      </tr>

      <!-- Label -->
      <tr>
        <td style="background:#A0522D;padding:10px 32px;">
          <span style="font-family:'Courier New',monospace;font-size:11px;color:#FDFCFA;text-transform:uppercase;letter-spacing:0.15em;">Compliance Breach</span>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px;font-family:Georgia,serif;font-size:16px;color:#1a1a1a;">
          ${paragraphs}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:24px 32px;border-top:1px solid #e8e4df;font-family:'Courier New',monospace;font-size:11px;color:#999;">
          <p style="margin:0 0 8px 0;">You're receiving this because you're subscribed to into.tax NorthStar briefings.</p>
          <p style="margin:0;"><a href="https://into.tax" style="color:#A0522D;text-decoration:none;">into.tax</a></p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}
