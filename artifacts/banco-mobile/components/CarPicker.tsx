import { Feather } from "@/components/icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useI18n } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";
import {
  CAR_BRANDS,
  CAR_COUNTRIES,
  CarBrand,
  brandLabel,
  browseModels,
  countryLabel,
} from "@/constants/cars";

interface CarPickerProps {
  visible: boolean;
  /** browse = catalogue + any-brand clear; create = catalogue + always-visible custom brand. */
  mode: "browse" | "create";
  selectedBrand?: string;
  selectedModel?: string;
  onClose: () => void;
  /** model is null when the user picks the whole brand (browse) or "Other" (create). */
  onSelect: (brand: CarBrand, model: string | null) => void;
  onClear: () => void;
}

function toCustomBrand(name: string): CarBrand {
  const trimmed = name.trim();
  return {
    value: `custom:${trimmed.toLowerCase()}`,
    en: trimmed,
    ar: trimmed,
    country: "other",
  };
}

export function CarPicker({
  visible,
  mode,
  selectedBrand,
  selectedModel,
  onClose,
  onSelect,
  onClear,
}: CarPickerProps) {
  const colors = useColors();
  const { t, isRTL } = useI18n();
  const insets = useSafeAreaInsets();
  const searchRef = useRef<TextInput>(null);

  const [activeBrand, setActiveBrand] = useState<CarBrand | null>(null);
  const [query, setQuery] = useState("");
  /** Create-mode: user chose "Other brand" — keep typed brand row visible. */
  const [customBrandMode, setCustomBrandMode] = useState(false);

  const rowDir = isRTL ? "row-reverse" : "row";
  const textAlign = isRTL ? "right" : "left";

  // Full catalogue is suggestions only. Unknown brands auto-learn on publish.
  const brands = CAR_BRANDS;

  useEffect(() => {
    if (!visible) {
      setActiveBrand(null);
      setQuery("");
      setCustomBrandMode(false);
    }
  }, [visible]);

  const popular = useMemo(
    () => brands.filter((b) => b.popular),
    [brands],
  );

  const countryGroups = useMemo(
    () =>
      CAR_COUNTRIES.map((c) => ({
        country: c,
        items: brands.filter((b) => b.country === c.value),
      })).filter((g) => g.items.length > 0),
    [brands],
  );

  const brandResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return brands.filter(
      (b) =>
        b.en.toLowerCase().includes(q) || b.ar.includes(query.trim()),
    );
  }, [query, brands]);

  // Both modes use the rich model catalogue; brand aliases + lenient
  // normalization resolve or accept whatever the seller picks (no create-safe gate).
  const models = activeBrand ? browseModels(activeBrand.value) : [];

  const modelResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !activeBrand) return models;
    return models.filter((m) => m.toLowerCase().includes(q));
  }, [query, models, activeBrand]);

  const reset = () => {
    setActiveBrand(null);
    setQuery("");
    setCustomBrandMode(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pick = (brand: CarBrand, model: string | null) => {
    reset();
    onSelect(brand, model);
  };

  const startCustomBrand = () => {
    setActiveBrand(null);
    setCustomBrandMode(true);
    setQuery("");
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  const typedBrand = query.trim();
  const showTypedBrandRow =
    mode === "create" &&
    !activeBrand &&
    typedBrand.length > 0 &&
    (customBrandMode || brandResults.length === 0);

  const Row = ({
    label,
    onPress,
    active,
    chevron,
    muted,
    testID,
  }: {
    label: string;
    onPress: () => void;
    active?: boolean;
    chevron?: boolean;
    muted?: boolean;
    testID?: string;
  }) => (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[
        styles.row,
        { flexDirection: rowDir, borderBottomColor: colors.border },
      ]}
    >
      <AppText
        style={[
          styles.rowLabel,
          {
            color: muted
              ? colors.mutedForeground
              : active
                ? colors.primary
                : colors.foreground,
            textAlign,
            fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular",
          },
        ]}
      >
        {label}
      </AppText>
      {active ? (
        <Feather name="check" size={18} color={colors.primary} />
      ) : chevron ? (
        <Feather
          name={isRTL ? "chevron-left" : "chevron-right"}
          size={18}
          color={colors.mutedForeground}
        />
      ) : null}
    </Pressable>
  );

  const SectionHeader = ({ label }: { label: string }) => (
    <AppText
      style={[
        styles.section,
        { color: colors.mutedForeground, textAlign },
      ]}
    >
      {label}
    </AppText>
  );

  const renderBrandRow = (b: CarBrand) => (
    <Row
      key={b.value}
      label={brandLabel(b, isRTL)}
      chevron
      active={selectedBrand === b.value && !selectedModel}
      onPress={() => {
        setQuery("");
        setActiveBrand(b);
      }}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { flexDirection: rowDir }]}>
            {activeBrand ? (
              <Pressable
                onPress={() => {
                  setActiveBrand(null);
                  setQuery("");
                }}
                hitSlop={10}
                style={styles.headerBtn}
              >
                <Feather
                  name={isRTL ? "arrow-right" : "arrow-left"}
                  size={22}
                  color={colors.foreground}
                />
              </Pressable>
            ) : (
              <View style={styles.headerBtn} />
            )}
            <AppText style={[styles.headerTitle, { color: colors.foreground }]}>
              {activeBrand
                ? brandLabel(activeBrand, isRTL)
                : t("carPicker.title")}
            </AppText>
            <Pressable onPress={handleClose} hitSlop={10} style={styles.headerBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Search box */}
          <View
            style={[
              styles.searchBox,
              {
                flexDirection: rowDir,
                backgroundColor: colors.secondary,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              ref={searchRef}
              value={query}
              onChangeText={setQuery}
              placeholder={
                activeBrand
                  ? t("carPicker.searchModel")
                  : customBrandMode
                    ? t("carPicker.searchCustomBrand")
                    : t("carPicker.searchBrand")
              }
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground, textAlign }]}
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x-circle" size={16} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {activeBrand ? (
              <>
                {/* Whole-brand option (browse only) */}
                {mode === "browse" && !query ? (
                  <Row
                    label={t("carPicker.allModels", {
                      name: brandLabel(activeBrand, isRTL),
                    })}
                    active={selectedBrand === activeBrand.value && !selectedModel}
                    onPress={() => pick(activeBrand, null)}
                  />
                ) : null}
                {modelResults.map((m) => (
                  <Row
                    key={m}
                    label={m}
                    active={
                      selectedBrand === activeBrand.value && selectedModel === m
                    }
                    onPress={() => pick(activeBrand, m)}
                  />
                ))}
                {/* Create: anything not in the seeded catalogue. Omits specs.model
                    so the backend infers leniently from the title (never rejected). */}
                {mode === "create" && !query ? (
                  <Row
                    label={t("carPicker.otherModel")}
                    muted
                    active={selectedBrand === activeBrand.value && !selectedModel}
                    onPress={() => pick(activeBrand, null)}
                  />
                ) : null}
                {mode === "browse" && query && modelResults.length === 0 ? (
                  <AppText style={[styles.empty, { color: colors.mutedForeground }]}>
                    {t("carPicker.noResults")}
                  </AppText>
                ) : null}
              </>
            ) : (
              <>
                {mode === "browse" && !query ? (
                  <Row
                    label={t("carPicker.anyBrand")}
                    muted
                    active={!selectedBrand}
                    onPress={() => {
                      reset();
                      onClear();
                    }}
                  />
                ) : null}
                {/* Create: custom brand ALWAYS reachable — catalogue is assistive. */}
                {mode === "create" && !query && !customBrandMode ? (
                  <Row
                    label={t("carPicker.otherBrand")}
                    muted
                    chevron
                    active={!!selectedBrand?.startsWith("custom:")}
                    onPress={startCustomBrand}
                    testID="car-picker-other-brand"
                  />
                ) : null}
                {customBrandMode && !typedBrand ? (
                  <AppText
                    style={[styles.empty, { color: colors.mutedForeground }]}
                  >
                    {t("carPicker.customBrandHint")}
                  </AppText>
                ) : null}
                {showTypedBrandRow ? (
                  <Row
                    label={t("carPicker.useTypedBrand", { name: typedBrand })}
                    muted
                    active={selectedBrand === `custom:${typedBrand.toLowerCase()}`}
                    onPress={() => pick(toCustomBrand(typedBrand), null)}
                    testID="car-picker-use-typed-brand"
                  />
                ) : null}
                {query && brandResults.length > 0
                  ? brandResults.map(renderBrandRow)
                  : null}
                {!query && !customBrandMode ? (
                  <>
                    {popular.length > 0 ? (
                      <>
                        <SectionHeader label={t("carPicker.popular")} />
                        {popular.map(renderBrandRow)}
                      </>
                    ) : null}
                    {countryGroups.map((g) => (
                      <View key={g.country.value}>
                        <SectionHeader label={countryLabel(g.country, isRTL)} />
                        {g.items.map(renderBrandRow)}
                      </View>
                    ))}
                  </>
                ) : null}
                {query &&
                brandResults.length === 0 &&
                mode === "browse" ? (
                  <AppText
                    style={[styles.empty, { color: colors.mutedForeground }]}
                  >
                    {t("carPicker.noResults")}
                  </AppText>
                ) : null}
              </>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "82%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
  searchBox: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  list: {
    flex: 1,
  },
  section: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingTop: 16,
    paddingBottom: 6,
  },
  row: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 14.5,
    flex: 1,
  },
  empty: {
    textAlign: "center",
    paddingVertical: 32,
    fontSize: 14,
  },
});
