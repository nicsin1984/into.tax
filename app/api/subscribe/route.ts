import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const SUPABASE_URL = 'https://ibktckdphhwjnmvzwssu.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlia3Rja2RwaGh3am5tdnp3c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzQxNzgsImV4cCI6MjA4ODIxMDE3OH0.-QXSfvi848zGDglMsU3hu2A6RWXKHRpMYPwuTpbko2s'
const resend = new Resend(process.env.RESEND_API_KEY)

const BLOCKED_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.uk",
  "outlook.com", "yahoo.com", "yahoo.co.uk", "icloud.com",
  "protonmail.com", "proton.me", "aol.com", "mail.com",
  "live.com", "live.co.uk", "btinternet.com", "sky.com",
  "virginmedia.com", "talktalk.net",
])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = (body.email ?? "").trim().toLowerCase()

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      )
    }

    const domain = email.split("@")[1]
    if (BLOCKED_DOMAINS.has(domain)) {
      return NextResponse.json(
        { success: false, message: "Please use your practice email — into.tax is for accountancy professionals." },
        { status: 422 }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
    const token = generateToken()

    const { error: insertError } = await supabase
      .from("subscribers")
      .insert({ 
        email, 
        domain, 
        source: "website", 
        active: false,
        confirmed: false,
        confirmation_token: token
      })

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { success: false, message: "You're already subscribed!" },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, message: `Database error: ${insertError.message}` },
        { status: 500 }
      )
    }

    try {
      await resend.emails.send({
        from: "nicky@into.tax",
        to: email,
        subject: "Confirm your into.tax subscription",
        html: `
          <p>Thanks for signing up to into.tax.</p>
          <p><a href="https://into.tax/api/confirm?token=${token}">Click here to confirm your subscription</a></p>
          <p>If you didn't sign up, ignore this email.</p>
        `
      })
    } catch (emailError) {
      // Don't fail the request if email send fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "Check your email — click the link to confirm your subscription." 
    })

  } catch (err) {
    return NextResponse.json(
      { success: false, message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 500 }
    )
  }
}
