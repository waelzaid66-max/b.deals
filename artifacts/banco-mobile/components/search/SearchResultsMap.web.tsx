import { FeedItem, getMapClusters } from "@workspace/api-client-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  buildMapClusterParams,
  type MapViewport,
  type SearchCriteria,
} from "@/lib/searchParams";
import { marketCountryMapCenter } from "@/lib/searchTaxonomy";
import {
  buildMapHtml,
  feedItemsToMarkers,
  type MapBridgeMessage,
  type MapClusterMarker,
} from "./mapHtml";
import { MapOverlayChrome } from "./MapOverlayChrome";
import type { SearchResultsMapProps } from "./SearchResultsMap";

const CLUSTER_DEBOUNCE_MS = 300;
const CLUSTER_CACHE_MAX = 24;

function clusterCacheKey(criteriaSig: string, viewport: MapViewport): string {
  return `${criteriaSig}:${viewport.max_lat.toFixed(3)}:${viewport.min_lat.toFixed(3)}:${viewport.max_lng.toFixed(3)}:${viewport.min_lng.toFixed(3)}:${viewport.zoom}`;
}

/**
 * Web map: Leaflet srcDoc iframe with the same filters/clusters/center path as
 * native. Clusters are pushed via postMessage ({type:"setClusters"}) because
 * sandboxed iframes cannot be eval/injected like WebView.
 */
export function SearchResultsMap({
  items,
  criteria,
  onOpenListing,
  onOpenListingId,
  onSave,
  isSaved,
}: SearchResultsMapProps) {
  const colors = useColors();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);

  const markers = useMemo(() => feedItemsToMarkers(items), [items]);
  const sig = useMemo(
    () => markers.map((m) => `${m.id}:${m.lat}:${m.lng}:${m.label}`).join("|"),
    [markers],
  );
  const criteriaSig = useMemo(() => JSON.stringify(criteria), [criteria]);
  const html = useMemo(
    () =>
      buildMapHtml(
        markers,
        {
          primary: colors.primary,
          primaryForeground: colors.primaryForeground,
          card: colors.card,
          foreground: colors.foreground,
          border: colors.border,
        },
        marketCountryMapCenter(criteria.marketCountry),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sig,
      colors.primary,
      colors.primaryForeground,
      colors.card,
      colors.foreground,
      colors.border,
      criteria.marketCountry,
    ],
  );

  const itemsRef = useRef<FeedItem[]>(items);
  itemsRef.current = items;
  const vpSeqRef = useRef(0);
  const lastViewportRef = useRef<MapViewport | null>(null);
  const prevSigRef = useRef(sig);
  const clusterCacheRef = useRef(
    new Map<string, { clusters: MapClusterMarker[]; total: number }>(),
  );
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    setSelectedId(null);
    setServerTotal(null);
    vpSeqRef.current++;
  }, [sig]);

  const pushClusters = useCallback((clusters: MapClusterMarker[]) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ type: "setClusters", clusters }),
      "*",
    );
  }, []);

  const fetchClusters = useCallback(
    async (viewport: MapViewport) => {
      const cacheKey = clusterCacheKey(criteriaSig, viewport);
      const cached = clusterCacheRef.current.get(cacheKey);
      if (cached) {
        setServerTotal(cached.total);
        pushClusters(cached.clusters);
        return;
      }

      const seq = ++vpSeqRef.current;
      try {
        const res = await getMapClusters(buildMapClusterParams(criteria, viewport));
        if (seq !== vpSeqRef.current) return;
        const clusters = res.data ?? [];
        const priceById = new Map(
          itemsRef.current.map((i) => [i.id, i.price_display]),
        );
        const bookableById = new Set(
          itemsRef.current.filter((i) => i.is_bookable === true).map((i) => i.id),
        );
        const enriched: MapClusterMarker[] = clusters.map((c) => {
          const single = c.count === 1 && !!c.listing_id;
          const fromApiPrice =
            single && c.price_display != null && c.price_display !== ""
              ? c.price_display
              : undefined;
          const fromPagePrice =
            single && c.listing_id ? priceById.get(c.listing_id) : undefined;
          const fromApiBookable =
            single && typeof c.is_bookable === "boolean" ? c.is_bookable : null;
          const fromPageBookable =
            single && c.listing_id ? bookableById.has(c.listing_id) : false;
          return {
            lat: c.lat,
            lng: c.lng,
            count: c.count,
            listing_id: c.listing_id,
            label: fromApiPrice ?? fromPagePrice,
            bookable: fromApiBookable ?? fromPageBookable,
          };
        });
        const total = clusters.reduce((sum, c) => sum + c.count, 0);
        const cache = clusterCacheRef.current;
        cache.set(cacheKey, { clusters: enriched, total });
        if (cache.size > CLUSTER_CACHE_MAX) {
          const oldest = cache.keys().next().value;
          if (oldest !== undefined) cache.delete(oldest);
        }
        setServerTotal(total);
        pushClusters(enriched);
      } catch {
        // Keep loaded-page pins if cluster fetch fails.
      }
    },
    [criteria, criteriaSig, pushClusters],
  );

  const scheduleClusterFetch = useCallback(
    (viewport: MapViewport) => {
      lastViewportRef.current = viewport;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        void fetchClusters(viewport);
      }, CLUSTER_DEBOUNCE_MS);
    },
    [fetchClusters],
  );

  useEffect(() => {
    const sigChanged = prevSigRef.current !== sig;
    prevSigRef.current = sig;
    if (sigChanged) return;
    if (lastViewportRef.current) {
      setServerTotal(null);
      clusterCacheRef.current.clear();
      scheduleClusterFetch(lastViewportRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, criteriaSig]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const msg = JSON.parse(String(event.data)) as MapBridgeMessage;
        if (msg.type === "ready" || msg.type === "error") {
          // Map page booted; viewport message follows and drives clusters.
        } else if (msg.type === "viewport") {
          scheduleClusterFetch({ ...msg.bounds, zoom: msg.zoom });
        } else if (msg.type === "select" && typeof msg.id === "string") {
          const hit = itemsRef.current.find((i) => i.id === msg.id);
          if (hit) setSelectedId(msg.id);
          else onOpenListingId?.(msg.id);
        }
      } catch {
        // Ignore non-map messages.
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onOpenListingId, scheduleClusterFetch]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}>
      <iframe
        key={sig}
        ref={iframeRef}
        title="search-map"
        srcDoc={html}
        sandbox="allow-scripts"
        style={{ border: "none", width: "100%", height: "100%" }}
      />
      <MapOverlayChrome
        count={serverTotal ?? markers.length}
        selected={selected}
        onClose={() => setSelectedId(null)}
        onOpenListing={onOpenListing}
        onSave={onSave}
        isSaved={isSaved}
      />
    </View>
  );
}
