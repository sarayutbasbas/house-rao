# HouseRao

แอปจัดการสต็อกของใช้ในบ้านด้วย Next.js, Auth.js (Google), Drizzle, PostgreSQL และ shadcn/ui ธีมหลักสีแดงเบอร์กันดี เลือกสว่าง/มืด/ตามระบบได้ในหน้า Settings

## สภาพแวดล้อม

| ที่ใช้งาน | URL | ฐานข้อมูล | รูปสินค้า |
| --- | --- | --- | --- |
| Docker บนเครื่อง | `https://bn-house-rao.basnana.com` | PostgreSQL ใน Docker volume `postgres_data` | Docker volume `uploads_data` บนเครื่อง |
| Vercel production (`house-rao`) | `https://house-rao.basnana.com` | Neon (`homeshelf-db`) | Vercel Blob (`house-rao-images`) |

ข้อมูลสองฝั่งแยกกันหลังจากคัดลอกข้อมูลตั้งต้น รูปใน Docker ให้บริการผ่าน API ที่ตรวจสิทธิ์สมาชิกบ้าน; รูปบน Vercel Blob เป็น public URL

หน้าหลักใช้ `/home`, `/history`, `/settings` โดยอ่านบัญชีที่ล็อกอินและบ้านที่เลือกจากคุกกี้ แล้วตรวจสิทธิ์สมาชิกกับฐานข้อมูลทุกครั้ง สามารถสลับบ้านได้ใน Settings; ลิงก์เดิมแบบ `/:houseId` ยังเปิดได้

เจ้าของบ้านหลักตั้งหรือถอดสิทธิ์เจ้าของร่วมและนำสมาชิกออกได้ เจ้าของร่วมช่วยนำสมาชิกทั่วไปออกได้ แต่ไม่สามารถเปลี่ยนสิทธิ์ของเจ้าของบ้านหลัก รูปโปรไฟล์มาจาก Google และผู้ใช้แก้ชื่อที่แสดงได้ใน Settings บ้านเลขที่ใส่ได้ตอนสร้างบ้านและแก้ได้ภายหลัง

รูปต้นฉบับต้องเป็น JPG, PNG หรือ WebP ไม่เกิน 8 MB เบราว์เซอร์บีบอัดก่อนส่งเพื่อให้ request อยู่ใต้ขีดจำกัดของ Vercel จากนั้นเซิร์ฟเวอร์แปลงเป็น WebP ขนาดภาพไม่เกิน 1600 px และไฟล์ที่เก็บไม่เกิน 1 MB ทั้งสองสภาพแวดล้อม

สต็อกเก็บแยกใน `item_batches` ตามจำนวนและวันหมดอายุของแต่ละรอบซื้อ กด `+` เพื่อเติมสต็อกและระบุวันที่; กด `−` เพื่อตัดชุดที่หมดอายุก่อน (ชุดไม่ระบุวันที่ใช้ทีหลัง) หน้ารายละเอียดเลือกใช้เฉพาะชุด แก้วันที่ หรือแยกบางชิ้นไปอีกวันได้ ยอดรวมและวันหมดอายุเร็วสุดใน `items` อัปเดตพร้อมกันใน transaction ที่ล็อกสินค้า ปุ่มทำเครื่องหมายว่าหมดจะตัดทุกชุดเป็นศูนย์และเก็บข้อมูลชุดเก่าไว้

Migration `0002` ย้ายจำนวนและวันหมดอายุเดิมเป็นชุดแรก ตรวจสต็อกผ่าน Docker ด้วย `node scripts/test-stock-local.mjs` และตรวจช่องตัวเลขกับสิทธิ์ด้วย `node --test tests/*.test.mjs`

## โครงสร้าง

```text
src/app/              หน้าจอและ API (รวม API สำหรับรูป Docker)
src/components/       ส่วน UI สำหรับมือถือ
src/db/               Drizzle schema และ PostgreSQL connection
src/lib/              validation และการตรวจสิทธิ์
drizzle/              migration
compose.yaml          แอป PostgreSQL migration และ Cloudflare Tunnel
vercel.json           Vercel Next.js framework และ Function region sin1
```

## Docker

ไฟล์ `.env.docker.local` (ไม่ commit) ต้องมี `DATABASE_URL=postgresql://...@postgres:5432/homeshelf`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL=https://bn-house-rao.basnana.com`, `STORAGE_DRIVER=local` และ `LOCAL_UPLOAD_DIR=/app/data/uploads` ดูรูปแบบใน `.env.docker.example`

```bash
docker compose --profile cloudflare up -d --build
docker compose ps
```

แอปเปิดที่ `http://localhost:8002` สำหรับการตรวจจากเครื่อง และ Cloudflare Tunnel ชี้ `bn-house-rao.basnana.com` ไป `http://host.docker.internal:8002` ข้อมูลเก็บใน Docker volumes บนเครื่อง อย่าใช้ `docker compose down -v` ถ้ายังต้องการข้อมูล

## Vercel production

เชื่อม repository กับ Vercel project `house-rao` แล้ว deploy ด้วย `vercel deploy --prod` โปรเจกต์นี้ต้องมี `DATABASE_URL` จาก Neon, `BLOB_READ_WRITE_TOKEN` จาก Blob store, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL=https://house-rao.basnana.com`, `AUTH_TRUST_HOST=true`, `STORAGE_DRIVER=blob` ใช้ Neon direct URL `DATABASE_URL_UNPOOLED` สำหรับ migration

หลังเปลี่ยน schema ให้รัน `npm run db:generate` และ `npm run db:migrate` กับฐานข้อมูลแต่ละฝั่งก่อน deploy; Docker รัน migration ให้อัตโนมัติเมื่อ `docker compose up -d --build`

DNS ที่ Cloudflare ใช้ `CNAME house-rao f0ec9fc7f1a90461.vercel-dns-017.com` แบบ DNS only และ Google OAuth Web client ต้องมี origin `https://house-rao.basnana.com` กับ redirect URI `https://house-rao.basnana.com/api/auth/callback/google` โดยเก็บค่า Docker เดิมไว้

ไฟล์ `.env.neon.backup.local` เป็นข้อมูลเชื่อมต่อ Neon เดิมสำหรับกู้คืน/ดูแลระบบ เก็บเป็นความลับและอย่า commit

## Shared RouteRao design / iPhone Home Screen

HouseRao reuses the active bn-trip SVG liquid-glass navigation and its refraction
engine (`app-bottom-navigation.tsx`, `codepen-switcher-glass.ts`, `rao-navigation.css`).
`PageIntro`, `SegmentedFilter`, and `EmptyState` are adapted from bn-trip's page intro,
trip filters, and empty state. Shared surface, radius, mobile sheet, and spacing rules
are in `globals.css`; existing shadcn form primitives retain their accessible behavior.
The HouseRao pastel palette and IBM Plex font are the brand tokens; see `docs/pastel-brand.md`.

Primary tabs and header navigation use `replace`, so switching tabs does not add
browser history. Item detail links still open normally. Existing browser history
from before entering the app is not erased or trapped.

On iPhone: open the desired HTTPS domain in Safari → Share → Add to Home Screen
(enable Open as Web App when offered). Launch the new HouseRao icon for standalone
mode. If an older shortcut still opens Safari, remove that shortcut and add it again.
`src/app/manifest.ts` defines installation metadata, icons and `/home` start URL.
The root layout enables Apple web-app mode and viewport safe areas. Authentication
and data still require an internet connection; private responses are not cached offline.

### จัดเก็บสินค้าตามห้อง

- โครงสร้าง: บ้าน → ห้อง → หมวดหมู่ → สินค้า พร้อมตำแหน่งย่อย เช่น ตู้หรือชั้นวาง
- เพิ่ม/แก้ไขห้องและรูปจากหน้าแรก หรือ ตั้งค่า → ห้องในบ้าน; รูปใช้ตัวอัปโหลดร่วมกับสินค้า โดยห้องครอปแนวนอน 16:9 และสินค้าครอปแนวตั้ง 3:4
- กดการ์ดห้องเพื่อดูสินค้า และจัดการหมวดหมู่ของห้องนั้น (ชื่อหมวดหมู่ซ้ำกันได้เมื่ออยู่คนละห้อง)
- หน้าสินค้าค้นหาได้ทุกห้อง ทั้งชื่อ แบรนด์ รายละเอียด หมวดหมู่และตำแหน่ง; เมื่อค้นหาจะรวมสินค้าที่ใช้หมดแล้วด้วย
- Migration `0003_reflective_mikhail_rasputin.sql` เพิ่ม rooms, categories.room_id, items.room_id และ items.location; ข้อมูลเดิมคงอยู่ใน “ยังไม่ระบุห้อง”
- ลบห้องต้องยืนยัน: หมวดหมู่ในห้องจะถูกลบ แต่สินค้า สต็อก และประวัติยังอยู่ โดยกลับไปเป็นรายการที่ไม่ระบุห้อง

### Shopping checklist และสแกนสินค้า

- `/shopping` รวมสินค้าที่คงเหลือ ≤ จุดเตือนจากทุกห้อง; ค่าแนะนำเติมให้เกินจุดเตือน 1 หน่วย (แก้จำนวนได้)
- Checklist แชร์ในบ้าน แยกจากการเช็กสินค้าเดิม; ติ๊กแล้วขีดฆ่า แต่ยังไม่เปลี่ยนสต็อกจนยืนยัน “เติมสต็อกเฉพาะที่เลือก”
- ยืนยันเติมเฉพาะรายการที่ติ๊ก ตามจำนวนและวันหมดอายุที่ระบุ เป็นชุดสต็อกใหม่และประวัติรายการ; ใช้ transaction + receipt request ID ป้องกันเติมซ้ำ/เติมบางส่วน
- เปิดกล้องสแกน EAN/UPC หรือ QR ที่มีรหัสสินค้า, เลือกรูป หรือกรอกเลขได้; ใช้ ZXing เฉพาะเมื่อเปิด scanner
- ค้นบาร์โค้ดจากสินค้าในบ้านก่อน แล้วใช้ Open Food Facts API (ODbL) สำหรับชื่อ แบรนด์ ขนาดตามที่มี; ไม่เปิด URL จาก QR และไม่คัดลอกวันหมดอายุเก่ามาใช้กับชุดใหม่
- วันหมดอายุกรอกตามฉลากจริง; ไม่มีข้อมูล/กล้องไม่พร้อม/บริการค้นหาล่ม ยังเพิ่มสินค้าเองได้
- Migration `0004_lame_stranger.sql`: shopping_entries, shopping_receipts, items.barcode; ไม่แก้สต็อกเดิม

- ลบสินค้าจากปุ่มถังขยะด้านขวาของปุ่มบันทึกในหน้าแก้ไข ต้องยืนยันก่อนลบสินค้า สต็อก ประวัติ และ checklist ของสินค้านั้น
