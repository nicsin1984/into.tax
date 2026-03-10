import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'

export async function GET(request: NextRequest) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse(errorHtml("Missing token."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const { data: digest, error } = await supabase
    .from("digests")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !digest) {
    return new NextResponse(errorHtml("Invalid or expired token."), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (digest.status === "sent") {
    return new NextResponse(
      successHtml(`Already sent on ${digest.sent_at?.slice(0, 10)}. Nothing to do.`),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  const created = new Date(digest.created_at);
  const ageHours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
  if (ageHours > 48) {
    await supabase.from("digests").update({ status: "expired" }).eq("token", token);
    return new NextResponse(errorHtml("This approval link has expired (48h limit)."), {
      status: 410,
      headers: { "Content-Type": "text/html" },
    });
  }

  await supabase
    .from("digests")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("token", token);

  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email")
    .eq("confirmed", true);

  if (!subscribers || subscribers.length === 0) {
    return new NextResponse(errorHtml("No confirmed subscribers found."), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    const personalHtml = digest.html.replace(/{{EMAIL}}/g, encodeURIComponent(sub.email));
    try {
      await resend.emails.send({
        from: "into.tax Weekly <nicky@into.tax>",
        to: sub.email,
        subject: digest.subject,
        html: personalHtml,
      });
      sent++;
    } catch (e) {
      console.error(`Failed to send to ${sub.email}:`, e);
      failed++;
    }
  }

  await supabase
    .from("digests")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("token", token);

  return new NextResponse(
    successHtml(`Digest sent to <strong>${sent}</strong> subscriber${sent !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}.`),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function successHtml(message: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Digest Approved</title></head>
<body style="font-family:Arial,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#111827;">
  <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:8px;padding:32px;">
    <div style="font-size:48px;margin-bottom:16px;">✓</div>
    <h1 style="font-size:18px;margin:0 0 8px;color:#065F46;">Digest Approved</h1>
    <p style="font-size:14px;color:#374151;margin:0;">${message}</p>
    <a href="https://into.tax" style="display:inline-block;margin-top:20px;color:#2563EB;font-size:13px;">← Back to into.tax</a>
  </div>
</body></html>`;
}

function errorHtml(message: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Error</title></head>
<body style="font-family:Arial,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#111827;">
  <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:32px;">
    <div style="font-size:48px;margin-bottom:16px;">✗</div>
    <h1 style="font-size:18px;margin:0 0 8px;color:#991B1B;">Error</h1>
    <p style="font-size:14px;color:#374151;margin:0;">${message}</p>
    <a href="https://into.tax" style="display:inline-block;margin-top:20px;color:#2563EB;font-size:13px;">← Back to into.tax</a>
  </div>
</body></html>`;
}
