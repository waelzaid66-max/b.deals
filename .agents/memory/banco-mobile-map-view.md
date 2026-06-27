---
name: BANCO mobile search map view
description: Why the search map is a WebView+Leaflet/OSM page (not a native map / not Google), and the contract any change must respect
---

The BANCO Mobile search "Map" view renders a self-contained Leaflet + leaflet.markercluster +
OpenStreetMap HTML page inside `react-native-webview` (native) / an `<iframe srcDoc>` (web). It is
NOT a native map module (no react-native-maps) and NOT Google Maps.

**Why:**
- The app runs in **Expo Go** via plain `expo start` (no dev/custom build), so native map SDKs
  cannot be loaded at all.
- The project deliberately avoids requiring a **Google Maps API key**. Leaflet + OSM tiles need no
  key and work entirely inside a WebView with zero native modules.

**How to apply (contract — keep these or the map breaks):**
- Markers are **embedded as JSON directly in the HTML** (escaping `<` → `\u003c`); there is no
  runtime map API to call after load. Re-render = rebuild the HTML string.
- Clustering is **honest centroid clustering** computed in-page by markercluster — clusters sit at
  the mean of their children, never a fake/fixed point.
- Bridge is `postMessage` with `{type: ready|error|select, id?}`. Native posts via
  `window.ReactNativeWebView.postMessage`; web posts via `window.parent.postMessage(..., "*")`.
- **Web hardening is required**: the iframe must keep `sandbox="allow-scripts"` (opaque origin; CDN
  scripts + `window.parent.postMessage` still work) AND the parent message listener must validate
  `event.source === iframeRef.current?.contentWindow` (don't trust origin — sandbox makes it null).
- The WebView/iframe is **keyed by a mapped-set signature** (`id:lat:lng:label` joined) so it
  reloads when the plotted set changes. Because the parent component does NOT remount, reset
  `ready=false` and clear the selection on sig change, or the spinner stays hidden and a stale pin
  selection lingers.
- `react-native-webview` is pinned to **13.15.0** (SDK54 baseline) — see icon/webview pinning notes.
- Scope is **incremental**: pins + centroid clusters + tap→bottom-card only. "Search this area" and
  "near me" are **deferred** because they need a backend bbox/geo query that doesn't exist yet — do
  not fake them client-side.
