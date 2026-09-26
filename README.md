# HomeShelf / house-rao

แอปจัดการสต็อกของใช้ในบ้านด้วย Next.js, Auth.js (Google), Drizzle และ PostgreSQL

## สภาพแวดล้อม

| ที่ใช้งาน | URL | ฐานข้อมูล | รูปสินค้า |
| --- | --- | --- | --- |
| Docker บนเครื่อง | `https://bn-house-rao.basnana.com` | PostgreSQL ใน Docker volume `postgres_data` | Docker volume `uploads_data` บนเครื่อง |
| Vercel production (`house-rao`) | `https://house-rao.basnana.com` | Neon (`homeshelf-db`) | Vercel Blob (`house-rao-images`) |

ข้อมูลสองฝั่งแยกกันหลังจากคัดลอกข้อมูลตั้งต้น รูปใน Docker ให้บริการผ่าน API ที่ตรวจสิทธิ์สมาชิกบ้าน; รูปบน Vercel Blob เป็น public URL

## โครงสร้าง

```text
src/app/              หน้าจอและ API (รวม API สำหรับรูป Docker)
src/components/       ส่วน UI สำหรับมือถือ
src/db/               Drizzle schema และ PostgreSQL connection
src/lib/              validation และการตรวจสิทธิ์
drizzle/              migration
compose.yaml          แอป PostgreSQL migration และ Cloudflare Tunnel
vercel.json           Vercel Next.js framework
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

DNS ที่ Cloudflare ต้องมี `A house-rao 76.76.21.21` ตามค่าที่ Vercel ระบุ และ Google OAuth Web client ต้องเพิ่ม origin `https://house-rao.basnana.com` กับ redirect URI `https://house-rao.basnana.com/api/auth/callback/google` โดยเก็บค่า Docker เดิมไว้

ไฟล์ `.env.neon.backup.local` เป็นข้อมูลเชื่อมต่อ Neon เดิมสำหรับกู้คืน/ดูแลระบบ เก็บเป็นความลับและอย่า commit
