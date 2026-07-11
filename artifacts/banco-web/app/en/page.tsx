import { JsonLd } from "../../components/JsonLd";
import { HomeFeedTeaser } from "../../components/HomeFeedTeaser";
import { HomeTrendingStrip } from "../../components/HomeTrendingStrip";
import { SectionIcon, type SectionIconVariant } from "../../components/SectionIcon";
import { bancoBrand, hubAccent } from "@workspace/design-tokens";
import { collectionPageJsonLd } from "../../lib/structured-data";
import { pageMetadata } from "../../lib/page-metadata";

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
  title: string;
  desc: string;
}> = [
  {
    href: "/en/search",
    accent: hubAccent.general,
    icon: "search",
    title: "Search",
    desc: "Filters, map, and live results",
  },
  {
    href: "/en/cars",
    accent: hubAccent.cars,
    icon: "cars",
    title: "Cars",
    desc: "Sale and financing",
  },
  {
    href: "/en/real-estate",
    accent: hubAccent.real_estate,
    icon: "real_estate",
    title: "Real Estate",
    desc: "Sale and rent",
  },
  {
    href: "/en/industrial",
    accent: hubAccent.industrial,
    icon: "industrial",
    title: "Industrial",
    desc: "Facilities and materials",
  },
];

export const metadata = pageMetadata({
  title: "BANCO — Cars, Real Estate & Industrial",
  description: "Browse cars, real estate, and industrial listings in Egypt on BANCO",
  path: "/en",
  locale: "en",
});

export default function EnglishHomePage() {
  return (
    <main style={sectionStyle}>
      <JsonLd
        data={collectionPageJsonLd({
          name: "BANCO",
          description: "Browse cars, real estate, and industrial listings",
          path: "/en",
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
        Browse the market in one place
      </h1>
      <p style={{ margin: 0, color: "var(--banco-muted)", lineHeight: 1.7, maxWidth: 560 }}>
        The consumer web companion — unified search with the mobile app via the shared search contract.
      </p>
      <nav style={gridStyle} aria-label="Browse hubs">
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
              <strong>{hub.title}</strong>
            </span>
            <p style={{ margin: "0.35rem 0 0", color: "var(--banco-muted)", fontSize: "0.9rem" }}>
              {hub.desc}
            </p>
          </a>
        ))}
      </nav>
      <HomeTrendingStrip locale="en" />
      <HomeFeedTeaser locale="en" />
    </main>
  );
}
