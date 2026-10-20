import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../app/theme';
export function Brand() {
  return (
    <View style={styles.row}>
      <View style={styles.mark} accessible={false}>
        <Text style={styles.check}>✓</Text>
      </View>
      <Text style={styles.name}>FocusFlow</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: {
    height: 34,
    width: 34,
    borderRadius: 11,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: colors.ink, fontWeight: '900', fontSize: 23 },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.7,
  },
});
