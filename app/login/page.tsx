"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ROUTES } from "@/constants/routes"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Màu design system Howl Studio */
const HS_BLACK = "#0A0A0A"
const HS_LIME = "#E8FF47"
const HS_GRAY_900 = "#111111"
const HS_GRAY_800 = "#1C1C1C"
const HS_GRAY_700 = "#2A2A2A"
const HS_WHITE = "#F5F5F5"
const HS_GRAY_400 = "#7A7A7A"

const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true"

function mapAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase()
  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid_credentials") ||
    m.includes("email not confirmed")
  ) {
    return "Email hoặc mật khẩu không đúng."
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại."
  }
  return "Đăng nhập thất bại. Vui lòng thử lại."
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(!DEV_AUTH_BYPASS)
  const [devLoading, setDevLoading] = useState(false)

  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user || cancelled) {
          return
        }
        const { data: row } = await supabase
          .from("brand_users")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()
        if (!cancelled && row) {
          router.replace(ROUTES.dashboard)
        }
      } catch {
        /* bỏ qua — user ở lại trang đăng nhập */
      } finally {
        if (!cancelled) setCheckingSession(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signError) {
        setError(mapAuthError(signError.message))
        return
      }
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("Đăng nhập thất bại. Vui lòng thử lại.")
        return
      }
      const { data: row, error: rowError } = await supabase
        .from("brand_users")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
      if (rowError || !row) {
        await supabase.auth.signOut()
        setError(
          "Tài khoản chưa được cấp quyền truy cập admin. Liên hệ quản trị viên."
        )
        return
      }
      router.push(ROUTES.dashboard)
      router.refresh()
    } catch {
      setError("Đăng nhập thất bại. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDevEnter() {
    setError(null)
    setDevLoading(true)
    try {
      const res = await fetch("/api/dev-session", { method: "POST" })
      if (!res.ok) {
        setError("Không bật được chế độ dev. Kiểm tra NEXT_PUBLIC_DEV_AUTH_BYPASS=true và khởi động lại dev server.")
        return
      }
      router.push(ROUTES.dashboard)
      router.refresh()
    } catch {
      setError("Lỗi kết nối. Thử lại.")
    } finally {
      setDevLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div
        className="flex min-h-full flex-1 items-center justify-center px-4 py-12"
        style={{ backgroundColor: HS_BLACK }}
      >
        <p className="text-sm" style={{ color: HS_GRAY_400 }}>
          Đang kiểm tra phiên đăng nhập…
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: HS_BLACK }}
    >
      <Card
        className={cn(
          "w-full max-w-[400px] border shadow-lg",
          "rounded-2xl"
        )}
        style={{
          borderColor: HS_GRAY_700,
          backgroundColor: HS_GRAY_900,
          color: HS_WHITE,
        }}
      >
        <CardHeader className="space-y-1 pb-2">
          <CardTitle
            className="text-xl font-semibold tracking-tight"
            style={{ color: HS_WHITE }}
          >
            Đăng nhập
          </CardTitle>
          <CardDescription className="text-[13px] leading-relaxed" style={{ color: HS_GRAY_400 }}>
            Event Admin — nhập email và mật khẩu được cấp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <Alert
                variant="destructive"
                className="border-red-500/40 bg-red-950/50 text-red-100"
              >
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px]" style={{ color: HS_WHITE }}>
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="ban@congty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-10 rounded-lg border text-[13px] text-white placeholder:text-[#7A7A7A] focus-visible:border-[#E8FF47] focus-visible:ring-[#E8FF47]/25"
                style={{
                  backgroundColor: HS_GRAY_800,
                  borderColor: HS_GRAY_700,
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px]" style={{ color: HS_WHITE }}>
                Mật khẩu
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-10 rounded-lg border text-[13px] text-white placeholder:text-[#7A7A7A] focus-visible:border-[#E8FF47] focus-visible:ring-[#E8FF47]/25"
                style={{
                  backgroundColor: HS_GRAY_800,
                  borderColor: HS_GRAY_700,
                }}
              />
            </div>
            <Button
              type="submit"
              className="h-10 w-full rounded-lg text-[13px] font-medium shadow-none transition-[box-shadow,transform] hover:shadow-[0_0_24px_rgba(232,255,71,0.35)] active:scale-[0.97] disabled:opacity-40"
              style={{
                backgroundColor: HS_LIME,
                color: HS_BLACK,
              }}
              disabled={loading || devLoading}
            >
              {loading ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
            {DEV_AUTH_BYPASS ? (
              <>
                <div className="relative py-1 text-center text-[11px] uppercase tracking-wider" style={{ color: HS_GRAY_400 }}>
                  <span className="relative z-10 bg-[#111111] px-2">hoặc</span>
                  <span
                    className="absolute left-0 right-0 top-1/2 z-0 h-px -translate-y-1/2"
                    style={{ backgroundColor: HS_GRAY_700 }}
                    aria-hidden
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full rounded-lg border text-[13px] font-medium shadow-none hover:bg-[#1C1C1C] disabled:opacity-40"
                  style={{
                    borderColor: HS_GRAY_700,
                    color: HS_WHITE,
                    backgroundColor: HS_GRAY_800,
                  }}
                  disabled={loading || devLoading}
                  onClick={() => void handleDevEnter()}
                >
                  {devLoading ? "Đang mở…" : "Vào bảng điều khiển (chế độ dev)"}
                </Button>
                <p className="text-center text-[12px] leading-snug" style={{ color: HS_GRAY_400 }}>
                  Chỉ dùng khi chưa kết nối Supabase Auth. Tắt NEXT_PUBLIC_DEV_AUTH_BYPASS trên production.
                </p>
              </>
            ) : null}
            <p
              className="text-center text-[13px] leading-snug"
              style={{ color: HS_GRAY_400 }}
            >
              Quên mật khẩu? Liên hệ quản trị viên hệ thống.
            </p>
          </form>
        </CardContent>
      </Card>
      <p className="mt-8 text-center text-[13px]" style={{ color: HS_GRAY_400 }}>
        <Link
          href="/"
          className="underline underline-offset-2 transition-colors hover:text-[#F5F5F5]"
        >
          Về trang chủ
        </Link>
      </p>
    </div>
  )
}
