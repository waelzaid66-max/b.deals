import { JsonLd } from "../components/JsonLd";
import { HomeFeedTeaser } from "../components/HomeFeedTeaser";
import { HomeTrendingStrip } from "../components/HomeTrendingStrip";
import { SectionIcon, type SectionIconVariant } from "../components/SectionIcon";
import { bancoBrand, hubAccent } from "@workspace/design-tokens";
import { collectionPageJsonLd } from "../lib/structured-data";
import { pageMetadata } from "../lib/page-metadata";

const sectionStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  padding: "2rem 1.25rem",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "0.75rem",
  marginTop: "1.25rem",
};

const hubCardStyle = (accent: string): React.CSSProperties => ({
  border: "1px solid var(--banco-border)",
  borderRadius: "var(--banco-radius)",
  background: "var(--banco-card)",
  padding: "1rem",
  textDecoration: "none",
  color: "var(--banco-fg)",
  display: "block",
  borderTop: `3px solid ${accent}`,
});

const HUBS: Array<{
  href: string;
  accent: string;
  icon: SectionIconVariant;
  titleAr: string;
  descAr: string;
}> = [
  {
    href: "/search",
    accent: hubAccent.general,
    icon: "search",
    titleAr: "بحث عام",
    descAr: "فلاتر، خريطة، ونتائج حية",
  },
  {
    href: "/cars",
    accent: hubAccent.cars,
    icon: "cars",
    titleAr: "سيارات",
    descAr: "بيع وتقسيط",
  },
  {
    href: "/real-estate",
    accent: hubAccent.real_estate,
    icon: "real_estate",
    titleAr: "عقارات",
    descAr: "بيع وإيجار",
  },
  {
    href: "/industrial",
    accent: hubAccent.industrial,
    icon: "industrial",
    titleAr: "صناعي",
    descAr: "منشآت ومواد",
  },
];

export const metadata = pageMetadata({
  title: "BANCO — سيارات وعقارات وصناعي",
  description: "منصة BANCO للبحث عن سيارات وعقارات ومنشآت صناعية في مصر",
  path: "/",
});

export default function HomePage() {
  return (
    <main style={sectionStyle}>
      <JsonLd
        data={collectionPageJsonLd({
          name: "BANCO",
          description: "تصفح سيارات وعقارات ومنشآت صناعية",
          path: "/",
        })}
      />
      <p
        style={{
          margin: "0 0 0.5rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: bancoBrand.red,
        }}
      >
        BANCO
      </p>
      <h1 style={{ margin: "0 0 0.75rem", fontSize: "1.75rem" }}>
        تصفّح السوق في مكان واحد
      </h1>
      <p style={{ margin: 0, color: "var(--banco-muted)", lineHeight: 1.7, maxWidth: 560 }}>
        موقع المستهلك التكميلي — بحث موحّد مع تطبيق الجوال عبر عقد البحث المشترك.
      </p>
      <nav style={gridStyle} aria-label="مراكز التصفح">
        {HUBS.map((hub) => (
          <a key={hub.href} href={hub.href} style={hubCardStyle(hub.accent)}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
              }}
            >
              <SectionIcon variant={hub.icon} size={18} color={hub.accent} />
              <strong>{hub.titleAr}</strong>
            </span>
            <p style={{ margin: "0.35rem 0 0", color: "var(--banco-muted)", fontSize: "0.9rem" }}>
              {hub.descAr}
            </p>
          </a>
        ))}
      </nav>
      <HomeTrendingStrip />
      <HomeFeedTeaser />
    </main>
  );
}
