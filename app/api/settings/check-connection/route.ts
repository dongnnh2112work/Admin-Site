import { NextResponse } from "next/server"

import { getCurrentUser, isSuperAdmin } from "@/lib/auth"
import { checkSupabaseConnection } from "@/lib/settings"

export const dynamic = "force-dynamic"

export async function POST() {
  const user = await getCurrentUser()
  if (!user || !isSuperAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await checkSupabaseConnection()
  return NextResponse.json(result)
}
