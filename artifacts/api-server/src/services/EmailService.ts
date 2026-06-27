import { db } from "@workspace/db";
import { notificationPreferences } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { getResolvedConfig } from "./EmailConfigService";

/**
 * EmailService — outbound transactional email for BANCO.
 *
 * Communications layer (Task #38). Two concerns are deliberately separated:
 *   1. Transport: HOW a message leaves the system. A provider abstraction keeps
 *      the rest of the app provider-agnostic. With no external provider wired,
 *      the default LogTransport renders the message and records it WITHOUT
 *      claiming delivery — honest about the fact nothing was actually sent.
 *      A ResendTransport activates automatically the moment a RESEND_API_KEY is
 *      configured, so adding a provider later needs no code change here.
 *   2. Content: bilingual (AR/EN), dark-themed templates that mirror the app's
 *      brand (#000 background, #E8002D accent). Every value passed in is REAL —
 *      this module never fabricates counts, prices or activity.
 */

export type EmailLang = "ar" | "en";

export type NotificationCategory =
  | "message"
  | "lead"
  | "system"
  | "rfq"
  | "new_match"
  | "price_drop";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailTransport {
  readonly name: string;
  send(msg: EmailMessage): Promise<void>;
}

/* ── Transports ────────────────────────────────────────── */

// Default transport: renders the message and logs that it was produced. It does
// NOT claim delivery — there is no external provider until one is configured.
class LogTransport implements EmailTransport {
  readonly name = "log";
  async send(msg: EmailMessage): Promise<void> {
    logger.info(
      {
        transport: "log",
        to: msg.to,
        subject: msg.subject,
        html_bytes: msg.html.length,
      },
      "Email rendered (no external provider configured; not delivered)",
    );
  }
}

// Real delivery via Resend's REST API. Activates only when RESEND_API_KEY is
// present, so it is inert (never constructed) until the user configures it.
class ResendTransport implements EmailTransport {
  readonly name = "resend";
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}
  async send(msg: EmailMessage): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend send failed: ${res.status} ${detail}`);
    }
  }
}

/**
 * Resolve the runtime for a single send from the admin-managed config (DB-first,
 * env fallback). Read fresh each time — no module cache — so a key/sender saved
 * in the Control Center takes effect on the next email without a redeploy.
 * Resend transport when an API key resolves, otherwise honest log-only.
 */
async function resolveEmailRuntime(): Promise<{
  transport: EmailTransport;
  appUrl: (path: string) => string | undefined;
}> {
  const cfg = await getResolvedConfig();
  const transport: EmailTransport = cfg.apiKey
    ? new ResendTransport(cfg.apiKey, cfg.from)
    : new LogTransport();
  const base = cfg.publicAppUrl;
  const appUrl = (path: string): string | undefined =>
    base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : undefined;
  return { transport, appUrl };
}

/* ── Preference gate ───────────────────────────────────── */

/**
 * True when the user accepts email for this category. Absence of a stored row
 * means enabled (defaults are implicit) — mirrors ProfileService resolution.
 */
export async function isEmailChannelEnabled(
  userId: string,
  type: NotificationCategory,
): Promise<boolean> {
  const [row] = await db
    .select({ email: notificationPreferences.email })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.type, type),
      ),
    )
    .limit(1);
  return row ? row.email : true;
}

/* ── Templates (bilingual, dark) ───────────────────────── */

const BRAND_RED = "#E8002D";
const BG = "#000000";
const CARD = "#0c0c0c";
const BORDER = "#1c1c1c";
const FG = "#ffffff";
const MUTED = "#9a9a9a";

interface TemplateRow {
  label: string;
  value: string;
}

interface TemplateInput {
  lang: EmailLang;
  preheader: string;
  heading: string;
  intro: string;
  rows?: TemplateRow[];
  cta?: { label: string; url: string };
  footer: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderEmail(input: TemplateInput): { html: string; text: string } {
  const dir = input.lang === "ar" ? "rtl" : "ltr";
  const align = input.lang === "ar" ? "right" : "left";
  const rowsHtml = (input.rows ?? [])
    .map(
      (r) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:13px;">${escapeHtml(r.label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${BORDER};color:${FG};font-size:15px;font-weight:600;text-align:${input.lang === "ar" ? "left" : "right"};">${escapeHtml(r.value)}</td>
        </tr>`,
    )
    .join("");

  const ctaHtml = input.cta
    ? `<tr><td style="padding-top:24px;">
         <a href="${escapeHtml(input.cta.url)}" style="display:inline-block;background:${BRAND_RED};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:12px;">${escapeHtml(input.cta.label)}</a>
       </td></tr>`
    : "";

  const html = `<!doctype html>
<html dir="${dir}" lang="${input.lang}">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
  <body style="margin:0;background:${BG};color:${FG};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;opacity:0;color:${BG};">${escapeHtml(input.preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${CARD};border:1px solid ${BORDER};border-radius:18px;overflow:hidden;">
          <tr><td style="padding:24px 28px;border-bottom:1px solid ${BORDER};">
            <span style="font-size:20px;font-weight:800;letter-spacing:0.5px;color:${FG};">BANCO</span>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${BRAND_RED};margin:0 4px;"></span>
          </td></tr>
          <tr><td style="padding:28px;text-align:${align};" dir="${dir}">
            <h1 style="margin:0 0 10px;font-size:20px;color:${FG};">${escapeHtml(input.heading)}</h1>
            <p style="margin:0 0 18px;font-size:15px;line-height:22px;color:${MUTED};">${escapeHtml(input.intro)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}${ctaHtml}</table>
          </td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid ${BORDER};color:${MUTED};font-size:12px;text-align:${align};" dir="${dir}">${escapeHtml(input.footer)}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const textLines = [
    input.heading,
    "",
    input.intro,
    ...(input.rows ?? []).map((r) => `- ${r.label}: ${r.value}`),
    ...(input.cta ? ["", `${input.cta.label}: ${input.cta.url}`] : []),
    "",
    input.footer,
  ];
  return { html, text: textLines.join("\n") };
}

/* ── Public send functions ─────────────────────────────── */

/**
 * Notify a seller by email that a buyer engaged one of their listings. Caller
 * is responsible for the preference gate + best-effort error handling; this
 * function renders the real lead context and hands it to the active transport.
 */
export async function sendLeadNotificationEmail(args: {
  to: string;
  lang?: EmailLang;
  sellerName: string;
  listingTitle: string;
  actionLabel: string;
  listingId?: string;
}): Promise<void> {
  const lang: EmailLang = args.lang ?? "ar";
  const ar = lang === "ar";
  const { transport, appUrl } = await resolveEmailRuntime();
  const cta = args.listingId ? appUrl(`/listing/${args.listingId}`) : undefined;

  const { html, text } = renderEmail({
    lang,
    preheader: ar ? "عندك مهتم جديد على إعلانك" : "You have a new lead on your listing",
    heading: ar ? "مهتم جديد 🔔" : "New lead 🔔",
    intro: ar
      ? `يا ${args.sellerName}، فيه مشتري تفاعل مع إعلانك على BANCO.`
      : `Hi ${args.sellerName}, a buyer just engaged your listing on BANCO.`,
    rows: [
      { label: ar ? "الإعلان" : "Listing", value: args.listingTitle },
      { label: ar ? "نوع التفاعل" : "Action", value: args.actionLabel },
    ],
    cta: cta ? { label: ar ? "افتح الإعلان" : "Open listing", url: cta } : undefined,
    footer: ar
      ? "بتستلم الإيميل ده لأن إشعارات البريد مفعّلة. تقدر توقفها من الإعدادات."
      : "You're receiving this because email alerts are on. Manage them in Settings.",
  });

  await transport.send({
    to: args.to,
    subject: ar ? "BANCO — مهتم جديد على إعلانك" : "BANCO — New lead on your listing",
    html,
    text,
  });
}

/**
 * Weekly activity digest for a seller. All numbers are computed from real data
 * by the caller (the weekly-reports job) — never fabricated here.
 */
export async function sendWeeklyReportEmail(args: {
  to: string;
  lang?: EmailLang;
  name: string;
  activeListings: number;
  weeklyLeads: number;
}): Promise<void> {
  const lang: EmailLang = args.lang ?? "ar";
  const ar = lang === "ar";
  const { transport, appUrl } = await resolveEmailRuntime();
  const cta = appUrl("/");

  const { html, text } = renderEmail({
    lang,
    preheader: ar ? "ملخص نشاطك الأسبوعي على BANCO" : "Your weekly BANCO activity",
    heading: ar ? "ملخصك الأسبوعي 📈" : "Your weekly summary 📈",
    intro: ar
      ? `يا ${args.name}، ده ملخص نشاطك على BANCO آخر ٧ أيام.`
      : `Hi ${args.name}, here's your BANCO activity over the last 7 days.`,
    rows: [
      {
        label: ar ? "إعلانات نشطة" : "Active listings",
        value: String(args.activeListings),
      },
      {
        label: ar ? "مهتمين جدد (٧ أيام)" : "New leads (7 days)",
        value: String(args.weeklyLeads),
      },
    ],
    cta: cta ? { label: ar ? "افتح BANCO" : "Open BANCO", url: cta } : undefined,
    footer: ar
      ? "ملخص أسبوعي تلقائي. تقدر توقف رسائل النظام من الإعدادات."
      : "Automated weekly summary. You can turn off system emails in Settings.",
  });

  await transport.send({
    to: args.to,
    subject: ar ? "BANCO — ملخصك الأسبوعي" : "BANCO — Your weekly summary",
    html,
    text,
  });
}
