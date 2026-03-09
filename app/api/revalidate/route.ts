import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

const CATEGORIES = [
  "Personal Tax",
  "Business Tax",
  "Employment Tax",
  "VAT & Indirect",
  "Capital Taxes",
  "HMRC & Practice",
]

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-revalidation-secret")

    if (!secret || secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing secret." },
        { status: 401 }
      )
    }

    // Revalidate the homepage
    revalidatePath("/")

    // Revalidate all category pages
    for (const category of CATEGORIES) {
      revalidatePath(`/category/${encodeURIComponent(category)}`)
    }

    return NextResponse.json({
      success: true,
      revalidated: ["/", ...CATEGORIES.map((c) => `/category/${encodeURIComponent(c)}`)],
      now: Date.now(),
    })
  } catch {
    return NextResponse.json(
      { success: false, message: "Revalidation failed." },
      { status: 500 }
    )
  }
}
