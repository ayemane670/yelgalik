# يلقالك (YelgaLik) — Runnable MVP

Marketplace معكوس: المشتري ينشر ما يبحث عنه، والبائع ينشر ما يملكه، والنظام يطابق بينهما تلقائيًا ويُخطر الطرفين. مبني بـ **Next.js 14 (App Router) + Supabase (Postgres/Auth/Realtime) + Tailwind CSS**.

Stack مُختار لأن: تطوير سريع (خصوصًا Auth + DB + Realtime جاهزة في Supabase بدون بناء backend منفصل)، تكلفة منخفضة جدًا (خطة Supabase المجانية تكفي MVP)، ونشر فوري على Vercel.

---

## 1. البنية

```
yelgalik/
├── app/
│   ├── (screens)/          Splash, onboarding, login, signup...
│   ├── home/                الرئيسية
│   ├── post-request/        نشر "أبحث عن"
│   ├── post-product/        نشر "أبيع"
│   ├── results/             نتائج المطابقة
│   ├── my-requests/  my-products/  saved/  profile/  settings/  report/
│   ├── chat/                قائمة المحادثات + chat/[id]
│   ├── notifications/
│   ├── admin/                لوحة الإدارة (محمية بـ is_admin)
│   └── api/
│       ├── requests/         POST ينشئ طلب + reverse-search على المنتجات
│       ├── products/         POST ينشئ منتج + reverse-search على الطلبات
│       ├── matches/          نتائج + طلب تواصل
│       ├── matches/[id]/respond/   قبول/رفض التواصل → يفتح محادثة
│       ├── messages/         Chat
│       ├── notifications/
│       ├── reports/  blocks/
├── lib/
│   ├── matching.ts            ⭐ خوارزمية المطابقة (Match Score)
│   └── supabase/               client.ts (متصفح) + server.ts (Server/Admin)
├── components/
│   ├── BottomNav.tsx
│   └── CategoryCityPicker.tsx
├── supabase/schema.sql         ⭐ قاعدة البيانات الكاملة + RLS + Seed data
├── middleware.ts                تحديث جلسة Supabase
└── STRATEGY.md                  نموذج الربح + النمو عبر فيسبوك + Viral Loop + خطة الإطلاق
```

---

## 2. التشغيل المحلي

### المتطلبات
- Node.js 18+
- حساب Supabase مجاني (https://supabase.com)

### الخطوات

```bash
# 1) ثبّت الحزم
cd yelgalik
npm install

# 2) أنشئ مشروع Supabase جديد من supabase.com/dashboard
#    ثم افتح SQL Editor والصق محتوى supabase/schema.sql وشغّله بالكامل.
#    هذا ينشئ كل الجداول (Users, Requests, Products, Matches...) + RLS + بيانات أولية (مدن وفئات).

# 3) انسخ متغيرات البيئة
cp .env.example .env.local
# ثم افتح .env.local واملأ:
#   NEXT_PUBLIC_SUPABASE_URL       (Settings → API → Project URL)
#   NEXT_PUBLIC_SUPABASE_ANON_KEY  (Settings → API → anon public)
#   SUPABASE_SERVICE_ROLE_KEY      (Settings → API → service_role — سرّي!)

# 4) فعّل Realtime على جدول messages (لدردشة حية)
#    Supabase Dashboard → Database → Replication → فعّل "messages"

# 5) شغّل المشروع
npm run dev
# افتح http://localhost:3000
```

---

## 3. إنشاء حساب Admin

1. أنشئ حسابًا عاديًا عبر شاشة `/signup` بأي بريد إلكتروني.
2. اذهب إلى Supabase Dashboard → Table Editor → جدول `users`.
3. ابحث عن صفك (بالبريد الإلكتروني أو `full_name`)، وغيّر عمود `is_admin` إلى `true`.
4. سجّل الدخول من نفس الحساب وافتح `/admin` — ستظهر لوحة الإدارة (إحصائيات + بلاغات + حظر مستخدمين).

> بديل عبر SQL مباشرة:
> ```sql
> update users set is_admin = true where id = '<USER_UUID_FROM_auth.users>';
> ```

---

## 4. آلية المطابقة (كيف تعمل؟)

الملف `lib/matching.ts` يحسب **Match Score من 0 إلى 100** حسب الأوزان التالية:

| العامل | الوزن |
|---|---|
| تشابه العنوان + الفئة | 40% |
| ملاءمة السعر للميزانية | 25% |
| تطابق المدينة | 15% |
| توافق الحالة (جديد/مستعمل...) | 10% |
| تطابق المواصفات (RAM, تخزين...) | 10% |

كل مرة يُنشئ مستخدم **طلبًا** (`POST /api/requests`) أو **منتجًا** (`POST /api/products`)، يبحث السيرفر فورًا في الجدول المقابل، يحسب Match Score لكل مرشح، ويخزّن كل نتيجة ≥ 45% في جدول `matches`، ثم يرسل إشعارات فورية لكلا الطرفين — هذا هو "البحث العكسي" المطلوب في الفكرة الأصلية.

خوارزمية v1 قاعدية (بدون AI) لسرعة الاستجابة وصفر تكلفة تشغيل. البنية جاهزة لإضافة AI لاحقًا (انظر STRATEGY.md → القسم 8).

---

## 5. النشر (Deployment)

**الأسهل: Vercel**

```bash
npm install -g vercel
vercel
```

- اربط المشروع بـ Vercel (استيراد من GitHub أو `vercel --prod` مباشرة).
- في Vercel Dashboard → Settings → Environment Variables، أضف نفس المتغيرات الثلاثة من `.env.local`.
- كل push إلى الفرع الرئيسي يُنشر تلقائيًا.

قاعدة البيانات تبقى على Supabase (لا حاجة لنقلها)، فقط تأكد أن Supabase Project ليس على وضع "Pause" (يحدث تلقائيًا بعد أسبوع خمول في الخطة المجانية).

---

## 6. ما هو مكتمل الآن مقابل ما هو Stub

**✅ يعمل فعليًا (منطق + DB متصل):**
Auth (تسجيل/دخول)، نشر طلب/منتج، البحث العكسي والمطابقة، صفحة النتائج بالـScore، طلب تواصل، قبول → فتح محادثة، Chat بـRealtime، الإشعارات، طلباتي/منتجاتي، البروفايل، الإبلاغ والحظر، لوحة Admin (إحصائيات + بلاغات).

**🚧 Stub بسيط (UI جاهز، منطق مبسط للتطوير لاحقًا):**
رفع الصور الفعلي (حاليًا حقل واجهة فقط)، صفحة "المحفوظات" (bookmark toggle)، الدفع الفعلي لـFeatured listings (البنية في جدول `payments` جاهزة، التكامل مع Edahabia/CIB يحتاج مزود دفع فعلي)، الترجمة الفرنسية الكاملة (i18n scaffolding غير مُضاف بعد)، اقتراح الفئة بالذكاء الاصطناعي.

---

## 7. تحويله إلى تطبيق هاتف (iOS/Android)

اقرأ `CAPACITOR_SETUP.md` للتعليمات الكاملة: نشر التطبيق، تغليفه بـCapacitor، الأيقونة وشاشة البداية، الإشعارات الفعلية، والنشر في App Store وGoogle Play.

## 8. الخطوة التالية المقترحة

اقرأ `STRATEGY.md` لنموذج الربح، استراتيجية النمو عبر فيسبوك، Viral Loop، وخطة الإطلاق في الجزائر (Cold Start Problem).
