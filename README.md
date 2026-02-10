# ERP PRO FINAL V3
## رفع على GitHub
- فك الضغط
- ارفع **كل الملفات والمجلدات** إلى Root الريبو (لا ترفع ZIP نفسه)
- Settings → Pages → main → /(root)

## إعداد Firebase
### 1) Authentication
فعّل Email/Password ثم أنشئ:
- admin@erp-pro.local
- admin123

### 2) Firestore Rules
انسخ القواعد من صفحة firebase-setup.html داخل البرنامج.

### 3) Firestore users/admin
Collection: users
Document ID: admin
Fields:
- username: admin
- role: admin
- active: true

## إدارة صلاحيات المستخدمين من داخل البرنامج
بعد دخول admin → صفحة **المستخدمين والصلاحيات**
- تضيف مستخدم وتحدد الصلاحيات (وتظهر الأزرار حسبها)
- كلمة المرور تُنشأ مرة واحدة من Firebase Authentication

## Firebase Config
{
  "apiKey": "AIzaSyBc-zCwcSNsVupzAAHWeUWKGHLdcrzg2iQ",
  "authDomain": "erp-pro-7307c.firebaseapp.com",
  "projectId": "erp-pro-7307c",
  "storageBucket": "erp-pro-7307c.firebasestorage.app",
  "messagingSenderId": "481869823115",
  "appId": "1:481869823115:web:68ea96d2a4ef5b732fa88e"
}


## إضافات V3
- فواتير مشتريات
- سند دفع
- تحويل عملات
- كشف حساب + دفتر الأستاذ + تقرير الأرصدة
- بطاقة تكاليف (3 أقسام)
