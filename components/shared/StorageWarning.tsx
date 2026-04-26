import { AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

const DEFAULT_QUOTA_BYTES = 800 * 1024 * 1024

export type StorageWarningProps = {
  /** Dung lượng đã dùng (bytes) */
  usedBytes: number
  /** Ngưỡng cảnh báo 0–1, mặc định 80% */
  threshold?: number
  /** Hạn mức so sánh (mặc định 800MB theo TODO) */
  quotaBytes?: number
  className?: string
}

function formatGiB(bytes: number): string {
  const gib = bytes / (1024 * 1024 * 1024)
  return `${gib.toFixed(2)} GB`
}

export function StorageWarning({
  usedBytes,
  threshold = 0.8,
  quotaBytes = DEFAULT_QUOTA_BYTES,
  className,
}: StorageWarningProps) {
  const ratio = quotaBytes > 0 ? usedBytes / quotaBytes : 0
  if (ratio <= threshold) {
    return null
  }

  const pct = Math.min(100, Math.round(ratio * 100))

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-amber-500/40 bg-amber-950/50 px-3 py-3 text-amber-100 shadow-sm",
        className
      )}
    >
      <div className="flex gap-2">
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-amber-50">
            Dung lượng lưu trữ gần đầy
          </p>
          <p className="text-xs text-amber-200/90">
            Đã dùng khoảng {formatGiB(usedBytes)} trong hạn mức {formatGiB(quotaBytes)}{" "}
            ({pct}%). Nên xóa tệp không cần thiết hoặc liên hệ quản trị.
          </p>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-amber-950/80"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-amber-400 transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
