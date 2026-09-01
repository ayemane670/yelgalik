# تحويل يلقالك إلى تطبيق هاتف حقيقي (Capacitor)

Capacitor يغلّف نفس تطبيق Next.js داخل تطبيق iOS/Android حقيقي قابل للنشر في App Store وGoogle Play، بدون إعادة كتابة أي كود.

**ملاحظة أساسية:** بما أن التطبيق يحتوي على API routes وSSR (وليس صفحات ثابتة)، لا يمكن تصديره كملفات HTML ثابتة. لذلك Capacitor سيُحمّل نسخة **منشورة على الإنترنت** من التطبيق داخل WebView أصلي. هذا هو الأسلوب الصحيح والمعتمد لتطبيقات Next.js الديناميكية.

---

## 0. المتطلبات

- Node.js 18+
- **لتطوير iOS:** جهاز Mac + Xcode (مجاني من App Store)
- **لتطوير Android:** Android Studio (يعمل على Windows/Mac/Linux)
- حساب Apple Developer (99$/سنة) للنشر على App Store
- حساب Google Play Console (25$ دفعة واحدة) للنشر على Google Play

---

## 1. انشر التطبيق أولًا (خطوة إلزامية قبل Capacitor)

```bash
npm install -g vercel
cd yelgalik
vercel --prod
```

انسخ الرابط الناتج (مثلًا `https://yelgalik.vercel.app`)، وضعه في `capacitor.config.ts`:

```ts
server: {
  url: "https://yelgalik.vercel.app", // ⬅️ رابطك الحقيقي
  cleartext: false,
},
```

---

## 2. ثبّت Capacitor

الحزم مُضافة مسبقًا في `package.json`. فقط:

```bash
npm install
```

---

## 3. أضف منصّتي iOS وAndroid

```bash
npx cap add ios
npx cap add android
npx cap sync
```

هذا يُنشئ مجلدي `ios/` و`android/` (مشروعا Xcode وAndroid Studio كاملان) داخل مشروعك.

---

## 4. افتح وشغّل على جهاز/محاكي

```bash
# iOS (يتطلب Mac)
npx cap open ios
# يفتح Xcode → اختر جهازًا/محاكيًا → زر Run (▶)

# Android
npx cap open android
# يفتح Android Studio → اختر جهازًا/محاكيًا → زر Run (▶)
```

---

## 5. الأيقونة وشاشة البداية (Splash Screen)

```bash
npm install -D @capacitor/assets
```

ضع شعارك بصيغة PNG 1024×1024 في `resources/icon.png` وشعار شاشة البداية في `resources/splash.png`، ثم:

```bash
npx capacitor-assets generate
npx cap sync
```

سيولّد تلقائيًا كل أحجام الأيقونات المطلوبة لكل من iOS وAndroid.

---

## 6. الإشعارات الفعلية (Push Notifications)

البنية الأساسية موجودة في `components/NativeBridge.tsx` — تطلب صلاحية الإشعارات وتسجّل جهاز المستخدم عند فتح التطبيق داخل الغلاف الأصلي.

للإكمال (خطوة لاحقة، ليست ضرورية للتشغيل الأولي):
1. أنشئ حساب Firebase (مجاني) → فعّل Cloud Messaging (FCM).
2. أضف `google-services.json` (Android) و`GoogleService-Info.plist` (iOS) للمشاريع الأصلية.
3. أنشئ جدولًا `push_tokens (user_id, token, platform)` في Supabase.
4. في `NativeBridge.tsx`، عند استلام التوكن، احفظه عبر استدعاء لـ`/api/push-tokens` (route جديد بسيط تُنشئه).
5. عند إنشاء إشعار في `/api/requests` أو `/api/products`، أرسل أيضًا طلب push فعلي عبر FCM Admin SDK (من سيرفر، وليس من المتصفح).

---

## 7. اختبار التطوير المباشر (Live Reload)

بدل تحميل نسخة Vercel أثناء التطوير، يمكنك توجيه Capacitor لجهازك المحلي:

```ts
// capacitor.config.ts — مؤقتًا أثناء التطوير فقط
server: {
  url: "http://192.168.1.10:3000", // IP جهازك على نفس الشبكة، وليس localhost
  cleartext: true, // يسمح بـ HTTP غير مشفّر للتطوير المحلي فقط
},
```

```bash
npm run dev            # في نافذة طرفية
npx cap sync && npx cap run android   # في نافذة أخرى
```

**تذكّر إعادة `cleartext: false` والرابط الحقيقي قبل بناء نسخة الإنتاج/النشر.**

---

## 8. بناء نسخة جاهزة للنشر

**Android (APK/AAB):**
Xcode → Android Studio → `Build` → `Generate Signed Bundle / APK` → اتبع المعالج لإنشاء مفتاح توقيع (Keystore) واحفظه بأمان (لن تستطيع تحديث التطبيق بدونه لاحقًا).

**iOS (IPA):**
Xcode → `Product` → `Archive` → `Distribute App` → يتطلب حساب Apple Developer نشط.

---

## 9. النشر في المتاجر

- **Google Play Console** (play.google.com/console): أنشئ تطبيقًا جديدًا، ارفع ملف `.aab`، املأ الوصف والصور (استخدم لقطات من التطبيق)، أرسل للمراجعة (عادة 1-3 أيام).
- **App Store Connect** (appstoreconnect.apple.com): أنشئ تطبيقًا جديدًا، ارفع عبر Xcode Organizer أو Transporter، املأ البيانات، أرسل للمراجعة (عادة 1-2 يوم).

---

## ملخص الأوامر الكاملة (من الصفر)

```bash
npm install
vercel --prod                          # انشر أولًا واحصل على الرابط
# عدّل capacitor.config.ts بالرابط الحقيقي
npx cap add ios
npx cap add android
npx cap sync
npx cap open android                   # أو ios
```
