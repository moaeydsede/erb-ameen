# ERP PRO (Final v1 - جاهز رفع على GitHub Pages)
هذه نسخة تعمل وتفتح وتدعم:
- تسجيل دخول Firebase Auth + تحقق من Firestore users
- واجهات احترافية RTL + مناسبة للموبايل والكمبيوتر
- شريط أزرار مثل الصورة (Tabs) + إظهار حسب الصلاحيات
- PWA (تثبيت على الموبايل)
- صفحات مفعّلة: بيانات الشركة، دليل الحسابات، العملاء، الموردين، فاتورة مبيعات، سند قبض متعدد الحسابات، قيد يومية مبسط، تقارير (ميزان مراجعة)، CFO (Admin فقط)

> ملاحظة مهمة: "ERP كامل بكل ما طلبته" (تصنيع/تكلفة/COGS/جرد كامل/كشف حساب تفصيلي/PDF…) يحتاج إصدار v2/v3. لكن هذه النسخة **نهائية مستقرة** كقاعدة قوية بدون أخطاء نشر/دخول/صلاحيات.

---

## 1) الرفع على GitHub Pages
1) أنشئ Repo جديد.
2) ارفع **كل الملفات والمجلدات** كما هي (css / js / pwa + صفحات HTML).
3) Settings > Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /(root)
4) افتح رابط GitHub Pages.

---

## 2) إعداد Firebase (مهم)
### (A) إنشاء مستخدم في Firebase Authentication
Authentication > Users > Add user:
- Email: admin@erp-pro.local
- Password: admin123

### (B) إنشاء وثيقة المستخدم في Firestore
Firestore Database > Data:
- Collection: users
- Document ID: admin
- Fields:
  - username (string): admin
  - role (string): admin
  - active (boolean): true
  - permissions (map) (اختياري للغير Admin)

### (C) قواعد Firestore (حل Missing or insufficient permissions)
Firestore > Rules ثم الصق:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn(){ return request.auth != null; }

    match /users/{id} { allow read, write: if signedIn(); }
    match /company/{id} { allow read, write: if signedIn(); }

    match /accounts/{id} { allow read, write: if signedIn(); }
    match /customers/{id} { allow read, write: if signedIn(); }
    match /suppliers/{id} { allow read, write: if signedIn(); }

    match /invoices/{id} { allow read, write: if signedIn(); }
    match /vouchers/{id} { allow read, write: if signedIn(); }

    match /currencies/{id} { allow read, write: if signedIn(); }

    match /{document=**} { allow read, write: if false; }
  }
}
```

---

## 3) الصلاحيات (إظهار الأزرار حسب المستخدم)
لو عندك مستخدم غير Admin:
- Auth user: user1@erp-pro.local / 123456
- Firestore: users/user1
  - role: "viewer"
  - permissions: map مثل:
    - company: true
    - accounts: true
    - invoices: true
    - vouchers: false
    - reports: true
    - manufacturing: false
    - cfo: false

Admin يرى كل شيء تلقائيًا.

---

## 4) ملاحظات هامة
- إذا الدخول لا يفتح: تأكد من Authentication User موجود + Firestore users/{username} موجود.
- إذا ظهرت Missing permissions: طبق الـ Rules ثم انتظر دقيقة وأعد التجربة.
- PWA: افتح الموقع من Chrome > Add to Home screen.
