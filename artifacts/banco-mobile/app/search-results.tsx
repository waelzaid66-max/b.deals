import { Feather } from "@/components/icons";
import {
  searchListings,
  FeedItem,
  SearchListingsCategory,
} from "@workspace/api-client-react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import {
  Category,
  apiCategoryFor,
  feedItemMatchesCategory,
  industrialGroupForCategory,
} from "@/components/CategoryTabs";
import { SkeletonCard } from "@/components/SkeletonCard";
import { SmartAssetCard } from "@/components/SmartAssetCard";
import { engineByKey } from "@/constants/engines";
import { useI18n } from "@/context/LanguageContext";
import { useSession } from "@/context/SessionContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: Category[] = [
  "all",
  "car",
  "real_estate",
  "facilities",
  "materials",
];

/**
 * Dedicated results screen for filter-only "section + engine" browsing launched
 * from the Search discover surface. Every chip maps to a real backend filter
 * (see constants/engines.ts) and `q` is optional here, so results are always
 * real — never fabricated. Typed free-text search stays inline on the Search
 * tab; this screen handles the query-less section browse.
 */
export default function SearchResultsScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const { isSaved, toggleSave } = useSession();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const textAlign = isRTL ? "right" : "left";

  const params = useLocalSearchParams<{
    q?: string;
    category?: string;
    engine?: string;
    minPrice?: string;
    maxPrice?: string;
    location?: string;
    paymentType?: string;
  }>();

  const category = (CATEGORIES.includes(params.category as Category)
    ? params.category
    : "all") as Category;
  const engineKey = params.engine ?? "all";
  const q = params.q ? String(params.q) : "";

  const [results, setResults] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);

  const buildParams = useCallback(
    (nextCursor?: string): Parameters<typeof searchListings>[0] => {
      const sp: Parameters<typeof searchListings>[0] = { limit: 30 };
      if (q.trim()) sp.q = q.trim();
      const apiCat = apiCategoryFor(category);
      if (apiCat) sp.category = apiCat as SearchListingsCategory;
      // Industrial groups (facilities/materials) share the `industrial` category
      // and split by industrial_type — filter by the whole group server-side so
      // paginated results never false-empty.
      const group = industrialGroupForCategory(category);
      if (group) sp.industrial_type = group.join(",");

      const engine = engineByKey(category, engineKey);
      if (engine) Object.assign(sp, engine.params);

      const minNum = Number(params.minPrice);
      if (params.minPrice && !Number.isNaN(minNum)) sp.min_price = minNum;
      const maxNum = Number(params.maxPrice);
      if (params.maxPrice && !Number.isNaN(maxNum)) sp.max_price = maxNum;
      if (params.location && String(params.location).trim()) {
        sp.location = String(params.location).trim();
      }
      if (params.paymentType === "installment") sp.has_installment = true;
      if (nextCursor) sp.cursor = nextCursor;
      return sp;
    },
    [
      q,
      category,
      engineKey,
      params.minPrice,
      params.maxPrice,
      params.location,
      params.paymentType,
    ]
  );

  const fetchResults = useCallback(
    async (reset: boolean) => {
      try {
        const res = await searchListings(
          buildParams(reset ? undefined : cursor)
        );
        const data = res.data ?? [];
        const meta = res.meta;
        if (reset) {
          setResults(data);
        } else {
          setResults((prev) => [...prev, ...data]);
        }
        setCursor(meta?.cursor);
        setHasNext(meta?.has_next ?? false);
        setError(false);
      } catch {
        if (reset) setError(true);
      }
    },
    [buildParams, cursor, category]
  );

  useEffect(() => {
    setLoading(true);
    setError(false);
    setCursor(undefined);
    setHasNext(false);
    fetchResults(true).then(() => setLoading(false));
    // Only re-run when the filter identity changes, not on cursor updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, engineKey, q, params.minPrice, params.maxPrice, params.location, params.paymentType]);

  const handleLoadMore = async () => {
    if (loadingMore || loading || !hasNext) return;
    setLoadingMore(true);
    await fetchResults(false);
    setLoadingMore(false);
  };

  const handleRetry = async () => {
    setLoading(true);
    setError(false);
    setCursor(undefined);
    await fetchResults(true);
    setLoading(false);
  };

  const engine = engineByKey(category, engineKey);
  const engineLabel =
    engine && engine.key !== "all" ? t(engine.i18nKey) : "";
  const catLabel = t(`home.categories.${category}`);
  const title = q.trim()
    ? q.trim()
    : engineLabel
      ? `${catLabel} · ${engineLabel}`
      : catLabel;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          testID="results-back"
        >
          <Feather
            name={isRTL ? "arrow-right" : "arrow-left"}
            size={22}
            color={colors.foreground}
          />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <AppText
            numberOfLines={1}
            style={[styles.headerTitle, { color: colors.foreground, textAlign }]}
          >
            {title}
          </AppText>
          {!loading && !error && results.length > 0 && (
            <AppText
              style={[
                styles.headerCount,
                { color: colors.mutedForeground, textAlign },
              ]}
            >
              {`${results.length}${hasNext ? "+" : ""} ${t("search.results")}`}
            </AppText>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletons}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Feather name="wifi-off" size={52} color={colors.mutedForeground} />
          <AppText style={[styles.emptyTitle, { color: colors.foreground }]}>
            {t("search.errorTitle")}
          </AppText>
          <AppText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {t("search.errorHint")}
          </AppText>
          <Pressable
            onPress={handleRetry}
            style={[
              styles.retryBtn,
              { backgroundColor: colors.primary, borderRadius: colors.radius },
            ]}
            testID="results-retry"
          >
            <AppText
              style={[styles.retryText, { color: colors.primaryForeground }]}
            >
              {t("search.retry")}
            </AppText>
          </Pressable>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather
            name="alert-circle"
            size={52}
            color={colors.mutedForeground}
          />
          <AppText style={[styles.emptyTitle, { color: colors.foreground }]}>
            {t("search.noResults")}
          </AppText>
          <AppText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {t("search.noResultsHint")}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SmartAssetCard
              item={item}
              onPress={(it) => router.push(`/listing/${it.id}`)}
              onSave={toggleSave}
              isSaved={isSaved(item.id)}
            />
          )}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  headerCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  skeletons: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  retryText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
