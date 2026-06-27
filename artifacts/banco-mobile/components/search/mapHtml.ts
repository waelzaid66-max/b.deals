import type { FeedItem } from "@workspace/api-client-react";

/** A single price pin on the map. */
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Pre-formatted, already-localized price (FeedItem.price_display). */
  label: string;
}

/** Brand colors threaded into the Leaflet page so pins match the app theme. */
export interface MapTheme {
  primary: string;
  primaryForeground: string;
  card: string;
  foreground: string;
  border: string;
}

/** Bridge message posted from the Leaflet page back to React Native / the web host. */
export type MapBridgeMessage =
  | { type: "ready" }
  | { type: "error" }
  | { type: "select"; id: string };

const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist";
const CLUSTER = "https://unpkg.com/leaflet.markercluster@1.5.3/dist";

/**
 * Project the feed onto map pins. Only items that carry valid coordinates are
 * mappable, so the map (and its honest "N on the map" caption) never overstates
 * how many results have a real location.
 */
export function feedItemsToMarkers(items: FeedItem[]): MapMarker[] {
  const out: MapMarker[] = [];
  for (const item of items) {
    const c = item.coordinates;
    if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
      out.push({ id: item.id, lat: c.lat, lng: c.lng, label: item.price_display });
    }
  }
  return out;
}

/**
 * Build a fully self-contained Leaflet + OpenStreetMap page. No API key and no
 * Google dependency — it works inside Expo Go's WebView (native) and in an
 * <iframe> (web). Pins are price pills; nearby pins are grouped into honest
 * centroid clusters (Leaflet.markercluster) that show the real grouped count.
 * Tapping a pin posts {type:"select", id} back to the host so it can reveal the
 * listing card. The marker JSON is embedded directly so the page needs no
 * follow-up bridge to render.
 */
export function buildMapHtml(markers: MapMarker[], theme: MapTheme): string {
  // JSON is safe inside a <script> except for a literal "</script>"; escaping
  // "<" to its unicode form neutralizes that without changing the parsed data.
  const json = JSON.stringify(markers).replace(/</g, "\\u003c");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="${LEAFLET}/leaflet.css" />
<link rel="stylesheet" href="${CLUSTER}/MarkerCluster.css" />
<link rel="stylesheet" href="${CLUSTER}/MarkerCluster.Default.css" />
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  body { background: ${theme.card}; }
  .leaflet-container {
    background: ${theme.card};
    font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
  }
  .pin .pill {
    position: absolute;
    transform: translate(-50%, -50%);
    background: ${theme.primary};
    color: ${theme.primaryForeground};
    font-weight: 700;
    font-size: 12px;
    line-height: 1;
    padding: 6px 9px;
    border-radius: 16px;
    white-space: nowrap;
    border: 1.5px solid ${theme.primaryForeground};
    box-shadow: 0 1px 5px rgba(0,0,0,0.35);
    cursor: pointer;
  }
  .marker-cluster-small div,
  .marker-cluster-medium div,
  .marker-cluster-large div {
    background: ${theme.primary};
    color: ${theme.primaryForeground};
    font-weight: 700;
  }
  .marker-cluster-small,
  .marker-cluster-medium,
  .marker-cluster-large { background: rgba(0,0,0,0.18); }
</style>
</head>
<body>
<div id="map"></div>
<script src="${LEAFLET}/leaflet.js"></script>
<script src="${CLUSTER}/leaflet.markercluster.js"></script>
<script>
  (function () {
    var DATA = ${json};
    function post(msg) {
      try {
        var s = JSON.stringify(msg);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(s);
        } else if (window.parent) {
          window.parent.postMessage(s, "*");
        }
      } catch (e) {}
    }
    function esc(t) {
      return String(t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
    if (!window.L) { post({ type: "error" }); return; }
    var map = L.map("map", { zoomControl: false, attributionControl: true })
      .setView([26.8, 30.8], 6);
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);
    var group = L.markerClusterGroup
      ? L.markerClusterGroup({ maxClusterRadius: 48, showCoverageOnHover: false, spiderfyOnMaxZoom: true })
      : L.layerGroup();
    var pts = [];
    DATA.forEach(function (d) {
      if (typeof d.lat !== "number" || typeof d.lng !== "number") return;
      var icon = L.divIcon({
        className: "pin",
        html: '<div class="pill">' + esc(d.label) + "</div>",
        iconSize: [0, 0]
      });
      var m = L.marker([d.lat, d.lng], { icon: icon });
      m.on("click", function () { post({ type: "select", id: d.id }); });
      group.addLayer(m);
      pts.push([d.lat, d.lng]);
    });
    map.addLayer(group);
    if (pts.length === 1) {
      map.setView(pts[0], 13);
    } else if (pts.length > 1) {
      map.fitBounds(pts, { padding: [48, 48], maxZoom: 15 });
    }
    post({ type: "ready" });
  })();
</script>
</body>
</html>`;
}
