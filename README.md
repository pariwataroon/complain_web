นี่คือโปรเจกต์ [Next.js](https://nextjs.org/) ที่สร้างขึ้นโดยใช้ [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app)

## เริ่มต้นใช้งาน

### ขั้นตอนที่ 1: ติดตั้ง Dependencies

ก่อนเริ่มต้นเซิร์ฟเวอร์พัฒนา **อย่าลืมติดตั้ง dependencies**:

```bash
npm install -f
```

เพื่อให้มั่นใจว่าทุกแพ็คเกจที่จำเป็นจะถูกติดตั้งครบถ้วน

### ขั้นตอนที่ 2: รันเซิร์ฟเวอร์พัฒนา

เมื่อทำการติดตั้ง dependencies เสร็จแล้ว ให้เริ่มต้นเซิร์ฟเวอร์พัฒนาได้ด้วยคำสั่ง:

```bash
npm run dev
# หรือ
yarn dev
```

จากนั้นเปิด [http://localhost:3000](http://localhost:3000) บนเว็บเบราว์เซอร์เพื่อดูผลลัพธ์

### ขั้นตอนที่ 3: แก้ไขโปรเจกต์

คุณสามารถเริ่มแก้ไขแอปพลิเคชันได้โดยการแก้ไขไฟล์ เช่น `pages/index.js` หน้าจอจะอัปเดตโดยอัตโนมัติเมื่อคุณบันทึกการเปลี่ยนแปลง

## การใช้งาน API Routes

- API Routes สามารถเข้าถึงได้ที่ [http://localhost:3000/api/hello](http://localhost:3000/api/hello)
- ไดเรกทอรี `pages/api` จะถูกแมปเป็น `/api/*` และไฟล์ในไดเรกทอรีนี้จะถูกปฏิบัติเป็น [API Routes](https://nextjs.org/docs/api-routes/introduction) แทนที่จะเป็น React Pages
- คุณสามารถปรับแต่ง API Endpoint ได้โดยแก้ไขไฟล์ `pages/api/hello.js`

## ตัวแปรสภาพแวดล้อม (Environment Variables)

- **สำคัญมาก**: โปรเจกต์นี้ไม่มีไฟล์ `.env` แต่จะมีเพียง `.env.example` เพื่อเป็นตัวอย่าง  
  **ห้าม** อัปโหลดไฟล์ `.env` จริงขึ้นไปในระบบควบคุมเวอร์ชัน (Version Control)  
  กรุณาเก็บข้อมูลสำคัญและการตั้งค่าที่ต้องขึ้นอยู่กับสภาพแวดล้อมไว้ในเครื่องของคุณเท่านั้น

## ศึกษาเพิ่มเติม

หากต้องการเรียนรู้เพิ่มเติมเกี่ยวกับ Next.js สามารถอ่านได้ที่:

- [เอกสาร Next.js](https://nextjs.org/docs) - เรียนรู้เกี่ยวกับฟีเจอร์และ API ของ Next.js
- [เรียนรู้ Next.js](https://nextjs.org/learn) - คอร์สเรียนแบบโต้ตอบของ Next.js

คุณยังสามารถดู [GitHub ของ Next.js](https://github.com/vercel/next.js) เพื่อร่วมให้ความคิดเห็นหรือมีส่วนร่วมในโปรเจกต์

## การ Deploy

วิธีที่ง่ายที่สุดในการ Deploy แอปพลิเคชัน Next.js คือการใช้ [แพลตฟอร์ม Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) ซึ่งสร้างโดยทีมพัฒนา Next.js

อ่านเพิ่มเติมเกี่ยวกับ [การ Deploy Next.js](https://nextjs.org/docs/deployment) ได้จากเอกสาร

## หมายเหตุ

1. **อย่าลืมรันคำสั่ง `npm install -f`** ก่อนรันเซิร์ฟเวอร์พัฒนาเพื่อป้องกันปัญหา Dependencies ขาดหาย
2. ตรวจสอบให้แน่ใจว่าไฟล์ `.env` ของคุณถูกตั้งค่าอย่างถูกต้องในเครื่อง โดยใช้ `.env.example` เป็นตัวอย่าง
3. **ห้าม Commit ตัวแปรหรือค่าที่สำคัญในไฟล์ `.env`** ขึ้นไปยังระบบควบคุมเวอร์ชัน เพื่อความปลอดภัยของข้อมูล