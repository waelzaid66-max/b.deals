"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { bancoBrand } from "@workspace/design-tokens";
import {
  getAdminUrl,
  getAppStoreUrls,
  getMarketUrl,
} from "../lib/site-env";
import { chromeCopy } from "../lib/chrome-copy";
import { localeFromPathname } from "../lib/hub-config";
import { writeStoredLocale } from "../lib/locale-preference";
import { LocaleSwitcher } from "./LocaleSwitcher";

const headerStyle: React.CSSProperties = {
  borderBottom: "1px solid var(--banco-border)",
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(8px)",
  position: "sticky",
  top: 0,
  zIndex: 50,
};

const innerStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  padding: "0.75rem 1.25rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  flexWrap: "wrap",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.65rem",
  alignItems: "center",
};

const linkStyle: React.CSSProperties = {
  color: "var(--banco-fg)",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: 600,
};

const footerStyle: React.CSSProperties = {
  borderTop: "1px solid var(--banco-border)",
  marginTop: "2.5rem",
  padding: "1.5rem 1.25rem 2rem",
  color: "var(--banco-muted)",
  fontSize: "0.85rem",
};

const footerGridStyle: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
};

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={linkStyle}>
      {children}
    </a>
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const locale = localeFromPathname(pathname);
  const copy = chromeCopy(locale);
  const market = getMarketUrl();
  const admin = getAdminUrl();
  const stores = getAppStoreUrls();

  useEffect(() => {
    if (locale === "ar" && !pathname.startsWith("/listing/")) {
      writeStoredLocale("ar");
    }
  }, [locale, pathname]);

  return (
    <>
      <header style={headerStyle}>
        <div style={innerStyle}>
          <Link
            href={copy.homeHref}
            aria-label={copy.brandAria}
            style={{ ...linkStyle, color: bancoBrand.red, fontSize: "1.1rem" }}
          >
            BANCO
          </Link>
          <nav style={navStyle} aria-label={copy.navAria}>
            <Link href={copy.searchHref} style={linkStyle}>
              {copy.search}
            </Link>
            <Link href={copy.carsHref} style={linkStyle}>
              {copy.cars}
            </Link>
            <Link href={copy.realEstateHref} style={linkStyle}>
              {copy.realEstate}
            </Link>
            <Link href={copy.industrialHref} style={linkStyle}>
              {copy.industrial}
            </Link>
            {market ? <ExternalLink href={market}>{copy.market}</ExternalLink> : null}
            {admin ? <ExternalLink href={admin}>{copy.admin}</ExternalLink> : null}
            <LocaleSwitcher />
          </nav>
        </div>
      </header>
      <div id="main-content">{children}</div>
      <footer style={footerStyle}>
        <div style={footerGridStyle}>
          <div>
            <strong style={{ color: "var(--banco-fg)" }}>{copy.browse}</strong>
            <p style={{ margin: "0.5rem 0 0", lineHeight: 1.8 }}>
              <Link href={copy.searchHref}>{copy.generalSearch}</Link>
              {" · "}
              <Link href={copy.carsHref}>{copy.cars}</Link>
              {" · "}
              <Link href={copy.realEstateHref}>{copy.realEstate}</Link>
              {" · "}
              <Link href={copy.industrialHref}>{copy.industrial}</Link>
            </p>
          </div>
          <div>
            <strong style={{ color: "var(--banco-fg)" }}>{copy.platforms}</strong>
            <p style={{ margin: "0.5rem 0 0", lineHeight: 1.8 }}>
              {market ? (
                <a href={market} target="_blank" rel="noreferrer">
                  {copy.marketLabel}
                </a>
              ) : (
                copy.marketSoon
              )}
              {" · "}
              {admin ? (
                <a href={admin} target="_blank" rel="noreferrer">
                  {copy.adminLabel}
                </a>
              ) : (
                copy.adminSoon
              )}
            </p>
          </div>
          <div>
            <strong style={{ color: "var(--banco-fg)" }}>{copy.app}</strong>
            <p style={{ margin: "0.5rem 0 0", lineHeight: 1.8 }}>
              {stores.android ? (
                <a href={stores.android} target="_blank" rel="noreferrer">
                  Android
                </a>
              ) : (
                copy.androidSoon
              )}
              {" · "}
              {stores.ios ? (
                <a href={stores.ios} target="_blank" rel="noreferrer">
                  iOS
                </a>
              ) : (
                copy.iosSoon
              )}
            </p>
          </div>
        </div>
        <p style={{ textAlign: "center", margin: "1.25rem 0 0" }}>
          © {new Date().getFullYear()} BANCO
        </p>
      </footer>
    </>
  );
}
