# Cursor Build Tracker — Admin Site

> **Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Shadcn/ui · Supabase  
> **Quy tắc:** Hoàn thành từng step → chạy `npx tsc --noEmit` → mới sang step tiếp.  
> **Khi Cursor lạc:** _"Stop everything. Revert the last change. Read only the current step prompt again and implement exactly what it says, nothing more."_

---

## Tiến độ tổng quan

| Phase | Nội dung | Số tasks |
|-------|----------|----------|
| Phase 0 | Khởi tạo project | 3 |
| Phase 1 | Auth — Login | 1 |
| Phase 2 | App Shell — Layout | 4 |
| Phase 3 | Shared Components | 6 |
| Phase 4 | Dashboard | 2 |
| Phase 5 | Brands | 2 |
| Phase 6 | Products | 2 |
| Phase 7 | Media Manager | 1 |
| Phase 8 | Notifications | 1 |
| Phase 9 | Users + Audit Log + Settings | 3 |
| Phase Final | Kiểm tra toàn bộ | 7 |

---

## Phase 0 — Khởi tạo project

- [x] **STEP 0.1** — Chạy lệnh tạo project và cài dependencies  
  `create-next-app` + `shadcn init` + `npm install` tất cả packages  
  ⚠️ _Verify: chạy `npm run dev` để xác nhận app khởi động được_  
  ✅ _Done: Next.js 16 + shadcn (toast→sonner), deps đã cài; `npm run lint` + `npm run build` + `npm run dev` OK. Lưu ý: folder tên có space → scaffold rồi merge; `package.json` name `howls-admin-site`._

- [x] **STEP 0.2** — Tạo file cấu trúc và types  
  `lib/types.ts` · `lib/supabase/` · `lib/auth.ts` · `constants/routes.ts`  
  ⚠️ _Verify: chạy `npx tsc --noEmit` — phải có 0 lỗi_  
  ✅ _Done: đã thêm `lib/types.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/auth.ts`, `constants/routes.ts`; `npx tsc --noEmit` OK._

- [x] **STEP 0.3** — Điền biến môi trường vào `.env.local`  
  🔴 **Quan trọng:** `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
  Lấy từ: Supabase Dashboard → Settings → API  
  ✅ _Done: đã thêm `.env.example` (commit được nhờ `!.env.example` trong `.gitignore`). **Bạn** cần copy → `.env.local` và điền key thật trên máy/CI._

---

## Phase 1 — Auth (Login)

- [x] **STEP 1.1** — Trang Login `app/login/page.tsx`  
  Form email + mật khẩu · redirect sau login · thông báo lỗi tiếng Việt  
  ⚠️ _Verify: truy cập `/login`, submit form, xác nhận redirect_  
  ✅ _Done: `app/login/page.tsx` (UI tiếng Việt, kiểm tra `brand_users` sau login); `app/(admin)/layout.tsx` + `app/(admin)/dashboard/page.tsx` tối thiểu + `requireAuth`; `/` redirect theo phiên; `dynamic = force-dynamic` cho route dùng Supabase. `npx tsc --noEmit` + `npm run lint` + `npm run build` OK._

---

## Phase 2 — App Shell (Layout)

- [x] **STEP 2.1** — Sidebar (desktop) `components/layout/Sidebar.tsx`  
  Icon-only 44px · dark navy `#0F1729` · tooltip tiếng Việt · role-based ẩn/hiện  
  ✅ _Done: `Sidebar` + `constants/navigation.ts`; tooltip Base UI (`render` + `Link`); chỉ hiện `md:flex`._

- [x] **STEP 2.2** — TopBar `components/layout/TopBar.tsx`  
  Brand selector dropdown · notification bell · user avatar + đăng xuất  
  ✅ _Done: chọn brand (super + nhiều brand) · chuông → thông báo theo brand hiện tại · menu avatar + đăng xuất (Supabase)._

- [x] **STEP 2.3** — Bottom Tab Bar (mobile) `components/layout/BottomTabBar.tsx`  
  5 tabs · ẩn trên desktop (`md:hidden`)  
  ✅ _Done: Tổng quan · Thương hiệu · Sản phẩm · Thông báo · tab 5 (Cài đặt super / Chi tiết TH khác)._

- [x] **STEP 2.4** — AppShell `components/layout/AppShell.tsx`  
  Kết hợp sidebar + topbar + bottom tab · auth guard  
  ⚠️ _Verify: `/dashboard` redirect về `/login` nếu chưa đăng nhập_  
  ✅ _Done: `AppShell` + `TooltipProvider`; `app/(admin)/layout.tsx` fetch `brands` + bọc shell; không dùng `position: fixed` (sticky TopBar). `npx tsc --noEmit` + `npm run lint` + `npm run build` OK._

---

## Phase 3 — Shared Components

- [x] **STEP 3.1** — ConfirmDialog `components/shared/ConfirmDialog.tsx`  
  🔴 **Bắt buộc trước khi xóa bất cứ thứ gì** · nút đỏ · không đóng khi click ngoài  
  ✅ _Done: `Dialog` + `disablePointerDismissal` · `showCloseButton={false}` · nút `destructive` · copy tiếng Việt._

- [x] **STEP 3.2** — PageHeader `components/shared/PageHeader.tsx`  
  Title + subtitle + breadcrumb + actions slot  
  ✅ _Done: breadcrumb + `Link` / text · slot `actions`._

- [x] **STEP 3.3** — StatCard `components/shared/StatCard.tsx`  
  Label + số lớn + subtext có màu (success/warning/danger)  
  ✅ _Done: `subtextTone` default | success | warning | danger._

- [x] **STEP 3.4** — StorageWarning `components/shared/StorageWarning.tsx`  
  Hiện khi > 80% (800MB) · amber banner · progress bar  
  ✅ _Done: `quotaBytes` mặc định 800MB · `threshold` 0.8._

- [x] **STEP 3.5** — EventCountdown `components/shared/EventCountdown.tsx`  
  Hiện khi sự kiện trong vòng 7 ngày · blue banner · tính `daysLeft`  
  ✅ _Done: `date-fns` + `startOfDay` · hiển thị ngày `vi-VN` / múi giờ `Asia/Ho_Chi_Minh`._

- [x] **STEP 3.6** — EmptyState `components/shared/EmptyState.tsx`  
  Icon + title + description + action button · dùng ở nhiều trang  
  ⚠️ _Verify: `npx tsc --noEmit` — 0 lỗi trước khi sang Phase 4_  
  ✅ _Done: `actionLabel`/`onAction` + `children`. `npx tsc --noEmit` + `npm run lint` + `npm run build` OK._

---

## Phase 4 — Dashboard

- [x] **STEP 4.1** — Dashboard data fetching (Server Component)  
  Fetch: brands count · products count · notifs active · audit logs  
  Phân quyền: super_admin thấy tất cả, brand_admin chỉ thấy brand của mình  
  ✅ _Done: `lib/dashboard.ts` (`getDashboardData`): đếm + thương hiệu gần đây + sự kiện tới; nhật ký: `super_admin` + `brand_admin` (theo brand); `brand_editor` không xem; thông báo active: brand mình + broadcast (`brand_id` null)._

- [x] **STEP 4.2** — Dashboard UI (Client Component) `components/dashboard/DashboardView.tsx`  
  Banners · 4 StatCards · Brands gần đây · Hoạt động gần đây · Quick Actions 2×2  
  ⚠️ _Verify: Dashboard load được, stat cards hiển thị số đúng_  
  ✅ _Done: `PageHeader`, `EventCountdown`, `StatCard`×4, danh sách + quick actions 2×2 (`Link` + `buttonVariants`); super: link Users/Settings. `storageUsedBytes` tạm `null`. `npm run lint` + `npm run build` OK._

---

## Phase 5 — Brands

- [x] **STEP 5.1** — Brands List `app/(admin)/brands/page.tsx`  
  Search realtime · filter pills · table có color dot + slug + status  
  Kebab menu: Sửa · Nhân bản · Xóa (với ConfirmDialog)  
  ✅ _Done: `BrandList`; chỉ `super_admin` Nhân bản/Xóa; `brand_editor` xem + sản phẩm; mobile cards; `ConfirmDialog`._

- [x] **STEP 5.2** — Brand Detail `app/(admin)/brands/[id]/page.tsx` — 4 tabs  
  🔴 **Không được hiện ô JSON nào với user**  
  Tab 1: Thông tin cơ bản · Tab 2: Giao diện (upload logo/banner)  
  Tab 3: Header & Footer (form bình thường, lưu thành JSON) · Tab 4: Config thông báo  
  ⚠️ _Verify: lưu từng tab, kiểm tra dữ liệu cập nhật trong Supabase_  
  ✅ _Done: `BrandDetailView` + form `key={id+updated_at}`; lưu từng tab; upload `brand-assets`; `brand_editor` read-only. `npm run lint` + `npm run build` OK._

---

## Phase 6 — Products

- [x] **STEP 6.1** — Products List `app/(admin)/brands/[id]/products/page.tsx`  
  Search · filter pills · sort · Xuất CSV · Nhập CSV  
  Bulk actions: Đặt Active / Draft / Archived / Xóa  
  Status toggle inline · Featured toggle inline (không cần nút Lưu)  
  ✅ _Done: `ProductList` + `lib/product-csv.ts` (UTF-8 BOM, metadata_kv). Bypass: `devMockProducts`. `npx tsc` + `npm run lint` + `npm run build` OK._

- [x] **STEP 6.2** — Product Form `components/products/ProductForm.tsx`  
  2-column layout (desktop) · metadata key-value builder  
  🔴 **Không hiện raw JSON** · Upload ảnh chính + ảnh bổ sung  
  Buttons: "Lưu nháp" và "Lưu & Đăng"  
  ⚠️ _Verify: tạo sản phẩm mới, upload ảnh, kiểm tra trong Supabase_  
  ✅ _Done: `app/(admin)/brands/[id]/products/new` + `[productId]`; lưu nháp/đăng; upload sau khi có `productId`; `devMockProduct` bypass. **Bạn** verify trên Supabase thật._

---

## Phase 7 — Media Manager

- [x] **STEP 7.1** — Media Manager `app/(admin)/brands/[id]/assets/page.tsx`  
  Storage usage bar · folder tree bên trái · file grid bên phải  
  Drag & drop upload · hover overlay: Copy URL + Xóa  
  ⚠️ _Verify: upload ảnh, copy URL, paste URL vào trình duyệt xem được ảnh_  
  ✅ _Done: `components/media/MediaManager.tsx` + route assets; folder tree + filter/search, drag-drop (`react-dropzone`), upload bucket `brand-assets` + insert `brand_assets`, overlay copy/delete (ConfirmDialog), usage bar theo bytes scan `brands/{slug}`. `npx tsc` + `npm run lint` + `npm run build` OK._

---

## Phase 8 — Notifications

- [x] **STEP 8.1** — Notifications page + Form Dialog  
  `app/(admin)/brands/[id]/notifications/page.tsx`  
  Status summary pills · table + toggle switch  
  `NotificationFormDialog`: schedule + CTA + level badge · mở dialog (không phải trang mới)  
  ⚠️ _Verify: tạo thông báo, toggle bật/tắt, kiểm tra show_from/show_until_
  ✅ _Done: thêm route `app/(admin)/brands/[id]/notifications/page.tsx` + `components/notifications/NotificationList.tsx` (table, summary pills, filter, inline toggle, create/edit dialog với schedule/CTA/level/scope), hỗ trợ `dev-bypass` qua `devMockNotifications`. `npx tsc --noEmit` + `npm run lint` + `npm run build` OK._

---

## Phase 9 — Users + Audit Log + Settings

- [x] **STEP 9.1** — Users page `app/(admin)/users/page.tsx`  
  🔴 Guard: chỉ `super_admin` được vào  
  Avatar màu theo role · Đổi vai trò inline · InviteUserDialog
  ✅ _Done: thêm `app/(admin)/users/page.tsx` + `components/users/UserManagement.tsx`; guard `super_admin` (khác role → `notFound()`), list membership từ `brand_users` + `brands(name)`, đổi role inline, xóa membership, `InviteUserDialog` tạo membership mới (user_id + brand + role). `npx tsc --noEmit` + `npm run lint` + `npm run build` OK._

- [x] **STEP 9.2** — Audit Log `app/(admin)/audit-log/page.tsx`  
  🔴 Guard: chỉ `super_admin` được vào  
  Filter brand + action + date · mô tả hành động tiếng Việt · collapsible detail row
  ✅ _Done: thêm `app/(admin)/audit-log/page.tsx` + `components/audit/AuditLogView.tsx`; guard `super_admin` (`notFound()` nếu role khác), filter brand/action/date (7d/30d/custom), mô tả hành động tiếng Việt, bảng có expandable detail row hiển thị `record_id`, `user_id`, `ip_address`, `old_data/new_data`._

- [x] **STEP 9.3** — Settings `app/(admin)/settings/page.tsx`  
  🔴 Guard: chỉ `super_admin` được vào  
  Kết nối Supabase · Storage usage · System info · nút "Kiểm tra kết nối"
  ✅ _Done: thêm `app/(admin)/settings/page.tsx`, `components/settings/SettingsView.tsx`, `lib/settings.ts` và API `app/api/settings/check-connection/route.ts`; guard `super_admin`, hiển thị thống kê + storage usage ước tính + system info, và nút "Kiểm tra kết nối" (DB + Storage)._

---

## Phase Final — Kiểm tra toàn bộ

- [x] Chạy `npx tsc --noEmit` → phải có **0 lỗi**
- [x] Chạy `npm run build` → phải build **thành công**
- [ ] Test login + redirect đúng
- [ ] Test role-based menu: super_admin thấy tất cả · brand_admin ẩn Users/Audit Log
- [ ] Test mobile (resize < 768px): sidebar ẩn · bottom tab bar hiện · form không tràn
- [ ] Test upload ảnh end-to-end: upload → URL cập nhật trong DB → hình hiện trên giao diện
- [ ] 🔴 Test **không có ô JSON nào** hiện với user: Brand detail · Product metadata · Notification config
  ✅ _Auto-verify: `npx tsc --noEmit` + `npm run build` pass. Các mục UI/login/role/mobile/upload vẫn cần verify tay trên browser._

---

## Lệnh hay dùng

```bash
# Kiểm tra TypeScript sau mỗi step
npx tsc --noEmit

# Chạy dev server
npm run dev

# Build trước khi deploy
npm run build
```

## Reset command cho Cursor

```
Stop everything. Revert the last change. Read only the current step 
prompt again and implement exactly what it says, nothing more.
```

```
Run npx tsc --noEmit and show me the full error output.
Fix only the TypeScript errors, do not change any other code.
```
