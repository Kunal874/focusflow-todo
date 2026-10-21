import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../app/theme';
export function Button({
  label,
  onPress,
  busy = false,
  disabled = false,
  secondary = false,
  style,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  secondary?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (disabled || busy) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {busy && (
        <ActivityIndicator
          color={secondary ? colors.ink : colors.white}
          style={styles.spinner}
        />
      )}
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.ink,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: { color: colors.white, fontSize: 16, fontWeight: '700' },
  secondaryLabel: { color: colors.ink },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
  spinner: { marginRight: 10 },
});
