import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, common } from '../app/theme';
export function TextField({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.wrapper}>
      <Text style={[common.label, styles.label]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7A847F"
        selectionColor={colors.ink}
        {...props}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          error && styles.invalid,
          props.style,
        ]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={[common.error, styles.error]}>
          {error}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { marginBottom: 18 },
  label: { marginBottom: 9 },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  invalid: { borderColor: colors.danger },
  error: { marginTop: 6 },
});
