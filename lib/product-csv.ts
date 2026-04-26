/** Xuất / nhập CSV sản phẩm — UTF-8, trường có dấu phẩy được bọc ngoặc kép. */

export type ProductCsvRow = Record<string, string>

const HEADERS = [
  "id",
  "name",
  "slug",
  "status",
  "is_featured",
  "sort_order",
  "short_desc",
  "description",
  "category_slug",
  "seo_title",
  "seo_description",
  "image_url",
  "thumbnail_url",
  "metadata_kv",
] as const

export type ProductCsvHeader = (typeof HEADERS)[number]

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
        continue
      }
      inQuotes = !inQuotes
    } else if (c === "," && !inQuotes) {
      result.push(cur)
      cur = ""
    } else {
      cur += c
    }
  }
  result.push(cur)
  return result
}

export function productsToCsv(rows: ProductCsvRow[]): string {
  const lines = [
    HEADERS.join(","),
    ...rows.map((row) =>
      HEADERS.map((h) => escapeCsvCell(row[h] ?? "")).join(",")
    ),
  ]
  return "\uFEFF" + lines.join("\r\n")
}

export function parseProductsCsv(text: string): {
  headers: string[]
  rows: ProductCsvRow[]
  error?: string
} {
  const normalized = text.replace(/^\uFEFF/, "").trim()
  if (!normalized) {
    return { headers: [], rows: [], error: "File rỗng." }
  }
  const lines = normalized.split(/\r?\n/).filter((l) => l.trim() !== "")
  if (lines.length < 2) {
    return { headers: [], rows: [], error: "Cần ít nhất một dòng tiêu đề và một dòng dữ liệu." }
  }
  const headers = parseCsvLine(lines[0]!).map((h) => h.trim().toLowerCase())
  const rows: ProductCsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!)
    const row: ProductCsvRow = {}
    headers.forEach((h, j) => {
      row[h] = cells[j] ?? ""
    })
    rows.push(row)
  }
  return { headers, rows }
}

export function expectedCsvHeaders(): readonly string[] {
  return HEADERS
}

/** key=value|key2=value2 — giá trị phức tạp được JSON.stringify; tránh | trong chuỗi thô */
export function metadataToKv(meta: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return ""
  return Object.entries(meta)
    .map(([k, v]) => {
      let cell: string
      if (v === null || v === undefined) cell = ""
      else if (typeof v === "string") cell = v
      else if (typeof v === "number" || typeof v === "boolean") cell = String(v)
      else cell = JSON.stringify(v)
      return `${k.trim()}=${cell.replace(/\|/g, " ")}`
    })
    .join("|")
}

export function metadataFromKv(s: string): Record<string, unknown> | null {
  const t = s.trim()
  if (!t) return null
  const out: Record<string, unknown> = {}
  for (const part of t.split("|")) {
    const eq = part.indexOf("=")
    if (eq <= 0) continue
    const k = part.slice(0, eq).trim()
    const v = part.slice(eq + 1).trim()
    if (!k) continue
    if (v === "") {
      out[k] = ""
      continue
    }
    if (
      (v.startsWith("{") && v.endsWith("}")) ||
      (v.startsWith("[") && v.endsWith("]"))
    ) {
      try {
        out[k] = JSON.parse(v) as unknown
        continue
      } catch {
        /* giữ chuỗi */
      }
    }
    if (v === "true") {
      out[k] = true
      continue
    }
    if (v === "false") {
      out[k] = false
      continue
    }
    const num = Number(v)
    if (v !== "" && Number.isFinite(num) && String(num) === v) {
      out[k] = num
      continue
    }
    out[k] = v
  }
  return Object.keys(out).length ? out : null
}
