"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

import { ROUTES } from "@/constants/routes"
import { createClient } from "@/lib/supabase/client"
import type { BrandOption, BrandUserRole } from "@/lib/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/shared/PageHeader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type UserMembership = {
  id: string
  user_id: string
  brand_id: string
  brand_name: string
  role: BrandUserRole
  created_at: string
}

type InviteForm = {
  user_id: string
  brand_id: string | null
  role: BrandUserRole
}

const roleOptions: { value: BrandUserRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "brand_admin", label: "Brand Admin" },
  { value: "brand_editor", label: "Brand Editor" },
]

function roleLabel(role: BrandUserRole): string {
  const found = roleOptions.find((x) => x.value === role)
  return found?.label ?? role
}

function roleBadgeClass(role: BrandUserRole): string {
  switch (role) {
    case "super_admin":
      return "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300"
    case "brand_admin":
      return "border-sky-500/40 bg-sky-500/10 text-sky-300"
    default:
      return "border-zinc-600 bg-zinc-800 text-zinc-300"
  }
}

function shortUserId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}...${id.slice(-4)}`
}

export function UserManagement({
  initialMemberships,
  brands,
}: {
  initialMemberships: UserMembership[]
  brands: BrandOption[]
}) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [banner, setBanner] = React.useState<string | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [inviteSaving, setInviteSaving] = React.useState(false)
  const [inviteForm, setInviteForm] = React.useState<InviteForm>({
    user_id: "",
    brand_id: brands[0]?.id ?? "",
    role: "brand_editor",
  })

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return initialMemberships
    return initialMemberships.filter((m) => {
      return (
        m.user_id.toLowerCase().includes(q) ||
        m.brand_name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
      )
    })
  }, [initialMemberships, search])

  async function updateRole(row: UserMembership, nextRole: BrandUserRole) {
    if (row.role === nextRole) return
    setBusyId(row.id)
    setBanner(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("brand_users")
        .update({ role: nextRole })
        .eq("id", row.id)
      if (error) {
        setBanner(error.message || "Không thể đổi vai trò.")
        return
      }
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function removeMembership(row: UserMembership) {
    setBusyId(row.id)
    setBanner(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("brand_users").delete().eq("id", row.id)
      if (error) {
        setBanner(error.message || "Không thể gỡ user khỏi thương hiệu.")
        return
      }
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function submitInvite() {
    const userId = inviteForm.user_id.trim()
    if (!userId) {
      setBanner("Vui lòng nhập user_id (UUID) của Supabase Auth user.")
      return
    }
    if (!inviteForm.brand_id) {
      setBanner("Vui lòng chọn thương hiệu.")
      return
    }
    setInviteSaving(true)
    setBanner(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("brand_users").insert({
        user_id: userId,
        brand_id: inviteForm.brand_id,
        role: inviteForm.role,
      })
      if (error) {
        setBanner(error.message || "Không thể tạo lời mời (membership).")
        return
      }
      setInviteOpen(false)
      setInviteForm({
        user_id: "",
        brand_id: brands[0]?.id ?? "",
        role: "brand_editor",
      })
      router.refresh()
    } finally {
      setInviteSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Người dùng"
        subtitle="Quản lý membership user theo thương hiệu và vai trò."
        breadcrumbs={[
          { label: "Tổng quan", href: ROUTES.dashboard },
          { label: "Người dùng" },
        ]}
        actions={
          <Button
            type="button"
            className="bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="mr-1 size-4" />
            Mời người dùng
          </Button>
        }
      />

      {banner ? (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {banner}
        </div>
      ) : null}

      <Input
        placeholder="Tìm theo user_id, thương hiệu hoặc role..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-lg border-zinc-700 bg-zinc-950"
      />

      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead>User</TableHead>
              <TableHead>Thương hiệu</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Ngày thêm</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id} className="border-zinc-800">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 border border-zinc-700">
                      <AvatarFallback className="bg-zinc-800 text-xs text-[#E8FF47]">
                        {row.user_id.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs text-zinc-100">
                        {shortUserId(row.user_id)}
                      </div>
                      <div className="text-[11px] text-zinc-500">{row.user_id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-zinc-200">{row.brand_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge className={roleBadgeClass(row.role)}>
                      {roleLabel(row.role)}
                    </Badge>
                    <Select
                      value={row.role}
                      onValueChange={(v) =>
                        void updateRole(row, v as BrandUserRole)
                      }
                      disabled={busyId === row.id}
                    >
                      <SelectTrigger className="h-8 w-40 border-zinc-700 bg-zinc-950 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
                        {roleOptions.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-zinc-400">
                  {new Date(row.created_at).toLocaleString("vi-VN")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-red-400 hover:bg-red-950/40 hover:text-red-300"
                    disabled={busyId === row.id}
                    onClick={() => void removeMembership(row)}
                    aria-label="Xóa membership"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={5} className="py-8 text-center text-zinc-400">
                  Không có user phù hợp.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-50">
          <DialogHeader>
            <DialogTitle>Mời người dùng</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Tạo dòng mới trong `brand_users` bằng user_id của Supabase Auth.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="invite-user-id">User ID (UUID)</Label>
              <Input
                id="invite-user-id"
                value={inviteForm.user_id}
                onChange={(e) =>
                  setInviteForm((s) => ({ ...s, user_id: e.target.value }))
                }
                placeholder="00000000-0000-0000-0000-000000000000"
                className="border-zinc-700 bg-zinc-950 font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>Thương hiệu</Label>
              <Select
                value={inviteForm.brand_id}
                onValueChange={(v) =>
                  setInviteForm((s) => ({ ...s, brand_id: v || null }))
                }
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v) =>
                  setInviteForm((s) => ({ ...s, role: v as BrandUserRole }))
                }
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-50">
                  {roleOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-zinc-800 bg-zinc-900/30">
            <Button
              variant="outline"
              className="border-zinc-700"
              onClick={() => setInviteOpen(false)}
              disabled={inviteSaving}
            >
              Hủy
            </Button>
            <Button
              className="bg-[#E8FF47] text-zinc-950 hover:bg-[#E8FF47]/90"
              onClick={() => void submitInvite()}
              disabled={inviteSaving}
            >
              {inviteSaving ? "Đang lưu..." : "Tạo lời mời"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
