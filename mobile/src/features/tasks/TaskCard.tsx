import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Task } from './types';
import { colors, common, priorityColors } from '../../app/theme';
const moment = (value: string) =>
  new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
export function TaskCard({
  task,
  now,
  busy,
  onEdit,
  onToggle,
}: {
  task: Task;
  now: number;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const completed = task.status === 'completed';
  const overdue = !completed && Date.parse(task.deadlineAt) < now;
  const palette = priorityColors[task.priority];
  return (
    <View style={[styles.card, completed && styles.completed]}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={
            'Mark ' + task.title + (completed ? ' as pending' : ' as completed')
          }
          accessibilityState={{ checked: completed, disabled: busy }}
          disabled={busy}
          onPress={onToggle}
          style={styles.checkTarget}
        >
          <View style={[styles.checkbox, completed && styles.checked]}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.ink} />
            ) : (
              completed && <Text style={styles.tick}>✓</Text>
            )}
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Edit ' + task.title}
          onPress={onEdit}
          style={styles.main}
        >
          <Text style={[styles.title, completed && styles.strike]}>
            {task.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Open ' + task.title}
          onPress={onEdit}
          style={styles.open}
        >
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
      <View style={styles.tags}>
        <View
          style={[styles.priority, { backgroundColor: palette.background }]}
        >
          <Text style={[styles.priorityText, { color: palette.ink }]}>
            {task.priority[0].toUpperCase() + task.priority.slice(1)} priority
          </Text>
        </View>
        <Text style={[styles.status, overdue && styles.overdue]}>
          {completed ? 'Completed' : overdue ? 'Overdue' : 'Pending'}
        </Text>
      </View>
      <View style={styles.dates}>
        <Text style={common.caption}>
          Planned{' '}
          <Text style={styles.dateValue}>{moment(task.scheduledAt)}</Text>
        </Text>
        <Text style={[common.caption, overdue && styles.overdue]}>
          Due{' '}
          <Text style={[styles.dateValue, overdue && styles.overdue]}>
            {moment(task.deadlineAt)}
          </Text>
        </Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  completed: { backgroundColor: '#EFF2EC' },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  checkTarget: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  checkbox: {
    height: 26,
    width: 26,
    borderWidth: 1.5,
    borderColor: '#8B9A91',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: colors.mint, borderColor: '#77B990' },
  tick: { fontSize: 18, fontWeight: '800', color: colors.ink },
  main: { flex: 1, minHeight: 48 },
  title: { fontSize: 17, fontWeight: '700', color: colors.ink, lineHeight: 23 },
  strike: { textDecorationLine: 'line-through', color: colors.muted },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 5,
  },
  open: { minWidth: 40, minHeight: 48, alignItems: 'flex-end' },
  chevron: { fontSize: 28, color: '#78877C' },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  priority: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  priorityText: { fontSize: 12, fontWeight: '700' },
  status: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  overdue: { color: colors.danger },
  dates: {
    borderTopWidth: 1,
    borderTopColor: '#EDF0EA',
    marginTop: 14,
    paddingTop: 12,
    gap: 4,
  },
  dateValue: { color: '#46534A' },
});
