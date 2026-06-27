/**
 * Location taxonomy for the structured location picker.
 *
 * The backend filters listings by a single `location` string using a
 * case-insensitive substring match (ILIKE %value%). So every `value` below is
 * chosen to be a substring of the real location strings stored on listings
 * (e.g. "October" matches "6th of October City", "Sokhna" matches
 * "Ain Sokhna"). Selecting an area applies the most specific real match;
 * selecting a whole governorate/emirate applies the broader name.
 *
 * Labels are baked bilingually (en + ar) so the picker needs no extra i18n
 * keys for the ~hundreds of place names. The data is Egypt-centric because
 * that is where the seeded inventory lives; UAE/Saudi are honest filters that
 * simply return what exists for those markets.
 */
export interface LocOption {
  /** Substring used for the backend `location` filter. */
  value: string;
  en: string;
  ar: string;
}

export interface LocGroup extends LocOption {
  areas: LocOption[];
}

export interface LocCountry extends LocOption {
  groups: LocGroup[];
}

export function locLabel(o: LocOption, isRTL: boolean): string {
  return isRTL ? o.ar : o.en;
}

const a = (value: string, en: string, ar: string): LocOption => ({
  value,
  en,
  ar,
});

const EGYPT: LocCountry = {
  value: "Egypt",
  en: "Egypt",
  ar: "مصر",
  groups: [
    {
      value: "Cairo",
      en: "Cairo",
      ar: "القاهرة",
      areas: [
        a("New Cairo", "New Cairo", "القاهرة الجديدة"),
        a("New Administrative Capital", "New Capital", "العاصمة الإدارية"),
        a("Nasr City", "Nasr City", "مدينة نصر"),
        a("Heliopolis", "Heliopolis", "مصر الجديدة"),
        a("Maadi", "Maadi", "المعادي"),
        a("Zamalek", "Zamalek", "الزمالك"),
        a("Downtown", "Downtown", "وسط البلد"),
        a("Rehab", "El Rehab", "الرحاب"),
        a("Shorouk", "El Shorouk", "الشروق"),
        a("Shubra", "Shubra", "شبرا"),
        a("Helwan", "Helwan", "حلوان"),
      ],
    },
    {
      value: "Giza",
      en: "Giza",
      ar: "الجيزة",
      areas: [
        a("October", "6th of October", "6 أكتوبر"),
        a("Sheikh Zayed", "Sheikh Zayed", "الشيخ زايد"),
        a("Mohandessin", "Mohandessin", "المهندسين"),
        a("Dokki", "Dokki", "الدقي"),
        a("Haram", "Haram", "الهرم"),
        a("Faisal", "Faisal", "فيصل"),
      ],
    },
    {
      value: "Alexandria",
      en: "Alexandria",
      ar: "الإسكندرية",
      areas: [
        a("Smouha", "Smouha", "سموحة"),
        a("Sidi Gaber", "Sidi Gaber", "سيدي جابر"),
        a("Stanley", "Stanley", "ستانلي"),
        a("Miami", "Miami", "ميامي"),
        a("Agami", "Agami", "العجمي"),
        a("Borg El Arab", "Borg El Arab", "برج العرب"),
      ],
    },
    {
      value: "Red Sea",
      en: "Red Sea",
      ar: "البحر الأحمر",
      areas: [
        a("Hurghada", "Hurghada", "الغردقة"),
        a("Gouna", "El Gouna", "الجونة"),
      ],
    },
    {
      value: "Matrouh",
      en: "Matrouh",
      ar: "مطروح",
      areas: [
        a("North Coast", "North Coast", "الساحل الشمالي"),
        a("Marsa Matrouh", "Marsa Matrouh", "مرسى مطروح"),
      ],
    },
    {
      value: "South Sinai",
      en: "South Sinai",
      ar: "جنوب سيناء",
      areas: [
        a("Sharm", "Sharm El Sheikh", "شرم الشيخ"),
        a("Dahab", "Dahab", "دهب"),
      ],
    },
    {
      value: "Suez",
      en: "Suez",
      ar: "السويس",
      areas: [
        a("Sokhna", "Ain Sokhna", "العين السخنة"),
        a("Suez", "Suez City", "مدينة السويس"),
      ],
    },
    {
      value: "Sharqia",
      en: "Sharqia",
      ar: "الشرقية",
      areas: [
        a("Zagazig", "Zagazig", "الزقازيق"),
        a("Ramadan", "10th of Ramadan", "العاشر من رمضان"),
      ],
    },
    {
      value: "Qalyubia",
      en: "Qalyubia",
      ar: "القليوبية",
      areas: [
        a("Banha", "Banha", "بنها"),
        a("Obour", "Obour", "العبور"),
        a("Shubra El Kheima", "Shubra El Kheima", "شبرا الخيمة"),
      ],
    },
    {
      value: "Dakahlia",
      en: "Dakahlia",
      ar: "الدقهلية",
      areas: [a("Mansoura", "Mansoura", "المنصورة")],
    },
    {
      value: "Gharbia",
      en: "Gharbia",
      ar: "الغربية",
      areas: [
        a("Tanta", "Tanta", "طنطا"),
        a("Mahalla", "Mahalla", "المحلة"),
      ],
    },
    {
      value: "Beheira",
      en: "Beheira",
      ar: "البحيرة",
      areas: [a("Damanhour", "Damanhour", "دمنهور")],
    },
    {
      value: "Kafr El Sheikh",
      en: "Kafr El Sheikh",
      ar: "كفر الشيخ",
      areas: [a("Kafr El Sheikh", "Kafr El Sheikh", "كفر الشيخ")],
    },
    {
      value: "Damietta",
      en: "Damietta",
      ar: "دمياط",
      areas: [a("Damietta", "Damietta", "دمياط")],
    },
    {
      value: "Port Said",
      en: "Port Said",
      ar: "بورسعيد",
      areas: [a("Port Said", "Port Said", "بورسعيد")],
    },
    {
      value: "Ismailia",
      en: "Ismailia",
      ar: "الإسماعيلية",
      areas: [a("Ismailia", "Ismailia", "الإسماعيلية")],
    },
    {
      value: "Fayoum",
      en: "Fayoum",
      ar: "الفيوم",
      areas: [a("Fayoum", "Fayoum", "الفيوم")],
    },
    {
      value: "Beni Suef",
      en: "Beni Suef",
      ar: "بني سويف",
      areas: [a("Beni Suef", "Beni Suef", "بني سويف")],
    },
    {
      value: "Minya",
      en: "Minya",
      ar: "المنيا",
      areas: [a("Minya", "Minya", "المنيا")],
    },
    {
      value: "Assiut",
      en: "Assiut",
      ar: "أسيوط",
      areas: [a("Assiut", "Assiut", "أسيوط")],
    },
    {
      value: "Sohag",
      en: "Sohag",
      ar: "سوهاج",
      areas: [a("Sohag", "Sohag", "سوهاج")],
    },
    {
      value: "Qena",
      en: "Qena",
      ar: "قنا",
      areas: [a("Qena", "Qena", "قنا")],
    },
    {
      value: "Luxor",
      en: "Luxor",
      ar: "الأقصر",
      areas: [a("Luxor", "Luxor", "الأقصر")],
    },
    {
      value: "Aswan",
      en: "Aswan",
      ar: "أسوان",
      areas: [a("Aswan", "Aswan", "أسوان")],
    },
    {
      value: "New Valley",
      en: "New Valley",
      ar: "الوادي الجديد",
      areas: [a("Kharga", "Kharga", "الخارجة")],
    },
    {
      value: "North Sinai",
      en: "North Sinai",
      ar: "شمال سيناء",
      areas: [a("Arish", "Arish", "العريش")],
    },
  ],
};

const UAE: LocCountry = {
  value: "UAE",
  en: "UAE",
  ar: "الإمارات",
  groups: [
    {
      value: "Dubai",
      en: "Dubai",
      ar: "دبي",
      areas: [],
    },
    {
      value: "Abu Dhabi",
      en: "Abu Dhabi",
      ar: "أبو ظبي",
      areas: [],
    },
    {
      value: "Sharjah",
      en: "Sharjah",
      ar: "الشارقة",
      areas: [],
    },
    {
      value: "Ajman",
      en: "Ajman",
      ar: "عجمان",
      areas: [],
    },
    {
      value: "Ras Al Khaimah",
      en: "Ras Al Khaimah",
      ar: "رأس الخيمة",
      areas: [],
    },
    {
      value: "Fujairah",
      en: "Fujairah",
      ar: "الفجيرة",
      areas: [],
    },
    {
      value: "Umm Al Quwain",
      en: "Umm Al Quwain",
      ar: "أم القيوين",
      areas: [],
    },
  ],
};

const SAUDI: LocCountry = {
  value: "Saudi Arabia",
  en: "Saudi Arabia",
  ar: "السعودية",
  groups: [
    { value: "Riyadh", en: "Riyadh", ar: "الرياض", areas: [] },
    { value: "Jeddah", en: "Jeddah", ar: "جدة", areas: [] },
    { value: "Mecca", en: "Mecca", ar: "مكة", areas: [] },
    { value: "Medina", en: "Medina", ar: "المدينة", areas: [] },
    { value: "Dammam", en: "Dammam", ar: "الدمام", areas: [] },
    { value: "Khobar", en: "Khobar", ar: "الخبر", areas: [] },
    { value: "Tabuk", en: "Tabuk", ar: "تبوك", areas: [] },
    { value: "Abha", en: "Abha", ar: "أبها", areas: [] },
  ],
};

export const LOCATIONS: LocCountry[] = [EGYPT, UAE, SAUDI];

/** Flattened area list for a country, used for the picker's search box. */
export function flattenAreas(
  country: LocCountry
): { area: LocOption; group: LocGroup }[] {
  const out: { area: LocOption; group: LocGroup }[] = [];
  for (const group of country.groups) {
    if (group.areas.length === 0) {
      out.push({ area: group, group });
    } else {
      for (const area of group.areas) out.push({ area, group });
    }
  }
  return out;
}

export function labelForValue(value: string, isRTL: boolean): string {
  if (!value) return "";
  for (const country of LOCATIONS) {
    for (const group of country.groups) {
      if (group.value === value) return locLabel(group, isRTL);
      for (const area of group.areas) {
        if (area.value === value) return locLabel(area, isRTL);
      }
    }
  }
  return value;
}
