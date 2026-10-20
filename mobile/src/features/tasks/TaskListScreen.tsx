import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { useTasks } from './TasksContext';
import type { Priority, SortMode, Task, TaskStatus } from './types';
import { filterTasks, sortTasks } from './sortTasks';
import { TaskCard } from './TaskCard';
import { Button } from '../../components/Button';
import { Brand } from '../../components/Brand';
import { colors, common } from '../../app/theme';
const sortNames: Record<SortMode, string> = {
  smart: 'Smart order',
  deadline: 'Earliest deadline',
  schedule: 'Scheduled time',
  priority: 'Highest priority',
};
export function TaskListScreen({
  onCreate,
  onEdit,
}: {
  onCreate: () => void;
  onEdit: (id: string) => void;
}) {
  const { signOut } = useAuth();
  const { tasks, loading, error, pendingIds, refresh, update } = useTasks();
  const [status, setStatus] = useState<'all' | TaskStatus>('all');
  const [priority, setPriority] = useState<'all' | Priority>('all');
  const [sort, setSort] = useState<SortMode>('smart');
  const [sheet, setSheet] = useState(false);
  const [now, setNow] = useState(Date.now());
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      const timer = setInterval(() => setNow(Date.now()), 60000);
      return () => clearInterval(timer);
    }, []),
  );
  const visible = useMemo(
    () => sortTasks(filterTasks(tasks, status, priority), sort, now),
    [tasks, status, priority, sort, now],
  );
  const completed = tasks.filter(task => task.status === 'completed').length;
  const progress = tasks.length ? completed / tasks.length : 0;
  const reload = () => {
    setNow(Date.now());
    void refresh().catch(() => {});
  };
  const toggle = (task: Task) => {
    void update(task.id, {
      status: task.status === 'completed' ? 'pending' : 'completed',
    }).catch(() => {});
  };
  const logout = () =>
    Alert.alert('Sign out?', 'Your tasks will be here when you return.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        onPress: () => {
          void signOut().catch(() =>
            Alert.alert('Could not sign out', 'Please try again.'),
          );
        },
      },
    ]);
  const header = (
    <View>
      <View style={styles.topbar}>
        <Brand />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={logout}
          style={styles.signOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
      <View style={styles.hero}>
        <Text style={styles.date}>
          {new Date(now).toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={styles.heading}>Your day,{'\n'}in focus.</Text>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {tasks.length
              ? completed + ' of ' + tasks.length + ' tasks completed'
              : 'A little space for your next good idea.'}
          </Text>
          {tasks.length > 0 && (
            <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
          )}
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: tasks.length || 1,
            now: completed,
          }}
          accessibilityLabel="Task completion"
          style={styles.track}
        >
          <View
            style={[
              styles.fill,
              { width: (progress * 100 + '%') as DimensionValue },
            ]}
          />
        </View>
      </View>
      <View style={styles.controls}>
        <View style={styles.tabs}>
          {(['all', 'pending', 'completed'] as const).map(value => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: status === value }}
              key={value}
              onPress={() => setStatus(value)}
              style={[styles.tab, status === value && styles.activeTab]}
            >
              <Text
                style={[
                  styles.tabText,
                  status === value && styles.activeTabText,
                ]}
              >
                {value[0].toUpperCase() + value.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sort and filter tasks"
          onPress={() => setSheet(true)}
          style={styles.sort}
        >
          <Text style={styles.sortText}>
            {sortNames[sort]}
            {priority !== 'all' ? ' · ' + priority : ''}
          </Text>
          <Text style={styles.sortGlyph}>≡</Text>
        </Pressable>
      </View>
      {!!error && (
        <View style={styles.error}>
          <Text accessibilityRole="alert" style={common.error}>
            {error}
          </Text>
          <Button
            secondary
            label="Try again"
            onPress={reload}
            style={styles.retry}
          />
        </View>
      )}
    </View>
  );
  return (
    <SafeAreaView style={common.screen}>
      <FlatList
        data={visible}
        keyExtractor={task => task.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        refreshing={loading && tasks.length > 0}
        onRefresh={reload}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            now={now}
            busy={pendingIds.includes(item.id)}
            onEdit={() => onEdit(item.id)}
            onToggle={() => toggle(item)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.ink} />
              <Text style={common.body}>Gathering your tasks…</Text>
            </View>
          ) : error ? (
            <View />
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyCheck}>✓</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {tasks.length
                  ? 'Nothing in this view.'
                  : 'Room for a fresh start.'}
              </Text>
              <Text style={[common.body, styles.emptyText]}>
                {tasks.length
                  ? 'Try another filter to see more tasks.'
                  : 'Add your first task. A clear plan starts with one small step.'}
              </Text>
              {!tasks.length && (
                <Button
                  secondary
                  label="Create your first task"
                  onPress={onCreate}
                />
              )}
            </View>
          )
        }
      />
      <View style={styles.addContainer}>
        <Button label="＋ New task" onPress={onCreate} style={styles.add} />
      </View>
      <Modal
        visible={sheet}
        animationType="slide"
        transparent
        onRequestClose={() => setSheet(false)}
      >
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.sheetScroll}>
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Find your focus</Text>
              <Text style={[common.label, styles.section]}>Sort by</Text>
              {(Object.keys(sortNames) as SortMode[]).map(value => (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sort === value }}
                  onPress={() => setSort(value)}
                  style={[
                    styles.option,
                    sort === value && styles.selectedOption,
                  ]}
                >
                  <Text style={common.label}>{sortNames[value]}</Text>
                  <Text>{sort === value ? '●' : '○'}</Text>
                </Pressable>
              ))}
              <Text style={styles.explanation}>
                Smart order blends priority (50%), deadline urgency (35%), and
                scheduled time (15%). Overdue tasks come first; completed tasks
                come last.
              </Text>
              <Text style={[common.label, styles.section]}>Priority</Text>
              <View style={styles.priorityOptions}>
                {(['all', 'high', 'medium', 'low'] as const).map(value => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: priority === value }}
                    onPress={() => setPriority(value)}
                    style={[
                      styles.priorityOption,
                      priority === value && styles.selectedOption,
                    ]}
                  >
                    <Text style={common.label}>
                      {value === 'all'
                        ? 'Any'
                        : value[0].toUpperCase() + value.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Button
                label="Apply"
                onPress={() => setSheet(false)}
                style={styles.apply}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 110,
    flexGrow: 1,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  signOut: {
    minWidth: 66,
    minHeight: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  signOutText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  hero: { backgroundColor: colors.mint, padding: 24, borderRadius: 28 },
  date: { fontSize: 13, color: '#365D49', marginBottom: 14 },
  heading: {
    fontSize: 40,
    lineHeight: 43,
    letterSpacing: -1.4,
    color: colors.ink,
    fontWeight: '800',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  progressText: { fontSize: 13, color: '#365D49', flex: 1 },
  percent: { fontSize: 13, color: colors.ink, fontWeight: '700' },
  track: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#94D5AF',
    marginTop: 10,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: 4, backgroundColor: colors.ink },
  controls: { marginTop: 24, marginBottom: 10 },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#E9EDE5',
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    paddingHorizontal: 4,
  },
  activeTab: { backgroundColor: colors.ink },
  tabText: { fontSize: 13, color: '#526055', fontWeight: '600' },
  activeTabText: { color: colors.white },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  sortText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  sortGlyph: { fontSize: 26, color: colors.ink },
  error: {
    padding: 14,
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    marginBottom: 14,
  },
  retry: { marginTop: 10 },
  empty: {
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 18,
    gap: 14,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: '#E8EDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCheck: { fontSize: 32, color: '#719582' },
  emptyTitle: { fontSize: 21, fontWeight: '700', color: colors.ink },
  emptyText: { textAlign: 'center', maxWidth: 280 },
  addContainer: { position: 'absolute', bottom: 24, right: 24 },
  add: { paddingHorizontal: 24, borderRadius: 20, elevation: 4 },
  overlay: { flex: 1, backgroundColor: '#17212288' },
  sheetScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.paper,
    padding: 24,
    paddingBottom: 36,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetTitle: { fontSize: 27, fontWeight: '800', color: colors.ink },
  section: { marginTop: 24, marginBottom: 10 },
  option: {
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 7,
  },
  selectedOption: { backgroundColor: colors.mint },
  explanation: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    marginTop: 10,
  },
  priorityOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityOption: {
    paddingHorizontal: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  apply: { marginTop: 24 },
});
