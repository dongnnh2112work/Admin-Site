import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { isAuthBypass } from "@/lib/dev-bypass"

/** Giữ khởi tạo client khi chưa có project thật (chỉ dùng cùng bypass) */
const PLACEHOLDER_URL = "https://placeholder.supabase.co"
const PLACEHOLDER_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.placeholder"

export async function createClient() {
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

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          /* set có thể fail trong Server Component — middleware/route handler sẽ refresh session */
        }
      },
    },
  })
}
