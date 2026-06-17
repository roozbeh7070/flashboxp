# راهنمای به‌روزرسانی و مدیریت حافظه موقت (PWA Update Guide)

این سند برای راهنمایی توسعه‌دهندگان (یا هوش مصنوعی) در تغییرات و به‌روزرسانی‌های آینده‌ی پروژه ایجاد شده است تا فرآیند کش و به‌روزرسانی خودکار به درستی انجام شود و در مرورگرهای موبایل و دسکتاپ قفل نگردد.

---

## ۱. مراحل لازم هنگام اعمال هرگونه تغییر یا انتشار نسخه جدید

هر زمان که کدهای استاتیک پروژه (مانند کدهای درون پوشه `js`، `css`، فونت‌ها یا فایل `index.html`) را تغییر می‌دهید، حتماً باید مراحل زیر را انجام دهید تا تغییرات به کاربران نهایی برسد:

### مرحله اول: افزایش نسخه کش در سرویس ورکر
فایل [public/sw.js](file:///F:/code%20tafrihi/Flashcards/1-1-2/public/sw.js) را باز کنید و متغیر `CACHE_NAME` را یک شماره ارتقا دهید.
* مثال: تغییر از `'lang-app-v13'` به `'lang-app-v14'`

```javascript
// مسیر: public/sw.js
const CACHE_NAME = 'lang-app-v14'; // این مقدار حتماً ارتقا یابد
```

### مرحله دوم: تغییر نسخه در دکمه تنظیمات (اختیاری اما جهت شفافیت کاربر)
برای اینکه نسخه نمایش داده شده به کاربر در منوی تنظیمات تغییر کند، فایل [js/components/modals/SettingsModals.js](file:///F:/code%20tafrihi/Flashcards/1-1-2/js/components/modals/SettingsModals.js) را باز کرده و متن نسخه نرم‌افزار را ویرایش کنید:
```javascript
// مسیر: js/components/modals/SettingsModals.js
// خطوط بالا مربوط به اطلاعات برنامه
Software Version 1.2.4 // نسخه جدید را اینجا بنویسید
```

---

## ۲. مکانیسم‌های فنی به‌کار رفته برای حل مشکل قفل شدن کش

برای حل دائمی قفل حافظه موقت، موارد زیر در پروژه تعبیه شده است و نباید تغییر کنند مگر با دلیل فنی موجه:

1. **دور زدن کش مرورگر در زمان نصب سرویس ورکر:**
   در فایل `sw.js` متد `cache.add` حذف شده و از ساختار زیر استفاده می‌شود:
   ```javascript
   const response = await fetch(new Request(url, { cache: 'reload' }));
   ```
   پارامتر `{ cache: 'reload' }` مرورگر را مجبور می‌کند فایل‌های پروژه (مانند `app.js` بدون هش) را حتماً از شبکه بگیرد، نه از کش HTTP داخلی مرورگر.

2. **کنترل و بهینه‌سازی آفلاین و Supabase:**
   رویداد `fetch` در `sw.js` به گونه‌ای تنظیم شده که فقط درخواست‌های `GET` با دامنه‌ی یکسان با برنامه را کش کند. درخواست‌های ارسالی به دیتابیس Supabase بدون تداخل مستقیماً رد می‌شوند. این ویژگی باعث پایداری کارکرد برنامه در حالت آفلاین می‌شود.

3. **ارتباط دو طرفه برای به‌روزرسانی آنی:**
   * در فایل [js/app.js](file:///F:/code%20tafrihi/Flashcards/1-1-2/js/app.js) رویداد `controllerchange` ثبت شده است که با فعال شدن ورکر جدید صفحه را رفرش می‌کند.
   * در فایل [js/services/actions.js](file:///F:/code%20tafrihi/Flashcards/1-1-2/js/services/actions.js) متد `hotReload` پیام `SKIP_WAITING` را به سرویس ورکرِ در حال انتظار می‌فرستد تا فوراً اکتیو شود.

---

## ۳. تنظیمات حیاتی سرور (بسیار مهم)

سرویس ورکرها زمانی درست به‌روزرسانی می‌شوند که مرورگر متوجه تغییر فایل `sw.js` شود. بنابراین **فایل `sw.js` نباید در وب‌سرور کش شود**.

### پیکربندی هدرهای HTTP سرور برای `sw.js`:
تنظیمات زیر را روی سرور خود (یا CDN) اعمال کنید تا فایل `sw.js` با هدرهای عدم کش ارسال شود:

* **در هاست‌های آپاچی (فایل `.htaccess`):**
  ```apache
  <FilesMatch "sw\.js$">
      FileETag None
      <IfModule mod_headers.c>
          Header unset ETag
          Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
          Header set Pragma "no-cache"
          Header set Expires "Wed, 11 Jan 1984 05:00:00 GMT"
      </IfModule>
  </FilesMatch>
  ```

* **در هاست‌های Nginx:**
  ```nginx
  location /sw.js {
      add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
      expires -1;
  }
  ```
