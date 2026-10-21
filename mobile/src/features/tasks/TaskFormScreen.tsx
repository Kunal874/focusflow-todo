import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTasks } from './TasksContext';
import type { CreateTaskInput, Priority } from './types';
import { validateTaskInput } from './validation';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { colors, common, priorityColors } from '../../app/theme';

const showDate = (date: Date) =>
  date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
export function TaskFormScreen({
  taskId,
  onBack,
}: {
  taskId?: string;
  onBack: () => void;
}) {
  const { tasks, create, update, remove } = useTasks();
  const existing = tasks.find(task => task.id === taskId);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [scheduled, setScheduled] = useState(
    () => new Date(existing?.scheduledAt ?? Date.now()),
  );
  const [deadline, setDeadline] = useState(
    () => new Date(existing?.deadlineAt ?? Date.now() + 2 * 3600000),
  );
  const [priority, setPriority] = useState<Priority>(
    existing?.priority ?? 'medium',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const active = useRef(true);
  useEffect(
    () => () => {
      active.current = false;
    },
    [],
  );
  const pick = (value: Date, setValue: (date: Date) => void) => {
    if (busy) return;
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      onChange: (event, date) => {
        if (event.type !== 'set' || !date) return;
        const combined = new Date(date);
        combined.setHours(value.getHours(), value.getMinutes(), 0, 0);
        DateTimePickerAndroid.open({
          value: combined,
          mode: 'time',
          onChange: (timeEvent, time) => {
            if (timeEvent.type !== 'set' || !time) return;
            combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
            setValue(new Date(combined));
          },
        });
      },
    });
  };
  const run = async (operation: () => Promise<unknown>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await operation();
      if (active.current) onBack();
    } catch (problem) {
      if (active.current) {
        setError(
          problem instanceof Error
            ? problem.message
            : 'Could not save your change.',
        );
        if (problem instanceof ApiError) setErrors(problem.fields);
      }
    } finally {
      locked.current = false;
      if (active.current) setBusy(false);
    }
  };
  const save = () => {
    const input: CreateTaskInput = {
      title: title.trim(),
      description: description.trim(),
      scheduledAt: scheduled.toISOString(),
      deadlineAt: deadline.toISOString(),
      priority,
    };
    const next = validateTaskInput(input);
    setErrors(next);
    if (Object.keys(next).length) return;
    void run(() => (taskId ? update(taskId, input) : create(input)));
  };
  const confirmDelete = () =>
    Alert.alert(
      'Delete this task?',
      'This will permanently remove it from your list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void run(() => remove(taskId!));
          },
        },
      ],
    );
  if (taskId && !existing)
    return (
      <SafeAreaView style={[common.screen, common.content]}>
        <Text style={common.title}>Task not found</Text>
        <Text style={common.body}>
          It may have been removed. Return to your list and refresh.
        </Text>
        <Button label="Back to tasks" onPress={onBack} />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={common.screen}>
      <KeyboardAvoidingView
        style={common.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={common.content}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to tasks"
              onPress={onBack}
              style={styles.back}
            >
              <Text style={styles.backGlyph}>‹</Text>
            </Pressable>
            <View style={styles.heading}>
              <Text style={common.title}>
                {taskId ? 'Edit task' : 'A fresh start.'}
              </Text>
              <Text style={common.body}>
                {taskId
                  ? 'Make the plan work for you.'
                  : 'One small step toward a clearer day.'}
              </Text>
            </View>
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          <TextField
            label="Title"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            error={errors.title}
            placeholder="What would you like to get done?"
            editable={!busy}
          />
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            maxLength={2000}
            error={errors.description}
            multiline
            placeholder="A few details to help you get started…"
            editable={!busy}
          />
          <Text style={[common.label, styles.sectionLabel]}>
            Make time for it
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose scheduled date and time"
            disabled={busy}
            onPress={() => pick(scheduled, setScheduled)}
            style={styles.date}
          >
            <Text style={common.caption}>Scheduled</Text>
            <Text style={styles.dateValue}>{showDate(scheduled)}</Text>
          </Pressable>
          {!!errors.scheduledAt && (
            <Text style={common.error}>{errors.scheduledAt}</Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose deadline date and time"
            disabled={busy}
            onPress={() => pick(deadline, setDeadline)}
            style={styles.date}
          >
            <Text style={common.caption}>Deadline</Text>
            <Text style={styles.dateValue}>{showDate(deadline)}</Text>
          </Pressable>
          {!!errors.deadlineAt && (
            <Text accessibilityRole="alert" style={common.error}>
              {errors.deadlineAt}
            </Text>
          )}
          <Text style={[common.label, styles.sectionLabel]}>Priority</Text>
          <View style={styles.priorities}>
            {(['low', 'medium', 'high'] as const).map(value => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={
                  value[0].toUpperCase() + value.slice(1) + ' priority'
                }
                accessibilityState={{
                  selected: priority === value,
                  disabled: busy,
                }}
                disabled={busy}
                onPress={() => setPriority(value)}
                style={[
                  styles.priority,
                  { backgroundColor: priorityColors[value].background },
                  priority === value && styles.selected,
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: priorityColors[value].ink },
                  ]}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button
            label={busy ? 'Saving…' : taskId ? 'Save changes' : 'Create task'}
            busy={busy}
            onPress={save}
            style={styles.save}
          />
          {taskId && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete task"
              disabled={busy}
              onPress={confirmDelete}
              style={styles.delete}
            >
              <Text style={styles.deleteText}>Delete task</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: { marginBottom: 30 },
  back: {
    minWidth: 48,
    minHeight: 48,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  backGlyph: { fontSize: 36, color: colors.ink },
  heading: { gap: 8, marginTop: 8 },
  sectionLabel: { marginTop: 12, marginBottom: 12 },
  date: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    minHeight: 76,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 4,
  },
  priorities: { flexDirection: 'row', gap: 10 },
  priority: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.ink },
  priorityText: { fontWeight: '700', fontSize: 14 },
  save: { marginTop: 30 },
  delete: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  deleteText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
    lineHeight: 20,
  },
});
