/**
 * Live deploy freshness probe — run after API redeploy.
 * Usage: node audit/mobile/scripts/probe-live-deploy.mjs [baseUrl]
 * Default base: https://banco-ca-oom.replit.app
 */
const base = (process.argv[2] || "https://banco-ca-oom.replit.app").replace(/\/$/, "");
const api = `${base}/api/v1`;

async function getJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  return { status: res.status, body };
}

function ids(body) {
  return (body?.data || []).map((x) => x.id).join(",");
}

const health = await getJson(`${base}/api/healthz`);
const eg = await getJson(`${api}/search?category=car&limit=3&market_country=EG`);
const sa = await getJson(`${api}/search?category=car&limit=3&market_country=SA`);
const bad = await getJson(`${api}/search?category=car&limit=1&market_country=EGYPT`);
const map = await getJson(
  `${api}/search/map?category=real_estate&min_lat=29.9&max_lat=30.2&min_lng=31.1&max_lng=31.5&zoom=11`,
);

const egIds = ids(eg.body);
const saIds = ids(sa.body);
const cluster = (map.body?.data || [])[0] || {};
const mapKeys = Object.keys(cluster).sort().join(",");
const report = {
  base,
  health: health.body?.status ?? health.status,
  egIds,
  saIds,
  egEqSa: egIds === saIds && egIds.length > 0,
  badIsoStatus: bad.status,
  mapKeys,
  hasBookable: "is_bookable" in cluster,
  hasPrice: "price_display" in cluster,
  clusterCount: (map.body?.data || []).length,
};

const fresh =
  report.badIsoStatus >= 400 &&
  report.hasBookable &&
  report.hasPrice &&
  !report.egEqSa;

report.verdict = fresh
  ? "FRESH — market + map bookable look deployed"
  : "STALE — redeploy fix/mobile-master-stabilize API before device claims";

console.log(JSON.stringify(report, null, 2));
process.exit(fresh ? 0 : 2);
