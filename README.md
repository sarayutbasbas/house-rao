# HomeShelf

Mobile-first shared home inventory built with Next.js App Router, TypeScript, Tailwind CSS, Auth.js/NextAuth Google login, Drizzle ORM, Neon PostgreSQL, and Vercel Blob.

## Data model

| Table | Purpose |
| --- | --- |
| `users` | Google-signed-in people, keyed by verified email |
| `houses` | Shared homes and random invite codes |
| `memberships` | House membership and owner/member roles |
| `categories` | Custom categories scoped to one house |
| `items` | Current and archived inventory with photo, specs, quantity, threshold, expiry, checked state |
| `stock_events` | Quantity adjustment history with member and resulting quantity |

Items are archived when finished, preserving their image and specs for reordering. A low stock item is one whose quantity is less than or equal to its minimum; the shopping quantity is `max(0, minimum - quantity)`. Expiry warnings start seven days before the date.

## Project layout

```text
src/
  app/                Pages and API route handlers
    [houseId]/        Inventory, history, item detail, settings
    api/              Auth, houses, categories, items, uploads
  components/         Mobile shell, inventory, item form, settings
  db/                 Drizzle connection and schema
  lib/                Access control, validation, shared types
  auth.ts             Google Auth.js configuration
drizzle.config.ts     Migration configuration
.env.example          Required environment variables
```

## Local setup

1. Run `npm install`.
2. Create a Neon PostgreSQL database. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to its pooled connection string.
3. Create a Google OAuth web application. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
4. Generate `AUTH_SECRET` with `openssl rand -base64 32`.
5. Create a **public** Vercel Blob store, then set `BLOB_READ_WRITE_TOKEN` from its project environment variables. Images are public URLs; do not upload sensitive photos.
6. Run `npm run db:generate`, `npm run db:migrate`, then `npm run dev`.

For production, add the same variables to the hosting environment and add `https://YOUR_DOMAIN/api/auth/callback/google` to Google OAuth redirect URIs. Apply migrations before the first deployment. Auth.js detects the host on Vercel. Configure `AUTH_URL` if using a custom reverse proxy.

## รันด้วย Docker บนพอร์ต 8002

คัดลอก `.env.example` เป็น `.env.local` แล้วตั้งค่า `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` และ `BLOB_READ_WRITE_TOKEN` จากบริการจริง จากนั้นรัน:

```bash
docker compose up -d --build
docker compose ps
```

เปิด `http://localhost:8002` และเพิ่ม `http://localhost:8002/api/auth/callback/google` ใน Google OAuth authorized redirect URIs ใช้ `docker compose logs -f homeshelf` ดู log และ `docker compose down` เพื่อหยุดแอป ฐานข้อมูลใช้ Neon ภายนอก ไม่ได้สร้าง PostgreSQL ใน Compose; ให้รัน `npm run db:migrate` หลังตั้งค่า `DATABASE_URL` ก่อนใช้งานจริง หากใช้โดเมนหรือ reverse proxy ให้แก้ `AUTH_URL` ให้ตรงกับ URL ที่ผู้ใช้เปิด

## เชื่อมต่อ Cloudflare Tunnel

ติดตั้ง `cloudflared` เป็นบริการบนเครื่องโฮสต์ แล้วตั้งค่า **Published application route** ใน Cloudflare Dashboard ให้ public hostname ที่เลือกชี้ไปยัง `http://localhost:8002` (ชนิด HTTP) ตัว Compose เปิดพอร์ต 8002 เฉพาะ `127.0.0.1` สำหรับ tunnel บนเครื่องเดียวกัน เมื่อมีโดเมนแล้ว ให้เปลี่ยน `AUTH_URL` ใน `.env.local` เป็น `https://ชื่อโดเมน` และเพิ่ม `https://ชื่อโดเมน/api/auth/callback/google` ใน Google OAuth authorized redirect URIs จากนั้นรัน `docker compose up -d --force-recreate`

ถ้าต้องการให้โปรเจกต์ตั้งค่า route ผ่าน Cloudflare API ให้คัดลอก `.env.cloudflare.example` เป็น `.env.cloudflare.local` ใส่ชื่อโดเมนเต็มและ API token ที่มีสิทธิ์ **Zone Read, DNS Edit, Cloudflare Tunnel Write** จากนั้นรัน `node scripts/cloudflare-route.mjs` เพื่อตรวจแผน และ `node scripts/cloudflare-route.mjs --apply` เพื่อตั้งค่า Script จะไม่แทนที่ ingress หรือ DNS ที่ชี้ไปที่อื่นอยู่แล้ว

Uploads accept JPG, PNG, or WebP up to 4 MB. Every API operation verifies the signed-in user belongs to the relevant house. Invitation codes can be rotated by the house owner. The app needs real Neon, Google OAuth, and Blob credentials to test the complete external flow.
# house-rao
