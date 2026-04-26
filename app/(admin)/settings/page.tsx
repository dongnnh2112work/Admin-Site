import { notFound } from "next/navigation"

import { SettingsView } from "@/components/settings/SettingsView"
import { isSuperAdmin, requireAuth } from "@/lib/auth"
import { checkSupabaseConnection, getSettingsOverview } from "@/lib/settings"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const user = await requireAuth()
  if (!isSuperAdmin(user)) {
    notFound()
  }

  const [overview, initialConnection] = await Promise.all([
    getSettingsOverview(),
    checkSupabaseConnection(),
  ])

  return <SettingsView overview={overview} initialConnection={initialConnection} />
}
