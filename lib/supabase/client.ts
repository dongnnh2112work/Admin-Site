import { createBrowserClient } from "@supabase/ssr"

import { isAuthBypass } from "@/lib/dev-bypass"

const PLACEHOLDER_URL = "https://placeholder.supabase.co"
const PLACEHOLDER_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder"

export function createClient() {
  const bypass = isAuthBypass()
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || (bypass ? PLACEHOLDER_URL : "")
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (bypass ? PLACEHOLDER_ANON : "")
  if (!url || !anonKey) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local"
    )
  }
  return createBrowserClient(url, anonKey)
}
