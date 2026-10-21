import { StyleSheet } from 'react-native';
export const colors = {
  paper: '#F7F6F2',
  ink: '#172122',
  mint: '#B9F3D1',
  muted: '#5C6863',
  line: '#E1E5DE',
  white: '#FFFFFF',
  danger: '#A32D27',
  dangerSoft: '#FDECE8',
};
export const priorityColors = {
  high: { ink: '#9F341D', background: '#FCECE5' },
  medium: { ink: '#805900', background: '#FFF2C7' },
  low: { ink: '#256052', background: '#E4F4E9' },
};
export const common = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 24, paddingBottom: 40 },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -1.2,
  },
  body: { fontSize: 16, lineHeight: 24, color: colors.muted },
  caption: { fontSize: 13, lineHeight: 19, color: colors.muted },
  label: { fontSize: 15, color: colors.ink, fontWeight: '700' },
  error: { fontSize: 14, lineHeight: 20, color: colors.danger },
  row: { flexDirection: 'row', alignItems: 'center' },
});
