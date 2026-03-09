"use server"

import { subscribeEmail } from "@/lib/queries"

export async function subscribe(formData: FormData) {
  const email = formData.get("email") as string
  if (!email || !email.includes("@")) {
    return { success: false, message: "Please enter a valid email" }
  }
  return subscribeEmail(email)
}
