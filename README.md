# ERP – Accounting & Manufacturing (Firebase)

## تشغيل سريع
- فك الضغط
- افتح `index.html` أو انشره على GitHub Pages

## تسجيل الدخول
- اسم المستخدم: `admin`
- كلمة المرور: `admin123`

> ملاحظة: Firebase Auth يعتمد Email. التطبيق يحوّل username إلى Email داخلي:
`admin` -> `admin@erb-sestem.local`

## إعداد Firebase (مهم)
1) Firebase Console → Authentication → فعّل Email/Password  
2) Firebase Console → Firestore Database → Create (default)  
3) Authentication → Users → Add user:
   - Email: `admin@erb-sestem.local`
   - Password: `admin123`
4) Firestore → (default) → أنشئ:
   - `tenants` / `main`
   - ثم داخلها `users` / `{UID}` (UID من Authentication)
     - `displayName`: "Admin"
     - `role`: "admin"
     - `active`: true
     - `permissions`: (اختياري)

## المحتويات
- شجرة الحسابات
- قيود اليومية
- ميزان المراجعة
- تقرير الأرصدة
- شجرة المواد (Inventory Items)
- BOM التصنيع
- أوامر إنتاج (مبسطة)
- COGS تقرير مبسط
- إدارة صلاحيات (وثيقة مستخدم في Firestore)

## ملاحظات
- التقارير حالياً تعتمد على قراءة journalLines من Firestore داخل المتصفح. للمشاريع الضخمة يفضّل تجميعات (Cloud Functions) لاحقاً.
