import { FeedItem } from "@workspace/api-client-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

import { useColors } from "@/hooks/useColors";
import { buildMapHtml, feedItemsToMarkers, type MapBridgeMessage } from "./mapHtml";
import { MapOverlayChrome } from "./MapOverlayChrome";

export interface SearchResultsMapProps {
  /** Already-mappable results (callers filter to items with coordinates). */
  items: FeedItem[];
  onOpenListing: (item: FeedItem) => void;
  onSave?: (item: FeedItem) => void;
  isSaved: (id: string) => boolean;
}

/**
 * Native map surface: a self-contained Leaflet/OpenStreetMap page rendered in a
 * WebView (Expo Go friendly, no native map module, no API key). The WebView is
 * keyed by the mapped-set signature so it only reloads when the plotted set
 * actually changes (not on every parent re-render). Tapping a pin selects it;
 * MapOverlayChrome shows the listing preview card.
 */
export function SearchResultsMap({ items, onOpenListing, onSave, isSaved }: SearchResultsMapProps) {
  const colors = useColors();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const markers = useMemo(() => feedItemsToMarkers(items), [items]);
  const sig = useMemo(
    () => markers.map((m) => `${m.id}:${m.lat}:${m.lng}:${m.label}`).join("|"),
    [markers],
  );
  const html = useMemo(
    () =>
      buildMapHtml(markers, {
        primary: colors.primary,
        primaryForeground: colors.primaryForeground,
        card: colors.card,
        foreground: colors.foreground,
        border: colors.border,
      }),
    // Rebuild only when the plotted set or the themed colors change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sig, colors.primary, colors.primaryForeground, colors.card, colors.foreground, colors.border],
  );

  // The WebView is keyed by `sig`, so a changed mapped-set reloads it — but this
  // component does not remount, so reset load/selection state ourselves or the
  // spinner stays hidden and a stale pin selection lingers across reloads.
  useEffect(() => {
    setReady(false);
    setSelectedId(null);
  }, [sig]);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as MapBridgeMessage;
      if (msg.type === "ready" || msg.type === "error") setReady(true);
      else if (msg.type === "select" && typeof msg.id === "string") setSelectedId(msg.id);
    } catch {
      // Ignore malformed bridge messages.
    }
  }, []);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}>
      <WebView
        key={sig}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        androidLayerType="hardware"
        style={styles.web}
      />

      {!ready ? (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      <MapOverlayChrome
        count={markers.length}
        selected={selected}
        onClose={() => setSelectedId(null)}
        onOpenListing={onOpenListing}
        onSave={onSave}
        isSaved={isSaved}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: "transparent" },
  center: { alignItems: "center", justifyContent: "center" },
});
