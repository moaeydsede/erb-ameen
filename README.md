# ERP PRO (Starter)
هذه نسخة بداية **تعمل الآن**: تسجيل دخول + Dashboard + PWA + ربط Firebase.

## 1) رفع على GitHub Pages
1. أنشئ Repo جديد (مثال: `erp-pro`)
2. ارفع كل الملفات كما هي
3. Settings → Pages → اختر Branch `main` و Folder `/ (root)`
4. افتح رابط GitHub Pages

## 2) أهم شيء: Firestore Rules (Production Mode)
بما أنك أنشأت Firestore على **Production Mode**، لازم تضع قواعد تسمح للمستخدم المُسجل (Auth) بالقراءة/الكتابة حسب الحاجة.

اذهب إلى: Firestore Database → Rules
واستبدل القواعد بهذا (نسخة بداية آمنة):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function isAdmin() {
      return signedIn() &&
        exists(/databases/$(database)/documents/users/admin) &&
        get(/databases/$(database)/documents/users/admin).data.role == "admin";
    }

    // Users profiles: اقرأ ملف المستخدم الحالي فقط (بالـ username كـ DocumentId)
    match /users/{username} {
      allow read: if signedIn();        // بداية (يمكن تشديدها لاحقاً)
      allow write: if isAdmin();        // Admin فقط
    }

    // Company settings: قراءة للجميع / تعديل Admin فقط
    match /company/{docId} {
      allow read: if signedIn();
      allow write: if isAdmin();
    }

    // Currencies: قراءة للجميع / تعديل Admin فقط
    match /currencies/{code} {
      allow read: if signedIn();
      allow write: if isAdmin();
    }

    // باقي collections (سنبنيها لاحقاً) – اتركها مغلقة الآن
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 3) تسجيل الدخول (Admin)
- Username: `admin`
- Password: `admin123`

**مهم:** يجب أن يكون لديك User في Authentication:
- Email: `admin@erp-pro.local`
- Password: `admin123`

و Firestore:
- users/admin
- company/main
- currencies/EGP
