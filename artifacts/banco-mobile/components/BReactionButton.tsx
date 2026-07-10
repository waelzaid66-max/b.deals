import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Ionicons } from "@/components/icons";
import { useColors } from "@/hooks/useColors";

/**
 * The identity "B" (lightning bolt) cropped from the OFFICIAL transparent
 * B-OOM wordmark — the exact logo pixels, never redrawn, never simplified.
 * B = Banco Potential (affinity signal), not a generic "like/heart".
 */
const LOGO = require("@/assets/images/boom-logo.png");
const LOGO_RATIO = 2045 / 769;
const B_START = 0.05;
const B_END = 0.3;

export function BGlyph({
  height = 24,
  tintColor,
}: {
  height?: number;
  tintColor?: string;
}) {
  const imgW = height * LOGO_RATIO;
  const width = imgW * (B_END - B_START);
  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <Image
        source={LOGO}
        tintColor={tintColor}
        style={{
          position: "absolute",
          left: -imgW * B_START,
          top: 0,
          width: imgW,
          height,
        }}
        contentFit="contain"
      />
    </View>
  );
}

export type BReaction = "save" | "angry";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const CHIP_SIZE = 34;
const CHIP_GAP = 8;
const AUTO_CLOSE_MS = 3500;
const POTENTIAL_SILVER = "#C9CCD1";

/**
 * B-OOM reaction button — tap B = Banco Potential (affinity), long-press = save / not for me.
 */
export function BReactionButton({
  saved,
  potentialActive,
  saveIcon,
  onPotential,
  onSave,
  onAngry,
  height = 24,
  testID,
}: {
  saved: boolean;
  /** Visual hint after a Potential tap this session. */
  potentialActive?: boolean;
  saveIcon: IoniconName;
  onPotential: () => void;
  onSave: () => void;
  onAngry: () => void;
  height?: number;
  testID?: string;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const close = useCallback(() => {
    clearTimer();
    progress.value = withTiming(0, { duration: 130 });
    setOpen(false);
  }, [progress]);

  const openMenu = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOpen(true);
    progress.value = withSpring(1, { damping: 14, stiffness: 190, mass: 0.6 });
    clearTimer();
    closeTimer.current = setTimeout(close, AUTO_CLOSE_MS);
  }, [close, progress]);

  useEffect(() => clearTimer, []);

  const chips: {
    key: BReaction;
    icon: IoniconName | "potential-p";
    color: string;
    onPress: () => void;
  }[] = [
    { key: "save", icon: saveIcon, color: colors.primary, onPress: onSave },
    { key: "angry", icon: "thumbs-down", color: "#B3122F", onPress: onAngry },
  ];

  const chipStyle0 = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: -1 * (CHIP_SIZE + CHIP_GAP) * progress.value },
      { scale: 0.4 + 0.6 * progress.value },
    ],
  }));
  const chipStyle1 = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateX: -2 * (CHIP_SIZE + CHIP_GAP) * progress.value },
      { scale: 0.4 + 0.6 * progress.value },
    ],
  }));
  const chipStyles = [chipStyle0, chipStyle1];

  const pick = (chip: (typeof chips)[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    chip.onPress();
    close();
  };

  const bTint = saved
    ? colors.primary
    : potentialActive
      ? POTENTIAL_SILVER
      : "#FFFFFF";

  return (
    <View style={styles.wrap}>
      {chips.map((chip, i) => (
        <Animated.View
          key={chip.key}
          pointerEvents={open ? "auto" : "none"}
          style={[styles.chipHolder, chipStyles[i]]}
        >
          <Pressable
            onPress={() => pick(chip)}
            style={[
              styles.chip,
              {
                backgroundColor: "rgba(12,12,12,0.92)",
                borderColor: chip.color,
              },
            ]}
            testID={`${testID ?? "breact"}-${chip.key}`}
          >
            <Ionicons name={chip.icon as IoniconName} size={17} color={chip.color} />
          </Pressable>
        </Animated.View>
      ))}

      <Pressable
        onPress={() => {
          if (open) {
            close();
            return;
          }
          onPotential();
        }}
        onLongPress={openMenu}
        delayLongPress={320}
        hitSlop={8}
        style={styles.bBtn}
        testID={testID}
        accessibilityLabel="Banco Potential"
      >
        <BGlyph height={height} tintColor={bTint} />
      </Pressable>
    </View>
  );
}

/** Small "P" chip label for Potential tooltips / docs parity. */
export function PotentialMark({ size = 14 }: { size?: number }) {
  return (
    <Text
      style={{
        fontSize: size,
        fontFamily: "Inter_700Bold",
        color: POTENTIAL_SILVER,
      }}
    >
      P
    </Text>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  bBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  chipHolder: {
    position: "absolute",
    right: 0,
  },
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: CHIP_SIZE / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
