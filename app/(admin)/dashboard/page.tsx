import { DashboardView } from "@/components/dashboard/DashboardView"
import { getDashboardData } from "@/lib/dashboard"
import { requireAuth } from "@/lib/auth"

export default async function DashboardPage() {
  const user = await requireAuth()
  const data = await getDashboardData(user)
  return <DashboardView user={user} data={data} />
}
