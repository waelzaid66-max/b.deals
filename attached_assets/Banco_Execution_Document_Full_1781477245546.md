# 📘 وثيقة تنفيذية شاملة — تطبيق بانكو (Banco)
## Mobile Application — إضافات وتحسينات على المشروع القائم
### الإصدار النهائي | يونيو 2026

---

## 📋 فهرس المحتويات

| # | القسم | الصفحة |
|---|-------|--------|
| 1 | الملخص التنفيذي والرؤية | — |
| 2 | نظام البحث الذكي (Booking-Style) | — |
| 3 | نظام الباقات والإشتراكات | — |
| 4 | نظام الدفع والفوترة | — |
| 5 | نظام المصادقة والحسابات والتوثيق | — |
| 6 | صفحة الحساب والملف الشخصي | — |
| 7 | وحدة العقارات (Real Estate) | — |
| 8 | وحدة السيارات (Car Market) | — |
| 9 | وحدة السوق الصناعي (Industrial) | — |
| 10 | نظام المحادثات والتواصل | — |
| 11 | نظام الإشعارات | — |
| 12 | نظام التحويل والقرار (Conversion) | — |
| 13 | نظام الحاسبات التقديرية | — |
| 14 | نظام الثقة ومكافحة الاحتيال | — |
| 15 | نظام المساعد الذكي (AI) | — |
| 16 | لوحة تحكم المطور والأدمن | — |
| 17 | قواعد الأداء والأداء | — |
| 18 | ملاحظات قانونية | — |
| 19 | ملاحظات تنفيذية صارمة | — |

---

## 1. الملخص التنفيذي والرؤية

### رؤية بانكو
بانكو = Marketplace متكامل (عقارات + سيارات + صناعي) + AI Layer بسيط + Decision Engine

### المبادئ التنفيذية
- **لا تعقيد**: كل ميزة يجب أن تكون بسيطة وواضحة
- **لا تمويل**: المنصة لا تقدم تمويل — جميع الحسابات تقديرية فقط
- **سرعة فائقة**: لا يوجد مجال للبطء أو التعليق في أي صفحة
- **ثقة مطلقة**: التوثيق والتحقق أساس كل تفاعل
- **تحويل ذكي**: تقليل الخطوات = زيادة الصفقات

### الأقسام الرئيسية
| القسم | الوصف |
|-------|--------|
| 🏠 **عقارات** | بيع، إيجار، تقسيط، رهن |
| 🚗 **سيارات** | بيع، حجز تجربة، مقارنة |
| 🏭 **صناعي** | مصانع، مواد خام، موردين، تصدير |



---

## 2. نظام البحث الذكي (Smart Search System)

### 2.1 ملاحظة شديدة الأهمية في حالة البحث

رغم أنني أضفت طرق بحث متعددة، إلا أن الأهم عندي هو أن يكون البحث بنفس الطريقة التي في بوكينغ.

أريد أن يكون هناك خاصية "Near Me" بحيث أبحث في المحيط حولي، سواء في السيارات أو أي قسم من الأقسام. يجب أن يكون البحث ذكياً، بحيث أحدد المسافة حولي (مثلاً 5 كم أو 7 كم)، أو أبحث في محافظة معينة، أو عنوان معين، أو في مصر كلها.

أريد أن أطلب صلاحيات لهذه الخاصية في بداية إنشاء التطبيق حتى لا أعود لها لاحقاً، وأن تنفذ بدقة عالية، مثل بوكينغ أو أي منصة عالمية، على الخريطة، بحيث تعرض نفس البائعين الذين تم طلبهم في البحث، بنفس الشكل الاحترافي لخريطة جوجل، دون تكاليف زائدة، وباستخدام تقنيات بسيطة ومحكمة، بحيث تكون مناسبة تماماً للتطبيق من غير تعليق أو بطء.

يجب مراعاة سرعة كل الصفحات والبيانات.

### 2.2 آلية البحث المتقدمة

| نوع البحث | الوصف |
|-----------|--------|
| **Near Me** | بحث في المحيط الجغرافي حول المستخدم |
| **نطاق المسافة** | 5 كم / 7 كم (قابل للتعديل) |
| **بحث محلي** | محافظة معينة / عنوان محدد / منطقة معينة |
| **بحث عام** | مصر كلها |

### 2.3 المتطلبات التقنية
- **الصلاحيات**: طلب صلاحيات الموقع (Location Permissions) **في أول إنشاء التطبيق** فقط — لا يتم إرجاعها مرة أخرى
- **الخريطة**: عرض نتائج البحث على خريطة تفاعلية (Google Maps Style) تظهر نفس الـ Vendors/Businesses الخاصة بنتائج البحث
- **الأداء**: بدون تعليق أو بطء — سرعة تحميل البيانات في أولوية قصوى
- **التكلفة**: استخدام تقنيات بسيطة ومحكمة، بدون تكاليف زائدة أو تكنولوجيا معقدة

### 2.4 فلاتر البحث المتقدمة

#### فلاتر أساسية (Basic Filters)
- نطاق السعر (min/max)
- نطاق المساحة
- عدد الغرف / الحمامات
- الموقع (city + area)
- نوع الإعلان (rent/sale/mortgage/installment)
- نوع الدفع (cash/mortgage/installment)
- نطاق الدفعة المقدمة
- نطاق القسط الشهري
- التشطيب (none/semi/full/luxury)
- التأثيث (empty/furnished)

#### فلاتر متقدمة (Advanced Filters)
- سعر المتر (pricePerMeter)
- المسافة من المستخدم (distanceFromUser)
- الخدمات القريبة (schools, hospitals)
- كومباوند vs standalone
- النشاط الصناعي (غذائي/كيميائي/نسيج)
- الجهد الكهربائي
- القرب من طرق رئيسية

### 2.5 منطق الترتيب (Search Ranking)
1. بائع موثق (Verified)
2. سعر مناسب (Best Price)
3. تفاعل عالي (High Engagement)
4. إعلان جديد (Newest)

### 2.6 البحث الجغرافي (Geo Search)
- البحث ضمن نطاق من الخريطة
- عرض جميع الأصول على الخريطة
- Saved Searches + Alerts



---

## 3. نظام الباقات والإشتراكات (Subscription Tiers)

### 3.1 التحكم الكامل في الحسابات والفوترة

هذا قسم مهم يحتوي على نوعين ثابتين: نظام الاشتراكات الشهرية والسنوية، ونظام المحاسبة إعلان بإعلان.

### 3.2 الباقات الشخصية (Individual Plans)

#### أ) باقة بانكو كور — المجانية (Banco Core Free)
| البند | التفاصيل |
|-------|----------|
| عدد الإعلانات | 3 إعلانات/شهر |
| محتوى الإعلان | 2 صورة كحد أقصى لكل إعلان |
| الوصول | 10% للمهتمين / 50% للباحثين |
| السعر | **مجاني** |

#### ب) باقة بانكو كور — المدفوعة (Banco Core)
| البند | التفاصيل |
|-------|----------|
| عدد الإعلانات | 5 إعلانات/شهر |
| محتوى الإعلان | 10 صور + فيديو قصير (45 ثانية كحد أقصى) |
| الوصول | 60% للمهتمين |
| الترويج | داخلي وخارجي عبر قنوات بانكو |
| السعر | **1,000 جنيه/شهر** |
| التجربة | 3 إعلانات مجانية في البداية لكل شركة |

#### ج) باقة بانكو برو (Banco Pro)
| البند | التفاصيل |
|-------|----------|
| عدد الإعلانات | 12 إعلان/شهر |
| محتوى الإعلان | 2 إعلان بصورتين فقط + 10 إعلانات كاملة (10 صور + فيديو أو فيديوين لكل إعلان) |
| الوصول | 80% للمهتمين |
| الترويج | خارجي عبر منصات بانكو الأخرى |
| السعر | **1,500 جنيه/شهر** |

#### د) الإعلان الفردي (Pay Per Ad)
| النوع | التفاصيل | السعر |
|-------|----------|-------|
| إعلان صغير | 2 صورة فقط | **50 جنيه** |
| إعلان كبير | ترويج كامل | **250 جنيه** |

> **ملاحظة:** الأسعار ثابتة لكل المنتجات.

### 3.3 الباقات للشركات (Business Plans)

نفس الباقات الشخصية بالضبط، مع **زيادة 500 جنيه** على كل باقة:

| الباقة | عدد الإعلانات | السعر/شهر |
|--------|---------------|-----------|
| بانكو فيكتور (Banco Vector) | 5 إعلانات (10 صور + فيديو 45 ثانية) | **1,000 جنيه** |
| بانكو بيزنس (Banco Business) | 12 إعلان (2 بصورتين + 10 كاملة) | **1,500 جنيه** |

- كل شركة تحصل على **3 إعلانات مجانية** في البداية للتجربة.
- الإعلان الفردي بنفس الأسعار: 50 جنيه (صغير) / 250 جنيه (كبير).
- كل شركة تحصل على **2 إعلان مجاني** كل شهر ضمن الباقة.

### 3.4 نظام الاشتراكات
- **اشتراكات شهرية وسنوية**
- **نظام محاسبة إعلان بإعلان**
- **لوحة تحكم كاملة** للأسعار والباقات في Banco Admin



---

## 4. نظام الدفع والفوترة (Payment & Billing)

### 4.1 طرق الدفع المتاحة
| الطريقة | الوصف |
|---------|--------|
| **Paymob** | بوابة الدفع الرئيسية داخل مصر |
| **Fawry (فوري)** | دفع نقدي عبر منافذ فوري |
| **بطاقات الدفع** | Visa / Mastercard (محلية مصرية أو دولية) |
| **Credit/Debit Card** | محلي داخل مصر |
| **Stripe** | تجهيز أساس دولي للتوسعات المستقبلية |

### 4.2 لوحة التحكم المالية (Banco Admin Dashboard)
- لوحة تحكم كاملة للأسعار والباقات
- إمكانية تغيير الأسعار بسهولة من لوحة التحكم
- تثبيت الباقات على أساس دولي ومحاسبة دولية
- متابعة الاشتراكات الشهرية والسنوية
- نظام محاسبة إعلان بإعلان



---

## 5. نظام المصادقة والحسابات (Auth & Onboarding)

### 5.1 حقول إضافية إلزامية
- **عنوان:** حقل عنوان للحسابات الشخصية
- **بيانات النشاط التجاري:** (عند تحويل الحساب لبيزنس)
  - نبذة عن النشاط
  - رقم السجل التجاري
  - صورة من السجل التجاري

### 5.2 تحسينات كلمة المرور
- **أيقونة إظهار/إخفاء كلمة المرور:** نقطة صغيرة تتيح للمستخدم رؤية كلمة السر
- **زر "نسيت كلمة السر":** إرسال OTP عبر البريد الإلكتروني → التحقق → إعادة تعيين كلمة سر جديدة
- **تبديل اللغة:** سهولة تحويل اللغة للعربية

### 5.3 المصادقة البيومترية والصلاحيات
- **بصمة الوجه (Face ID)** و**بصمة الإصبع (Fingerprint)**
- **الصلاحيات المطلوبة في البداية:**
  - الموقع (Location)
  - الصور والفيديوهات (Gallery/Camera)
  - الإشعارات
- يجب أن تكون جميعها في **إجراءات الموافقات المبدئية** أثناء Onboarding التطبيق

### 5.4 تحويل الحساب الشخصي لبيزنس
- زرار تحويل واضح
- حقول إضافية: بيانات النشاط، نبذة، رقم السجل التجاري، صورة السجل
- زرار **التوثيق:** الحساب يظل شغالاً عاديًا حتى الرد عليه من الداشبورد/الأدمن

### 5.5 نظام التوثيق (KYC & Verification)

#### توثيق المعلن (KYC)
- بطاقة هوية / سجل تجاري / تفويض بيع
- رفع عقود الملكية
- ربط مع جهة تحقق (manual في البداية)

#### مستويات التوثيق
| المستوى | المتطلبات |
|---------|-----------|
| **Basic** | بيانات فقط |
| **Advanced** | مستندات |
| **Premium** | زيارات / توثيق كامل |

#### Badges واضحة
- "Verified Owner" — مالك موثق
- "Broker" — وسيط موثق
- "Developer" — مطور موثق
- "Verified Supplier" — مورد موثق
- "Documents Checked" — تم فحص المستندات



---

## 6. صفحة الحساب والملف الشخصي (Profile & Business Page)

### 6.1 مميزات الصفحة
- عرض **البوستات/الإعلانات** بشكل منظم (مثل Instagram)
- عرض **عدد التفاعلات** (Likes, Comments, Saves)
- إمكانية وضع **اللوجو والشعار** الخاص بالشركة أو الشخص
- **نبذة تعريفية** عن النشاط
- **شكل ترويجي** للصفحة الشخصية أو شركة

### 6.2 قائمة اللوجو (Logo Menu)

**ملاحظة مهمة جداً:** اللوجو هو مش بيفتح أي شيء في UX أو الواجهة. نحن نريد أن اللوجو لما نضغط عليه يفتح قائمة مهمة جداً صغيرة فيها:

1. **People who love my ad** — قائمة المستخدمين الذين تفاعلوا مع الإعلان
2. **التعليقات (Comments)** — التعليقات الواردة على الإعلانات
3. **المتابعين (Follows)** — من قام بمتابعة الصفحة أو حفظ الإعلان
4. **التاغز (Tags)** — أربعة تاغز مخصصة
5. **المساعد الذكي (AI Assistant)** — مساعد ذكي مزوّد ببرومبت كامل

### 6.3 إضافة إعلان
- زر **"إضافة إعلان"** يجب أن يكون في **منتصف المسطرة السفلية (Bottom Navigation)** — شيك وجذاب
- مراعاة **جميع مقاسات الشاشات** (Responsive Design)
- الصفحة الرئيسية تدعم جميع طرق العرض والمقاسات



---

## 7. وحدة العقارات (Real Estate Module)

### 7.1 هيكل الإعلان (Property Listing)

```
OBJECT: Property
├── id
├── title
├── description
├── location:
│   ├── city
│   ├── area
│   ├── lat
│   └── lng
├── listingType:
│   ├── rent
│   ├── sale
│   ├── mortgage
│   └── installment
├── price:
│   ├── total (for sale)
│   └── monthly (for rent/installment)
├── specs:
│   ├── area (sqm)
│   ├── bedrooms
│   ├── bathrooms
│   ├── floor
│   ├── finishing (none/semi/full/luxury)
│   └── furnishing (empty/furnished)
├── payment:
│   ├── type: cash/mortgage/installment
│   ├── cash: totalPrice
│   ├── mortgage: downPayment, years, monthlyInstallment
│   └── installment: downPayment, years, monthlyInstallment
├── status: ready/under_construction
├── developer:
│   ├── id, name, role (developer/owner/broker)
│   └── verified (true/false)
├── media:
│   ├── images[]
│   ├── video
│   └── tour360 (optional)
└── createdAt
```

### 7.2 خطوات إنشاء الإعلان (Developer Input)
**Step 1:** title + location (city + area) + listingType
**Step 2:** price OR monthly OR payment type
**Step 3:** specs (area + rooms فقط mandatory)
**Step 4:** upload images
> أي field ناقص → optional

### 7.3 نظام الحجز (Booking System)

```
OBJECT: Booking
├── id
├── propertyId
├── userId
├── developerId
├── date
├── time
├── status: pending/confirmed/cancelled/completed
├── note
└── createdAt
```

**Flow:**
1. اختيار التاريخ
2. اختيار الوقت المتاح
3. إدخال الاسم + الهاتف + ملاحظة (optional)
4. تأكيد الحجز

**قواعد:**
- منع double booking
- slot lock = 2 minutes
- pending expires after 15 minutes

**Auto Actions على الحجز:**
1. إنشاء booking
2. فتح chat تلقائي
3. إرسال notification

### 7.4 نظام التوفر (Availability)
```
OBJECT: Availability
├── propertyId
├── developerId
└── slots:
    ├── date
    └── times[]
```

### 7.5 حاسبات تقديرية (Calculators)

#### A) سعر المتر التلقائي (Price Per Meter)
```
IF totalPrice موجود AND area موجود:
    pricePerMeter = totalPrice / area
    DISPLAY: "سعر المتر: XXXX جنيه"
```

#### B) حاسبة القسط (Installment Calculator)
```
INPUT: totalPrice, downPayment, years
remaining = totalPrice - downPayment
months = years × 12
monthlyInstallment = remaining / months
DISPLAY: "قسط شهري تقريبي: XXXX جنيه"
NOTE: "حساب تقريبي وليس عرض تمويلي"
```

#### C) حاسبة الرهن (Mortgage Calculator)
```
INPUT: totalPrice, downPayment, interestRate (optional), years
IF no interest: same as installment
IF interest exists (later phase): use reducing balance formula
```

#### D) مقارنة الإيجار vs الشراء (Rent vs Buy)
```
IF property has installment AND user searches rent:
    DISPLAY:
    - إيجار: XXXX/شهر
    - شراء: XXXX/شهر
    - فرق: "فرق X جنيه شهريًا"
```

**قواعد العرض:**
- يظهر تحت السعر مباشرة
- Collapsible section (زر: "احسب القسط")
- Default: hidden (optional)
- لا يمنع عرض الإعلان
- لا يؤثر على الأداء
- لو البيانات ناقصة → لا يظهر



---

## 8. وحدة السيارات (Car Market Module)

### 8.1 ميزات متقدمة (Advanced Features)

#### 16) Deal Flow (تحويل المستخدم لصفقة)
- المستخدم يضغط: تواصل / احجز تجربة
- النظام: يفتح Chat مباشرة أو يفتح Booking
- الهدف: تقليل الخطوات = زيادة الصفقات

#### 17) Price History (تاريخ السعر)
- تخزين كل تعديل سعر
- عرض داخل الإعلان:
  - السعر الحالي
  - السعر السابق
- مثال: كان 520,000 → الآن 480,000
- الفائدة: إحساس "فرصة شراء"

#### 18) Similar Cars (منع خروج المستخدم)
- عرض سيارات مشابهة داخل الصفحة
- بناءً على: السعر، الموديل، الفئة
- الهدف: زيادة الوقت داخل التطبيق + فرص البيع

#### 19) Seller Strength (بناء الثقة)
- عدد الإعلانات
- عدد الصفقات
- سرعة الرد
- النتيجة: المستخدم يثق أسرع

#### 20) Fast Action Buttons
- تواصل
- احجز تجربة
- احفظ
- بدون قوائم إضافية
- الهدف: سرعة التفاعل

#### 21) Save + Follow System
- المستخدم يحفظ السيارة
- يراقب السعر
- النتيجة: يرجع للتطبيق مرة تانية

#### 22) Price Drop Alert
- إشعارات تلقائية:
  - "السعر نزل"
  - "سيارة جديدة تناسبك"
- الهدف: إعادة المستخدم (Retention)

#### 23) Search Ranking Logic
1. بائع موثق
2. سعر مناسب
3. تفاعل عالي
4. إعلان جديد

#### 24) Listing Quality Control
- حد أدنى 5 صور
- بيانات كاملة
- منع: صور ضعيفة، بيانات ناقصة
- الهدف: جودة السوق

#### 25) Deal Rating (أهم ميزة)
تحليل السعر مقابل السوق:
- **Excellent Deal** — أقل من السوق
- **Good Deal** — جيد
- **Fair Price** — طبيعي
- **High Price** — غالي
- يظهر بشكل واضح داخل الإعلان
- الهدف: مساعدة القرار فورًا

### 8.2 ملخص القسم الناجح
- سعر واضح
- تقييم الصفقة
- ثقة في البائع
- سرعة تواصل



---

## 9. وحدة السوق الصناعي (Industrial Marketplace)

### 9.1 أنواع الإعلانات (Listing Types)
- production_line — خط إنتاج
- raw_material — مواد خام
- supplier — مورد
- exporter — مصدر

### 9.2 هيكل الإعلان الصناعي (Industrial Listing)

```
OBJECT: IndustrialListing
├── id, title, description
├── category, industryType
├── location:
│   ├── country, city, lat, lng
├── tradeType:
│   ├── local, export, import
├── pricing:
│   ├── model: fixed_price/price_on_request/tier_pricing
│   ├── totalPrice, pricePerUnit
│   ├── currency: USD/EUR/EGP/AED
│   └── tierPricing[]:
│       ├── minQty, pricePerUnit
├── MOQ
├── availability: in_stock/on_demand
├── leadTime (days)
├── condition: new/used
├── specifications:
│   ├── capacity, power, materialType
├── certifications[]
├── media:
│   ├── images[], video
├── supplier:
│   ├── id, name, type (factory/trader/exporter)
│   ├── verified (true/false)
│   ├── verificationLevel: basic/advanced/premium
│   ├── documentsChecked (true/false)
│   ├── rating, completedDeals
├── paymentOptions:
│   ├── cash
│   ├── installment_from_supplier:
│   │   ├── available, downPayment, months, monthlyAmount
│   ├── supplier_credit:
│   │   ├── available, creditDays (30/60/90)
│   └── agreementRequired (true)
├── logistics:
│   ├── shippingAvailable (true/false)
│   ├── shippingType: sea/air/land
│   └── estimatedDeliveryDays
└── exportData:
    ├── incoterms: EXW/FOB/CIF
    └── requiredDocuments:
        ├── invoice, packing_list, certificate_of_origin
```

### 9.3 حقول خاصة حسب الفئة

#### A) خط إنتاج (Production Line)
- productionCapacity
- requiredSpace
- powerConsumption
- includedMachines[]
- ROI_estimation (optional)

#### B) مواد خام (Raw Material)
- materialType
- purity
- originCountry
- packagingType
- shelfLife

#### C) مورد (Supplier)
- productTypes[]
- supplyRegions[]
- deliveryTime

#### D) مصدر (Exporter)
- exportCountries[]
- shippingMethods
- exportVolume

### 9.4 نظام RFQ + Direct Deal

```
OBJECT: RFQ
├── id, listingId, buyerId, supplierId
├── quantity, budget, message
└── status: pending/negotiation/agreed/closed
```

**Direct Deal:**
- IF price available: زر "اشتري الآن" / "ابدأ تقسيط"
- ELSE: RFQ only

### 9.5 نظام الطلبات (Demand System)
```
OBJECT: DemandRequest
├── id, buyerId, industryType
├── productName, quantity, targetPrice
└── status: open/matched/closed
```

**الميزة:** المورد يشوف الطلبات المفتوحة ويرد عليها مباشرة

### 9.6 نظام المطابقة (Matching Engine)
**Auto Match Rules:**
- نفس industryType
- نفس المنتج
- supplier verified
- shippingAvailable

**Output:** suggested suppliers / suggested listings

### 9.7 نظام التمويل (Financing System)
```
installment_calculator:
    monthlyInstallment = (totalPrice - downPayment) / months

supplier_credit:
    buy now → pay after X days (30/60/90)

bank_integration (future):
    request financing approval
```

### 9.8 نظام اللوجستيات (Logistics Engine)
```
auto_estimate_shipping:
    INPUT: weight, country
    OUTPUT: shipping cost, delivery time

track_shipment (future)
```

### 9.9 التجارة الدولية (Global Trade Layer)

#### A) Export/Import Support
- tradeType: local/export/import
- incoterms: EXW/FOB/CIF
- customsSupport (true/false)
- requiredDocuments: invoice, packing_list, certificate_of_origin

#### B) Multi-Currency Support
- currency: USD/EUR/EGP/AED
- autoConversion: display price in user currency

#### C) Language Support
- listingLanguage: Arabic/English
- auto translate (optional)

### 9.10 رؤية اللوجستيات
```
DISPLAY:
- "التوصيل خلال 15 يوم"
- "الشحن متاح دوليًا"
```

### 9.11 تبسيط الصفقة (Deal Simplification)
```
quick_deal_summary:
    DISPLAY:
    - السعر
    - الكمية
    - طريقة الدفع
    - موعد التسليم

    زر: "تأكيد الاتفاق"
```

### 9.12 Flow رئيسي
**Buyer:** Search → Filter → Open → RFQ/Buy → Chat → Payment → Delivery
**Supplier:** Add Listing → Receive RFQ → Negotiate → Close Deal → Ship



---

## 10. نظام المحادثات والتواصل (Messaging System)

### 10.1 هيكل المحادثة
```
OBJECT: Chat
├── id
├── propertyId (or listingId)
├── participants [userId, developerId/supplierId]
├── lastMessage
└── updatedAt

OBJECT: Message
├── id, chatId, senderId
├── type: text/image/file(PDF)
├── content
├── status: sent/delivered/seen
└── createdAt
```

### 10.2 المميزات
- Realtime chat
- Read receipt
- Typing indicator
- Image upload
- File upload (PDF — للمستندات التقنية)

### 10.3 رسائل تلقائية (Auto Messages)
**على الحجز:**
```
"تم حجز معاينة للوحدة يوم [DATE] الساعة [TIME]"
```

**RFQ → Chat:**
```
فتح chat تلقائي عند إرسال RFQ
```

### 10.4 قواعد UI
- نفس UX Messenger
- بسيط وبدون تعقيد



---

## 11. نظام الإشعارات (Notification System)

### 11.1 هيكل الإشعار
```
OBJECT: Notification
├── id, userId
├── type: booking/message/deal/price_drop
├── title, body
├── read (true/false)
└── createdAt
```

### 11.2 Triggers
**User:**
- booking confirmed
- booking reminder (before 24h, before 2h)
- new message
- price drop alert
- new matching listing

**Developer/Supplier:**
- new booking
- new message
- new RFQ
- deal update



---

## 12. نظام التحويل والقرار (Conversion Layer)

### 12.1 Badges
- best_price — أفضل سعر
- hot_deal — صفقة ساخنة
- verified — موثق
- exclusive — حصري
- fast_delivery — توصيل سريع
- high_rating — تقييم عالي

### 12.2 Insights ذكية
- price_per_meter مقارنة بالمنطقة
- average_price_area
- avg price per category
- top countries exporting

### 12.3 Urgency (الإلحاح)
- "تم مشاهدة الإعلان X مرة اليوم"
- "باقي X وحدات فقط"
- "تم طلب عرض سعر 10 مرات اليوم"

### 12.4 Lead Qualification
**على الحجز:**
- budgetRange
- purchaseType: investment/living
- timeline: immediate/3_months/later

**Lead Score:**
- **hot:** budget واضح + جاهز
- **warm:** مهتم لكن غير محدد
- **cold:** غير جاد

### 12.5 طبقة الاهتمام (Interest Layer — Before Booking)
**Buttons:**
- save property/listing
- request details
- compare

**Tracking:**
- view_count
- save_count
- chat_click

**Ranking Boost:**
- listings ذات تفاعل عالي تظهر أولاً



---

## 13. نظام الحاسبات التقديرية (Estimation Tools)

### 13.1 المبدأ
**هدف:** مساعدة المستخدم في اتخاذ القرار بدون تقديم تمويل

### 13.2 حاسبة القسط (Installment Estimator)
```
INPUT: totalPrice, downPayment, years
PROCESS:
    remaining = totalPrice - downPayment
    months = years × 12
    estimatedMonthlyInstallment = remaining / months
OUTPUT: estimatedMonthlyInstallment
DISPLAY: "قسط تقريبي: XXXX / شهر"
NOTE: "حساب تقريبي وليس عرض تمويلي"
```

### 13.3 حاسبة الرهن (Mortgage Estimator)
```
INPUT: totalPrice, downPayment, years
PROCESS: same as installment
OUTPUT: estimatedMonthlyInstallment
NOTE: "حسب بيانات المعلن"
```

### 13.4 مقارنة الإيجار vs الشراء (Rent vs Buy)
```
COMPARE:
    - rentMonthly
    - estimatedInstallment
DISPLAY:
    - "الإيجار: XXXX"
    - "الشراء: XXXX"
```

### 13.5 قواعد العرض
- يظهر كـ: "حاسبة تقديرية"
- Collapsible section
- لا يظهر لو البيانات ناقصة
- لا يحتوي على بنك أو جهة تمويل



---

## 14. نظام الثقة ومكافحة الاحتيال (Anti-Spam & Trust)

### 14.1 كشف التكرار (Duplicate Detection)
- نفس الصور
- نفس رقم الهاتف

### 14.2 كشف الشذوذ السعري (Price Anomaly)
- مقارنة بسعر المنطقة
- مقارنة بمتوسط الفئة

### 14.3 التحقق من الصور (Image Validation)
- منع الصور غير الواقعية
- حد أدنى 5 صور للسيارات
- حد أدنى صور واضحة للعقارات

### 14.4 مراجعة الإعلان (Listing Review)
- أول إعلان: manual approval
- الإعلانات التالية: auto-review مع فحص

### 14.5 التحقق من المستندات (Document Verification)
- commercialRegister
- taxCard
- license
- verifiedByPlatform (true/false)



---

## 15. نظام المساعد الذكي (AI Assistant System)

### 15.1 المبدأ الأساسي
- **AI واحد** داخل التطبيق
- **لا يغيّر أي سيستم موجود**
- فقط:
  - يسهّل البحث
  - يسرّع القرار
  - ينفذ actions

### 15.2 Smart Routing (بدون تعقيد)
AI يفهم المستخدم تلقائي:
- "شقة / إيجار" → **عقارات**
- "مصنع / مورد" → **صناعي**
- "عربية / سيارة" → **سيارات**

**الخطوات:**
1. يحدد القسم
2. يطبق filters
3. يعرض نتائج

### 15.3 الوظائف المشتركة (Shared Functions)
| الوظيفة | الوصف |
|---------|--------|
| **Smart Search** | يحول الكلام → Filters |
| **Recommendation** | يرشح أفضل نتائج |
| **Comparison** | يقارن بين اختيارات |
| **Decision Hint** | مناسب / غالي / فرصة |
| **Action** | Chat / Booking / RFQ |

### 15.4 تكامل العقارات (Real Estate Integration)
AI يستخدم الموجود:
- price_per_meter
- installment_estimator

**وظيفته:**
- ترشيح وحدات
- حساب القسط
- مقارنة
- حجز معاينة

**Output:**
- قائمة وحدات
- أفضل اختيار
- زر: احجز معاينة / تواصل

### 15.5 تكامل الصناعي (Industrial Integration)
AI يستخدم:
- RFQ system
- supplier verification

**وظيفته:**
- ترشيح موردين
- تحليل السعر
- فتح RFQ
- بدء شات

**Output:**
- موردين / مصانع
- تحليل سريع: مناسب / غالي / فرصة
- زر: احجز زيارة / تواصل

### 15.6 تكامل السيارات (Cars Integration — الأقوى)
AI يستخدم:
- deal rating
- price history
- similar cars

**وظيفته:**
- تحليل السعر: ممتاز / مناسب / غالي
- شرح: "السعر نزل"
- اقتراح: سيارات بديلة
- تنفيذ: حجز تجربة / تواصل

**Output:**
- سيارات مناسبة
- تقييم الصفقة

### 15.7 قاعدة عدم التعارض (Non-Conflict Rule)
- **لا يستبدل** الفلاتر
- **لا يغير** الـ UI
- **لا يضيف** تعقيد

**AI = Layer فوق السيستم فقط**

### 15.8 هيكل UI
- **زر واحد:** "المساعد الذكي"
- **Edge Widget:** يختفي ويظهر من الجانب
- **يمكن إغلاقه** من الإعدادات داخل الحساب

**داخل الشات:**
Quick Actions:
- رشحلي
- قارن
- احسب
- تواصل

### 15.9 نظام Auto Action (Smart)
لو المستخدم مهتم:
AI يقترح:
- احجز معاينة
- احجز تجربة
- اطلب عرض سعر

**Trigger:** لو المستخدم مهتم → يظهر CTA

### 15.10 Value Proposition
```
بدون AI:
- المستخدم يدور

مع AI:
- المستخدم يلاقي + يقرر + ينفذ
```

### 15.11 قواعد AI
- يعتمد على بيانات التطبيق فقط
- لا يقدم تمويل
- الحسابات تقديرية
- ينفذ actions (search/booking/RFQ)



---

## 16. لوحة تحكم المطور والأدمن (Developer & Admin Tools)

### 16.1 Dashboard
- listings count
- views
- bookings
- conversion rate
- stats: views / bookings

### 16.2 Actions
- boost listing
- edit price
- mark as sold

### 16.3 إحصائيات الصفحة
- عدد البوستات
- عدد التفاعلات (Likes, Comments, Saves, Follows)
- People who love my ad

### 16.4 Banco Admin
- إدارة الحسابات والإعلانات
- مراجعة واعتماد حسابات الشركات
- تعديل أسعار الباقات والإعلانات الفردية
- متابعة الأداء: إحصائيات الوصول والتفاعل



---

## 17. قواعد الأداء والأداء (Performance Rules)

### 17.1 متطلبات الأداء
- **Pagination required** — في كل قوائم البحث
- **Lazy load images** — تحميل الصور عند الحاجة
- **Speed first** — سرعة كل الصفحات والبيانات في أولوية قصوى
- **No lag** — لا يوجد مجال للتعليق أو البطء

### 17.2 Firestore Indexes
```
- price
- location
- listingType
- createdAt
- city
- area
- category
- industryType
```

### 17.3 UI Rules (No Complexity)
- شاشة واحدة للـ listing:
  - صور فوق
  - السعر
  - زر: احجز معاينة / تواصل
- Filters: bottom sheet بسيط
- Booking: 3 steps max
- Chat: نفس UX Messenger

### 17.4 الصور والعرض
- مراعاة **جميع مقاسات الشاشات** (Responsive Design)
- الصفحة الرئيسية تدعم جميع طرق العرض والمقاسات
- ضغط تلقائي للصور والفيديوهات



---

## 18. ملاحظات قانونية (Legal Notes)

### 18.1 مبادئ قانونية
- **المنصة لا تقدم تمويل** — جميع الحسابات تقديرية فقط
- **المنصة وسيط رقمي فقط** — توثق المستندات بدون تحمل مسؤولية التنفيذ
- **الاتفاق يتم بين الأطراف مباشرة**
- **لا تتحمل مسؤولية الدفع أو التنفيذ**

### 18.2 Disclaimer
- جميع الحسابات تقديرية فقط
- الاتفاق يتم بين الأطراف مباشرة
- التحقق من المستندات يتم بدون تحمل مسؤولية التنفيذ



---

## 19. ملاحظات تنفيذية صارمة (Critical Implementation Notes)

| # | الملاحظة | الأولوية |
|---|----------|----------|
| 1 | صلاحيات الموقع تُطلب مرة واحدة فقط عند أول تشغيل | 🔴 عالية |
| 2 | سرعة تحميل البيانات في كل الصفحات — لا يوجد مجال للبطء | 🔴 عالية |
| 3 | تثبيت أسعار الباقات مع إمكانية التعديل من الأدمن | 🔴 عالية |
| 4 | 3 إعلانات مجانية لكل شركة جديدة في البداية | 🔴 عالية |
| 5 | المساعد الذكي يحتوي على برومبت كامل بمعلومات المشروع | 🟡 متوسطة |
| 6 | دعم جميع المقاسات والشاشات في الواجهة | 🔴 عالية |
| 7 | التوثيق يتم من الداشبورد — الحساب يظل نشطًا حتى الرد | 🟡 متوسطة |
| 8 | إضافة إعلان في منتصف المسطرة السفلية | 🔴 عالية |
| 9 | AI واحد فقط — لا 3 شاتات منفصلة | 🔴 عالية |
| 10 | Edge Widget للمساعد الذكي — يمكن إغلاقه من الإعدادات | 🟡 متوسطة |
| 11 | تفعيل بصمة الوجه والإصبع | 🔴 عالية |
| 12 | OTP عبر الإيميل لاستعادة كلمة السر | 🔴 عالية |
| 13 | Manual approval لأول إعلان | 🔴 عالية |
| 14 | Deal Rating للسيارات | 🔴 عالية |
| 15 | Price History للسيارات | 🟡 متوسطة |
| 16 | Price Drop Alerts | 🟡 متوسطة |
| 17 | Global Trade Layer للصناعي | 🟢 مستقبلية |
| 18 | Multi-Currency Support | 🟢 مستقبلية |
| 19 | NDA قبل عرض التفاصيل الحساسة | 🟢 مستقبلية |
| 20 | CAD/PDF Upload للمخططات | 🟢 مستقبلية |

---

## الخلاصة النهائية (Final Summary)

```
Banco =

Marketplace (عقارات + سيارات + صناعي)
+ AI Layer بسيط (مساعد ذكي واحد)
+ Decision Engine (حاسبات + تقييم + مقارنة)
+ Conversion System (حجز + محادثة + RFQ)
+ Trust System (توثيق + verification + anti-fraud)
+ Payment System (Paymob + Fawry + Stripe)
+ Admin Dashboard (تحكم كامل في الأسعار والباقات)
```

**الهدف:**
- يقلل وقت البحث
- يرفع conversion
- يحول المستخدم لعميل
- يبني ثقة مستدامة

---

**الإصدار:** 1.0 — يونيو 2026
**الحالة:** وثيقة تنفيذية صارمة — إضافات وتحسينات على المشروع القائم
**ملاحظة:** جميع ما ورد أعلاه يُعتبر إضافات وتحسينات صارمة على المشروع القائم. يجب تنفيذها بدقة عالية ومطابقة للمنصات العالمية، مع الحفاظ على البساطة التقنية وخفض التكاليف غير الضرورية.
