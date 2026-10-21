import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { Brand } from '../../components/Brand';
import { ConnectionButton } from '../../components/ConnectionButton';
import { colors, common } from '../../app/theme';

export function AuthScreen({
  mode,
  onSwitch,
}: {
  mode: 'login' | 'register';
  onSwitch: () => void;
}) {
  const { signIn, signUp, error: sessionError } = useAuth();
  const register = mode === 'register';
  const { width, fontScale } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const submit = async () => {
    if (submitting.current) return;
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'Enter a valid email address.';
    if (password.length < 10 || password.length > 128)
      next.password = 'Use 10–128 characters.';
    if (register && password !== confirmation)
      next.confirmation = 'Passwords must match.';
    setErrors(next);
    setError('');
    if (Object.keys(next).length) return;
    submitting.current = true;
    setBusy(true);
    try {
      await (register ? signUp : signIn)(email, password);
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Could not sign in. Please try again.',
      );
      if (problem instanceof ApiError) setErrors(problem.fields);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={common.screen}>
      <KeyboardAvoidingView
        style={common.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Brand />
          <View style={styles.hero}>
            {width >= 400 && fontScale <= 1.1 && (
              <View
                style={styles.motif}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Text style={styles.heroCheck}>✓</Text>
                <View style={styles.rule} />
                <View style={styles.shortRule} />
              </View>
            )}
            <Text style={styles.heading}>
              {register
                ? 'Big plans.\nSmall steps.'
                : 'A clearer day\nstarts here.'}
            </Text>
            <Text style={[common.body, styles.subtitle]}>
              {register
                ? 'Create your account and make room for what matters.'
                : 'Sign in to pick up where you left off.'}
            </Text>
          </View>
          {!!(error || sessionError) && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error || sessionError}
            </Text>
          )}
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            maxLength={254}
            error={errors.email}
            editable={!busy}
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={register ? 'new-password' : 'current-password'}
            maxLength={128}
            error={errors.password}
            editable={!busy}
            placeholder={register ? 'At least 10 characters' : 'Your password'}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            style={styles.visibility}
            onPress={() => setVisible(value => !value)}
          >
            <Text style={styles.linkText}>
              {visible ? 'Hide password' : 'Show password'}
            </Text>
          </Pressable>
          {register && (
            <TextField
              label="Confirm password"
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry={!visible}
              autoCapitalize="none"
              maxLength={128}
              error={errors.confirmation}
              editable={!busy}
            />
          )}
          <Button
            label={
              busy
                ? register
                  ? 'Creating account…'
                  : 'Signing in…'
                : register
                ? 'Create account'
                : 'Sign in'
            }
            busy={busy}
            onPress={() => {
              void submit();
            }}
          />
          <View style={styles.switchRow}>
            <Text style={common.body}>
              {register ? 'Already have an account?' : 'New to FocusFlow?'}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onSwitch}
              style={styles.switch}
            >
              <Text style={styles.linkText}>
                {register ? 'Sign in' : 'Create account'}
              </Text>
            </Pressable>
          </View>
          <ConnectionButton />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 26, paddingBottom: 32 },
  hero: { marginTop: 32, marginBottom: 26 },
  heading: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1.6,
    color: colors.ink,
  },
  subtitle: { marginTop: 14, maxWidth: 330 },
  motif: {
    position: 'absolute',
    right: 0,
    top: -6,
    width: 72,
    height: 76,
    borderRadius: 20,
    backgroundColor: colors.mint,
    transform: [{ rotate: '8deg' }],
    padding: 13,
    opacity: 0.65,
  },
  heroCheck: { fontSize: 25, fontWeight: '800', color: colors.ink },
  rule: {
    height: 4,
    width: 44,
    backgroundColor: '#6CAF91',
    borderRadius: 3,
    marginTop: 3,
  },
  shortRule: {
    height: 4,
    width: 26,
    backgroundColor: '#6CAF91',
    borderRadius: 3,
    marginTop: 7,
  },
  visibility: {
    minHeight: 48,
    alignSelf: 'flex-end',
    marginTop: -16,
    marginBottom: 8,
    justifyContent: 'center',
  },
  linkText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switch: { paddingHorizontal: 8, minHeight: 48, justifyContent: 'center' },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
});
