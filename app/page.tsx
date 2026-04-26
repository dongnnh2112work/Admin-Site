import { redirect } from "next/navigation"

import { ROUTES } from "@/constants/routes"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default async function Home() {
  const user = await getCurrentUser()
  if (user) {
    redirect(ROUTES.dashboard)
  }
  redirect(ROUTES.login)
}
