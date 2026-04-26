import { NextResponse } from "next/server"

function bypassEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true"
}

/** Bật phiên dev (cookie) — chỉ khi NEXT_PUBLIC_DEV_AUTH_BYPASS=true */
export async function POST() {
  if (!bypassEnabled()) {
    return NextResponse.json({ error: "Chế độ dev tắt." }, { status: 403 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set("howl_dev_admin", "1", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

/** Tắt phiên dev */
export async function DELETE() {
  if (!bypassEnabled()) {
    return NextResponse.json({ error: "Chế độ dev tắt." }, { status: 403 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.delete("howl_dev_admin")
  return res
}
