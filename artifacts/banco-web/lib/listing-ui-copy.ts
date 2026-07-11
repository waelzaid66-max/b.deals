import type { SiteLocale } from "./hub-config";

export type ListingUiCopy = {
  home: string;
  breadcrumbAria: string;
  category: string;
  status: string;
  seller: string;
  sellerAbout: string;
  share: string;
  openInApp: string;
  publicLink: string;
  contactTitle: string;
  contactCall: string;
  contactWhatsApp: string;
  contactChat: string;
  contactBooking: string;
  contactAppHint: string;
  requestBadge: string;
  sponsored: string;
  video: string;
  notFoundTitle: string;
  notFoundBody: string;
  backToSearch: string;
  loadingAria: string;
  metadataMissing: string;
  metadataFallback: string;
};

const COPY: Record<SiteLocale, ListingUiCopy> = {
  ar: {
    home: "الرئيسية",
    breadcrumbAria: "مسار التصفح",
    category: "الفئة",
    status: "الحالة",
    seller: "البائع",
    sellerAbout: "عن البائع",
    share: "مشاركة",
    openInApp: "فتح في التطبيق",
    publicLink: "رابط عام",
    contactTitle: "تواصل مع البائع",
    contactCall: "اتصال",
    contactWhatsApp: "واتساب",
    contactChat: "محادثة",
    contactBooking: "حجز إقامة",
    contactAppHint: "الاتصال والحجز والمحادثة متاحان في تطبيق BANCO — نفس تجربة الجوال.",
    requestBadge: "طلب شراء",
    sponsored: "ممول",
    video: "فيديو",
    notFoundTitle: "الإعلان غير متاح",
    notFoundBody: "ربما تم حذف الإعلان أو انتهت صلاحيته.",
    backToSearch: "العودة إلى البحث",
    loadingAria: "جاري تحميل الإعلان",
    metadataMissing: "إعلان غير موجود",
    metadataFallback: "إعلان",
  },
  en: {
    home: "Home",
    breadcrumbAria: "Breadcrumb",
    category: "Category",
    status: "Status",
    seller: "Seller",
    sellerAbout: "About the seller",
    share: "Share",
    openInApp: "Open in app",
    publicLink: "Public link",
    contactTitle: "Contact seller",
    contactCall: "Call",
    contactWhatsApp: "WhatsApp",
    contactChat: "Message",
    contactBooking: "Book stay",
    contactAppHint: "Call, chat, and booking run in the BANCO app — same as mobile.",
    requestBadge: "Wanted to buy",
    sponsored: "Sponsored",
    video: "Video",
    notFoundTitle: "Listing unavailable",
    notFoundBody: "It may have been removed or expired.",
    backToSearch: "Back to search",
    loadingAria: "Loading listing",
    metadataMissing: "Listing not found",
    metadataFallback: "Listing",
  },
};

export function listingUiCopy(locale: SiteLocale): ListingUiCopy {
  return COPY[locale];
}

export const LISTING_HUB_LABELS: Record<
  SiteLocale,
  Record<"car" | "real_estate" | "industrial", { href: string; label: string }>
> = {
  ar: {
    car: { href: "/cars", label: "سيارات" },
    real_estate: { href: "/real-estate", label: "عقارات" },
    industrial: { href: "/industrial", label: "صناعي" },
  },
  en: {
    car: { href: "/en/cars", label: "Cars" },
    real_estate: { href: "/en/real-estate", label: "Real Estate" },
    industrial: { href: "/en/industrial", label: "Industrial" },
  },
};
