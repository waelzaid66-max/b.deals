// Public company / supplier profile (Task #40). Real stats + structured trade
// block; Follow/Unfollow is server-backed and viewer-relative. No fabricated
// figures — every optional field is hidden when null.
import { Feather, MaterialCommunityIcons } from "@/components/icons";
import { useUser } from "@clerk/expo";
import {
  CompanyProfile,
  useFollowCompany,
  useGetCompany,
  useUnfollowCompany,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

type Colors = ReturnType<typeof useColors>;
type T = (k: string, vars?: Record<string, string | number>) => string;

export default function CompanyProfileScreen() {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign: "left" | "right" = isRTL ? "right" : "left";

  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSignedIn, isLoaded } = useUser();
  const { data, isLoading, isError, refetch } = useGetCompany(id ?? "");
  const profile = data?.data as CompanyProfile | undefined;

  const followM = useFollowCompany();
  const unfollowM = useUnfollowCompany();
  const [busy, setBusy] = useState(false);

  const toggleFollow = () => {
    if (!profile) return;
    if (isLoaded && !isSignedIn) {
      router.push("/(tabs)/profile");
      return;
    }
    setBusy(true);
    const m = profile.is_following ? unfollowM : followM;
    m.mutate(
      { id: profile.id },
      {
        onSuccess: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          refetch().finally(() => setBusy(false));
        },
        onError: () => setBusy(false),
      },
    );
  };

  const Header = (
    <View
      style={[
        styles.header,
        {
          paddingTop: topPad + 12,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
          flexDirection: rowDir,
        },
      ]}
    >
      <Pressable
        onPress={() => router.back()}
        style={styles.iconBtn}
        hitSlop={12}
        testID="company-back"
      >
        <Feather
          name={isRTL ? "arrow-right" : "arrow-left"}
          size={22}
          color={colors.foreground}
        />
      </Pressable>
      <AppText style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
        {t("business.company.title")}
      </AppText>
      <View style={styles.iconBtn} />
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {Header}
        <View style={styles.stateWrap}>
          <Feather name="alert-circle" size={48} color={colors.mutedForeground} />
          <AppText style={[styles.stateTitle, { color: colors.foreground }]}>
            {t("business.common.loadError")}
          </AppText>
        </View>
      </View>
    );
  }

  const trade = profile.company;
  const followerCount = profile.follower_count ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Header}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <View
            style={[
              styles.logo,
              { backgroundColor: colors.secondary, borderRadius: colors.radius },
            ]}
          >
            <MaterialCommunityIcons
              name="office-building-outline"
              size={30}
              color={colors.mutedForeground}
            />
          </View>
          <View style={[styles.nameRow, { flexDirection: rowDir }]}>
            <AppText style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
              {profile.name}
            </AppText>
            {profile.is_verified && (
              <MaterialCommunityIcons name="check-decagram" size={18} color={colors.primary} />
            )}
          </View>
          <AppText style={[styles.role, { color: colors.mutedForeground }]}>
            {profile.role}
          </AppText>
        </View>

        <Pressable
          onPress={toggleFollow}
          disabled={busy}
          style={[
            styles.followBtn,
            {
              backgroundColor: profile.is_following ? colors.secondary : colors.primary,
              borderColor: profile.is_following ? colors.border : colors.primary,
              borderRadius: colors.radius,
              opacity: busy ? 0.7 : 1,
            },
          ]}
          testID="company-follow"
        >
          {busy ? (
            <ActivityIndicator
              size="small"
              color={profile.is_following ? colors.foreground : colors.primaryForeground}
            />
          ) : (
            <>
              <Feather
                name={profile.is_following ? "check" : "plus"}
                size={16}
                color={profile.is_following ? colors.foreground : colors.primaryForeground}
              />
              <AppText
                style={[
                  styles.followText,
                  { color: profile.is_following ? colors.foreground : colors.primaryForeground },
                ]}
              >
                {profile.is_following
                  ? t("business.suppliers.following")
                  : t("business.suppliers.follow")}
              </AppText>
            </>
          )}
        </Pressable>

        <View style={[styles.statsGrid, { flexDirection: rowDir }]}>
          <StatBox
            value={String(profile.stats.active_listings)}
            label={t("business.company.activeListings")}
            colors={colors}
          />
          <StatBox
            value={String(followerCount)}
            label={t("business.suppliers.followers")}
            colors={colors}
          />
          <StatBox
            value={String(profile.stats.years_active)}
            label={t("business.company.yearsActive")}
            colors={colors}
          />
        </View>

        {trade ? (
          <>
            {trade.about ? (
              <Section title={t("business.company.about")} colors={colors} textAlign={textAlign}>
                <AppText style={[styles.body, { color: colors.mutedForeground, textAlign }]}>
                  {trade.about}
                </AppText>
              </Section>
            ) : null}

            <Section title={t("business.company.tradeInfo")} colors={colors} textAlign={textAlign}>
              <View style={styles.kvWrap}>
                {trade.industry ? (
                  <KV
                    label={t("business.company.industry")}
                    value={t(`business.ind.${trade.industry}`)}
                    colors={colors}
                    rowDir={rowDir}
                  />
                ) : null}
                {trade.hq_country ? (
                  <KV label={t("business.company.hqCountry")} value={trade.hq_country} colors={colors} rowDir={rowDir} />
                ) : null}
                {trade.year_established ? (
                  <KV
                    label={t("business.company.yearEstablished")}
                    value={String(trade.year_established)}
                    colors={colors}
                    rowDir={rowDir}
                  />
                ) : null}
                {trade.monthly_capacity ? (
                  <KV label={t("business.company.monthlyCapacity")} value={trade.monthly_capacity} colors={colors} rowDir={rowDir} />
                ) : null}
                {trade.lead_time_days ? (
                  <KV
                    label={t("business.company.leadTime")}
                    value={`${trade.lead_time_days} ${t("business.company.daysUnit")}`}
                    colors={colors}
                    rowDir={rowDir}
                  />
                ) : null}
                {trade.min_order_value ? (
                  <KV
                    label={t("business.company.minOrder")}
                    value={`${trade.min_order_value}${trade.min_order_unit ? ` ${trade.min_order_unit}` : ""}`}
                    colors={colors}
                    rowDir={rowDir}
                  />
                ) : null}
              </View>
            </Section>

            {trade.countries_import_from.length > 0 ? (
              <Section title={t("business.company.importFrom")} colors={colors} textAlign={textAlign}>
                <ChipList items={trade.countries_import_from} colors={colors} rowDir={rowDir} />
              </Section>
            ) : null}
            {trade.countries_export_to.length > 0 ? (
              <Section title={t("business.company.exportTo")} colors={colors} textAlign={textAlign}>
                <ChipList items={trade.countries_export_to} colors={colors} rowDir={rowDir} />
              </Section>
            ) : null}
            {trade.certifications.length > 0 ? (
              <Section title={t("business.company.certifications")} colors={colors} textAlign={textAlign}>
                <ChipList items={trade.certifications} colors={colors} rowDir={rowDir} />
              </Section>
            ) : null}
          </>
        ) : (
          <View
            style={[styles.notice, { backgroundColor: colors.card, borderRadius: colors.radius }]}
          >
            <AppText style={[styles.noticeText, { color: colors.mutedForeground, textAlign }]}>
              {t("business.company.noTradeInfo")}
            </AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ value, label, colors }: { value: string; label: string; colors: Colors }) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
      <AppText style={[styles.statValue, { color: colors.foreground }]}>{value}</AppText>
      <AppText style={[styles.statLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
  textAlign,
}: {
  title: string;
  children: React.ReactNode;
  colors: Colors;
  textAlign: "left" | "right";
}) {
  return (
    <View style={[styles.section, { borderTopColor: colors.border }]}>
      <AppText style={[styles.sectionTitle, { color: colors.foreground, textAlign }]}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function KV({
  label,
  value,
  colors,
  rowDir,
}: {
  label: string;
  value: string;
  colors: Colors;
  rowDir: "row" | "row-reverse";
}) {
  return (
    <View style={[styles.kvRow, { flexDirection: rowDir, borderBottomColor: colors.border }]}>
      <AppText style={[styles.kvLabel, { color: colors.mutedForeground }]}>{label}</AppText>
      <AppText style={[styles.kvValue, { color: colors.foreground }]} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

function ChipList({
  items,
  colors,
  rowDir,
}: {
  items: string[];
  colors: Colors;
  rowDir: "row" | "row-reverse";
}) {
  return (
    <View style={[styles.chipList, { flexDirection: rowDir }]}>
      {items.map((it) => (
        <View
          key={it}
          style={[styles.chip, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}
        >
          <AppText style={[styles.chipText, { color: colors.foreground }]}>{it}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  stateWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 40 },
  stateTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  scroll: { padding: 16, paddingBottom: 120 },
  identity: { alignItems: "center", gap: 8 },
  logo: { width: 64, height: 64, alignItems: "center", justifyContent: "center" },
  nameRow: { alignItems: "center", gap: 7, marginTop: 4 },
  name: { fontSize: 19, fontFamily: "Inter_700Bold", textAlign: "center" },
  role: { fontSize: 13.5, fontFamily: "Inter_400Regular" },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  followText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  statsGrid: { gap: 10, marginTop: 16 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11.5, fontFamily: "Inter_400Regular" },
  section: { borderTopWidth: 1, paddingTop: 16, marginTop: 18 },
  sectionTitle: { fontSize: 15.5, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  kvWrap: { gap: 0 },
  kvRow: { justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: 1 },
  kvLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  kvValue: { flex: 1, fontSize: 13.5, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  chipList: { flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  notice: { padding: 16, marginTop: 18 },
  noticeText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
});
