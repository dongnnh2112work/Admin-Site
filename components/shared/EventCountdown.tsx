import { differenceInCalendarDays, startOfDay } from "date-fns"
import { CalendarClock } from "lucide-react"

import { cn } from "@/lib/utils"

const WINDOW_DAYS = 7

export type EventCountdownProps = {
  /** Ngày sự kiện (ISO string hoặc Date) */
  eventDate: string | Date | null | undefined
  /** Tên sự kiện hiển thị */
  eventName?: string | null
  className?: string
}

function parseEventDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function daysLeftUntil(eventDay: Date, now: Date): number {
  return differenceInCalendarDays(startOfDay(eventDay), startOfDay(now))
}

export function EventCountdown({
  eventDate,
  eventName,
  className,
}: EventCountdownProps) {
  if (eventDate == null || eventDate === "") {
    return null
  }

  const parsed = parseEventDate(eventDate)
  if (!parsed) {
    return null
  }

  const daysLeft = daysLeftUntil(parsed, new Date())
  if (daysLeft < 0 || daysLeft > WINDOW_DAYS) {
    return null
  }

  const formattedDate = parsed.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const dayWord =
    daysLeft === 0
      ? "Hôm nay là ngày diễn ra sự kiện"
      : daysLeft === 1
        ? "Ngày mai là ngày diễn ra sự kiện"
        : `Còn ${daysLeft} ngày nữa đến sự kiện`

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-sky-500/35 bg-sky-950/45 px-3 py-3 text-sky-50",
        className
      )}
    >
      <div className="flex gap-2">
        <CalendarClock
          className="mt-0.5 size-5 shrink-0 text-sky-400"
          aria-hidden
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-sky-100">
            Sự kiện sắp diễn ra
            {eventName ? ` — ${eventName}` : ""}
          </p>
          <p className="text-xs text-sky-200/90">
            <time dateTime={parsed.toISOString()}>
              {formattedDate}
            </time>
            {" · "}
            <span className="font-medium text-sky-100">{dayWord}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
