import { AppShell } from "@/components/layout/AppShell"
import { requireAuth, isSuperAdmin } from "@/lib/auth"
import { isAuthBypass } from "@/lib/dev-bypass"
import { createClient } from "@/lib/supabase/server"
import type { BrandOption } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  let brands: BrandOption[] = []

  if (isAuthBypass()) {
    return (
      <AppShell user={user} brands={brands}>
        {children}
      </AppShell>
    )
  }

  const supabase = await createClient()

  if (isSuperAdmin(user)) {
    const { data } = await supabase
      .from("brands")
      .select("id,name,slug")
      .order("name", { ascending: true })
    brands = (data ?? []) as BrandOption[]
  } else if (user.brand_id) {
    const { data } = await supabase
      .from("brands")
      .select("id,name,slug")
      .eq("id", user.brand_id)
      .maybeSingle()
    if (data) brands = [data as BrandOption]
  }

  return (
    <AppShell user={user} brands={brands}>
      {children}
    </AppShell>
  )
}
